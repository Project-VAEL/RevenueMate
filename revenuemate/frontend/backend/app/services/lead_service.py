"""
backend/app/services/lead_service.py
Owner: P1
Purpose: Lead creation and reads.
Depends on: models, services.stock_service, services.state_machine,
  services.event_service, ai.parser, ai.scorer (P2), schemas
Used by: api.leads, api.webhooks, seed

PROMPT:
Write only this file.

Requirements:
- create_lead(db, tenant_id, customer_name, customer_contact, raw_text) -> Lead: insert
  the lead with status new, record lead_created, commit.
- Then call ai.parser.parse_enquiry(raw_text, catalogue) where catalogue is
  list_products_with_stock. Store product_id, quantity, intent, urgency, parse_confidence
  and record lead_parsed.
- Then call ai.scorer.score_lead(lead, signals) with signals = {has_product, in_stock,
  stock_is_stale, quantity, urgency}. Store priority_score, priority_reasons, rule_version
  and record lead_scored. Commit.
- Wrap the parser and scorer calls in try/except Exception. A failure records the event
  with the error in payload, leaves the fields empty, and never stops lead creation.
- get_lead_detail(db, tenant_id, lead_id) -> LeadDetail with product, latest draft and
  latest payment. list_leads(db, tenant_id) -> list[Lead] ordered by priority_score
  descending then created_at descending.
- Raise NotFoundError for an unknown lead or a lead of another tenant.

Do not:
- Call the messaging or payment adapters.
- Set lead.status directly.

Done when: creating a lead returns a saved lead with exactly the events lead_created,
lead_parsed and lead_scored, whether the AI layer works or raises.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.draft import Draft
from app.models.lead import Lead
from app.models.payment_request import PaymentRequest
from app.models.product import Product
from app.schemas.catalogue import ProductOut
from app.schemas.common import EventType, LeadStatus
from app.schemas.draft import DraftOut
from app.schemas.lead import LeadDetail, LeadOut
from app.schemas.payment import PaymentOut
from app.services.errors import NotFoundError
from app.services.event_service import record_event
from app.services.stock_service import get_stock, list_products_with_stock


def create_lead(
    db: Session,
    tenant_id: str,
    customer_name: Optional[str],
    customer_contact: str,
    raw_text: str,
) -> Lead:
    lead = Lead(
        tenant_id=tenant_id,
        customer_name=customer_name,
        customer_contact=customer_contact,
        raw_text=raw_text,
        status=LeadStatus.new.value,
    )
    db.add(lead)
    db.flush()

    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.lead_created,
        reason=f"New lead created from {customer_contact}",
        lead_id=lead.id,
        payload={"customer_contact": customer_contact, "raw_text": raw_text},
    )
    db.commit()
    db.refresh(lead)

    catalogue = list_products_with_stock(db, tenant_id)

    # 1. Advisory AI Parser call
    try:
        from app.ai.parser import parse_enquiry  # type: ignore

        parsed = parse_enquiry(raw_text, catalogue)
        if parsed:
            lead.product_id = getattr(parsed, "product_id", None)
            lead.quantity = getattr(parsed, "quantity", None)
            lead.intent = getattr(parsed, "intent", None)
            lead.urgency = getattr(parsed, "urgency", None)
            lead.parse_confidence = getattr(parsed, "confidence", None)

            record_event(
                db=db,
                tenant_id=tenant_id,
                type="lead_parsed",
                reason="Customer enquiry parsed successfully",
                lead_id=lead.id,
                payload={
                    "product_id": lead.product_id,
                    "quantity": lead.quantity,
                    "intent": lead.intent,
                },
            )
    except Exception as e:
        record_event(
            db=db,
            tenant_id=tenant_id,
            type="lead_parsed",
            reason=f"AI parser encountered error: {e}",
            lead_id=lead.id,
            payload={"error": str(e)},
        )

    # 2. Advisory AI Scorer call
    try:
        from app.ai.scorer import score_lead  # type: ignore

        has_product = bool(lead.product_id)
        stock_info = (
            get_stock(db, tenant_id, lead.product_id, lead_id=lead.id)
            if lead.product_id
            else None
        )
        in_stock = (stock_info.quantity or 0) > 0 if stock_info else False
        stock_is_stale = stock_info.is_stale if stock_info else True

        signals = {
            "has_product": has_product,
            "in_stock": in_stock,
            "stock_is_stale": stock_is_stale,
            "quantity": lead.quantity,
            "urgency": lead.urgency,
        }

        score = score_lead(lead, signals)
        if score:
            lead.priority_score = getattr(score, "value", 0)
            lead.priority_reasons = getattr(score, "reasons", [])
            lead.rule_version = getattr(score, "rule_version", None)

            record_event(
                db=db,
                tenant_id=tenant_id,
                type="lead_scored",
                reason=f"Lead priority evaluated to {lead.priority_score}",
                lead_id=lead.id,
                payload={"priority_score": lead.priority_score, "signals": signals},
            )
    except Exception as e:
        record_event(
            db=db,
            tenant_id=tenant_id,
            type="lead_scored",
            reason=f"AI scorer encountered error: {e}",
            lead_id=lead.id,
            payload={"error": str(e)},
        )

    db.commit()
    db.refresh(lead)
    return lead


def get_lead(db: Session, tenant_id: str, lead_id: str) -> Lead:
    lead = db.get(Lead, lead_id)
    if not lead or lead.tenant_id != tenant_id:
        raise NotFoundError(f"Lead '{lead_id}' not found.")
    return lead


def get_lead_detail(db: Session, tenant_id: str, lead_id: str) -> LeadDetail:
    lead = get_lead(db, tenant_id, lead_id)

    product_out = None
    if lead.product_id:
        p = db.get(Product, lead.product_id)
        if p and p.tenant_id == tenant_id:
            stock = get_stock(db, tenant_id, p.id)
            product_out = ProductOut(
                id=p.id,
                sku=p.sku,
                name=p.name,
                price_paise=p.price_paise,
                active=p.active,
                quantity=stock.quantity,
                stock_as_of=stock.as_of,
                stock_is_stale=stock.is_stale,
            )

    # Latest draft
    draft_stmt = (
        select(Draft)
        .where(Draft.tenant_id == tenant_id, Draft.lead_id == lead_id)
        .order_by(Draft.created_at.desc())
    )
    latest_draft_model = db.scalars(draft_stmt).first()
    latest_draft_out = (
        DraftOut.model_validate(latest_draft_model) if latest_draft_model else None
    )

    # Latest payment
    payment_stmt = (
        select(PaymentRequest)
        .where(PaymentRequest.tenant_id == tenant_id, PaymentRequest.lead_id == lead_id)
        .order_by(PaymentRequest.created_at.desc())
    )
    latest_payment_model = db.scalars(payment_stmt).first()
    latest_payment_out = (
        PaymentOut.model_validate(latest_payment_model)
        if latest_payment_model
        else None
    )

    return LeadDetail(
        id=lead.id,
        customer_name=lead.customer_name,
        customer_contact=lead.customer_contact,
        raw_text=lead.raw_text,
        product_id=lead.product_id,
        quantity=lead.quantity,
        status=LeadStatus(lead.status),
        priority_score=lead.priority_score,
        priority_reasons=lead.priority_reasons or [],
        rule_version=lead.rule_version,
        intent=lead.intent,
        urgency=lead.urgency,
        created_at=lead.created_at,
        product=product_out,
        latest_draft=latest_draft_out,
        latest_payment=latest_payment_out,
    )


def list_leads(db: Session, tenant_id: str) -> list[Lead]:
    stmt = (
        select(Lead)
        .where(Lead.tenant_id == tenant_id)
        .order_by(Lead.priority_score.desc(), Lead.created_at.desc())
    )
    return list(db.scalars(stmt).all())
