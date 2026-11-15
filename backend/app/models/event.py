"""
backend/app/models/event.py
Owner: P1
Purpose: Append-only activity log.
Depends on: models.base
Used by: event_service, every service

PROMPT:
Write only this file. Table name events.

Requirements:
- Event(Base, IdMixin, TenantMixin): lead_id FK nullable indexed, type String(32) indexed,
  reason Text, payload JSON default dict. created_at comes from IdMixin.
- Index on (tenant_id, created_at).

Do not:
- Add update or delete helpers; events are never changed.

Done when: events can be written and queried by lead_id and ordered by created_at.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Any, Optional

from sqlalchemy import ForeignKey, Index, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IdMixin, TenantMixin


class Event(Base, IdMixin, TenantMixin):
    __tablename__ = "events"

    lead_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("leads.id"), index=True, nullable=True
    )
    order_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("orders.id"), index=True, nullable=True
    )
    type: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    reason: Mapped[str] = mapped_column(Text, default="", nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )

    __table_args__ = (
        Index("ix_events_tenant_created", "tenant_id", "created_at"),
    )
