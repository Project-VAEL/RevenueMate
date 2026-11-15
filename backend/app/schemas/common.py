"""
backend/app/schemas/common.py
Owner: P1
Purpose: Shared enums and error shape.
Depends on: none
Used by: every schema, service and router

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- str Enums LeadStatus, DraftStatus, PaymentStatus and EventType; members and values
  exactly as in docs/statuses-and-events.md.
- ErrorResponse(detail: str).

Do not:
- Rename or add enum members that the docs do not list; change the docs first.

Done when: every status and event string in the docs exists as an enum member with the
same value.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from enum import Enum
from pydantic import BaseModel, ConfigDict


class LeadStatus(str, Enum):
    new = "new"
    drafted = "drafted"
    approved = "approved"
    sent = "sent"
    payment_requested = "payment_requested"
    paid = "paid"
    dismissed = "dismissed"
    uncertain = "uncertain"


class DraftStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    dismissed = "dismissed"


class OrderStatus(str, Enum):
    draft = "draft"
    reservation_pending = "reservation_pending"
    reserved = "reserved"
    confirmed = "confirmed"
    cancelled = "cancelled"
    expired = "expired"
    completed = "completed"


class ReservationStatus(str, Enum):
    pending = "pending"
    active = "active"
    released = "released"
    expired = "expired"
    consumed = "consumed"


class PaymentStatus(str, Enum):
    created = "created"
    sent = "sent"
    pending = "pending"
    success = "success"
    failed = "failed"
    expired = "expired"
    uncertain = "uncertain"


class FulfillmentMethod(str, Enum):
    store_pickup = "store_pickup"
    home_delivery = "home_delivery"


class PickupStatus(str, Enum):
    awaiting_preparation = "awaiting_preparation"
    ready_for_pickup = "ready_for_pickup"
    handed_over = "handed_over"


class DeliveryStatus(str, Enum):
    awaiting_dispatch = "awaiting_dispatch"
    dispatched = "dispatched"
    delivered = "delivered"
    delivery_failed = "delivery_failed"


class EventType(str, Enum):
    lead_created = "lead_created"
    lead_status_changed = "lead_status_changed"
    draft_created = "draft_created"
    draft_approved = "draft_approved"
    draft_dismissed = "draft_dismissed"
    message_sent = "message_sent"
    message_received = "message_received"
    payment_created = "payment_created"
    payment_verified = "payment_verified"
    payment_failed = "payment_failed"
    payment_uncertain = "payment_uncertain"
    order_created = "order_created"
    order_updated = "order_updated"
    reservation_requested = "reservation_requested"
    reservation_approved = "reservation_approved"
    reservation_rejected = "reservation_rejected"
    reservation_expired = "reservation_expired"
    reservation_released = "reservation_released"
    stock_reserved = "stock_reserved"
    stock_reservation_released = "stock_reservation_released"
    fulfillment_method_selected = "fulfillment_method_selected"
    pickup_ready = "pickup_ready"
    reservation_lookup_performed = "reservation_lookup_performed"
    payment_link_created = "payment_link_created"
    pickup_handover_completed = "pickup_handover_completed"
    delivery_dispatched = "delivery_dispatched"
    delivery_completed = "delivery_completed"
    order_completed = "order_completed"
    order_cancelled = "order_cancelled"


class ErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    detail: str
