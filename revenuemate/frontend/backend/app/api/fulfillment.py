"""
backend/app/api/fulfillment.py
Owner: P1
Purpose: Thin HTTP router for pickup and delivery operations.
Depends on: services.fulfillment_service, schemas.fulfillment, deps
Used by: api.router
"""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.tenant import Tenant
from app.schemas.fulfillment import (
    FulfillmentDispatch,
    FulfillmentOut,
    FulfillmentSelectMethod,
)
from app.services import fulfillment_service

router = APIRouter(tags=["fulfillment"])


@router.post("/orders/{order_id}/fulfillment/select-method", response_model=FulfillmentOut)
def select_order_fulfillment_method_endpoint(
    order_id: str,
    payload: FulfillmentSelectMethod,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    f = fulfillment_service.select_fulfillment_method(
        db=db,
        tenant_id=tenant.id,
        order_id=order_id,
        method=payload.method,
        delivery_address=payload.delivery_address,
    )
    return FulfillmentOut.model_validate(f)


@router.post("/orders/{order_id}/fulfillment/dispatch", response_model=FulfillmentOut)
def dispatch_order_fulfillment_endpoint(
    order_id: str,
    payload: Optional[FulfillmentDispatch] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    tracking = payload.tracking_reference if payload else None
    notes = payload.notes if payload else None
    f = fulfillment_service.dispatch_delivery(
        db=db,
        tenant_id=tenant.id,
        order_id=order_id,
        tracking_reference=tracking,
        notes=notes,
    )
    return FulfillmentOut.model_validate(f)


@router.post("/orders/{order_id}/fulfillment/complete-delivery", response_model=FulfillmentOut)
def complete_order_delivery_endpoint(
    order_id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    f = fulfillment_service.complete_delivery(
        db=db,
        tenant_id=tenant.id,
        order_id=order_id,
        notes=notes,
    )
    return FulfillmentOut.model_validate(f)


@router.post("/orders/{order_id}/fulfillment/mark-pickup-ready", response_model=FulfillmentOut)
def mark_order_pickup_ready_endpoint(
    order_id: str,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    f = fulfillment_service.mark_pickup_ready(
        db=db,
        tenant_id=tenant.id,
        order_id=order_id,
        notes=notes,
    )
    return FulfillmentOut.model_validate(f)


@router.post("/orders/{order_id}/fulfillment/complete-pickup", response_model=FulfillmentOut)
def complete_order_pickup_endpoint(
    order_id: str,
    payment_policy: str = "online_before_handover",
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> FulfillmentOut:
    f = fulfillment_service.complete_pickup(
        db=db,
        tenant_id=tenant.id,
        order_id=order_id,
        payment_policy=payment_policy,
        notes=notes,
    )
    return FulfillmentOut.model_validate(f)
