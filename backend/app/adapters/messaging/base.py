"""
backend/app/adapters/messaging/base.py
Owner: P2
Purpose: Messaging interface.

PROMPT:
Write only this file. Abstract MessagingAdapter with send_message, send_owner_prompt
and parse_inbound exactly as in docs/statuses-and-events.md.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""

from abc import ABC, abstractmethod
from typing import Any

from app.schemas.message import InboundMessage, SendResult


class MessagingAdapter(ABC):
    @abstractmethod
    def send_message(self, recipient: str, text: str, idempotency_key: str) -> SendResult:
        pass

    @abstractmethod
    def send_owner_prompt(self, recipient: str, text: str, draft_id: str) -> SendResult:
        pass

    @abstractmethod
    def parse_inbound(self, payload: dict[str, Any]) -> InboundMessage | None:
        pass
