"""
backend/app/models/order.py
Owner: P1
Purpose: Order and OrderItem persistence models.
Depends on: models.base, models.product, models.lead
Used by: order_service, reservation_service, fulfillment_service, payment_service

PROMPT:
Order and OrderItem persistence models. See docs/statuses-and-events.md and ARCHITECTURE.md.

Requirements:
- Order(Base, IdMixin, TenantMixin):
  - lead_id FK leads.id nullable indexed
  - customer_name String nullable, customer_contact String not null
  - status String(32) default 'draft' (draft, reservation_pending, reserved, confirmed, cancelled, expired, completed)
  - total_amount_paise Integer default 0 not null
  - notes Text nullable
  - items relationship to OrderItem
  - reservation relationship to Reservation
  - fulfillment relationship to Fulfillment
- OrderItem(Base, IdMixin):
  - order_id FK orders.id indexed not null
  - product_id FK products.id indexed not null
  - quantity Integer not null
  - unit_price_paise Integer not null
  - relationships to order and product
"""

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.fulfillment import Fulfillment
    from app.models.lead import Lead
    from app.models.product import Product
    from app.models.reservation import Reservation


class Order(Base, IdMixin, TenantMixin):
    __tablename__ = "orders"

    lead_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("leads.id"), index=True, nullable=True
    )
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_contact: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)
    total_amount_paise: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    items: Mapped[list["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="select"
    )
    reservation: Mapped[Optional["Reservation"]] = relationship(
        "Reservation", back_populates="order", uselist=False, lazy="select"
    )
    fulfillment: Mapped[Optional["Fulfillment"]] = relationship(
        "Fulfillment", back_populates="order", uselist=False, lazy="select"
    )
    lead: Mapped[Optional["Lead"]] = relationship("Lead", lazy="select")

    __table_args__ = (
        Index("ix_orders_tenant_id_status", "tenant_id", "status"),
    )


class OrderItem(Base, IdMixin):
    __tablename__ = "order_items"

    order_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("orders.id"), index=True, nullable=False
    )
    product_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("products.id"), index=True, nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_paise: Mapped[int] = mapped_column(Integer, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", lazy="select")
