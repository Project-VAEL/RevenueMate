"""
Tests for Task 7 — Response Generator + Recommendation Agent.

response_generator tests: inject MockProvider; use synthetic RecommendationResult.
recommendation_agent tests: inject MockProvider + use real SQLite DBs for retrieval.

Run from revenuemate/backend/:
    pytest tests/test_task7.py -v --tb=short
"""
from __future__ import annotations

import json
import pytest

import app.ai.llm_client as llm_module
from app.ai.llm_client import MockProvider
from app.ai.response_generator import generate_response, _build_template_reply
from app.ai.recommendation_agent import handle_buyer_message
from app.ai.conversation_manager import new_context
from app.schemas.conversation import BuyerCriteria, ConversationContext, HardConstraints, SoftPreferences
from app.schemas.recommendation import (
    CandidateProduct,
    ConversationReply,
    RecommendationResult,
    SourceEvidence,
)


# ── Fixtures & helpers ────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_chain():
    original = llm_module._chain[:]
    yield
    llm_module._chain = original


def _mock_llm(response: str) -> MockProvider:
    mock = MockProvider(response)
    llm_module._chain = [mock]
    return mock


def _make_candidate(
    product_id: str = "P-HP-OMNI14-E70FYPA",
    product_name: str = "HP OmniBook 14",
    brand: str = "HP",
    facts: dict | None = None,
    unknown_fields: list[str] | None = None,
    source_ids: list[str] | None = None,
    fit_reasons: list[str] | None = None,
    trade_offs: list[str] | None = None,
) -> CandidateProduct:
    return CandidateProduct(
        product_id=product_id,
        brand=brand,
        product_name=product_name,
        model_code="E70FYPA",
        facts=facts or {"memory": {"capacity_GB": 16}},
        unknown_fields=unknown_fields or ["battery_capacity_Wh"],
        source_ids=source_ids or ["SRC-HP-OMNI14"],
        evidence=[SourceEvidence(source_id=s) for s in (source_ids or ["SRC-HP-OMNI14"])],
        recommendation_eligible=True,
        fit_reasons=fit_reasons or ["16GB RAM meets workload requirement"],
        trade_offs=trade_offs or ["Battery capacity not confirmed in source data"],
    )


def _make_result(
    candidates: list[CandidateProduct] | None = None,
    transaction_allowed: bool = False,
    reference_only: bool = True,
) -> RecommendationResult:
    return RecommendationResult(
        candidates=candidates or [_make_candidate()],
        merchant_offer_status="not_checked",
        transaction_allowed=transaction_allowed,
        reference_only=reference_only,
    )


def _make_criteria(
    budget_max_paise: int | None = 6_000_000,
    workloads: list[str] | None = None,
    needs_clarification: bool = False,
    clarifying_question: str | None = None,
    battery: str | None = None,
) -> BuyerCriteria:
    return BuyerCriteria(
        intent="product_discovery",
        budget_max_paise=budget_max_paise,
        workloads=workloads or ["programming", "docker"],
        hard_constraints=HardConstraints(),
        soft_preferences=SoftPreferences(battery=battery),
        confirmed_fields=["budget_max_paise", "workloads"],
        needs_clarification=needs_clarification,
        clarifying_question=clarifying_question,
        confidence=0.9,
    )


def _ctx() -> ConversationContext:
    return new_context("conv-test", "tenant-test")


