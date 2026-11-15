"""
backend/app/ai/guardrails.py
Owner: P2
Purpose: Input and output safety checks.

PROMPT:
Write only this file. validate_parsed(output, catalogue) rejects product ids not in
the catalogue. check_draft(text, facts) flags any price or stock figure in the text
that is not in facts. Customer text can never trigger an action.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""
