"""
backend/app/schemas/reservation.py
Owner: P1
Purpose: Pydantic schemas for reservation creation, approval, lookup and expiry.
Depends on: schemas.common
Used by: reservation_service, order_service, api.reservations

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model.

Requirements:
- ReservationOut: id, order_id, reservation_code, status (ReservationStatus), expires_at,
  released_at, created_at.
- ReservationLookupOut: minimal fields only for receptionist role:
  reservation_code, order_id, status (ReservationStatus), expires_at, customer_name,
  customer_contact, total_amount_paise, payment_status, fulfillment_status.
- ReservationRequest: notes str | None.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.common import PaymentStatus, ReservationStatus


class ReservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    reservation_code: str
    status: ReservationStatus
    expires_at: datetime
    released_at: Optional[datetime] = None
    created_at: datetime


class ReservationLookupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reservation_code: str
    order_id: str
    status: ReservationStatus
    expires_at: datetime
    customer_name: Optional[str] = None
    customer_contact: str
    total_amount_paise: int
    payment_status: Optional[PaymentStatus] = None
    fulfillment_status: Optional[str] = None


class ReservationRequest(BaseModel):
    notes: Optional[str] = None
