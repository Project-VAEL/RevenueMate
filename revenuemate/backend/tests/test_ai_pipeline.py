"""
backend/tests/test_ai_pipeline.py
Task 8 — End-to-End AI Pipeline Tests

Proves the full buyer-message → ConversationReply pipeline works as an integrated
system using the real SQLite databases and a mock LLM provider.

This is the demo rehearsal in test form. If these pass, the AI layer is ready.

What is tested:
  - Core demo scenario (HP OmniBook 14 / 16, ₹60,000, Python + Docker)
  - Candidates have fit_reasons and trade_offs from the comparator
  - Two-turn conversation flow (clarification → resolution)
  - Mock messaging round-trip
  - Guardrail integration: invented price claim
  - Guardrail integration: stock claim
  - Both demo products appear as candidates
  - reference_only and merchant_offer_status correctness
  - Mid-pipeline LLM failure degrades to template reply
  - Context immutability across the full pipeline

What is NOT tested:
  - Live WhatsApp delivery (deferred)
  - Payment or reservation flows
  - Any P1-owned service layer

Run from revenuemate/backend/:
    pytest tests/test_ai_pipeline.py -v --tb=short
"""
from __future__ import annotations

import json
import pytest

import app.ai.llm_client as llm_module
from app.ai.llm_client import MockProvider
from app.ai import conversation_manager, recommendation_agent
from app.adapters.messaging.mock import MockMessagingAdapter
from app.schemas.recommendation import ConversationReply

DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000001"
BUYER_PHONE = "+919999999999"


# ── Shared utilities ──────────────────────────────────────────────────────────

class SequentialMock:
    """
    Mock LLM provider that returns a different canned response on each successive call.
    When all responses are exhausted it cycles back to the last one.

    Use this whenever the pipeline makes two LLM calls in one test:
      call 1 → intent_parser  (expects BuyerCriteria JSON)
      call 2 → response_generator (expects free-text prose)
    """
    name = "sequential_mock"

    def __init__(self, responses: list[str]):
        self._responses = list(responses)
        self._idx = 0
        self.call_count = 0

    def call(self, messages: list[dict], json_schema: dict | None, timeout: float) -> str:
        response = self._responses[self._idx]
        # Advance index but clamp at last entry so it always returns something
        if self._idx < len(self._responses) - 1:
            self._idx += 1
        self.call_count += 1
        return response


def _intent_json(
    *,
    budget_max_paise: int | None = 6_000_000,
    workloads: list[str] | None = None,
    battery: str | None = "important",
    needs_clarification: bool = False,
    clarifying_question: str | None = None,
    confirmed_fields: list[str] | None = None,
    missing_critical_fields: list[str] | None = None,
) -> str:
    """Build a valid BuyerCriteria JSON string for LLM mock responses."""
    if confirmed_fields is None:
        confirmed_fields = (
            ["budget_max_paise", "workloads", "battery"]
            if not needs_clarification
            else [f for f in ["workloads"] if workloads]
        )
    return json.dumps({
        "intent": "product_discovery" if not needs_clarification else "other",
        "budget_max_paise": budget_max_paise,
        "workloads": workloads or ["programming", "docker"],
        "hard_constraints": {
            "os": None,
            "min_ram_gb": None,
            "min_storage_gb": None,
            "discrete_gpu_required": False,
            "max_weight_kg": None,
            "required_ports": [],
        },
        "soft_preferences": {
            "battery": battery,
            "weight": None,
            "display": None,
            "keyboard": None,
            "portability": None,
        },
        "confirmed_fields": confirmed_fields,
        "missing_critical_fields": missing_critical_fields or [],
        "needs_clarification": needs_clarification,
        "clarifying_question": clarifying_question,
        "confidence": 0.5 if needs_clarification else 0.92,
    })


def _demo_reply_text() -> str:
    return (
        "Based on your requirements for Python and Docker development with a ₹60,000 "
        "budget and good battery life, here are options from the reference catalogue. "
        "The HP OmniBook 14 features 16GB RAM and an OLED display — both confirmed from "
        "source data. Battery capacity could not be confirmed from source data. "
        "These are reference products — availability in the merchant's shop is not confirmed."
    )


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_chain():
    """Restore _chain to its original state after every test."""
    original = llm_module._chain[:]
    yield
    llm_module._chain = original


