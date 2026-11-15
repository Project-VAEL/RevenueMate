"""
backend/app/models/approval.py
Owner: P1
Purpose: Owner decision on a draft.
Depends on: models.base, models.draft
Used by: approval_service

PROMPT:
Write only this file. Table name approvals. One row per decision.

Requirements:
- Approval(Base, IdMixin, TenantMixin): draft_id FK drafts.id indexed, decision String(16)
  ('approved' or 'dismissed'), decided_by String, channel String(16) ('dashboard' or
  'whatsapp'), edited_text Text nullable, decided_at timezone-aware datetime default now.

Do not:
- Update or delete decisions.

Done when: an approval row records who decided, through which channel, and any edited
text.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin, utcnow

if TYPE_CHECKING:
    from app.models.draft import Draft


class Approval(Base, IdMixin, TenantMixin):
    __tablename__ = "approvals"

    draft_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("drafts.id"), index=True, nullable=False
    )
    decision: Mapped[str] = mapped_column(String(16), nullable=False)
    decided_by: Mapped[str] = mapped_column(String(128), nullable=False)
    channel: Mapped[str] = mapped_column(String(16), nullable=False)
    edited_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    draft: Mapped["Draft"] = relationship(
        "Draft", back_populates="approvals", lazy="select"
    )
