"""
backend/app/api/payments.py
Owner: P1
Purpose: Payment endpoints.
Depends on: services.payment_service, schemas.payment, deps
Used by: api.router

PROMPT:
Write only this file.

Requirements:
- GET /payments/{id} -> PaymentOut (NotFoundError when missing).
- POST /payments/{id}/verify -> PaymentOut, calls payment_service.verify.

Do not:
- Put business logic here; it belongs in services/.

Done when: verify on a paid order returns the same body with no new events.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.payment_request import PaymentRequest
from app.models.tenant import Tenant
from app.schemas.payment import PaymentOut
from app.services import payment_service
from app.services.errors import NotFoundError

router = APIRouter(tags=["payments"])


@router.get("/payments/{id}", response_model=PaymentOut)
def get_payment_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> PaymentOut:
    payment = db.get(PaymentRequest, id)
    if not payment or payment.tenant_id != tenant.id:
        raise NotFoundError(f"Payment '{id}' not found.")
    return PaymentOut.model_validate(payment)


@router.post("/payments/{id}/verify", response_model=PaymentOut)
def verify_payment_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> PaymentOut:
    payment = payment_service.verify(db, tenant.id, id)
    return PaymentOut.model_validate(payment)
