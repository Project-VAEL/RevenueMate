"""
backend/app/models/approval.py
Owner: P1
Purpose: Owner decision on a draft.
Depends on: models.base, models.draft
Used by: approval_service

PROMPT:
Write only this file. Table name approvals. One row per decision.

Requirements:
- Approval(Base, IdMixin, TenantMixin): draft_id FK drafts.id indexed, decision String(16)
  ('approved' or 'dismissed'), decided_by String, channel String(16) ('dashboard' or
  'whatsapp'), edited_text Text nullable, decided_at timezone-aware datetime default now.

Do not:
- Update or delete decisions.

Done when: an approval row records who decided, through which channel, and any edited
text.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
