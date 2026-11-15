"""
backend/app/models/tenant.py
Owner: P1
Purpose: Merchant workspace.
Depends on: models.base
Used by: every other model (foreign key), deps.py, seed

PROMPT:
Write only this file. Table name tenants.

Requirements:
- Tenant(Base, IdMixin): name String not null, owner_contact String nullable.
- Do not use TenantMixin; a tenant has no tenant_id.

Do not:
- Add users, roles or authentication fields.

Done when: the table exists with id, name, owner_contact and timestamps.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IdMixin


class Tenant(Base, IdMixin):
    __tablename__ = "tenants"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_contact: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