# ═══════════════════════════════════════════════════════════════════════════════
# Test 1 — Core demo scenario
# ═══════════════════════════════════════════════════════════════════════════════

def test_demo_scenario():
    """
    Buyer: "I need a laptop for Python, VS Code and Docker.
            Budget ₹60,000. Battery life matters."

    Uses real SQLite DBs. Mock LLM for intent (call 1) and response (call 2).
    This is the exact scenario from AI_LAYER_PLAN.md § Task 8.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        _demo_reply_text(),
    ])]

    context = conversation_manager.new_context("conv-001", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "I need a laptop for Python, VS Code and Docker. "
        "Budget ₹60,000. Battery life matters.",
        context,
    )

    assert isinstance(reply, ConversationReply)
    assert reply.needs_clarification is False
    assert len(reply.candidates) >= 1
    assert all(c.recommendation_eligible for c in reply.candidates)
    assert reply.transaction_allowed is False
    assert len(reply.evidence_ids) > 0
    assert "in stock" not in reply.reply_text.lower()


# ═══════════════════════════════════════════════════════════════════════════════
# Test 2 — Demo candidates have fit_reasons and trade_offs
# ═══════════════════════════════════════════════════════════════════════════════

def test_demo_candidates_have_comparator_output():
    """
    After the full pipeline, candidates returned by the comparator must have
    fit_reasons and trade_offs populated. Battery is unconfirmed for both
    HP OmniBooks, so at least one trade_off is guaranteed.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(battery="important"),
        _demo_reply_text(),
    ])]

    context = conversation_manager.new_context("conv-002", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "I need a laptop for Python, VS Code and Docker. "
        "Budget ₹60,000. Battery life matters.",
        context,
    )

    assert len(reply.candidates) >= 1
    # At least one candidate must have trade_offs (battery unconfirmed)
    any_trade_offs = any(len(c.trade_offs) > 0 for c in reply.candidates)
    assert any_trade_offs, "Expected at least one candidate with trade_offs"

    # At least one candidate must have fit_reasons (budget or workload logic)
    any_fit_reasons = any(len(c.fit_reasons) > 0 for c in reply.candidates)
    # fit_reasons only appear when criteria has hard constraints — battery soft pref
    # adds a trade_off when null; fit_reasons may be empty if no hard constraints set
    # We assert the candidates were processed (fit_reasons or trade_offs non-empty)
    assert any_trade_offs or any_fit_reasons, (
        "Expected comparator to have annotated at least one candidate"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Test 3 — Two-turn conversation flow
# ═══════════════════════════════════════════════════════════════════════════════

def test_two_turn_flow():
    """
    Turn 1: message with workloads but no budget → needs_clarification=True
    Turn 2: adds budget → needs_clarification=False, candidates returned

    Proves conversation_manager integrates correctly with the agent across turns.
    """
    context = conversation_manager.new_context("conv-003", DEMO_TENANT_ID)

    # Turn 1: LLM asks for budget
    llm_module._chain = [MockProvider(_intent_json(
        budget_max_paise=None,
        needs_clarification=True,
        clarifying_question="What is your budget?",
        confirmed_fields=["workloads"],
        missing_critical_fields=["budget_max_paise"],
    ))]
    reply1 = recommendation_agent.handle_buyer_message(
        "I need a laptop for Python and Docker",
        context,
    )
    assert reply1.needs_clarification is True
    assert reply1.recommended_action == "ask_clarification"
    assert reply1.transaction_allowed is False

    # Turn 2: budget provided → full pipeline runs
    llm_module._chain = [SequentialMock([
        _intent_json(budget_max_paise=6_000_000, needs_clarification=False),
        "Here are matching laptops within your budget.",
    ])]
    reply2 = recommendation_agent.handle_buyer_message(
        "My budget is ₹60,000",
        context,
    )
    assert reply2.needs_clarification is False
    assert reply2.transaction_allowed is False
    assert len(reply2.candidates) >= 1


# ═══════════════════════════════════════════════════════════════════════════════
# Test 4 — Mock messaging round-trip
# ═══════════════════════════════════════════════════════════════════════════════

def test_mock_messaging_round_trip():
    """
    handle_buyer_message output → adapter.send_message → SendResult(status="sent")
    → adapter._sent has the correct record.

    Proves the reply can be passed directly into the messaging adapter.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        "The HP OmniBook 14 fits your Python and Docker requirements.",
    ])]

    context = conversation_manager.new_context("conv-004", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    adapter = MockMessagingAdapter()
    result = adapter.send_message(
        to=BUYER_PHONE,
        text=reply.reply_text,
        idempotency_key="e2e-test-key-001",
    )

    assert result.ok is True
    assert result.status == "sent"
    assert result.provider_message_id is not None
    assert len(adapter._sent) == 1

    record = adapter._sent[0]
    assert record["to"] == BUYER_PHONE
    assert record["text"] == reply.reply_text
    assert record["idempotency_key"] == "e2e-test-key-001"


# ═══════════════════════════════════════════════════════════════════════════════
# Test 5 — Guardrail integration: invented price
# ═══════════════════════════════════════════════════════════════════════════════

def test_guardrail_fires_on_invented_price():
    """
    LLM response_generator step returns a price (₹55,000) not grounded in any
    candidate's facts → guardrail fires → warning in ConversationReply.warnings.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        "The HP OmniBook 14 is priced at ₹55,000 and is perfect for coding.",
    ])]

    context = conversation_manager.new_context("conv-005", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    # Guardrail must have fired since no candidate has a confirmed merchant price
    assert any("price" in w.lower() for w in reply.warnings), (
        f"Expected price guardrail warning but got: {reply.warnings}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Test 6 — Guardrail integration: stock claim
# ═══════════════════════════════════════════════════════════════════════════════

def test_guardrail_fires_on_stock_claim():
    """
    LLM returns "in stock" — no stock data in any candidate's facts
    → guardrail fires → warning in ConversationReply.warnings.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        "The HP OmniBook 14 is in stock and ships today.",
    ])]

    context = conversation_manager.new_context("conv-006", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    assert any("stock" in w.lower() for w in reply.warnings), (
        f"Expected stock guardrail warning but got: {reply.warnings}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Test 7 — Both demo products appear as candidates
# ═══════════════════════════════════════════════════════════════════════════════

def test_both_demo_products_in_candidates():
    """
    HP OmniBook 14 (P-HP-OMNI14-E70FYPA) and HP OmniBook 16 (P-HP-OMNI16-BH4K6PA)
    are both recommendation_eligible=True and both have NULL merchant prices
    (kept as reference-only). Both must appear for the demo scenario.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        _demo_reply_text(),
    ])]

    context = conversation_manager.new_context("conv-007", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "I need a laptop for Python, VS Code and Docker. "
        "Budget ₹60,000. Battery life matters.",
        context,
    )

    candidate_ids = [c.product_id for c in reply.candidates]
    assert "P-HP-OMNI14-E70FYPA" in candidate_ids, (
        f"HP OmniBook 14 missing from candidates: {candidate_ids}"
    )
    assert "P-HP-OMNI16-BH4K6PA" in candidate_ids, (
        f"HP OmniBook 16 missing from candidates: {candidate_ids}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Test 8 — reference_only and merchant_offer_status correctness
# ═══════════════════════════════════════════════════════════════════════════════

def test_reference_only_and_merchant_status():
    """
    merchant_offer_status must be 'not_checked' and transaction_allowed must be False.
    The reply must not suggest the buyer can purchase directly.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        _demo_reply_text(),
    ])]

    context = conversation_manager.new_context("conv-008", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    assert reply.merchant_offer_status == "not_checked"
    assert reply.transaction_allowed is False
    # Transactional language must not appear in the reply
    for phrase in ["reserve", "buy now", "place your order", "add to cart"]:
        assert phrase not in reply.reply_text.lower(), (
            f"Transactional phrase '{phrase}' found in reply"
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Test 9 — Mid-pipeline LLM failure degrades to template reply
# ═══════════════════════════════════════════════════════════════════════════════

def test_mid_pipeline_llm_failure_degrades_gracefully():
    """
    LLM call 1 (intent) succeeds → retrieval runs against real DB →
    LLM call 2 (response) fails → template reply returned.

    Proves graceful degradation mid-flow: the buyer gets a coherent reply
    even when the response LLM step fails.
    """
    failing_mock = MockProvider(simulate_failure=True)
    intent_mock = MockProvider(_intent_json())

    # First call → intent_mock succeeds; second call → failing_mock raises
    # We simulate this with a SequentialMock where call 2 raises.
    class _FailOnSecond:
        name = "fail_on_second"
        def __init__(self):
            self._count = 0
        def call(self, messages, json_schema, timeout):
            self._count += 1
            if self._count == 1:
                return _intent_json()
            raise llm_module.LLMUnavailable("Simulated response-step failure")

    llm_module._chain = [_FailOnSecond()]

    context = conversation_manager.new_context("conv-009", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    # Must return a valid ConversationReply — not crash
    assert isinstance(reply, ConversationReply)
    assert reply.transaction_allowed is False
    assert len(reply.reply_text) > 0
    # Template reply mentions product names or "reference"
    assert (
        "HP" in reply.reply_text
        or "reference" in reply.reply_text.lower()
        or "laptop" in reply.reply_text.lower()
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Test 10 — Context immutability across the full pipeline
# ═══════════════════════════════════════════════════════════════════════════════

def test_context_not_mutated_by_pipeline():
    """
    The ConversationContext passed into handle_buyer_message must be unchanged
    after the call returns. P1 owns persistence; the agent must not mutate
    the caller's context object.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        "Here are your laptop options.",
    ])]

    context = conversation_manager.new_context("conv-010", DEMO_TENANT_ID)
    original_turn_count = context.turn_count
    original_history_len = len(context.history)
    original_stage = context.stage

    recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    assert context.turn_count == original_turn_count, (
        "turn_count was mutated — context must be immutable from caller's perspective"
    )
    assert len(context.history) == original_history_len, (
        "history was mutated — context must be immutable from caller's perspective"
    )
    assert context.stage == original_stage


