"""
backend/app/models/payment_request.py
Owner: P1
Purpose: Payment link and its status.
Depends on: models.base, models.lead
Used by: payment_service

PROMPT:
Write only this file. Table name payment_requests.

Requirements:
- PaymentRequest(Base, IdMixin, TenantMixin): lead_id FK leads.id indexed, amount_paise
  Integer, order_ref String unique, provider String, link_url String nullable,
  provider_ref String nullable.
- status String(16) default 'created' (values from docs/statuses-and-events.md),
  idempotency_key String unique, last_status_raw JSON nullable.

Do not:
- Store the Paytm merchant key or any secret.
- Use float for amounts.

Done when: two payment requests with the same order_ref or idempotency_key are rejected by
the database.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.lead import Lead
    from app.models.order import Order


class PaymentRequest(Base, IdMixin, TenantMixin):
    __tablename__ = "payment_requests"

    lead_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("leads.id"), index=True, nullable=True
    )
    order_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("orders.id"), index=True, nullable=True
    )
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    order_ref: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    link_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    provider_ref: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    status: Mapped[str] = mapped_column(
        String(16), default="created", nullable=False
    )
    idempotency_key: Mapped[str] = mapped_column(
        String(128), unique=True, index=True, nullable=False
    )
    last_status_raw: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )

    lead: Mapped[Optional["Lead"]] = relationship(
        "Lead", back_populates="payments", lazy="select"
    )
    order: Mapped[Optional["Order"]] = relationship("Order", lazy="select")

    __table_args__ = (
        Index("ix_payment_requests_tenant_id_status", "tenant_id", "status"),
    )
