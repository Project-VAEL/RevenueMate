"""
backend/app/api/events.py
Owner: P1
Purpose: Activity timeline endpoint.
Depends on: services.event_service, schemas.event, deps
Used by: api.router

PROMPT:
Write only this file.

Requirements:
- GET /events with optional query parameter lead_id and limit (default 200, max 500) ->
  list[EventOut], newest first.

Do not:
- Put business logic here; it belongs in services/.

Done when: the timeline for a lead lists every action with its reason.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.tenant import Tenant
from app.schemas.event import EventOut
from app.services import event_service

router = APIRouter(tags=["events"])


@router.get("/events", response_model=list[EventOut])
def get_events(
    lead_id: Optional[str] = None,
    order_id: Optional[str] = None,
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> list[EventOut]:
    events = event_service.list_events(
        db=db,
        tenant_id=tenant.id,
        lead_id=lead_id,
        order_id=order_id,
        limit=limit,
    )
    return [EventOut.model_validate(e) for e in events]
