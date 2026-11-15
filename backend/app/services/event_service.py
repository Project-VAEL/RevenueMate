"""
backend/app/services/event_service.py
Owner: P1
Purpose: Writes and reads activity events.
Depends on: models.event, schemas.common
Used by: every service, api.events

PROMPT:
Write only this file. Every state change in the system goes through record_event.

Requirements:
- record_event(db, tenant_id, type, reason, lead_id=None, payload=None) -> Event. Add to
  the session and flush; never commit.
- list_events(db, tenant_id, lead_id=None, limit=200) -> list[Event], newest first.
- reason is a plain-language sentence for a merchant, for example 'Owner approved the
  draft on the dashboard'.

Do not:
- Commit; the caller owns the transaction.
- Update or delete events.

Done when: after any service call, the events table explains in order what happened to the
lead.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event import Event
from app.schemas.common import EventType


def record_event(
    db: Session,
    tenant_id: str,
    type: EventType | str,
    reason: str,
    lead_id: Optional[str] = None,
    order_id: Optional[str] = None,
    payload: Optional[dict[str, Any]] = None,
) -> Event:
    event_type_str = type.value if isinstance(type, EventType) else str(type)
    event = Event(
        tenant_id=tenant_id,
        lead_id=lead_id,
        order_id=order_id,
        type=event_type_str,
        reason=reason,
        payload=payload or {},
    )
    db.add(event)
    db.flush()
    return event


def list_events(
    db: Session,
    tenant_id: str,
    lead_id: Optional[str] = None,
    order_id: Optional[str] = None,
    limit: int = 200,
) -> list[Event]:
    stmt = (
        select(Event)
        .where(Event.tenant_id == tenant_id)
        .order_by(Event.created_at.desc())
        .limit(limit)
    )
    if lead_id:
        stmt = stmt.where(Event.lead_id == lead_id)
    if order_id:
        stmt = stmt.where(Event.order_id == order_id)
    return list(db.scalars(stmt).all())