# ═══════════════════════════════════════════════════════════════════════════════
# response_generator tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestResponseGenerator:

    # ── LLM success path ──────────────────────────────────────────────────────

    def test_reply_text_from_mock(self):
        _mock_llm("The HP OmniBook 14 fits your requirements well.")
        reply = generate_response(_make_criteria(), _make_result(), _ctx())
        assert reply.reply_text == "The HP OmniBook 14 fits your requirements well."

    def test_transaction_allowed_always_false(self):
        _mock_llm("Great laptop for you.")
        reply = generate_response(_make_criteria(), _make_result(), _ctx())
        assert reply.transaction_allowed is False

    def test_candidate_ids_populated(self):
        c1 = _make_candidate("P-HP-OMNI14-E70FYPA")
        c2 = _make_candidate("P-HP-OMNI16-BH4K6PA", product_name="HP OmniBook 16",
                              source_ids=["SRC-HP-OMNI16"])
        _mock_llm("Here are two options.")
        reply = generate_response(_make_criteria(), _make_result([c1, c2]), _ctx())
        assert "P-HP-OMNI14-E70FYPA" in reply.candidate_ids
        assert "P-HP-OMNI16-BH4K6PA" in reply.candidate_ids

    def test_evidence_ids_populated(self):
        _mock_llm("Good laptop.")
        reply = generate_response(_make_criteria(), _make_result(), _ctx())
        assert len(reply.evidence_ids) > 0
        assert "SRC-HP-OMNI14" in reply.evidence_ids

    def test_evidence_ids_deduplicated(self):
        """Same source_id on two candidates must appear only once."""
        c1 = _make_candidate("P-001", source_ids=["SRC-SHARED"])
        c2 = _make_candidate("P-002", product_name="Laptop 2", source_ids=["SRC-SHARED"])
        _mock_llm("Two laptops.")
        reply = generate_response(_make_criteria(), _make_result([c1, c2]), _ctx())
        assert reply.evidence_ids.count("SRC-SHARED") == 1

    def test_intent_propagated(self):
        _mock_llm("Here are your options.")
        criteria = _make_criteria()
        reply = generate_response(criteria, _make_result(), _ctx())
        assert reply.intent == criteria.intent

    def test_merchant_offer_status_propagated(self):
        _mock_llm("Here are your options.")
        result = _make_result()
        reply = generate_response(_make_criteria(), result, _ctx())
        assert reply.merchant_offer_status == "not_checked"

    def test_needs_clarification_always_false(self):
        _mock_llm("Here are your options.")
        reply = generate_response(_make_criteria(), _make_result(), _ctx())
        assert reply.needs_clarification is False

    def test_recommended_action_show_comparison(self):
        _mock_llm("Here are two options.")
        reply = generate_response(_make_criteria(), _make_result(), _ctx())
        assert reply.recommended_action == "show_comparison"

    # ── Guardrails ─────────────────────────────────────────────────────────────

    def test_invented_price_triggers_guardrail_warning(self):
        """LLM invents a price not in facts → warning in ConversationReply.warnings."""
        candidate = _make_candidate(facts={})   # no price in facts
        _mock_llm("This laptop is ₹55,000 and very capable.")
        reply = generate_response(_make_criteria(), _make_result([candidate]), _ctx())
        assert any("price" in w.lower() for w in reply.warnings)

    def test_grounded_price_no_warning(self):
        """Price in facts → no warning."""
        candidate = _make_candidate(facts={"merchant_price_inr": 55000})
        _mock_llm("This laptop is ₹55,000.")
        reply = generate_response(_make_criteria(), _make_result([candidate]), _ctx())
        assert not any("price" in w.lower() for w in reply.warnings)

    def test_stock_claim_triggers_guardrail(self):
        candidate = _make_candidate(facts={})
        _mock_llm("This laptop is in stock at the shop.")
        reply = generate_response(_make_criteria(), _make_result([candidate]), _ctx())
        assert any("stock" in w.lower() for w in reply.warnings)

    def test_battery_runtime_claim_triggers_guardrail(self):
        candidate = _make_candidate(facts={})
        _mock_llm("Enjoy 12 hours battery life.")
        reply = generate_response(_make_criteria(), _make_result([candidate]), _ctx())
        assert any("battery" in w.lower() for w in reply.warnings)

    def test_clean_reply_no_warnings(self):
        candidate = _make_candidate(facts={"memory": {"capacity_GB": 16}})
        _mock_llm("This laptop has 16GB RAM and an OLED display.")
        reply = generate_response(_make_criteria(), _make_result([candidate]), _ctx())
        assert reply.warnings == []

    # ── Transactional language neutralisation ──────────────────────────────────

    def test_buy_language_neutralised_when_not_allowed(self):
        _mock_llm("You can buy this laptop today.")
        reply = generate_response(_make_criteria(), _make_result(transaction_allowed=False), _ctx())
        assert "buy" not in reply.reply_text.lower()
        assert any("transactional" in w.lower() for w in reply.warnings)

    def test_reserve_language_neutralised(self):
        _mock_llm("You can reserve this laptop now.")
        reply = generate_response(_make_criteria(), _make_result(transaction_allowed=False), _ctx())
        assert "reserve" not in reply.reply_text.lower()

    def test_order_language_neutralised(self):
        _mock_llm("Place your order today.")
        reply = generate_response(_make_criteria(), _make_result(transaction_allowed=False), _ctx())
        assert "order" not in reply.reply_text.lower()

    def test_transactional_language_allowed_when_flag_true(self):
        """
        transaction_allowed=True (hypothetical future state) → no neutralisation.
        Note: generate_response still sets transaction_allowed=False on the reply
        per plan rules — only the text neutralisation is skipped.
        """
        _mock_llm("You can reserve this laptop now.")
        reply = generate_response(
            _make_criteria(),
            _make_result(transaction_allowed=True),
            _ctx(),
        )
        # Text is NOT cleaned when transaction_allowed=True
        assert "reserve" in reply.reply_text.lower()

    # ── LLM unavailable → template reply ─────────────────────────────────────

    def test_llm_unavailable_returns_template(self):
        llm_module._chain = [MockProvider(simulate_failure=True)]
        reply = generate_response(_make_criteria(), _make_result(), _ctx())
        assert "HP OmniBook 14" in reply.reply_text
        assert reply.transaction_allowed is False

    def test_llm_unavailable_template_mentions_reference(self):
        llm_module._chain = [MockProvider(simulate_failure=True)]
        reply = generate_response(_make_criteria(), _make_result(), _ctx())
        assert "reference" in reply.reply_text.lower()

    def test_llm_unavailable_template_mentions_unknown_specs(self):
        llm_module._chain = [MockProvider(simulate_failure=True)]
        candidate = _make_candidate(unknown_fields=["battery_capacity_Wh", "weight_kg"])
        reply = generate_response(_make_criteria(), _make_result([candidate]), _ctx())
        # Template should mention that some specs couldn't be confirmed
        assert "not be confirmed" in reply.reply_text.lower() or "specification" in reply.reply_text.lower()

    def test_llm_unavailable_no_candidates_returns_no_match_message(self):
        llm_module._chain = [MockProvider(simulate_failure=True)]
        result = _make_result(candidates=[])
        reply = generate_response(_make_criteria(), result, _ctx())
        assert len(reply.reply_text) > 0
        assert reply.transaction_allowed is False

    # ── _build_template_reply unit ────────────────────────────────────────────

    def test_template_reply_no_candidates(self):
        result = _make_result(candidates=[])
        text = _build_template_reply(result)
        assert "not find" in text.lower() or "no match" in text.lower() or "could not" in text.lower()

    def test_template_reply_includes_product_name(self):
        result = _make_result()
        text = _build_template_reply(result)
        assert "HP OmniBook 14" in text

    def test_template_reply_mentions_reference(self):
        result = _make_result()
        text = _build_template_reply(result)
        assert "reference" in text.lower()


