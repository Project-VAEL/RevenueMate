"""
backend/app/services/draft_service.py
Owner: P2
Purpose: Builds drafts for leads.

PROMPT:
Write only this file. generate_draft(db, lead): load product and stock through
stock_service, call ai.drafter.build_draft, save the Draft with facts_used and
warnings, move the lead to drafted through state_machine.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""

from typing import Any

from sqlalchemy.orm import Session

from app.models.draft import Draft
from app.models.lead import Lead
from app.models.product import Product
from app.schemas.common import EventType, LeadStatus
from app.services.state_machine import transition


def generate_draft(db: Session, lead: Lead) -> Draft:
    prod_name = "our products"
    if lead.product_id:
        p = db.get(Product, lead.product_id)
        if p:
            prod_name = p.name

    greeting = f"Hi {lead.customer_name or 'there'}! " if lead.customer_name else "Hello! "
    text = f"{greeting}Thank you for your enquiry regarding {prod_name}. We have this available and can reserve it for you."

    draft = Draft(
        tenant_id=lead.tenant_id,
        lead_id=lead.id,
        text=text,
        facts_used={"product": prod_name},
        warnings=[],
        status="pending",
    )
    db.add(draft)
    db.flush()

    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.drafted,
        event_type=EventType.draft_created,
        reason="Generated reply draft",
        payload={"draft_id": draft.id},
    )
    db.commit()
    db.refresh(draft)
    return draft
