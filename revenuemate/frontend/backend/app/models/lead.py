"""
backend/app/models/lead.py
Owner: P1
Purpose: Lead record.
Depends on: models.base, models.product
Used by: lead_service, state_machine, draft_service, payment_service

PROMPT:
Write only this file. Table name leads.

Requirements:
- Lead(Base, IdMixin, TenantMixin): customer_name String, customer_contact String,
  raw_text Text, product_id FK nullable, quantity Integer nullable.
- status String(32) default 'new' (values from docs/statuses-and-events.md),
  status_before_uncertain String(32) nullable.
- priority_score Integer default 0, priority_reasons JSON default list, rule_version
  String nullable.
- intent String nullable, urgency String nullable, parse_confidence Float nullable.
- Relationships (lazy select): product, drafts (ordered by created_at), payments (ordered
  by created_at). Index on (tenant_id, status).

Do not:
- Store status as a database enum; a plain String keeps SQLite and PostgreSQL identical.

Done when: a Lead can be created with only the required fields and loads its drafts and
payments.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import Float, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.draft import Draft
    from app.models.message import Message
    from app.models.payment_request import PaymentRequest
    from app.models.product import Product


class Lead(Base, IdMixin, TenantMixin):
    __tablename__ = "leads"

    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer_contact: Mapped[str] = mapped_column(String(50), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    product_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("products.id"), nullable=True
    )
    quantity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    status: Mapped[str] = mapped_column(String(32), default="new", nullable=False)
    status_before_uncertain: Mapped[Optional[str]] = mapped_column(
        String(32), nullable=True
    )

    priority_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    priority_reasons: Mapped[list[Any]] = mapped_column(
        JSON, default=list, nullable=False
    )
    rule_version: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    intent: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    urgency: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    parse_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    product: Mapped[Optional["Product"]] = relationship("Product", lazy="select")
    drafts: Mapped[list["Draft"]] = relationship(
        "Draft", back_populates="lead", order_by="Draft.created_at", lazy="select"
    )
    payments: Mapped[list["PaymentRequest"]] = relationship(
        "PaymentRequest",
        back_populates="lead",
        order_by="PaymentRequest.created_at",
        lazy="select",
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="lead", order_by="Message.created_at", lazy="select"
    )

    __table_args__ = (
        Index("ix_leads_tenant_id_status", "tenant_id", "status"),
    )
