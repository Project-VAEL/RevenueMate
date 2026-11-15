"""
backend/app/models/reservation.py
Owner: P1
Purpose: Reservation persistence model with unique non-guessable reservation_code and expires_at.
Depends on: models.base, models.order
Used by: reservation_service, order_service, fulfillment_service

PROMPT:
Reservation persistence model. See docs/statuses-and-events.md and ARCHITECTURE.md.

Requirements:
- Reservation(Base, IdMixin, TenantMixin):
  - order_id FK orders.id indexed not null
  - reservation_code String(32) unique indexed not null (non-guessable lookup code)
  - status String(32) default 'pending' (pending, active, released, expired, consumed)
  - expires_at timezone-aware UTC datetime not null
  - released_at timezone-aware UTC datetime nullable
  - order relationship back to Order
- Index on (tenant_id, status)
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.order import Order


class Reservation(Base, IdMixin, TenantMixin):
    __tablename__ = "reservations"

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id"), index=True, nullable=False
    )
    reservation_code: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(32), default="pending", nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    released_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    order: Mapped["Order"] = relationship("Order", back_populates="reservation")

    __table_args__ = (
        Index("ix_reservations_tenant_id_status", "tenant_id", "status"),
    )
