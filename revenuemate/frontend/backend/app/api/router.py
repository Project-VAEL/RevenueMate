"""
backend/app/api/router.py
Owner: P1
Purpose: Combines all routers.
Depends on: api.health, leads, drafts, payments, catalogue, events, webhooks, mock_pay, orders, reservations, fulfillment
Used by: main.py

PROMPT:
Write only this file.

Requirements:
- api_router = APIRouter(); include the routers (health, leads, drafts, payments,
  catalogue, events, webhooks, mock_pay, orders, reservations, fulfillment) with no prefix.

Do not:
- Put business logic here; it belongs in services/.

Done when: every path in docs/api-contract.md is registered exactly once.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from fastapi import APIRouter

from app.api import (
    catalogue,
    drafts,
    events,
    fulfillment,
    health,
    leads,
    mock_pay,
    orders,
    payments,
    reservations,
    webhooks,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(leads.router)
api_router.include_router(drafts.router)
api_router.include_router(catalogue.router)
api_router.include_router(events.router)
api_router.include_router(orders.router)
api_router.include_router(reservations.router)
api_router.include_router(fulfillment.router)
api_router.include_router(payments.router)
api_router.include_router(mock_pay.router)
api_router.include_router(webhooks.router)
