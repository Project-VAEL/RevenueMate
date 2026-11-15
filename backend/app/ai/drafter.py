"""
backend/app/ai/drafter.py
Owner: P2
Purpose: Draft text with facts from the database.

PROMPT:
Write only this file. build_draft(lead, product, stock) -> DraftResult. Price and
stock are inserted by template from the arguments. The LLM writes only the surrounding
wording. If the LLM fails or stock is stale, return a plain template draft with a
warning.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""
