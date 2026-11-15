"""
backend/app/api/leads.py
Owner: P1
Purpose: Lead endpoints.
Depends on: services.lead_service, services.payment_service, services.draft_service (P2),
  schemas, deps
Used by: api.router

PROMPT:
Write only this file. Routers parse input, call one service function, and return a
response model.

Requirements:
- GET /leads -> list[LeadOut]. POST /leads (201) takes LeadCreate -> LeadOut. GET
  /leads/{id} -> LeadDetail.
- POST /leads/{id}/draft -> DraftOut: load the lead (NotFoundError if missing for this
  tenant), call draft_service.generate_draft(db, lead).
- POST /leads/{id}/payment-link -> PaymentOut: optional CreateLinkRequest body, calls
  payment_service.create_link.
- Every route depends on get_db and get_tenant and passes tenant.id to services.

Do not:
- Put business logic here; it belongs in services/.
- Catch exceptions; main.py maps them to status codes.

Done when: all five routes appear in /docs and match docs/api-contract.md.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.tenant import Tenant
from app.schemas.draft import DraftOut
from app.schemas.lead import LeadCreate, LeadDetail, LeadOut
from app.schemas.payment import CreateLinkRequest, PaymentOut
from app.services import draft_service, lead_service, payment_service

router = APIRouter(tags=["leads"])


@router.get("/leads", response_model=list[LeadOut])
def list_leads_endpoint(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> list[LeadOut]:
    leads = lead_service.list_leads(db, tenant.id)
    return [LeadOut.model_validate(l) for l in leads]


@router.post("/leads", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead_endpoint(
    payload: LeadCreate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> LeadOut:
    lead = lead_service.create_lead(
        db=db,
        tenant_id=tenant.id,
        customer_name=payload.customer_name,
        customer_contact=payload.customer_contact,
        raw_text=payload.raw_text,
    )
    return LeadOut.model_validate(lead)


@router.get("/leads/{id}", response_model=LeadDetail)
def get_lead_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> LeadDetail:
    return lead_service.get_lead_detail(db, tenant.id, id)


@router.post("/leads/{id}/draft", response_model=DraftOut)
def generate_draft_endpoint(
    id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> DraftOut:
    lead = lead_service.get_lead(db, tenant.id, id)
    draft = draft_service.generate_draft(db, lead)
    return DraftOut.model_validate(draft)


@router.post("/leads/{id}/payment-link", response_model=PaymentOut)
def create_lead_payment_link(
    id: str,
    payload: Optional[CreateLinkRequest] = None,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> PaymentOut:
    amount = payload.amount_paise if payload else None
    payment = payment_service.create_link(
        db=db,
        tenant_id=tenant.id,
        lead_id=id,
        amount_paise=amount,
    )
    return PaymentOut.model_validate(payment)
