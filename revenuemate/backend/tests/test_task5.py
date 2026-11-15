"""
backend/tests/test_task5.py
Tests for Task 5: product_comparator and guardrails.
No LLM, no network. Uses real schema objects from Task 0.
"""

from __future__ import annotations

import pytest

from app.ai.guardrails import check_draft, validate_parsed
from app.ai.product_comparator import compare_candidates
from app.schemas.conversation import BuyerCriteria, HardConstraints, SoftPreferences
from app.schemas.recommendation import CandidateProduct


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_candidate(
    product_id: str = "P-TEST-001",
    facts: dict | None = None,
    recommendation_eligible: bool = True,
) -> CandidateProduct:
    return CandidateProduct(
        product_id=product_id,
        brand="TestBrand",
        product_name="Test Laptop",
        model_code="TL-001",
        facts=facts or {},
        recommendation_eligible=recommendation_eligible,
    )


def make_criteria(
    budget_max_paise: int | None = None,
    min_ram_gb: int | None = None,
    min_storage_gb: int | None = None,
    discrete_gpu_required: bool = False,
    os: str | None = None,
    max_weight_kg: float | None = None,
    required_ports: list[str] | None = None,
    battery: str | None = None,
    weight: str | None = None,
    display: str | None = None,
) -> BuyerCriteria:
    return BuyerCriteria(
        hard_constraints=HardConstraints(
            min_ram_gb=min_ram_gb,
            min_storage_gb=min_storage_gb,
            discrete_gpu_required=discrete_gpu_required,
            os=os,
            max_weight_kg=max_weight_kg,
            required_ports=required_ports or [],
        ),
        soft_preferences=SoftPreferences(
            battery=battery,
            weight=weight,
            display=display,
        ),
        budget_max_paise=budget_max_paise,
    )


# ---------------------------------------------------------------------------
# compare_candidates — RAM
# ---------------------------------------------------------------------------


class TestComparatorRAM:
    def test_ram_meets_requirement(self):
        candidate = make_candidate(facts={"memory": {"capacity_GB": 16}})
        criteria = make_criteria(min_ram_gb=16)
        result = compare_candidates(criteria, [candidate])
        assert any("RAM" in r and "meets" in r for r in result[0].fit_reasons)

    def test_ram_below_minimum(self):
        candidate = make_candidate(facts={"memory": {"capacity_GB": 8}})
        criteria = make_criteria(min_ram_gb=16)
        result = compare_candidates(criteria, [candidate])
        assert any("8GB" in t and "below" in t for t in result[0].trade_offs)

    def test_ram_null_in_facts(self):
        candidate = make_candidate(facts={"memory": None})
        criteria = make_criteria(min_ram_gb=16)
        result = compare_candidates(criteria, [candidate])
        assert any("RAM" in t and "not confirmed" in t for t in result[0].trade_offs)

    def test_ram_key_missing_entirely(self):
        candidate = make_candidate(facts={})
        criteria = make_criteria(min_ram_gb=16)
        result = compare_candidates(criteria, [candidate])
        assert any("RAM" in t for t in result[0].trade_offs)

    def test_no_ram_criterion_no_ram_entries(self):
        candidate = make_candidate(facts={"memory": {"capacity_GB": 8}})
        criteria = make_criteria()  # no min_ram_gb
        result = compare_candidates(criteria, [candidate])
        assert not any("RAM" in r for r in result[0].fit_reasons)
        assert not any("RAM" in t for t in result[0].trade_offs)


# ---------------------------------------------------------------------------
# compare_candidates — Storage
# ---------------------------------------------------------------------------


class TestComparatorStorage:
    def test_storage_meets_minimum(self):
        candidate = make_candidate(facts={"storage": {"capacity_GB": 512}})
        criteria = make_criteria(min_storage_gb=256)
        result = compare_candidates(criteria, [candidate])
        assert any("storage" in r.lower() and "meets" in r for r in result[0].fit_reasons)

    def test_storage_below_minimum(self):
        candidate = make_candidate(facts={"storage": {"capacity_GB": 128}})
        criteria = make_criteria(min_storage_gb=256)
        result = compare_candidates(criteria, [candidate])
        assert any("below" in t for t in result[0].trade_offs)

    def test_storage_null(self):
        candidate = make_candidate(facts={})
        criteria = make_criteria(min_storage_gb=256)
        result = compare_candidates(criteria, [candidate])
        assert any("storage" in t.lower() and "not confirmed" in t for t in result[0].trade_offs)


# ---------------------------------------------------------------------------
# compare_candidates — Discrete GPU
# ---------------------------------------------------------------------------


