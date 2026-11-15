"""
backend/app/schemas/event.py
Owner: P1
Purpose: Event response model.
Depends on: schemas.common
Used by: api.events

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- EventOut: id, lead_id, type (EventType), reason, payload dict, created_at.

Do not:
- Expose tenant_id.

Done when: EventOut serialises an Event row directly.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
