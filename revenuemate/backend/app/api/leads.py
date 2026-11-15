"""
backend/app/api/leads.py
Lead management endpoints.

GET  /leads              → empty list (no DB yet; frontend uses seed data)
GET  /leads/{id}         → 404 (frontend falls back to seed data)
POST /leads              → creates a stub lead record
POST /leads/{id}/draft   → calls AI pipeline and returns a draft reply
"""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import settings
from app.services.conversation_service import process_message

router = APIRouter()


class CreateLeadRequest(BaseModel):
    customer_name: str | None = None
    customer_contact: str
    raw_text: str


class LeadDraftOut(BaseModel):
    id: str
    lead_id: str
    text: str
    facts_used: dict = {}
    warnings: list[str] = []
    status: str = "pending"
    created_at: str


@router.get("/leads")
def list_leads():
    """Return empty list — frontend uses its own seed data until DB is implemented."""
    return []


@router.get("/leads/{lead_id}")
def get_lead(lead_id: str):
    raise HTTPException(status_code=404, detail="Lead persistence not yet implemented")


@router.post("/leads", status_code=201)
def create_lead(body: CreateLeadRequest):
    """Stub — acknowledges the request and returns a minimal lead record."""
    return {
        "id": str(uuid.uuid4()),
        "customer_name": body.customer_name,
        "customer_contact": body.customer_contact,
        "raw_text": body.raw_text,
        "product_id": None,
        "quantity": None,
        "status": "new_enquiry",
        "priority_score": 0,
        "priority_reasons": [],
        "rule_version": None,
        "intent": None,
        "urgency": None,
        "created_at": datetime.utcnow().isoformat(),
    }


@router.post("/leads/{lead_id}/draft", response_model=LeadDraftOut)
def generate_draft(lead_id: str):
    """
    Run the full AI pipeline for this lead and return a draft reply.
    Uses the lead_id as the conversation_id.
    The buyer message is a placeholder — in production P1 passes the actual raw_text.
    """
    # With no DB yet, use a placeholder message that asks the AI to introduce itself
    placeholder_message = (
        "I'm looking for a laptop for programming and development work. "
        "My budget is around ₹60,000."
    )
    reply = process_message(
        conversation_id=lead_id,
        tenant_id=settings.DEMO_TENANT_ID,
        message=placeholder_message,
    )

    return LeadDraftOut(
        id=str(uuid.uuid4()),
        lead_id=lead_id,
        text=reply.reply_text,
        facts_used={
            "candidates": [c.product_id for c in reply.candidates],
            "evidence_ids": reply.evidence_ids,
        },
        warnings=reply.warnings,
        status="pending",
        created_at=datetime.utcnow().isoformat(),
    )
