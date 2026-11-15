"""
backend/app/models/draft.py
Owner: P1
Purpose: Draft reply for a lead.
Depends on: models.base, models.lead
Used by: draft_service (P2), approval_service

PROMPT:
Write only this file. Table name drafts.

Requirements:
- Draft(Base, IdMixin, TenantMixin): lead_id FK leads.id indexed, text Text, facts_used
  JSON default dict, warnings JSON default list, status String(16) default 'pending'
  (pending, approved, dismissed).
- Relationship back to lead.

Do not:
- Add columns for approval; those live in approvals.

Done when: a draft stores its facts_used and warnings as JSON.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
