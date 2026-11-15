"""
backend/tests/test_mock_messaging.py
Tests for Task 6: MockMessagingAdapter and MessagingAdapter ABC.
Uses no network, no LLM, no database.
"""

from __future__ import annotations

import pytest

from app.adapters.messaging.base import InboundMessage, MessagingAdapter, SendResult
from app.adapters.messaging.mock import MockMessagingAdapter


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_adapter(simulate_timeout: bool = False) -> MockMessagingAdapter:
    return MockMessagingAdapter(simulate_timeout=simulate_timeout)


# ---------------------------------------------------------------------------
# ABC contract
# ---------------------------------------------------------------------------


class TestMessagingAdapterABC:
    def test_cannot_instantiate_abstract(self):
        with pytest.raises(TypeError):
            MessagingAdapter()  # type: ignore[abstract]

    def test_mock_is_a_messaging_adapter(self):
        assert isinstance(make_adapter(), MessagingAdapter)


# ---------------------------------------------------------------------------
# Type availability
# ---------------------------------------------------------------------------


class TestTypeImports:
    def test_inbound_message_importable(self):
        msg = InboundMessage(sender="+919999999999", text="Hello")
        assert msg.sender == "+919999999999"
        assert msg.text == "Hello"
        assert msg.provider_message_id is None

    def test_send_result_importable(self):
        result = SendResult(ok=True, status="sent")
        assert result.ok is True
        assert result.status == "sent"
        assert result.provider_message_id is None
        assert result.error is None


# ---------------------------------------------------------------------------
# send_message
# ---------------------------------------------------------------------------


class TestSendMessage:
    def test_success_returns_sent_status(self):
        adapter = make_adapter()
        result = adapter.send_message("+919999999999", "hi there", "k1")
        assert result.ok is True
        assert result.status == "sent"
        assert result.provider_message_id is not None
        assert result.provider_message_id.startswith("mock-")
        assert result.error is None

    def test_success_appends_to_sent(self):
        adapter = make_adapter()
        adapter.send_message("+919999999999", "hi there", "k1")
        assert len(adapter._sent) == 1
        record = adapter._sent[0]
        assert record["type"] == "message"
        assert record["to"] == "+919999999999"
        assert record["text"] == "hi there"
        assert record["idempotency_key"] == "k1"

    def test_multiple_sends_accumulate(self):
        adapter = make_adapter()
        adapter.send_message("+911111111111", "msg1", "key-1")
        adapter.send_message("+912222222222", "msg2", "key-2")
        assert len(adapter._sent) == 2

    def test_timeout_returns_uncertain(self):
        adapter = make_adapter(simulate_timeout=True)
        result = adapter.send_message("+919999999999", "hi", "k1")
        assert result.ok is False
        assert result.status == "uncertain"

    def test_timeout_does_not_append_to_sent(self):
        adapter = make_adapter(simulate_timeout=True)
        adapter.send_message("+919999999999", "hi", "k1")
        assert len(adapter._sent) == 0

    def test_provider_message_ids_are_unique(self):
        adapter = make_adapter()
        r1 = adapter.send_message("+911111111111", "a", "k1")
        r2 = adapter.send_message("+912222222222", "b", "k2")
        assert r1.provider_message_id != r2.provider_message_id


# ---------------------------------------------------------------------------
# send_owner_prompt
# ---------------------------------------------------------------------------


class TestSendOwnerPrompt:
    def test_success_returns_sent_status(self):
        adapter = make_adapter()
        result = adapter.send_owner_prompt("+919000000000", "draft-1", "Approve?")
        assert result.ok is True
        assert result.status == "sent"

    def test_success_appends_owner_prompt_type(self):
        adapter = make_adapter()
        adapter.send_owner_prompt("+919000000000", "draft-1", "Approve?")
        assert len(adapter._sent) == 1
        record = adapter._sent[0]
        assert record["type"] == "owner_prompt"
        assert record["to"] == "+919000000000"
        assert record["action_id"] == "draft-1"
        assert record["text"] == "Approve?"

    def test_timeout_returns_uncertain(self):
        adapter = make_adapter(simulate_timeout=True)
        result = adapter.send_owner_prompt("+919000000000", "draft-1", "Approve?")
        assert result.ok is False
        assert result.status == "uncertain"

    def test_timeout_does_not_append_to_sent(self):
        adapter = make_adapter(simulate_timeout=True)
        adapter.send_owner_prompt("+919000000000", "draft-1", "Approve?")
        assert len(adapter._sent) == 0


