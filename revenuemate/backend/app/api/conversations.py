"""
backend/app/api/conversations.py
API router for AI conversation operations.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.schemas.recommendation import ConversationReply
from app.services.conversation_service import process_message

router = APIRouter()


class MessageRequest(BaseModel):
    message: str
    tenant_id: str = settings.DEMO_TENANT_ID


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ConversationReply,
    summary="Send a buyer message and get an AI-generated reply",
)
def send_message(conversation_id: str, body: MessageRequest) -> ConversationReply:
    """
    Process a buyer message through the full AI pipeline.

    - Parses intent from the message
    - Retrieves matching laptop candidates from the reference catalogue
    - Runs deterministic comparison against buyer criteria
    - Generates a natural-language reply grounded in verified facts
    - Returns ConversationReply with candidates, evidence, and warnings
    """
    return process_message(
        conversation_id=conversation_id,
        tenant_id=body.tenant_id,
        message=body.message,
    )
