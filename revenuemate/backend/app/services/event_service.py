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
