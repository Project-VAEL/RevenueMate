"""
backend/app/models/__init__.py
Owner: P1
Purpose: Registers every model with Base.
Depends on: all model modules
Used by: db.create_all, tests

PROMPT:
Write only this file.

Requirements:
- Import Base and every model class: Tenant, Product, StockSnapshot, Lead, Draft,
  Approval, PaymentRequest, Message, Event.
- List them all in __all__.

Do not:
- Define classes here.

Done when: import app.models makes Base.metadata contain all nine tables.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from app.models.approval import Approval
from app.models.base import Base, IdMixin, TenantMixin
from app.models.draft import Draft
from app.models.event import Event
from app.models.fulfillment import Fulfillment
from app.models.lead import Lead
from app.models.message import Message
from app.models.order import Order, OrderItem
from app.models.payment_request import PaymentRequest
from app.models.product import Product
from app.models.reservation import Reservation
from app.models.stock_snapshot import StockSnapshot
from app.models.tenant import Tenant

__all__ = [
    "Base",
    "IdMixin",
    "TenantMixin",
    "Tenant",
    "Product",
    "StockSnapshot",
    "Lead",
    "Draft",
    "Approval",
    "PaymentRequest",
    "Message",
    "Event",
    "Order",
    "OrderItem",
    "Reservation",
    "Fulfillment",
]
