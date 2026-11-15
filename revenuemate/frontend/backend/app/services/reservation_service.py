"""
backend/app/services/reservation_service.py
Owner: P1 / ⚠️ Codex
Purpose: Atomic stock reservation, oversell prevention, lookup, and expiry release.
Depends on: models, services.event_service, services.errors, schemas.common
Used by: order_service, fulfillment_service, api.reservations

Critical Invariants:
1. A reservation cannot allocate more units than available stock (available = on_hand - reserved).
   Uses row-level locking (with_for_update) or conditional atomic updates to prevent race conditions.
2. A reservation has an expiry timestamp. Expiry/cancellation releases reserved stock exactly once.
3. On order completion, reduce both on_hand and reserved stock exactly once (consume_reservation).
4. Receptionist lookup audits reservation_lookup_performed.
"""

import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.reservation import Reservation
from app.schemas.common import (
    EventType,
    OrderStatus,
    PickupStatus,
    ReservationStatus,
)
from app.services.errors import ConflictError, IllegalTransition, NotFoundError
from app.services.event_service import record_event


def _generate_reservation_code() -> str:
    # 8-char non-guessable alphanumeric uppercase code
    return f"RES-{secrets.token_hex(4).upper()}"


def request_reservation(
    db: Session,
    tenant_id: str,
    order_id: str,
    expires_in_minutes: int = 60,
) -> Reservation:
    order = db.get(Order, order_id)
    if not order or order.tenant_id != tenant_id:
        raise NotFoundError(f"Order '{order_id}' not found.")

    if order.status not in (OrderStatus.draft.value, OrderStatus.reservation_pending.value):
        raise ConflictError(f"Cannot request reservation for order in status '{order.status}'.")

    # Generate unique reservation code
    code = _generate_reservation_code()
    while db.scalar(select(Reservation).where(Reservation.reservation_code == code)):
        code = _generate_reservation_code()

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)

    reservation = Reservation(
        tenant_id=tenant_id,
        order_id=order_id,
        reservation_code=code,
        status=ReservationStatus.pending.value,
        expires_at=expires_at,
    )
    db.add(reservation)
    order.status = OrderStatus.reservation_pending.value

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.reservation_requested,
        reason=f"Reservation requested with code {code}",
        order_id=order_id,
        payload={"reservation_code": code, "expires_at": expires_at.isoformat()},
    )
    db.flush()
    return reservation


def approve_reservation(
    db: Session,
    tenant_id: str,
    reservation_id: str,
) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if not reservation or reservation.tenant_id != tenant_id:
        raise NotFoundError(f"Reservation '{reservation_id}' not found.")

    if reservation.status != ReservationStatus.pending.value:
        raise ConflictError(f"Reservation is not pending (status='{reservation.status}').")

    order = db.get(Order, reservation.order_id)
    if not order or order.tenant_id != tenant_id:
        raise NotFoundError(f"Order for reservation '{reservation_id}' not found.")

    # Check and lock stock for all items
    items = list(order.items)
    if not items:
        raise ConflictError("Order contains no items to reserve.")

    for item in items:
        # Row lock if supported by dialect
        stmt = (
            select(Product)
            .where(Product.id == item.product_id, Product.tenant_id == tenant_id)
            .with_for_update()
        )
        product = db.scalars(stmt).first()
        if not product:
            raise NotFoundError(f"Product '{item.product_id}' not found.")

        available = product.on_hand - product.reserved
        if available < item.quantity:
            raise ConflictError(
                f"Insufficient stock for '{product.name}'. Available: {available}, requested: {item.quantity}."
            )

    # Allocate stock
    for item in items:
        product = db.get(Product, item.product_id)
        if product:
            product.reserved += item.quantity
            record_event(
                db=db,
                tenant_id=tenant_id,
                type=EventType.stock_reserved,
                reason=f"Reserved {item.quantity} units of {product.name}",
                order_id=order.id,
                payload={"product_id": product.id, "quantity": item.quantity},
            )

    reservation.status = ReservationStatus.active.value
    order.status = OrderStatus.reserved.value

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.reservation_approved,
        reason=f"Reservation approved for order {order.id}",
        order_id=order.id,
        payload={"reservation_id": reservation.id, "code": reservation.reservation_code},
    )
    db.flush()
    return reservation


def reject_reservation(
    db: Session,
    tenant_id: str,
    reservation_id: str,
    reason: str = "Merchant rejected reservation",
) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if not reservation or reservation.tenant_id != tenant_id:
        raise NotFoundError(f"Reservation '{reservation_id}' not found.")

    if reservation.status != ReservationStatus.pending.value:
        raise ConflictError(f"Cannot reject reservation in status '{reservation.status}'.")

    reservation.status = ReservationStatus.released.value
    reservation.released_at = datetime.now(timezone.utc)

    order = db.get(Order, reservation.order_id)
    if order:
        order.status = OrderStatus.cancelled.value

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.reservation_rejected,
        reason=reason,
        order_id=reservation.order_id,
        payload={"reservation_id": reservation.id},
    )
    db.flush()
    return reservation


