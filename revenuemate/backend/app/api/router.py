"""
backend/app/api/router.py
Combines all routers into one APIRouter.
"""

from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.leads import router as leads_router
from app.api.drafts import router as drafts_router
from app.api.payments import router as payments_router
from app.api.catalogue import router as catalogue_router
from app.api.events import router as events_router
from app.api.webhooks import router as webhooks_router
from app.api.mock_pay import router as mock_pay_router
from app.api.conversations import router as conversations_router
from app.api.orders import router as orders_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(leads_router)
api_router.include_router(drafts_router)
api_router.include_router(payments_router)
api_router.include_router(catalogue_router)
api_router.include_router(events_router)
api_router.include_router(webhooks_router)
api_router.include_router(mock_pay_router)
api_router.include_router(conversations_router)
api_router.include_router(orders_router)
