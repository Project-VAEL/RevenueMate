"""
backend/app/services/fulfillment_service.py
Owner: P1 / ⚠️ Codex
Purpose: Fulfillment lifecycle for store pickup and home delivery. Only this service marks handover/delivery completion.
Depends on: models.fulfillment, models.order, services.order_service, services.event_service, services.errors, schemas.common
Used by: api.fulfillment, api.orders

Critical Invariants:
1. complete_pickup is a two-step confirmation (viewing is not completing).
2. Pickup handover is blocked unless reservation is valid and payment policy is satisfied.
3. Delivery completion requires explicit confirmation, not merely dispatch.
4. Duplicate handover is rejected.
"""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.fulfillment import Fulfillment
from app.models.order import Order
from app.models.payment_request import PaymentRequest
from app.schemas.common import (
    DeliveryStatus,
    EventType,
    FulfillmentMethod,
    PaymentStatus,
    PickupStatus,
    ReservationStatus,
)
from app.services.errors import ConflictError, NotFoundError
from app.services.event_service import record_event
from app.services.order_service import complete_order, get_order


def _get_fulfillment(db: Session, tenant_id: str, order_id: str) -> Optional[Fulfillment]:
    stmt = select(Fulfillment).where(
        Fulfillment.tenant_id == tenant_id,
        Fulfillment.order_id == order_id,
    )
    return db.scalars(stmt).first()


def select_fulfillment_method(
    db: Session,
    tenant_id: str,
    order_id: str,
    method: FulfillmentMethod | str,
    delivery_address: Optional[str] = None,
) -> Fulfillment:
    order = get_order(db, tenant_id, order_id)

    f_method = (
        method if isinstance(method, FulfillmentMethod) else FulfillmentMethod(method)
    )

    initial_status = (
        PickupStatus.awaiting_preparation.value
        if f_method == FulfillmentMethod.store_pickup
        else DeliveryStatus.awaiting_dispatch.value
    )

    fulfillment = _get_fulfillment(db, tenant_id, order_id)
    if not fulfillment:
        fulfillment = Fulfillment(
            tenant_id=tenant_id,
            order_id=order_id,
            method=f_method.value,
            status=initial_status,
            delivery_address=delivery_address,
        )
        db.add(fulfillment)
        order.fulfillment = fulfillment
    else:
        fulfillment.method = f_method.value
        fulfillment.status = initial_status
        if delivery_address:
            fulfillment.delivery_address = delivery_address

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.fulfillment_method_selected,
        reason=f"Fulfillment method selected: {f_method.value}",
        order_id=order.id,
        payload={"method": f_method.value, "delivery_address": delivery_address},
    )
    db.flush()
    return fulfillment


def mark_pickup_ready(
    db: Session,
    tenant_id: str,
    order_id: str,
    notes: Optional[str] = None,
) -> Fulfillment:
    get_order(db, tenant_id, order_id)
    f = _get_fulfillment(db, tenant_id, order_id)
    if not f or f.method != FulfillmentMethod.store_pickup.value:
        raise ConflictError("Order does not have a store pickup fulfillment record.")

    if f.status != PickupStatus.awaiting_preparation.value:
        raise ConflictError(f"Cannot mark ready: current pickup status is '{f.status}'.")

    f.status = PickupStatus.ready_for_pickup.value
    if notes:
        f.notes = notes

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.pickup_ready,
        reason="Order marked ready for store pickup",
        order_id=order_id,
        payload={"fulfillment_id": f.id},
    )
    db.flush()
    return f


def complete_pickup(
    db: Session,
    tenant_id: str,
    order_id: str,
    payment_policy: str = "online_before_handover",
    notes: Optional[str] = None,
) -> Fulfillment:
    order = get_order(db, tenant_id, order_id)
    f = _get_fulfillment(db, tenant_id, order_id)
    if not f or f.method != FulfillmentMethod.store_pickup.value:
        raise ConflictError("Order does not have a store pickup fulfillment record.")

    # Invariant 4: No duplicate handover
    if f.status == PickupStatus.handed_over.value:
        raise ConflictError("Order has already been handed over.")

    if f.status != PickupStatus.ready_for_pickup.value:
        raise ConflictError(
            f"Handover blocked: order is not ready for pickup (current status='{f.status}')."
        )

    # Invariant 6: Reservation must be valid
    if not order.reservation or order.reservation.status != ReservationStatus.active.value:
        raise ConflictError("Handover blocked: order does not have an active reservation.")

    # Invariant 6: Payment policy check
    if payment_policy == "online_before_handover":
        stmt = select(PaymentRequest).where(
            PaymentRequest.tenant_id == tenant_id,
            (PaymentRequest.order_id == order_id) | (PaymentRequest.lead_id == order.lead_id),
            PaymentRequest.status == PaymentStatus.success.value,
        )
        successful_payment = db.scalars(stmt).first()
        if not successful_payment:
            raise ConflictError("Handover blocked: payment policy requires verified payment before handover.")

    f.status = PickupStatus.handed_over.value
    f.handed_over_at = datetime.now(timezone.utc)
    if notes:
        f.notes = notes

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.pickup_handover_completed,
        reason="Physical handover confirmed by receptionist",
        order_id=order.id,
        payload={"fulfillment_id": f.id, "payment_policy": payment_policy},
    )

    # Complete the order
    complete_order(db, tenant_id, order_id, reason="Handover completed")
    db.flush()
    return f


def dispatch_delivery(
    db: Session,
    tenant_id: str,
    order_id: str,
    tracking_reference: Optional[str] = None,
    notes: Optional[str] = None,
) -> Fulfillment:
    get_order(db, tenant_id, order_id)
    f = _get_fulfillment(db, tenant_id, order_id)
    if not f or f.method != FulfillmentMethod.home_delivery.value:
        raise ConflictError("Order does not have a home delivery fulfillment record.")

    if f.status != DeliveryStatus.awaiting_dispatch.value:
        raise ConflictError(f"Cannot dispatch: current status is '{f.status}'.")

    f.status = DeliveryStatus.dispatched.value
    f.dispatched_at = datetime.now(timezone.utc)
    if tracking_reference:
        f.tracking_reference = tracking_reference
    if notes:
        f.notes = notes

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.delivery_dispatched,
        reason=f"Order dispatched with tracking ref '{tracking_reference}'",
        order_id=order_id,
        payload={"tracking_reference": tracking_reference},
    )
    db.flush()
    return f


def complete_delivery(
    db: Session,
    tenant_id: str,
    order_id: str,
    notes: Optional[str] = None,
) -> Fulfillment:
    get_order(db, tenant_id, order_id)
    f = _get_fulfillment(db, tenant_id, order_id)
    if not f or f.method != FulfillmentMethod.home_delivery.value:
        raise ConflictError("Order does not have a home delivery fulfillment record.")

    if f.status != DeliveryStatus.dispatched.value:
        raise ConflictError(f"Cannot complete delivery: current status is '{f.status}'.")

    f.status = DeliveryStatus.delivered.value
    f.delivered_at = datetime.now(timezone.utc)
    if notes:
        f.notes = notes

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.delivery_completed,
        reason="Home delivery confirmed delivered",
        order_id=order_id,
        payload={"fulfillment_id": f.id},
    )

    complete_order(db, tenant_id, order_id, reason="Delivery completed")
    db.flush()
    return f
