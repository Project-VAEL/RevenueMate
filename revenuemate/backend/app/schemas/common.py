"""
backend/app/schemas/common.py
Owner: P1
Purpose: Shared enums and error shape.
Depends on: none
Used by: every schema, service and router

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- str Enums LeadStatus, DraftStatus, PaymentStatus and EventType; members and values
  exactly as in docs/statuses-and-events.md.
- ErrorResponse(detail: str).

Do not:
- Rename or add enum members that the docs do not list; change the docs first.

Done when: every status and event string in the docs exists as an enum member with the
same value.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