def release_reservation(
    db: Session,
    tenant_id: str,
    reservation_id: str,
    reason: str = "Reservation released",
) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if not reservation or reservation.tenant_id != tenant_id:
        raise NotFoundError(f"Reservation '{reservation_id}' not found.")

    if reservation.status != ReservationStatus.active.value:
        return reservation  # Already released or expired, release is idempotent

    order = db.get(Order, reservation.order_id)
    if order:
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product:
                product.reserved = max(0, product.reserved - item.quantity)
                record_event(
                    db=db,
                    tenant_id=tenant_id,
                    type=EventType.stock_reservation_released,
                    reason=f"Released {item.quantity} reserved units of {product.name}",
                    order_id=order.id,
                    payload={"product_id": product.id, "quantity": item.quantity},
                )

    reservation.status = ReservationStatus.released.value
    reservation.released_at = datetime.now(timezone.utc)

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.reservation_released,
        reason=reason,
        order_id=reservation.order_id,
        payload={"reservation_id": reservation.id},
    )
    db.flush()
    return reservation


def expire_reservations(
    db: Session,
    tenant_id: Optional[str] = None,
) -> list[Reservation]:
    now = datetime.now(timezone.utc)
    stmt = (
        select(Reservation)
        .where(
            Reservation.status == ReservationStatus.active.value,
            Reservation.expires_at <= now,
        )
    )
    if tenant_id:
        stmt = stmt.where(Reservation.tenant_id == tenant_id)

    expired: list[Reservation] = []
    for res in db.scalars(stmt).all():
        order = db.get(Order, res.order_id)
        if order:
            for item in order.items:
                product = db.get(Product, item.product_id)
                if product:
                    product.reserved = max(0, product.reserved - item.quantity)
            order.status = OrderStatus.expired.value

        res.status = ReservationStatus.expired.value
        res.released_at = now
        expired.append(res)

        record_event(
            db=db,
            tenant_id=res.tenant_id,
            type=EventType.reservation_expired,
            reason=f"Reservation {res.reservation_code} expired and reserved stock released",
            order_id=res.order_id,
            payload={"reservation_id": res.id, "code": res.reservation_code},
        )

    db.flush()
    return expired


def lookup_reservation(
    db: Session,
    tenant_id: str,
    reservation_code: str,
) -> Reservation:
    stmt = select(Reservation).where(
        Reservation.tenant_id == tenant_id,
        Reservation.reservation_code == reservation_code,
    )
    res = db.scalars(stmt).first()
    if not res:
        raise NotFoundError(f"Reservation with code '{reservation_code}' not found.")

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.reservation_lookup_performed,
        reason=f"Receptionist looked up reservation {reservation_code}",
        order_id=res.order_id,
        payload={"reservation_code": reservation_code},
    )
    db.flush()
    return res


def mark_ready_for_pickup(
    db: Session,
    tenant_id: str,
    reservation_id: str,
) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if not reservation or reservation.tenant_id != tenant_id:
        raise NotFoundError(f"Reservation '{reservation_id}' not found.")

    if reservation.status != ReservationStatus.active.value:
        raise ConflictError(f"Cannot mark ready: reservation status is '{reservation.status}'.")

    order = db.get(Order, reservation.order_id)
    if order and order.fulfillment:
        order.fulfillment.status = PickupStatus.ready_for_pickup.value

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.pickup_ready,
        reason=f"Products prepared and ready for pickup for reservation {reservation.reservation_code}",
        order_id=reservation.order_id,
        payload={"reservation_id": reservation.id},
    )
    db.flush()
    return reservation


def consume_reservation(
    db: Session,
    tenant_id: str,
    reservation_id: str,
) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if not reservation or reservation.tenant_id != tenant_id:
        raise NotFoundError(f"Reservation '{reservation_id}' not found.")

    if reservation.status != ReservationStatus.active.value:
        raise ConflictError(f"Cannot consume reservation in status '{reservation.status}'.")

    order = db.get(Order, reservation.order_id)
    if order:
        for item in order.items:
            product = db.get(Product, item.product_id)
            if product:
                product.on_hand = max(0, product.on_hand - item.quantity)
                product.reserved = max(0, product.reserved - item.quantity)

    reservation.status = ReservationStatus.consumed.value
    db.flush()
    return reservation
