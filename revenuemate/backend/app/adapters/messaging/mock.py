"""
backend/app/adapters/messaging/mock.py
Owner: P2 (AI track)
Purpose: In-memory mock messaging adapter. Default adapter for all tests and local dev.
Depends on: adapters.messaging.base
Used by: adapters.registry (when MESSAGING_PROVIDER=mock), tests
"""

from __future__ import annotations

from uuid import uuid4

from app.adapters.messaging.base import InboundMessage, MessagingAdapter, SendResult


class MockMessagingAdapter(MessagingAdapter):
    """
    In-memory messaging adapter for tests and local development.

    Outbound sends are stored in self._sent.
    Parsed inbound messages are stored in self._received.
    No network calls are made.

    Args:
        simulate_timeout: When True, every send returns status='uncertain'
            and nothing is appended to _sent, simulating a network timeout.
    """

    def __init__(self, simulate_timeout: bool = False) -> None:
        self.simulate_timeout = simulate_timeout
        self._sent: list[dict] = []
        self._received: list[InboundMessage] = []

    # ------------------------------------------------------------------
    # Send operations
    # ------------------------------------------------------------------

    def send_message(self, to: str, text: str, idempotency_key: str) -> SendResult:
        if self.simulate_timeout:
            return SendResult(
                ok=False,
                status="uncertain",
                provider_message_id=None,
                error="simulated timeout",
            )

        provider_message_id = f"mock-{uuid4()}"
        self._sent.append(
            {
                "type": "message",
                "to": to,
                "text": text,
                "idempotency_key": idempotency_key,
                "provider_message_id": provider_message_id,
            }
        )
        return SendResult(
            ok=True,
            status="sent",
            provider_message_id=provider_message_id,
            error=None,
        )

    def send_owner_prompt(
        self, owner_contact: str, action_id: str, text: str
    ) -> SendResult:
        if self.simulate_timeout:
            return SendResult(
                ok=False,
                status="uncertain",
                provider_message_id=None,
                error="simulated timeout",
            )

        provider_message_id = f"mock-{uuid4()}"
        self._sent.append(
            {
                "type": "owner_prompt",
                "to": owner_contact,
                "action_id": action_id,
                "text": text,
                "provider_message_id": provider_message_id,
            }
        )
        return SendResult(
            ok=True,
            status="sent",
            provider_message_id=provider_message_id,
            error=None,
        )

    # ------------------------------------------------------------------
    # Inbound parsing
    # ------------------------------------------------------------------

    def parse_inbound(self, payload: dict) -> InboundMessage | None:
        """
        Accepts payloads shaped like WhatsApp Cloud API webhook entries:
            {"from": "+91...", "text": {"body": "Hello"}, "id": "wamid..."}

        Returns None for:
            - Delivery / read receipts  {"type": "receipt", ...}
            - Any unrecognised shape
        """
        try:
            # Delivery and read receipts — discard silently
            if payload.get("type") == "receipt":
                return None

            sender: str = payload["from"]
            body: str = payload["text"]["body"]
            provider_message_id: str | None = payload.get("id")

            message = InboundMessage(
                sender=sender,
                text=body,
                provider_message_id=provider_message_id,
            )
            self._received.append(message)
            return message

        except (KeyError, TypeError):
            # Unknown payload shape — return None, never crash
            return None
