"""
backend/app/models/draft.py
Owner: P1
Purpose: Draft reply for a lead.
Depends on: models.base, models.lead
Used by: draft_service (P2), approval_service

PROMPT:
Write only this file. Table name drafts.

Requirements:
- Draft(Base, IdMixin, TenantMixin): lead_id FK leads.id indexed, text Text, facts_used
  JSON default dict, warnings JSON default list, status String(16) default 'pending'
  (pending, approved, dismissed).
- Relationship back to lead.

Do not:
- Add columns for approval; those live in approvals.

Done when: a draft stores its facts_used and warnings as JSON.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import TYPE_CHECKING, Any

from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, IdMixin, TenantMixin

if TYPE_CHECKING:
    from app.models.approval import Approval
    from app.models.lead import Lead


class Draft(Base, IdMixin, TenantMixin):
    __tablename__ = "drafts"

    lead_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("leads.id"), index=True, nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    facts_used: Mapped[dict[str, Any]] = mapped_column(
        JSON, default=dict, nullable=False
    )
    warnings: Mapped[list[Any]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="pending", nullable=False)

    lead: Mapped["Lead"] = relationship(
        "Lead", back_populates="drafts", lazy="select"
    )
    approvals: Mapped[list["Approval"]] = relationship(
        "Approval", back_populates="draft", order_by="Approval.decided_at", lazy="select"
    )
