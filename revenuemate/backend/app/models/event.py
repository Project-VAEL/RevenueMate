"""
backend/app/models/event.py
Owner: P1
Purpose: Append-only activity log.
Depends on: models.base
Used by: event_service, every service

PROMPT:
Write only this file. Table name events.

Requirements:
- Event(Base, IdMixin, TenantMixin): lead_id FK nullable indexed, type String(32) indexed,
  reason Text, payload JSON default dict. created_at comes from IdMixin.
- Index on (tenant_id, created_at).

Do not:
- Add update or delete helpers; events are never changed.

Done when: events can be written and queried by lead_id and ordered by created_at.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
