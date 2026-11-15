"""
backend/app/schemas/order.py
Owner: P1
Purpose: Pydantic request/response schemas for order lifecycle.
Depends on: schemas.common, schemas.catalogue, schemas.reservation, schemas.fulfillment
Used by: order_service, reservation_service, fulfillment_service, api.orders

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- OrderItemCreate: product_id str, quantity int with ge=1.
- OrderItemOut: id, product_id, quantity, unit_price_paise, product ProductOut | None.
- OrderCreate: lead_id str | None, customer_name str | None, customer_contact str,
  items list[OrderItemCreate], notes str | None.
- OrderOut: id, lead_id, customer_name, customer_contact, status (OrderStatus),
  total_amount_paise, notes, created_at, items list[OrderItemOut].
- OrderDetail(OrderOut): reservation ReservationOut | None, fulfillment FulfillmentOut | None.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.catalogue import ProductOut
from app.schemas.common import OrderStatus
from app.schemas.fulfillment import FulfillmentOut
from app.schemas.reservation import ReservationOut


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    product_id: str
    quantity: int
    unit_price_paise: int
    product: Optional[ProductOut] = None


class OrderCreate(BaseModel):
    lead_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_contact: str
    items: list[OrderItemCreate]
    notes: Optional[str] = None


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_contact: str
    status: OrderStatus
    total_amount_paise: int
    notes: Optional[str] = None
    created_at: datetime
    items: list[OrderItemOut] = []


class OrderDetail(OrderOut):
    reservation: Optional[ReservationOut] = None
    fulfillment: Optional[FulfillmentOut] = None
