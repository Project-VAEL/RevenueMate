"""
backend/app/models/message.py
Owner: P1
Purpose: Inbound and outbound messages.
Depends on: models.base, models.lead
Used by: approval_service, payment_service, idempotency

PROMPT:
Write only this file. Table name messages.

Requirements:
- Message(Base, IdMixin, TenantMixin): lead_id FK nullable indexed, direction String(8)
  ('inbound' or 'outbound'), recipient String nullable, text Text.
- status String(16): pending, sent, failed, uncertain, received. idempotency_key String
  nullable unique. provider_message_id String nullable.

Do not:
- Add attachments or media fields.

Done when: an outbound message can be saved as pending before any provider call, then
updated.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import TYPE_CHECKING, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.lead import Lead


class Message(Base, IdMixin, TenantMixin):
    __tablename__ = "messages"

    lead_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("leads.id"), index=True, nullable=True
    )
    direction: Mapped[str] = mapped_column(String(8), nullable=False)
    recipient: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)
    idempotency_key: Mapped[Optional[str]] = mapped_column(
        String(128), unique=True, nullable=True
    )
    provider_message_id: Mapped[Optional[str]] = mapped_column(
        String(128), nullable=True
    )

    lead: Mapped[Optional["Lead"]] = relationship(
        "Lead", back_populates="messages", lazy="select"
    )
