"""
backend/app/schemas/fulfillment.py
Owner: P1
Purpose: Pydantic schemas for pickup and delivery operations.
Depends on: schemas.common
Used by: fulfillment_service, order_service, api.fulfillment

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model.

Requirements:
- FulfillmentSelectMethod: method (FulfillmentMethod), delivery_address str | None.
- FulfillmentDispatch: tracking_reference str | None, notes str | None.
- FulfillmentComplete: notes str | None.
- FulfillmentOut: id, order_id, method (FulfillmentMethod), status str,
  delivery_address str | None, tracking_reference str | None, handed_over_at datetime | None,
  dispatched_at datetime | None, delivered_at datetime | None, notes str | None, created_at.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.common import FulfillmentMethod


class FulfillmentSelectMethod(BaseModel):
    method: FulfillmentMethod
    delivery_address: Optional[str] = None


class FulfillmentDispatch(BaseModel):
    tracking_reference: Optional[str] = None
    notes: Optional[str] = None


class FulfillmentComplete(BaseModel):
    notes: Optional[str] = None


class FulfillmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    method: FulfillmentMethod
    status: str
    delivery_address: Optional[str] = None
    tracking_reference: Optional[str] = None
    handed_over_at: Optional[datetime] = None
    dispatched_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
