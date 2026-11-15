"""
backend/app/ai/llm_client.py
Owner: P2
Purpose: Single wrapper around the model API.

PROMPT:
Write only this file. complete(system, user, json_schema=None, timeout=20) using
LLM_API_KEY and LLM_MODEL over httpx. Raise LLMUnavailable on any failure. No business
logic.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""
