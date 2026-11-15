"""
backend/app/api/drafts.py
Owner: P1
Purpose: Draft decision endpoints.
Depends on: services.approval_service, schemas.draft, deps
Used by: api.router

PROMPT:
Write only this file.

Requirements:
- POST /drafts/{id}/approve takes ApproveRequest -> DraftOut, calls
  approval_service.approve.
- POST /drafts/{id}/dismiss takes DismissRequest -> DraftOut, calls
  approval_service.dismiss.

Do not:
- Put business logic here; it belongs in services/.

Done when: approving a draft twice returns 409 and never sends a second message.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.tenant import Tenant
from app.schemas.draft import ApproveRequest, DismissRequest, DraftOut
from app.services import approval_service

router = APIRouter(tags=["drafts"])


@router.post("/drafts/{id}/approve", response_model=DraftOut)
def approve_draft_endpoint(
    id: str,
    payload: ApproveRequest = ApproveRequest(),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> DraftOut:
    draft = approval_service.approve(
        db=db,
        tenant_id=tenant.id,
        draft_id=id,
        decided_by=payload.decided_by,
        channel=payload.channel,
        edited_text=payload.edited_text,
    )
    return DraftOut.model_validate(draft)


@router.post("/drafts/{id}/dismiss", response_model=DraftOut)
def dismiss_draft_endpoint(
    id: str,
    payload: DismissRequest = DismissRequest(),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> DraftOut:
    draft = approval_service.dismiss(
        db=db,
        tenant_id=tenant.id,
        draft_id=id,
        decided_by=payload.decided_by,
        channel=payload.channel,
    )
    return DraftOut.model_validate(draft)
