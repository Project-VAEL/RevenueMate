"""
backend/app/services/order_service.py
Owner: P1 / ⚠️ Codex
Purpose: Order lifecycle and transitions. Only this service may mutate order.status.
Depends on: models.order, services.reservation_service, services.event_service, services.errors, schemas.common
Used by: api.orders, fulfillment_service, payment_service

Allowed order transitions:
- draft -> reservation_pending or cancelled
- reservation_pending -> reserved or cancelled
- reserved -> confirmed, expired or cancelled
- confirmed -> completed or cancelled
- expired, cancelled, completed are terminal
"""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.common import EventType, OrderStatus, ReservationStatus
from app.services.errors import ConflictError, IllegalTransition, NotFoundError
from app.services.event_service import record_event
from app.services.reservation_service import consume_reservation, release_reservation

ORDER_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.draft: {OrderStatus.reservation_pending, OrderStatus.cancelled},
    OrderStatus.reservation_pending: {OrderStatus.reserved, OrderStatus.cancelled},
    OrderStatus.reserved: {OrderStatus.confirmed, OrderStatus.expired, OrderStatus.cancelled},
    OrderStatus.confirmed: {OrderStatus.completed, OrderStatus.cancelled},
    OrderStatus.expired: set(),
    OrderStatus.cancelled: set(),
    OrderStatus.completed: set(),
}


def transition_order(
    db: Session,
    order: Order,
    new_status: OrderStatus | str,
    reason: str = "",
) -> Order:
    current = OrderStatus(order.status)
    target = OrderStatus(new_status)

    if target not in ORDER_TRANSITIONS.get(current, set()):
        raise IllegalTransition(f"Illegal order transition: '{current.value}' -> '{target.value}'.")

    order.status = target.value

    event_type = EventType.order_updated
    if target == OrderStatus.completed:
        event_type = EventType.order_completed
    elif target == OrderStatus.cancelled:
        event_type = EventType.order_cancelled

    record_event(
        db=db,
        tenant_id=order.tenant_id,
        type=event_type,
        reason=reason or f"Order transitioned to {target.value}",
        order_id=order.id,
        payload={"from_status": current.value, "to_status": target.value},
    )
    db.flush()
    return order


def create_order(
    db: Session,
    tenant_id: str,
    customer_contact: str,
    items: list[dict[str, Any]],
    customer_name: Optional[str] = None,
    lead_id: Optional[str] = None,
    notes: Optional[str] = None,
) -> Order:
    if not items:
        raise ConflictError("Cannot create order without items.")

    total_amount = 0
    order_items: list[OrderItem] = []

    for item_data in items:
        product_id = item_data["product_id"]
        qty = item_data["quantity"]
        if qty <= 0:
            raise ConflictError("Item quantity must be greater than zero.")

        product = db.get(Product, product_id)
        if not product or product.tenant_id != tenant_id:
            raise NotFoundError(f"Product '{product_id}' not found.")

        price = product.price_paise
        total_amount += price * qty
        order_items.append(
            OrderItem(
                product_id=product_id,
                quantity=qty,
                unit_price_paise=price,
            )
        )

    order = Order(
        tenant_id=tenant_id,
        lead_id=lead_id,
        customer_name=customer_name,
        customer_contact=customer_contact,
        status=OrderStatus.draft.value,
        total_amount_paise=total_amount,
        notes=notes,
        items=order_items,
    )
    db.add(order)
    db.flush()

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.order_created,
        reason=f"Order created for customer {customer_contact}",
        order_id=order.id,
        lead_id=lead_id,
        payload={"total_amount_paise": total_amount, "item_count": len(order_items)},
    )
    db.flush()
    return order


def get_order(db: Session, tenant_id: str, order_id: str) -> Order:
    order = db.get(Order, order_id)
    if not order or order.tenant_id != tenant_id:
        raise NotFoundError(f"Order '{order_id}' not found.")
    return order


def list_orders(
    db: Session,
    tenant_id: str,
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
    limit: int = 100,
) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.tenant_id == tenant_id)
        .order_by(Order.created_at.desc())
        .limit(limit)
    )
    if status:
        stmt = stmt.where(Order.status == status)
    if lead_id:
        stmt = stmt.where(Order.lead_id == lead_id)
    return list(db.scalars(stmt).all())


def cancel_order(
    db: Session,
    tenant_id: str,
    order_id: str,
    reason: str = "Order cancelled",
) -> Order:
    order = get_order(db, tenant_id, order_id)

    # Release any active or pending reservation
    if order.reservation and order.reservation.status in (
        ReservationStatus.active.value,
        ReservationStatus.pending.value,
    ):
        release_reservation(db, tenant_id, order.reservation.id, reason=reason)

    return transition_order(db, order, OrderStatus.cancelled, reason=reason)


def confirm_order(
    db: Session,
    tenant_id: str,
    order_id: str,
    reason: str = "Order confirmed",
) -> Order:
    order = get_order(db, tenant_id, order_id)
    return transition_order(db, order, OrderStatus.confirmed, reason=reason)


def complete_order(
    db: Session,
    tenant_id: str,
    order_id: str,
    reason: str = "Order completed",
) -> Order:
    order = get_order(db, tenant_id, order_id)

    # Validate reservation exists
    if not order.reservation:
        raise ConflictError("Cannot complete order without a reservation.")

    if order.reservation.status == ReservationStatus.active.value:
        consume_reservation(db, tenant_id, order.reservation.id)
    elif order.reservation.status != ReservationStatus.consumed.value:
        raise ConflictError(
            f"Cannot complete order: reservation status is '{order.reservation.status}'."
        )

    return transition_order(db, order, OrderStatus.completed, reason=reason)
