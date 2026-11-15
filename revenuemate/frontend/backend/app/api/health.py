"""
backend/app/api/health.py
Owner: P1
Purpose: Liveness endpoint.
Depends on: none
Used by: api.router

PROMPT:
Write only this file.

Requirements:
- APIRouter with GET /health returning {'status': 'ok'}.

Do not:
- Put business logic here; it belongs in services/.

Done when: GET /health returns 200.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