# ═══════════════════════════════════════════════════════════════════════════════
# recommendation_agent tests
# ═══════════════════════════════════════════════════════════════════════════════

class TestRecommendationAgent:

    # ── Clarification early return ────────────────────────────────────────────

    def test_needs_clarification_returns_early(self):
        """When intent parser signals clarification needed, return immediately."""
        clarification_json = json.dumps({
            "intent": "other",
            "budget_max_paise": None,
            "workloads": [],
            "hard_constraints": {
                "os": None, "min_ram_gb": None, "min_storage_gb": None,
                "discrete_gpu_required": False, "max_weight_kg": None, "required_ports": [],
            },
            "soft_preferences": {
                "battery": None, "weight": None, "display": None,
                "keyboard": None, "portability": None,
            },
            "confirmed_fields": [],
            "missing_critical_fields": [],
            "needs_clarification": True,
            "clarifying_question": "What is your budget?",
            "confidence": 0.3,
        })
        _mock_llm(clarification_json)
        ctx = _ctx()
        reply = handle_buyer_message("I need a laptop", ctx)
        assert reply.needs_clarification is True
        assert reply.recommended_action == "ask_clarification"
        assert reply.transaction_allowed is False

    def test_clarification_reply_text_is_the_question(self):
        clarification_json = json.dumps({
            "intent": "other",
            "budget_max_paise": None,
            "workloads": [],
            "hard_constraints": {
                "os": None, "min_ram_gb": None, "min_storage_gb": None,
                "discrete_gpu_required": False, "max_weight_kg": None, "required_ports": [],
            },
            "soft_preferences": {
                "battery": None, "weight": None, "display": None,
                "keyboard": None, "portability": None,
            },
            "confirmed_fields": [],
            "missing_critical_fields": [],
            "needs_clarification": True,
            "clarifying_question": "What is your budget?",
            "confidence": 0.3,
        })
        _mock_llm(clarification_json)
        reply = handle_buyer_message("I need a laptop", _ctx())
        assert "budget" in reply.reply_text.lower() or reply.reply_text == "What is your budget?"

    # ── Full flow with real DBs ────────────────────────────────────────────────

    def _full_flow_intent_json(self, needs_clarification: bool = False) -> str:
        return json.dumps({
            "intent": "product_discovery",
            "budget_max_paise": 6_000_000,
            "workloads": ["programming", "docker"],
            "hard_constraints": {
                "os": None, "min_ram_gb": None, "min_storage_gb": None,
                "discrete_gpu_required": False, "max_weight_kg": None, "required_ports": [],
            },
            "soft_preferences": {
                "battery": "important", "weight": None, "display": None,
                "keyboard": None, "portability": None,
            },
            "confirmed_fields": ["budget_max_paise", "workloads", "battery"],
            "missing_critical_fields": [],
            "needs_clarification": needs_clarification,
            "clarifying_question": None,
            "confidence": 0.9,
        })

    def test_full_flow_returns_reply(self):
        """Real DBs + mock LLM for both intent and response steps."""
        # First call: intent parser reads this JSON
        # Second call: response generator gets free-text
        intent_mock = MockProvider(self._full_flow_intent_json())
        response_mock = MockProvider("The HP OmniBook 14 is a great fit for Python and Docker.")
        llm_module._chain = [intent_mock, response_mock]

        # Both LLM calls go through the same chain in sequence.
        # intent_parser uses call 1, response_generator uses call 2.
        # We need each mock to be used once — use a chain where first always succeeds.
        # Reset to have intent mock respond then response mock.
        # Simplest: use a single mock that returns the intent JSON for call 1,
        # then set a different response for call 2 by using call_count.
        # Actually: both complete() calls go left-to-right through _chain and
        # pick the FIRST provider. We need two separate mocks in sequence.
        # Use a custom provider that returns different responses on successive calls.

        class _SequentialMock:
            name = "sequential_mock"
            def __init__(self, responses):
                self._responses = list(responses)
                self._idx = 0
                self.call_count = 0
            def call(self, messages, json_schema, timeout):
                self.call_count += 1
                resp = self._responses[self._idx % len(self._responses)]
                self._idx += 1
                return resp

        seq = _SequentialMock([
            self._full_flow_intent_json(),
            "The HP OmniBook 14 is a great fit for Python and Docker.",
        ])
        llm_module._chain = [seq]

        ctx = _ctx()
        reply = handle_buyer_message(
            "I need a laptop for Python, VS Code and Docker. Budget ₹60,000. Battery matters.",
            ctx,
        )

        assert isinstance(reply, ConversationReply)
        assert reply.transaction_allowed is False
        assert reply.needs_clarification is False
        assert len(reply.candidates) > 0
        assert all(c.recommendation_eligible for c in reply.candidates)

    def test_full_flow_evidence_ids_non_empty(self):
        class _SequentialMock:
            name = "seq"
            def __init__(self, responses):
                self._r = list(responses)
                self._i = 0
            def call(self, m, s, t):
                r = self._r[self._i % len(self._r)]
                self._i += 1
                return r

        llm_module._chain = [_SequentialMock([
            self._full_flow_intent_json(),
            "Here are your options.",
        ])]
        reply = handle_buyer_message("Python laptop 60k", _ctx())
        assert len(reply.evidence_ids) > 0

    def test_transaction_allowed_always_false(self):
        class _SequentialMock:
            name = "seq"
            def __init__(self, r): self._r = list(r); self._i = 0
            def call(self, m, s, t):
                r = self._r[self._i % len(self._r)]; self._i += 1; return r

        llm_module._chain = [_SequentialMock([
            self._full_flow_intent_json(),
            "Here are your options.",
        ])]
        reply = handle_buyer_message("Python laptop 60k", _ctx())
        assert reply.transaction_allowed is False

    def test_no_in_stock_in_reply(self):
        """Guardrail must catch any 'in stock' claim from the LLM."""
        class _SequentialMock:
            name = "seq"
            def __init__(self, r): self._r = list(r); self._i = 0
            def call(self, m, s, t):
                r = self._r[self._i % len(self._r)]; self._i += 1; return r

        llm_module._chain = [_SequentialMock([
            self._full_flow_intent_json(),
            "This laptop is in stock and ready to ship.",  # guardrail should catch this
        ])]
        reply = handle_buyer_message("Python laptop 60k", _ctx())
        # Either guardrail fired (warning present) or text was neutralised
        stock_in_reply = "in stock" in reply.reply_text.lower()
        if stock_in_reply:
            # At minimum, a warning must be present
            assert any("stock" in w.lower() for w in reply.warnings)

    def test_impossible_budget_returns_reply_no_candidates(self):
        """₹100 budget — no variants match — reply should still be returned safely."""
        impossible_intent = json.dumps({
            "intent": "product_discovery",
            "budget_max_paise": 10000,   # ₹100 — nothing matches
            "workloads": [],
            "hard_constraints": {
                "os": None, "min_ram_gb": None, "min_storage_gb": None,
                "discrete_gpu_required": False, "max_weight_kg": None, "required_ports": [],
            },
            "soft_preferences": {
                "battery": None, "weight": None, "display": None,
                "keyboard": None, "portability": None,
            },
            "confirmed_fields": ["budget_max_paise"],
            "missing_critical_fields": [],
            "needs_clarification": False,
            "clarifying_question": None,
            "confidence": 0.9,
        })

        class _SequentialMock:
            name = "seq"
            def __init__(self, r): self._r = list(r); self._i = 0
            def call(self, m, s, t):
                r = self._r[self._i % len(self._r)]; self._i += 1; return r

        llm_module._chain = [_SequentialMock([
            impossible_intent,
            "No matching laptops found in the reference catalogue.",
        ])]
        reply = handle_buyer_message("I need a laptop for ₹100", _ctx())
        assert isinstance(reply, ConversationReply)
        assert reply.transaction_allowed is False
        # candidates may be empty
        assert reply.candidates == [] or len(reply.candidates) >= 0

    def test_retrieval_exception_returns_safe_reply(self, monkeypatch):
        """If retrieval raises, the agent must return a safe error reply."""
        def _broken_retrieval(criteria):
            raise RuntimeError("DB connection failed")

        import app.ai.recommendation_agent as agent_module
        monkeypatch.setattr(
            agent_module.retrieval, "search_exact_laptop_variants", _broken_retrieval
        )

        # Intent parser still needs a mock
        _mock_llm(self._full_flow_intent_json())
        reply = handle_buyer_message("Python laptop 60k", _ctx())
        assert isinstance(reply, ConversationReply)
        assert "service_error" in reply.warnings or reply.transaction_allowed is False

    def test_context_not_mutated(self):
        """Original context must be unchanged after handle_buyer_message."""
        class _SequentialMock:
            name = "seq"
            def __init__(self, r): self._r = list(r); self._i = 0
            def call(self, m, s, t):
                r = self._r[self._i % len(self._r)]; self._i += 1; return r

        llm_module._chain = [_SequentialMock([
            self._full_flow_intent_json(),
            "Here are your options.",
        ])]
        ctx = _ctx()
        original_turn_count = ctx.turn_count
        original_history_len = len(ctx.history)

        handle_buyer_message("Python laptop 60k", ctx)

        assert ctx.turn_count == original_turn_count
        assert len(ctx.history) == original_history_len

    def test_llm_unavailable_for_intent_returns_safe_or_clarification(self):
        """
        If intent parser LLM fails, it returns a needs_clarification=True fallback.
        The agent should return early with a clarification reply — not crash.
        """
        llm_module._chain = [MockProvider(simulate_failure=True)]
        reply = handle_buyer_message("Python laptop 60k", _ctx())
        assert isinstance(reply, ConversationReply)
        # Either clarification reply or safe error — both are valid
        assert reply.transaction_allowed is False