# ═══════════════════════════════════════════════════════════════════════════════
# Bonus: messaging timeout does not affect the pipeline reply
# ═══════════════════════════════════════════════════════════════════════════════

def test_messaging_timeout_does_not_affect_pipeline_reply():
    """
    If the messaging adapter times out on send, the pipeline reply itself is
    unaffected — the reply object is still correct.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(),
        "Here are your laptop options.",
    ])]

    context = conversation_manager.new_context("conv-011", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    adapter = MockMessagingAdapter(simulate_timeout=True)
    send_result = adapter.send_message(BUYER_PHONE, reply.reply_text, "key-timeout")

    # Messaging failed, but the reply itself is intact
    assert send_result.status == "uncertain"
    assert send_result.ok is False
    assert len(adapter._sent) == 0

    # The reply is still a valid, complete ConversationReply
    assert isinstance(reply, ConversationReply)
    assert reply.transaction_allowed is False


# ═══════════════════════════════════════════════════════════════════════════════
# Bonus: all 10 eligible variants are retrieved without budget filter
# ═══════════════════════════════════════════════════════════════════════════════

def test_all_ten_eligible_variants_accessible_through_pipeline():
    """
    When no budget is set (needs_clarification fires), no DB call is made.
    When budget is set, retrieval returns all 10 eligible variants
    (all have NULL merchant price → kept as reference-only).
    This test bypasses the clarification step by injecting a full criteria.
    """
    llm_module._chain = [SequentialMock([
        _intent_json(budget_max_paise=6_000_000),
        "Here are matching laptops.",
    ])]

    context = conversation_manager.new_context("conv-012", DEMO_TENANT_ID)
    reply = recommendation_agent.handle_buyer_message(
        "Python laptop 60k",
        context,
    )

    # All 10 eligible variants have NULL prices → all kept as reference-only
    assert len(reply.candidates) == 10, (
        f"Expected 10 candidates (all eligible, all NULL price), got {len(reply.candidates)}"
    )
    assert all(c.recommendation_eligible for c in reply.candidates)
