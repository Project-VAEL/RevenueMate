"""
backend/app/schemas/draft.py
Owner: P1
Purpose: Draft models and the drafter result type.
Depends on: schemas.common
Used by: draft_service (P2), approval_service, api.drafts

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- DraftOut: id, lead_id, text, facts_used dict, warnings list[str], status (DraftStatus),
  created_at.
- ApproveRequest: edited_text str | None, decided_by str default 'owner', channel
  Literal['dashboard','whatsapp'] default 'dashboard'.
- DismissRequest: decided_by and channel as above.
- DraftResult (dataclass): text str, facts_used dict, warnings list[str].

Do not:
- Add fields the API contract does not need.

Done when: ApproveRequest accepts an empty body and applies the defaults.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
