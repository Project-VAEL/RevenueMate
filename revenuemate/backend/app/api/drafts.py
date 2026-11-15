from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class ApproveRequest(BaseModel):
    edited_text: str | None = None
    decided_by: str = "owner"
    channel: str = "dashboard"


@router.post("/drafts/{draft_id}/approve")
def approve_draft(draft_id: str, body: ApproveRequest):
    return {"status": "approved"}


@router.post("/drafts/{draft_id}/dismiss")
def dismiss_draft(draft_id: str, body: ApproveRequest):
    return {"status": "dismissed"}
