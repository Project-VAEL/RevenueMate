"""
backend/app/schemas/message.py
Message models and messaging result types.
"""

from dataclasses import dataclass, field
from typing import Literal

from pydantic import BaseModel, ConfigDict


@dataclass
class InboundMessage:
    """Parsed representation of an inbound buyer message."""
    sender: str
    text: str
    provider_message_id: str | None = None


@dataclass
class SendResult:
    """Result returned by every send operation."""
    ok: bool
    status: Literal["sent", "failed", "uncertain"]
    provider_message_id: str | None = None
    error: str | None = None


class MessageOut(BaseModel):
    """Outbound message record for API responses."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: str
    direction: str
    text: str
    status: str
    created_at: str