class TestComparatorGPU:
    def test_discrete_gpu_present(self):
        candidate = make_candidate(facts={"graphics": {"type": "discrete"}})
        criteria = make_criteria(discrete_gpu_required=True)
        result = compare_candidates(criteria, [candidate])
        assert any("Discrete GPU" in r for r in result[0].fit_reasons)

    def test_integrated_gpu_when_discrete_required(self):
        candidate = make_candidate(facts={"graphics": {"type": "integrated"}})
        criteria = make_criteria(discrete_gpu_required=True)
        result = compare_candidates(criteria, [candidate])
        assert any("integrated" in t.lower() for t in result[0].trade_offs)

    def test_gpu_not_required_no_gpu_entries(self):
        candidate = make_candidate(facts={"graphics": {"type": "integrated"}})
        criteria = make_criteria(discrete_gpu_required=False)
        result = compare_candidates(criteria, [candidate])
        assert not any("GPU" in r for r in result[0].fit_reasons)
        assert not any("GPU" in t for t in result[0].trade_offs)


# ---------------------------------------------------------------------------
# compare_candidates — Battery soft preference
# ---------------------------------------------------------------------------


class TestComparatorBattery:
    def test_battery_null_with_preference(self):
        candidate = make_candidate(facts={"battery": None})
        criteria = make_criteria(battery="important")
        result = compare_candidates(criteria, [candidate])
        assert any(
            "battery" in t.lower() and "not confirmed" in t.lower()
            for t in result[0].trade_offs
        )

    def test_battery_missing_key_with_preference(self):
        candidate = make_candidate(facts={})
        criteria = make_criteria(battery="important")
        result = compare_candidates(criteria, [candidate])
        assert any("battery" in t.lower() for t in result[0].trade_offs)

    def test_battery_present_with_preference(self):
        candidate = make_candidate(facts={"battery": {"capacity_Wh": 56}})
        criteria = make_criteria(battery="important")
        result = compare_candidates(criteria, [candidate])
        assert any("battery" in r.lower() for r in result[0].fit_reasons)

    def test_battery_no_preference_no_entries(self):
        candidate = make_candidate(facts={"battery": None})
        criteria = make_criteria()  # no battery preference
        result = compare_candidates(criteria, [candidate])
        assert not any("battery" in r.lower() for r in result[0].fit_reasons)
        assert not any("battery" in t.lower() for t in result[0].trade_offs)


# ---------------------------------------------------------------------------
# compare_candidates — Budget / merchant price
# ---------------------------------------------------------------------------


class TestComparatorBudget:
    def test_no_confirmed_price_adds_trade_off(self):
        candidate = make_candidate(facts={})
        criteria = make_criteria(budget_max_paise=6_000_000)
        result = compare_candidates(criteria, [candidate])
        assert any("merchant price" in t.lower() for t in result[0].trade_offs)

    def test_candidate_kept_even_without_price(self):
        candidate = make_candidate(facts={})
        criteria = make_criteria(budget_max_paise=6_000_000)
        result = compare_candidates(criteria, [candidate])
        assert len(result) == 1

    def test_no_budget_criterion_no_price_trade_off(self):
        candidate = make_candidate(facts={})
        criteria = make_criteria()  # no budget
        result = compare_candidates(criteria, [candidate])
        assert not any("merchant price" in t.lower() for t in result[0].trade_offs)


# ---------------------------------------------------------------------------
# compare_candidates — does not mutate input
# ---------------------------------------------------------------------------


class TestComparatorImmutability:
    def test_does_not_mutate_input_candidates(self):
        candidate = make_candidate(facts={"memory": {"capacity_GB": 16}})
        original_fit = list(candidate.fit_reasons)
        criteria = make_criteria(min_ram_gb=16)
        compare_candidates(criteria, [candidate])
        assert candidate.fit_reasons == original_fit

    def test_multiple_candidates_all_returned(self):
        c1 = make_candidate(product_id="P-001", facts={"memory": {"capacity_GB": 16}})
        c2 = make_candidate(product_id="P-002", facts={"memory": {"capacity_GB": 8}})
        criteria = make_criteria(min_ram_gb=16)
        result = compare_candidates(criteria, [c1, c2])
        assert len(result) == 2
        ids = [r.product_id for r in result]
        assert "P-001" in ids and "P-002" in ids


# ---------------------------------------------------------------------------
# compare_candidates — demo scenario (HP OmniBook 14 + 16)
# ---------------------------------------------------------------------------


