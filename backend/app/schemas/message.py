"""
backend/app/schemas/message.py
Owner: P1
Purpose: Message models and messaging result types.
Depends on: none
Used by: adapters.messaging (P2), approval_service, api.webhooks

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- InboundMessage (dataclass): sender str, text str, provider_message_id str | None.
- SendResult (dataclass): ok bool, status Literal['sent','failed','uncertain'],
  provider_message_id str | None, error str | None.
- MessageOut: id, lead_id, direction, text, status, created_at.

Do not:
- Add channel-specific fields.

Done when: a messaging adapter can return SendResult(ok=False, status='uncertain') for a
timeout.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


@dataclass
class InboundMessage:
    sender: str
    text: str
    provider_message_id: Optional[str] = None


@dataclass
class SendResult:
    ok: bool
    status: Literal["sent", "failed", "uncertain"]
    provider_message_id: Optional[str] = None
    error: Optional[str] = None


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    lead_id: Optional[str] = None
    direction: str
    text: str
    status: str
    created_at: datetime
