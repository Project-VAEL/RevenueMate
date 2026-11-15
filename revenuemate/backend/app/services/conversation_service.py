"""
backend/app/services/conversation_service.py
Thin wrapper that connects the API layer to the AI pipeline.

Context is stateless per call for now — P1 can add DB persistence later.
Each call constructs a fresh ConversationContext. The updated context
returned by handle_buyer_message is available for future persistence.
"""

from __future__ import annotations

from app.ai import conversation_manager, recommendation_agent
from app.schemas.recommendation import ConversationReply


def process_message(
    conversation_id: str,
    tenant_id: str,
    message: str,
) -> ConversationReply:
    """
    Process a buyer message through the full AI pipeline and return a reply.

    Parameters
    ----------
    conversation_id  Unique identifier for this conversation (from the API path).
    tenant_id        Tenant identifier (defaults to DEMO_TENANT_ID if not provided).
    message          Raw buyer message text.

    Returns
    -------
    ConversationReply — never raises; AI layer handles all failures internally.
    """
    ctx = conversation_manager.new_context(conversation_id, tenant_id)
    return recommendation_agent.handle_buyer_message(message, ctx)
