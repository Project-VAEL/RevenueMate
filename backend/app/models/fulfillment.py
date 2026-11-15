"""
backend/app/models/fulfillment.py
Owner: P1
Purpose: Fulfillment persistence model for store pickup and home delivery.
Depends on: models.base, models.order
Used by: fulfillment_service, order_service

PROMPT:
Fulfillment persistence model. See docs/statuses-and-events.md and ARCHITECTURE.md.

Requirements:
- Fulfillment(Base, IdMixin, TenantMixin):
  - order_id FK orders.id indexed not null
  - method String(32) not null ('store_pickup' or 'home_delivery')
  - status String(32) not null (store_pickup: awaiting_preparation, ready_for_pickup, handed_over;
    home_delivery: awaiting_dispatch, dispatched, delivered, delivery_failed)
  - delivery_address Text nullable
  - tracking_reference String(128) nullable
  - handed_over_at timezone-aware UTC datetime nullable
  - dispatched_at timezone-aware UTC datetime nullable
  - delivered_at timezone-aware UTC datetime nullable
  - notes Text nullable
  - order relationship back to Order
- Index on (tenant_id, status)
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.order import Order


class Fulfillment(Base, IdMixin, TenantMixin):
    __tablename__ = "fulfillments"

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id"), index=True, nullable=False
    )
    method: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    delivery_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tracking_reference: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True
    )
    handed_over_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    dispatched_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="fulfillment")

    __table_args__ = (
        Index("ix_fulfillments_tenant_id_status", "tenant_id", "status"),
    )