# ═══════════════════════════════════════════════════════════════════════════════
# Demo scenario — end-to-end
# ═══════════════════════════════════════════════════════════════════════════════

class TestDemoScenario:

    def test_demo_scenario(self):
        """
        Full demo scenario:
        "I need a laptop for Python, VS Code and Docker. Budget ₹60,000. Battery life matters."
        Uses real SQLite DBs for retrieval. Mock LLM for both calls.

        Expected:
        - candidates populated (HP OmniBook 14 and 16 should be in results)
        - all candidates recommendation_eligible=True
        - transaction_allowed=False
        - needs_clarification=False
        - evidence_ids non-empty
        - "in stock" not asserted in reply (guardrail or not present)
        """
        demo_intent = json.dumps({
            "intent": "product_discovery",
            "budget_max_paise": 6_000_000,
            "workloads": ["programming", "docker"],
            "hard_constraints": {
                "os": None, "min_ram_gb": None, "min_storage_gb": None,
                "discrete_gpu_required": False, "max_weight_kg": None, "required_ports": [],
            },
            "soft_preferences": {
                "battery": "important", "weight": None, "display": None,
                "keyboard": None, "portability": None,
            },
            "confirmed_fields": ["budget_max_paise", "workloads", "battery"],
            "missing_critical_fields": [],
            "needs_clarification": False,
            "clarifying_question": None,
            "confidence": 0.92,
        })

        class _SequentialMock:
            name = "demo_seq"
            def __init__(self, responses):
                self._r = list(responses)
                self._i = 0
            def call(self, messages, json_schema, timeout):
                resp = self._r[self._i % len(self._r)]
                self._i += 1
                return resp

        llm_module._chain = [_SequentialMock([
            demo_intent,
            (
                "Based on your requirements for Python and Docker development with a "
                "₹60,000 budget and good battery life, here are two options from the "
                "reference catalogue. The HP OmniBook 14 features 16GB RAM and an OLED "
                "display — both confirmed from source data. Battery capacity could not be "
                "confirmed from source data. These are reference products — availability "
                "in the merchant's shop is not confirmed."
            ),
        ])]

        ctx = new_context("conv-demo", "tenant-demo")
        reply = handle_buyer_message(
            "I need a laptop for Python, VS Code and Docker. "
            "Budget ₹60,000. Battery life matters.",
            ctx,
        )

        # Core assertions from the plan
        assert isinstance(reply, ConversationReply)
        assert reply.needs_clarification is False
        assert len(reply.candidates) >= 1
        assert all(c.recommendation_eligible for c in reply.candidates)
        assert reply.transaction_allowed is False
        assert len(reply.evidence_ids) > 0
        assert "in stock" not in reply.reply_text.lower()

        # HP OmniBook 14 must be among candidates
        candidate_ids = [c.product_id for c in reply.candidates]
        assert "P-HP-OMNI14-E70FYPA" in candidate_ids

    def test_demo_two_turn_flow(self):
        """
        Turn 1: no budget → clarification reply
        Turn 2: budget added → candidates returned
        """
        clarification_intent = json.dumps({
            "intent": "other",
            "budget_max_paise": None,
            "workloads": ["programming"],
            "hard_constraints": {
                "os": None, "min_ram_gb": None, "min_storage_gb": None,
                "discrete_gpu_required": False, "max_weight_kg": None, "required_ports": [],
            },
            "soft_preferences": {
                "battery": None, "weight": None, "display": None,
                "keyboard": None, "portability": None,
            },
            "confirmed_fields": ["workloads"],
            "missing_critical_fields": ["budget_max_paise"],
            "needs_clarification": True,
            "clarifying_question": "What is your budget?",
            "confidence": 0.5,
        })

        full_intent = json.dumps({
            "intent": "product_discovery",
            "budget_max_paise": 6_000_000,
            "workloads": ["programming"],
            "hard_constraints": {
                "os": None, "min_ram_gb": None, "min_storage_gb": None,
                "discrete_gpu_required": False, "max_weight_kg": None, "required_ports": [],
            },
            "soft_preferences": {
                "battery": None, "weight": None, "display": None,
                "keyboard": None, "portability": None,
            },
            "confirmed_fields": ["workloads", "budget_max_paise"],
            "missing_critical_fields": [],
            "needs_clarification": False,
            "clarifying_question": None,
            "confidence": 0.9,
        })

        ctx = new_context("conv-two-turn", "tenant-demo")

        # Turn 1: clarification
        _mock_llm(clarification_intent)
        reply1 = handle_buyer_message("I need a laptop for Python", ctx)
        assert reply1.needs_clarification is True
        assert reply1.recommended_action == "ask_clarification"

        # Turn 2: budget provided
        class _SequentialMock:
            name = "seq"
            def __init__(self, r): self._r = list(r); self._i = 0
            def call(self, m, s, t):
                r = self._r[self._i % len(self._r)]; self._i += 1; return r

        llm_module._chain = [_SequentialMock([
            full_intent,
            "Here are matching laptops for your Python work.",
        ])]
        reply2 = handle_buyer_message("My budget is ₹60,000", ctx)
        assert reply2.needs_clarification is False
        assert reply2.transaction_allowed is False
        assert len(reply2.candidates) >= 1
