"""
Tests for Task 2 — Product Retrieval.
Tests run against the real static SQLite databases in data/databases/.
No fixtures required — the DBs are read-only static files.
"""
import sqlite3

import pytest

from app.product_intelligence.retrieval import (
    _LAPTOP_DB,
    get_laptop_variant,
    get_linked_components,
    get_product_fact_evidence,
    search_exact_laptop_variants,
)


# ---------------------------------------------------------------------------
# search_exact_laptop_variants
# ---------------------------------------------------------------------------

def test_search_returns_ten_eligible_variants():
    results = search_exact_laptop_variants({})
    assert len(results) == 10, f"Expected 10 eligible variants, got {len(results)}"


def test_search_budget_null_prices_kept():
    # All merchant_price_inr are NULL in this dataset → all 10 kept as reference-only
    results = search_exact_laptop_variants({"budget_max_paise": 6_000_000})
    assert len(results) == 10, (
        "NULL merchant prices must be kept (reference-only), not dropped by budget filter"
    )


def test_search_excludes_ineligible():
    results = search_exact_laptop_variants({})
    ids = {v.product_id for v in results}
    assert "P-ASUS-X1504VAP" not in ids, "Ineligible variant must never appear in search results"


def test_search_brand_filter_hp():
    results = search_exact_laptop_variants({"brand": "HP"})
    assert len(results) > 0, "Expected at least one HP variant"
    for v in results:
        assert v.brand == "HP", f"Non-HP variant in results: {v.product_id}"


def test_search_all_results_eligible():
    results = search_exact_laptop_variants({})
    for v in results:
        assert v.recommendation_eligible is True, (
            f"{v.product_id} has recommendation_eligible=False but was returned"
        )


# ---------------------------------------------------------------------------
# get_laptop_variant
# ---------------------------------------------------------------------------

def test_get_variant_hp_omni14_eligible():
    v = get_laptop_variant("P-HP-OMNI14-E70FYPA")
    assert v is not None
    assert v.recommendation_eligible is True
    assert v.brand == "HP"


def test_get_variant_hp_omni14_facts():
    v = get_laptop_variant("P-HP-OMNI14-E70FYPA")
    assert v is not None
    assert isinstance(v.facts, dict)
    assert v.facts["memory"]["capacity_GB"] == 16
    assert v.facts["display"]["panel"] == "OLED"


def test_get_variant_hp_omni14_source_ids():
    v = get_laptop_variant("P-HP-OMNI14-E70FYPA")
    assert v is not None
    assert v.source_ids == ["SRC-HP-OMNI14"]


def test_get_variant_asus_ineligible():
    v = get_laptop_variant("P-ASUS-X1504VAP")
    assert v is not None
    assert v.recommendation_eligible is False


def test_get_variant_missing_returns_none():
    v = get_laptop_variant("DOES-NOT-EXIST")
    assert v is None


def test_get_variant_returns_product_variant_schema():
    from app.schemas.product_knowledge import ProductVariant
    v = get_laptop_variant("P-HP-OMNI14-E70FYPA")
    assert isinstance(v, ProductVariant)


def test_get_variant_unknown_fields_is_list():
    v = get_laptop_variant("P-HP-OMNI14-E70FYPA")
    assert v is not None
    assert isinstance(v.unknown_fields, list)
    # HP Omni14 has one known unknown: battery capacity
    assert len(v.unknown_fields) >= 1


# ---------------------------------------------------------------------------
# get_product_fact_evidence
# ---------------------------------------------------------------------------

def test_fact_evidence_hp_omni14_has_source():
    facts = get_product_fact_evidence("P-HP-OMNI14-E70FYPA")
    assert len(facts) > 0, "Expected fact rows for HP OmniBook 14"
    source_ids_seen = {sid for f in facts for sid in f.source_ids}
    assert "SRC-HP-OMNI14" in source_ids_seen, (
        "Expected SRC-HP-OMNI14 in evidence source IDs"
    )


def test_fact_evidence_missing_product_empty_list():
    facts = get_product_fact_evidence("DOES-NOT-EXIST")
    assert facts == []


def test_fact_evidence_asus_has_rows():
    # ASUS X1504VAP has 9 fact rows in the DB (nulls are stored as absent rows, not NULL value_json)
    facts = get_product_fact_evidence("P-ASUS-X1504VAP")
    assert len(facts) == 9, f"Expected 9 fact rows for ASUS X1504VAP, got {len(facts)}"
    # All returned facts must have a non-None value (DB omits rather than NULLs missing specs)
    for f in facts:
        assert f.value is not None, f"Unexpected None value for fact {f.fact_path}"


def test_fact_evidence_returns_product_fact_schema():
    from app.schemas.product_knowledge import ProductFact
    facts = get_product_fact_evidence("P-HP-OMNI14-E70FYPA")
    assert len(facts) > 0
    assert all(isinstance(f, ProductFact) for f in facts)


def test_fact_evidence_non_null_values_parsed():
    facts = get_product_fact_evidence("P-HP-OMNI14-E70FYPA")
    non_null = [f for f in facts if f.value is not None]
    assert len(non_null) > 0, "HP Omni14 should have many non-null fact values"
    # Spot-check: display brightness fact should be a number
    brightness_facts = [f for f in facts if f.fact_path == "display.brightness_nits"]
    if brightness_facts:
        assert brightness_facts[0].value == 300


# ---------------------------------------------------------------------------
# get_linked_components
# ---------------------------------------------------------------------------

def test_linked_components_hp_omni14_count():
    components = get_linked_components("P-HP-OMNI14-E70FYPA")
    assert len(components) == 6, (
        f"Expected 6 linked components for HP OmniBook 14, got {len(components)}"
    )


def test_linked_components_hp_omni14_includes_cpu():
    components = get_linked_components("P-HP-OMNI14-E70FYPA")
    ids = {c.component_id for c in components}
    assert "CPU-INTEL-CORE5-320" in ids


def test_linked_components_missing_product_empty():
    components = get_linked_components("DOES-NOT-EXIST")
    assert components == []


def test_linked_components_all_types_non_empty():
    components = get_linked_components("P-HP-OMNI14-E70FYPA")
    for c in components:
        assert c.component_type, f"component_type is empty for {c.component_id}"
        assert c.component_name, f"component_name is empty for {c.component_id}"


def test_linked_components_returns_component_fact_schema():
    from app.schemas.product_knowledge import ComponentFact
    components = get_linked_components("P-HP-OMNI14-E70FYPA")
    assert all(isinstance(c, ComponentFact) for c in components)


def test_linked_components_facts_are_dicts():
    components = get_linked_components("P-HP-OMNI14-E70FYPA")
    for c in components:
        assert isinstance(c.facts, dict), f"facts is not a dict for {c.component_id}"


# ---------------------------------------------------------------------------
# Write protection
# ---------------------------------------------------------------------------

def test_write_attempt_raises():
    """Read-only connection must reject any write operation."""
    conn = sqlite3.connect(f"file:{_LAPTOP_DB}?mode=ro", uri=True)
    try:
        with pytest.raises(sqlite3.OperationalError):
            conn.execute(
                "INSERT INTO product_variants (product_id) VALUES (?)",
                ("FAKE-WRITE-TEST",),
            )
    finally:
        conn.close()
