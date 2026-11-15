"""
backend/app/adapters/messaging/base.py
Owner: P2 (AI track)
Purpose: Abstract MessagingAdapter interface shared by all messaging implementations.
Depends on: schemas.message (P1) — falls back to local dataclasses if not yet available
Used by: adapters.messaging.mock, adapters.messaging.whatsapp, adapters.registry
"""

from __future__ import annotations

from abc import ABC, abstractmethod

# ---------------------------------------------------------------------------
# Type imports — P1 owns schemas/message.py.
# Use their definitions when available; fall back to local dataclasses until
# P1 implements the file.
# ---------------------------------------------------------------------------
try:
    from app.schemas.message import InboundMessage, SendResult  # type: ignore[import]
except ImportError:
    from dataclasses import dataclass
    from typing import Literal

    @dataclass
    class InboundMessage:  # type: ignore[no-redef]
        """Parsed representation of an inbound buyer message."""

        sender: str
        text: str
        provider_message_id: str | None = None

    @dataclass
    class SendResult:  # type: ignore[no-redef]
        """Result returned by every send operation."""

        ok: bool
        status: Literal["sent", "failed", "uncertain"]
        provider_message_id: str | None = None
        error: str | None = None

    # TODO: import from app.schemas.message once P1 implements it


# Re-export so callers only need to import from base
__all__ = ["MessagingAdapter", "InboundMessage", "SendResult"]


class MessagingAdapter(ABC):
    """
    Provider-independent messaging interface.

    All implementations must be stateless with respect to business logic —
    they format, transmit, and parse; they never create leads, orders, or
    reservations.
    """

    @abstractmethod
    def send_message(self, to: str, text: str, idempotency_key: str) -> SendResult:
        """
        Send a plain-text message to a buyer.

        Args:
            to: Recipient phone number (E.164 format expected).
            text: Message body.
            idempotency_key: Caller-supplied key; used by the service layer
                to prevent double-sends. This adapter does NOT enforce it —
                deduplication happens upstream.

        Returns:
            SendResult with status 'sent', 'failed', or 'uncertain'.
        """
        ...

    @abstractmethod
    def send_owner_prompt(
        self, owner_contact: str, action_id: str, text: str
    ) -> SendResult:
        """
        Send an approval prompt to the merchant owner.

        Args:
            owner_contact: Owner's phone number.
            action_id: Identifier for the pending action (e.g. draft_id).
            text: Prompt text.

        Returns:
            SendResult with status 'sent', 'failed', or 'uncertain'.
        """
        ...

    @abstractmethod
    def parse_inbound(self, payload: dict) -> InboundMessage | None:
        """
        Parse a raw provider webhook payload into an InboundMessage.

        Returns:
            InboundMessage if the payload is a user text message.
            None for delivery receipts, read receipts, or unrecognised shapes.
        """
        ...
