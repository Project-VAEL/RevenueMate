"""
backend/app/models/base.py
Owner: P1
Purpose: Declarative base and shared column mixins.
Depends on: none
Used by: every model

PROMPT:
Write only this file. SQLAlchemy 2.0 style using Mapped and mapped_column.

Requirements:
- class Base(DeclarativeBase).
- IdMixin: id String(36) primary key defaulting to str(uuid4()), created_at and updated_at
  as timezone-aware UTC datetimes (default now in UTC, updated_at refreshed on update).
- TenantMixin: tenant_id String(36), ForeignKey('tenants.id'), indexed, not null.
- A helper utcnow() returning datetime.now(timezone.utc).

Do not:
- Use PostgreSQL-only column types; tests run on SQLite.
- Add columns that are not listed.

Done when: a model combining Base, IdMixin and TenantMixin creates a table with id,
tenant_id, created_at and updated_at.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class IdMixin:
    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid4())
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class TenantMixin:
    tenant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("tenants.id"), index=True, nullable=False
    )
