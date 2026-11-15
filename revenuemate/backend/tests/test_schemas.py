"""
Tests for Task 0 — AI-layer Pydantic v2 schemas.
No fixtures required — pure construction tests.
"""
import pytest
from pydantic import ValidationError


# ── conversation.py ──────────────────────────────────────────────────────────

def test_buyer_criteria_default_construction():
    from app.schemas.conversation import BuyerCriteria
    b = BuyerCriteria()
    assert b.intent == "product_discovery"
    assert b.budget_max_paise is None   # must be None, not 0
    assert b.workloads == []
    assert b.needs_clarification is False
    assert b.confidence == 0.0


def test_buyer_criteria_budget_none_preserved():
    from app.schemas.conversation import BuyerCriteria
    b = BuyerCriteria(budget_max_paise=None)
    assert b.budget_max_paise is None


def test_buyer_criteria_budget_paise():
    from app.schemas.conversation import BuyerCriteria
    b = BuyerCriteria(budget_max_paise=6_000_000)
    assert b.budget_max_paise == 6_000_000


def test_hard_constraints_defaults():
    from app.schemas.conversation import HardConstraints
    hc = HardConstraints()
    assert hc.os is None
    assert hc.min_ram_gb is None
    assert hc.discrete_gpu_required is False
    assert hc.required_ports == []


def test_soft_preferences_defaults():
    from app.schemas.conversation import SoftPreferences
    sp = SoftPreferences()
    assert sp.battery is None
    assert sp.weight is None


def test_conversation_context_construction():
    from app.schemas.conversation import ConversationContext
    ctx = ConversationContext(conversation_id="conv-1", tenant_id="tenant-1")
    assert ctx.stage == "discovery"
    assert ctx.history == []
    assert ctx.buyer_criteria is None
    assert ctx.turn_count == 0


def test_conversation_context_history_independent():
    """Two ConversationContext instances must not share the same history list."""
    from app.schemas.conversation import ConversationContext
    ctx1 = ConversationContext(conversation_id="c1", tenant_id="t1")
    ctx2 = ConversationContext(conversation_id="c2", tenant_id="t2")
    ctx1.history.append({"role": "user", "content": "hello"})
    assert ctx2.history == []


# ── recommendation.py ────────────────────────────────────────────────────────

def test_conversation_reply_minimal():
    from app.schemas.recommendation import ConversationReply
    r = ConversationReply(reply_text="hi")
    assert r.reply_text == "hi"
    assert r.transaction_allowed is False
    assert r.warnings == []
    assert r.recommended_action == "show_comparison"
    assert r.needs_clarification is False


def test_conversation_reply_requires_reply_text():
    from app.schemas.recommendation import ConversationReply
    with pytest.raises(ValidationError):
        ConversationReply()   # reply_text is required


def test_recommendation_result_defaults():
    from app.schemas.recommendation import RecommendationResult
    rr = RecommendationResult()
    assert rr.reference_only is True
    assert rr.transaction_allowed is False
    assert rr.merchant_offer_status == "not_checked"
    assert rr.candidates == []


def test_source_evidence_construction():
    from app.schemas.recommendation import SourceEvidence
    se = SourceEvidence(source_id="SRC-HP-OMNI14")
    assert se.source_id == "SRC-HP-OMNI14"
    assert se.publisher is None


def test_candidate_product_construction():
    from app.schemas.recommendation import CandidateProduct
    cp = CandidateProduct(
        product_id="P-HP-OMNI14-E70FYPA",
        brand="HP",
        product_name="OmniBook 14",
        model_code="E70FYPA",
        facts={"ram_gb": 16},
        recommendation_eligible=True,
    )
    assert cp.fit_reasons == []
    assert cp.trade_offs == []
    assert cp.unknown_fields == []


def test_recommendation_result_warnings_independent():
    """Two RecommendationResult instances must not share the same warnings list."""
    from app.schemas.recommendation import RecommendationResult
    r1 = RecommendationResult()
    r2 = RecommendationResult()
    r1.warnings.append("test")
    assert r2.warnings == []


# ── product_knowledge.py ─────────────────────────────────────────────────────

def test_product_fact_construction():
    from app.schemas.product_knowledge import ProductFact
    pf = ProductFact(fact_path="ram_gb", value=16, verification_status="verified")
    assert pf.value == 16
    assert pf.source_ids == []


def test_product_fact_null_value_preserved():
    from app.schemas.product_knowledge import ProductFact
    pf = ProductFact(fact_path="battery_wh", value=None, verification_status="unknown")
    assert pf.value is None   # must stay None, not coerced to 0 or ""


def test_product_variant_construction():
    from app.schemas.product_knowledge import ProductVariant
    pv = ProductVariant(
        product_id="P-HP-OMNI14-E70FYPA",
        family_id="FAM-HP-OMNI14",
        brand="HP",
        product_name="OmniBook 14",
        model_code="E70FYPA",
        variant_precision="full",
        region="IN",
        configuration_status="active",
        facts={"ram_gb": 16, "storage_gb": 512},
        recommendation_eligible=True,
    )
    assert pv.recommendation_eligible is True
    assert pv.manufacturer_sku is None
    assert pv.eligibility_reason is None
    assert pv.unknown_fields == []


def test_component_fact_construction():
    from app.schemas.product_knowledge import ComponentFact
    cf = ComponentFact(
        component_id="COMP-CPU-1",
        component_type="cpu",
        component_name="Intel Core 5",
        facts={"cores": 12, "tdp_w": 28},
    )
    assert cf.facts["cores"] == 12
    assert cf.source_ids == []


# ── __init__.py re-exports ────────────────────────────────────────────────────

def test_schema_package_re_exports():
    from app.schemas import (
        HardConstraints, SoftPreferences, BuyerCriteria, ConversationContext,
        SourceEvidence, CandidateProduct, RecommendationResult, ConversationReply,
        ProductFact, ProductVariant, ComponentFact,
    )
    # If this import succeeds, all re-exports are wired correctly
    assert BuyerCriteria is not None
    assert ConversationReply is not None
    assert ProductVariant is not None
