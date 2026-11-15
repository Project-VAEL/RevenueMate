"""
backend/app/api/orders.py
Owner: P1
Purpose: Thin HTTP router for tenant-scoped order operations.
Depends on: services.order_service, services.reservation_service, services.fulfillment_service, schemas.order, deps
Used by: api.router
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.tenant import Tenant
from app.schemas.fulfillment import FulfillmentDispatch, FulfillmentOut
from app.schemas.order import OrderCreate, OrderDetail, OrderOut
from app.schemas.payment import PaymentOut
from app.schemas.reservation import ReservationOut, ReservationRequest
from app.services import (
    fulfillment_service,
    order_service,
    payment_service,
    reservation_service,
)

router = APIRouter(tags=["orders"])


@router.post("/orders", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order_endpoint(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> OrderOut:
    items_data = [item.model_dump() for item in payload.items]
    order = order_service.create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact=payload.customer_contact,
        items=items_data,
        customer_name=payload.customer_name,
        lead_id=payload.lead_id,
        notes=payload.notes,
    )
    return OrderOut.model_validate(order)


@router.get("/orders", response_model=list[OrderOut])
def list_orders_endpoint(
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> list[OrderOut]:
    orders = order_service.list_orders(
        db=db, tenant_id=tenant.id, status=status, lead_id=lead_id, limit=limit
    )
    return [OrderOut.model_validate(o) for o in orders]


@router.get("/orders/{id}", response_model=OrderDetail)
def get_order_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> OrderDetail:
    order = order_service.get_order(db, tenant.id, id)
    return OrderDetail.model_validate(order)


@router.post("/orders/{id}/request-reservation", response_model=ReservationOut)
def request_order_reservation_endpoint(
    id: str,
    payload: Optional[ReservationRequest] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> ReservationOut:
    res = reservation_service.request_reservation(db, tenant.id, id)
    return ReservationOut.model_validate(res)


@router.post("/orders/{id}/approve-reservation", response_model=ReservationOut)
def approve_order_reservation_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> ReservationOut:
    order = order_service.get_order(db, tenant.id, id)
    if not order.reservation:
        raise reservation_service.NotFoundError(f"Order '{id}' has no pending reservation.")
    res = reservation_service.approve_reservation(db, tenant.id, order.reservation.id)
    return ReservationOut.model_validate(res)


@router.post("/orders/{id}/reject-reservation", response_model=ReservationOut)
def reject_order_reservation_endpoint(
    id: str,
    reason: str = "Merchant rejected",
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> ReservationOut:
    order = order_service.get_order(db, tenant.id, id)
    if not order.reservation:
        raise reservation_service.NotFoundError(f"Order '{id}' has no pending reservation.")
    res = reservation_service.reject_reservation(db, tenant.id, order.reservation.id, reason=reason)
    return ReservationOut.model_validate(res)


@router.post("/orders/{id}/cancel", response_model=OrderOut)
def cancel_order_endpoint(
    id: str,
    reason: str = "Order cancelled",
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> OrderOut:
    order = order_service.cancel_order(db, tenant.id, id, reason=reason)
    return OrderOut.model_validate(order)


@router.post("/orders/{id}/payment-link", response_model=PaymentOut)
def create_order_payment_link_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> PaymentOut:
    order = order_service.get_order(db, tenant.id, id)
    payment = payment_service.create_link(
        db=db,
        tenant_id=tenant.id,
        lead_id=order.lead_id or f"direct-order-{order.id}",
        amount_paise=order.total_amount_paise,
        order_id=order.id,
    )
    return PaymentOut.model_validate(payment)


@router.post("/orders/{id}/complete-pickup", response_model=FulfillmentOut)
def complete_order_pickup_endpoint(
    id: str,
    payment_policy: str = "online_before_handover",
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    f = fulfillment_service.complete_pickup(
        db=db,
        tenant_id=tenant.id,
        order_id=id,
        payment_policy=payment_policy,
        notes=notes,
    )
    return FulfillmentOut.model_validate(f)


@router.post("/orders/{id}/dispatch", response_model=FulfillmentOut)
def dispatch_order_endpoint(
    id: str,
    payload: Optional[FulfillmentDispatch] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    tracking = payload.tracking_reference if payload else None
    notes = payload.notes if payload else None
    f = fulfillment_service.dispatch_delivery(
        db=db,
        tenant_id=tenant.id,
        order_id=id,
        tracking_reference=tracking,
        notes=notes,
    )
    return FulfillmentOut.model_validate(f)


@router.post("/orders/{id}/complete-delivery", response_model=FulfillmentOut)
def complete_order_delivery_endpoint(
    id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    f = fulfillment_service.complete_delivery(
        db=db,
        tenant_id=tenant.id,
        order_id=id,
        notes=notes,
    )
    return FulfillmentOut.model_validate(f)