# ---------------------------------------------------------------------------
# parse_inbound
# ---------------------------------------------------------------------------


class TestParseInbound:
    def test_valid_text_message(self):
        adapter = make_adapter()
        payload = {"from": "+919999999999", "text": {"body": "Hello"}, "id": "wamid-001"}
        result = adapter.parse_inbound(payload)
        assert isinstance(result, InboundMessage)
        assert result.sender == "+919999999999"
        assert result.text == "Hello"
        assert result.provider_message_id == "wamid-001"

    def test_valid_message_without_id(self):
        adapter = make_adapter()
        payload = {"from": "+919999999999", "text": {"body": "Hello"}}
        result = adapter.parse_inbound(payload)
        assert result is not None
        assert result.provider_message_id is None

    def test_valid_message_appends_to_received(self):
        adapter = make_adapter()
        adapter.parse_inbound({"from": "+919999999999", "text": {"body": "Hello"}})
        assert len(adapter._received) == 1

    def test_receipt_returns_none(self):
        adapter = make_adapter()
        result = adapter.parse_inbound({"type": "receipt", "id": "wamid-001"})
        assert result is None

    def test_receipt_does_not_append_to_received(self):
        adapter = make_adapter()
        adapter.parse_inbound({"type": "receipt", "id": "wamid-001"})
        assert len(adapter._received) == 0

    def test_unknown_shape_returns_none(self):
        adapter = make_adapter()
        result = adapter.parse_inbound({"unknown": "shape"})
        assert result is None

    def test_text_not_a_dict_returns_none(self):
        adapter = make_adapter()
        result = adapter.parse_inbound({"from": "+919999999999", "text": "not_a_dict"})
        assert result is None

    def test_empty_payload_returns_none(self):
        adapter = make_adapter()
        assert adapter.parse_inbound({}) is None

    def test_nested_key_error_returns_none(self):
        adapter = make_adapter()
        # text dict exists but missing "body"
        result = adapter.parse_inbound({"from": "+919999999999", "text": {}})
        assert result is None


# ---------------------------------------------------------------------------
# State isolation between adapter instances
# ---------------------------------------------------------------------------


class TestStateIsolation:
    def test_separate_instances_have_independent_state(self):
        a1 = make_adapter()
        a2 = make_adapter()
        a1.send_message("+911111111111", "hi", "k1")
        assert len(a1._sent) == 1
        assert len(a2._sent) == 0

    def test_fresh_adapter_starts_empty(self):
        adapter = make_adapter()
        assert adapter._sent == []
        assert adapter._received == []


# ---------------------------------------------------------------------------
# Registry integration (optional — skipped if P1 hasn't implemented registry)
# ---------------------------------------------------------------------------


class TestRegistryIntegration:
    def test_registry_returns_mock_adapter(self):
        try:
            from app.adapters import registry  # type: ignore[import]

            if not callable(getattr(registry, "get_messaging", None)):
                pytest.skip("registry.get_messaging not yet implemented by P1")
            registry.reset_adapters()
            adapter = registry.get_messaging()
            assert isinstance(adapter, MockMessagingAdapter)
        except ImportError:
            pytest.skip("registry.py not yet implemented by P1")

    def test_registry_returns_same_instance(self):
        try:
            from app.adapters import registry  # type: ignore[import]

            if not callable(getattr(registry, "get_messaging", None)):
                pytest.skip("registry.get_messaging not yet implemented by P1")
            registry.reset_adapters()
            assert registry.get_messaging() is registry.get_messaging()
        except ImportError:
            pytest.skip("registry.py not yet implemented by P1")
