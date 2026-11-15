"""
backend/app/services/draft_service.py
Owner: P2
Purpose: Builds drafts for leads.

PROMPT:
Write only this file. generate_draft(db, lead): load product and stock through
stock_service, call ai.drafter.build_draft, save the Draft with facts_used and
warnings, move the lead to drafted through state_machine.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""
