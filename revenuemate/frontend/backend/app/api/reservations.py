"""
backend/app/api/reservations.py
Owner: P1
Purpose: Thin HTTP router for reservation and receptionist lookup operations.
Depends on: services.reservation_service, schemas.reservation, deps
Used by: api.router
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.order import Order
from app.models.tenant import Tenant
from app.schemas.common import PaymentStatus, ReservationStatus
from app.schemas.reservation import ReservationLookupOut, ReservationOut
from app.services import reservation_service

router = APIRouter(tags=["reservations"])


@router.get("/reservations/lookup/{reservation_code}", response_model=ReservationLookupOut)
def lookup_reservation_endpoint(
    reservation_code: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> ReservationLookupOut:
    res = reservation_service.lookup_reservation(db, tenant.id, reservation_code)
    order = db.get(Order, res.order_id)

    customer_name = order.customer_name if order else None
    customer_contact = order.customer_contact if order else ""
    total_amount = order.total_amount_paise if order else 0
    fulfillment_status = order.fulfillment.status if order and order.fulfillment else None

    return ReservationLookupOut(
        reservation_code=res.reservation_code,
        order_id=res.order_id,
        status=ReservationStatus(res.status),
        expires_at=res.expires_at,
        customer_name=customer_name,
        customer_contact=customer_contact,
        total_amount_paise=total_amount,
        payment_status=None,
        fulfillment_status=fulfillment_status,
    )


@router.post("/reservations/{id}/ready-for-pickup", response_model=ReservationOut)
def mark_reservation_ready_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> ReservationOut:
    res = reservation_service.mark_ready_for_pickup(db, tenant.id, id)
    return ReservationOut.model_validate(res)
