"""
backend/app/adapters/messaging/mock.py
Owner: P2
Purpose: Mock messaging, the default.

PROMPT:
Write only this file. Implement MessagingAdapter by printing and storing messages in
memory. Support a flag that simulates a timeout, returning an uncertain result.

Context to paste first: README.md ground rules, docs/statuses-and-events.md, docs/api-contract.md.
"""

from typing import Any, Optional

from app.adapters.messaging.base import MessagingAdapter
from app.schemas.message import InboundMessage, SendResult


class MockMessagingAdapter(MessagingAdapter):
    def __init__(self) -> None:
        self.sent_messages: list[dict[str, Any]] = []
        self.calls: list[tuple[str, str]] = []
        self.mode: str = "ok"

    def set_mode(self, mode: str) -> None:
        self.mode = mode

    def reset(self) -> None:
        self.sent_messages.clear()
        self.calls.clear()
        self.mode = "ok"

    def send_message(self, recipient: str, text: str, idempotency_key: str) -> SendResult:
        self.calls.append(("send_message", recipient))
        if self.mode == "timeout":
            return SendResult(
                ok=False,
                status="uncertain",
                provider_message_id=None,
                error="Mock messaging timeout",
            )
        msg_id = f"MOCK-MSG-{len(self.sent_messages) + 1}"
        self.sent_messages.append({
            "recipient": recipient,
            "text": text,
            "idempotency_key": idempotency_key,
            "id": msg_id,
        })
        return SendResult(
            ok=True,
            status="sent",
            provider_message_id=msg_id,
        )

    def send_owner_prompt(self, recipient: str, text: str, draft_id: str) -> SendResult:
        self.calls.append(("send_owner_prompt", recipient))
        if self.mode == "timeout":
            return SendResult(
                ok=False,
                status="uncertain",
                provider_message_id=None,
                error="Mock messaging timeout",
            )
        msg_id = f"MOCK-PROMPT-{draft_id}"
        self.sent_messages.append({
            "recipient": recipient,
            "text": text,
            "draft_id": draft_id,
            "id": msg_id,
        })
        return SendResult(
            ok=True,
            status="sent",
            provider_message_id=msg_id,
        )

    def parse_inbound(self, payload: dict[str, Any]) -> Optional[InboundMessage]:
        sender = payload.get("sender") or payload.get("from")
        text = payload.get("text") or payload.get("body")
        if not sender or not text:
            return None
        return InboundMessage(
            sender=str(sender),
            text=str(text),
            provider_message_id=payload.get("id"),
        )
