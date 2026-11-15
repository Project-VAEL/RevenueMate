"""
backend/app/deps.py
Owner: P1
Purpose: Shared FastAPI dependencies.
Depends on: db.py, config.py, models.tenant, services.errors
Used by: every router

PROMPT:
Write only this file.

Requirements:
- Re-export get_db from db.py.
- get_tenant(db=Depends(get_db), x_tenant_id: str | None = Header(default=None)) ->
  Tenant: use the header value when present, otherwise settings.DEMO_TENANT_ID.
- If the tenant row does not exist raise NotFoundError('Tenant not found. Run make
  seed.').

Do not:
- Implement authentication.
- Create the tenant here; seed.py does that.

Done when: a router can declare tenant: Tenant = Depends(get_tenant) and receive the demo
tenant after seeding.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Optional

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.config import DEMO_TENANT_ID
from app.db import get_db
from app.models.tenant import Tenant
from app.services.errors import NotFoundError


def get_tenant(
    db: Session = Depends(get_db),
    x_tenant_id: Optional[str] = Header(default=None),
) -> Tenant:
    tenant_id = x_tenant_id or DEMO_TENANT_ID
    tenant = db.get(Tenant, tenant_id)
    if not tenant:
        raise NotFoundError("Tenant not found. Run make seed.")
    return tenant