class TestComparatorDemoScenario:
    def test_both_omnibooks_returned_with_ram_fit(self):
        """
        Uses real retrieval data to mirror the hackathon demo scenario.
        Both HP OmniBook 14 and 16 have 16GB RAM and no confirmed battery.
        """
        try:
            from app.product_intelligence.retrieval import get_laptop_variant
        except ImportError:
            pytest.skip("retrieval module not available")

        omni14 = get_laptop_variant("P-HP-OMNI14-E70FYPA")
        omni16 = get_laptop_variant("P-HP-OMNI16-BH4K6PA")
        if omni14 is None or omni16 is None:
            pytest.skip("Demo product IDs not found in DB")

        candidates = [
            CandidateProduct(
                product_id=v.product_id,
                brand=v.brand,
                product_name=v.product_name,
                model_code=v.model_code or "",
                facts=v.facts,
                unknown_fields=v.unknown_fields,
                source_ids=v.source_ids,
                recommendation_eligible=v.recommendation_eligible,
            )
            for v in [omni14, omni16]
        ]

        criteria = make_criteria(
            budget_max_paise=6_000_000,
            min_ram_gb=16,
            battery="important",
        )
        result = compare_candidates(criteria, candidates)

        assert len(result) == 2
        for r in result:
            assert any("16GB RAM" in f or "RAM" in f for f in r.fit_reasons), (
                f"{r.product_id} should have RAM fit_reason"
            )
            assert any("battery" in t.lower() for t in r.trade_offs), (
                f"{r.product_id} should have battery trade_off"
            )


# ---------------------------------------------------------------------------
# guardrails — check_draft
# ---------------------------------------------------------------------------


class TestCheckDraft:
    def test_price_claim_no_facts(self):
        warnings = check_draft("This laptop is ₹55,000", {"price_paise": None})
        assert len(warnings) == 1
        assert "price" in warnings[0].lower()

    def test_price_claim_grounded_in_merchant_price_inr(self):
        warnings = check_draft("This laptop is ₹55,000", {"merchant_price_inr": 55000})
        assert warnings == []

    def test_price_claim_grounded_in_merchant_price_inr_60k(self):
        # ₹60,000 extracted as 60000; merchant_price_inr=60000 matches within 1%
        warnings = check_draft("Priced at ₹60,000", {"merchant_price_inr": 60000})
        assert warnings == []

    def test_stock_claim_no_facts(self):
        warnings = check_draft("This model is in stock at the shop", {})
        assert len(warnings) >= 1
        assert any("stock" in w.lower() for w in warnings)

    def test_stock_claim_grounded(self):
        warnings = check_draft("Available now", {"merchant_stock_on_hand": 5})
        assert warnings == []

    def test_battery_runtime_claim_no_facts(self):
        warnings = check_draft("Enjoy 10 hours battery life", {})
        assert len(warnings) >= 1
        assert any("battery" in w.lower() for w in warnings)

    def test_battery_runtime_grounded(self):
        warnings = check_draft(
            "Up to 10 hours battery",
            {"battery": {"runtime_hours": 10}},
        )
        assert warnings == []

    def test_no_claims_clean(self):
        warnings = check_draft(
            "This laptop has an OLED display and an Intel Core i5 processor.",
            {},
        )
        assert warnings == []

    def test_multiple_violations_all_returned(self):
        warnings = check_draft(
            "Priced at ₹55,000. In stock. Lasts 12 hours.",
            {},
        )
        assert len(warnings) == 3

    def test_empty_text(self):
        assert check_draft("", {}) == []


# ---------------------------------------------------------------------------
# guardrails — validate_parsed
# ---------------------------------------------------------------------------


class TestValidateParsed:
    CATALOGUE = ["P-HP-OMNI14-E70FYPA", "P-HP-OMNI16-BH4K6PA"]

    def test_valid_product_id(self):
        assert validate_parsed({"product_id": "P-HP-OMNI14-E70FYPA"}, self.CATALOGUE) is True

    def test_invalid_product_id(self):
        assert validate_parsed({"product_id": "P-FAKE-001"}, self.CATALOGUE) is False

    def test_valid_candidate_in_list(self):
        output = {"candidates": [{"product_id": "P-HP-OMNI14-E70FYPA"}]}
        assert validate_parsed(output, self.CATALOGUE) is True

    def test_invalid_candidate_in_list(self):
        output = {"candidates": [{"product_id": "P-FAKE-001"}]}
        assert validate_parsed(output, self.CATALOGUE) is False

    def test_mixed_candidates_one_invalid(self):
        output = {"candidates": [
            {"product_id": "P-HP-OMNI14-E70FYPA"},
            {"product_id": "P-FAKE-001"},
        ]}
        assert validate_parsed(output, self.CATALOGUE) is False

    def test_empty_output_is_valid(self):
        assert validate_parsed({}, self.CATALOGUE) is True

    def test_no_product_id_fields_is_valid(self):
        assert validate_parsed({"intent": "product_discovery"}, self.CATALOGUE) is True

    def test_empty_catalogue_rejects_any_id(self):
        assert validate_parsed({"product_id": "P-HP-OMNI14-E70FYPA"}, []) is False
