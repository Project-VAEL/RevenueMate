"""
backend/app/ai/parser.py
Owner: P2
Purpose: Enquiry text to structured result.

PROMPT:
Write only this file. parse_enquiry(text, catalogue) -> ParsedEnquiry via llm_client
and guardrails. If the product does not match a catalogue item, product_id is None. On
LLM failure return an unknown result.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""
