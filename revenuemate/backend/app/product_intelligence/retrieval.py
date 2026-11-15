"""
backend/app/product_intelligence/retrieval.py
Read-only SQLite access layer.  Returns typed schema objects; no business logic.

Requires: pydantic>=2 (via Task 0 schemas)
"""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from app.schemas.product_knowledge import ComponentFact, ProductFact, ProductVariant
from app.schemas.recommendation import SourceEvidence  # noqa: F401 — re-exported for callers

# ---------------------------------------------------------------------------
# DB path resolution
# ---------------------------------------------------------------------------
_HERE = Path(__file__).resolve()
# Walk up: retrieval.py → product_intelligence/ → app/ → backend/ → revenuemate/ → data/databases/
_DB_ROOT = _HERE.parents[3] / "data" / "databases"
_LAPTOP_DB = _DB_ROOT / "laptop_reference.sqlite"
_HARDWARE_DB = _DB_ROOT / "hardware_knowledge.sqlite"
# TODO: replace with settings.LAPTOP_DB_PATH and settings.HARDWARE_DB_PATH once config.py is implemented


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _ro(path: Path) -> sqlite3.Connection:
    """Open a SQLite database read-only."""
    conn = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _parse_json_col(raw: str | None, fallback: object) -> object:
    """Parse a JSON text column; return fallback on NULL or parse failure."""
    if raw is None:
        return fallback
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return fallback


def _row_to_variant(row: sqlite3.Row) -> ProductVariant:
    """Convert a product_variants row into a ProductVariant schema object."""
    facts: dict = _parse_json_col(row["facts_json"], {})
    unknown_fields: list[str] = _parse_json_col(row["unknown_fields_json"], [])
    source_ids: list[str] = _parse_json_col(row["source_ids_json"], [])
    segment_tags: list[str] = _parse_json_col(row["segment_tags_json"], [])

    return ProductVariant(
        product_id=row["product_id"],
        family_id=row["family_id"],
        brand=row["brand"],
        product_name=row["product_name"],
        model_code=row["model_code"],
        manufacturer_sku=row["manufacturer_sku"],
        variant_precision=row["variant_precision"],
        region=row["region"],
        configuration_status=row["configuration_status"],
        source_ids=source_ids,
        segment_tags=segment_tags,
        facts=facts,
        unknown_fields=unknown_fields,
        recommendation_eligible=bool(row["recommendation_eligible"]),
        eligibility_reason=row["eligibility_reason"],
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_laptop_variant(product_id: str) -> ProductVariant | None:
    """Return a single ProductVariant by product_id, or None if not found."""
    conn = _ro(_LAPTOP_DB)
    try:
        row = conn.execute(
            "SELECT * FROM product_variants WHERE product_id = ?",
            (product_id,),
        ).fetchone()
        if row is None:
            return None
        return _row_to_variant(row)
    finally:
        conn.close()


def search_exact_laptop_variants(criteria: dict) -> list[ProductVariant]:
    """
    Return all recommendation_eligible variants, optionally filtered.

    Supported criteria keys:
      budget_max_paise  – keeps variants with NULL merchant_price_inr (reference-only)
      brand             – case-insensitive exact match
      workloads         – ignored here; semantic matching belongs in the comparator
    """
    sql = "SELECT * FROM product_variants WHERE recommendation_eligible = 1"
    params: list = []

    budget = criteria.get("budget_max_paise")
    if budget is not None:
        # NULL prices are kept (reference-only); only drop if confirmed price exceeds budget
        sql += " AND (merchant_price_inr IS NULL OR CAST(merchant_price_inr AS INTEGER) * 100 <= ?)"
        params.append(budget)

    brand = criteria.get("brand")
    if brand is not None:
        sql += " AND LOWER(brand) = LOWER(?)"
        params.append(brand)

    conn = _ro(_LAPTOP_DB)
    try:
        rows = conn.execute(sql, params).fetchall()
        return [_row_to_variant(r) for r in rows]
    finally:
        conn.close()


def get_product_fact_evidence(product_id: str) -> list[ProductFact]:
    """
    Return per-fact provenance from the product_facts table for a product.
    Returns [] if no fact rows exist for the given product_id.
    """
    conn = _ro(_LAPTOP_DB)
    try:
        rows = conn.execute(
            """
            SELECT fact_path, value_json, verification_status, source_ids_json
            FROM product_facts
            WHERE product_id = ?
            """,
            (product_id,),
        ).fetchall()

        results: list[ProductFact] = []
        for row in rows:
            # value_json is a JSON scalar (string, number) or NULL
            raw_value = row["value_json"]
            if raw_value is None:
                value = None
            else:
                try:
                    value = json.loads(raw_value)
                except (json.JSONDecodeError, TypeError):
                    value = raw_value  # keep as raw string on parse failure

            source_ids: list[str] = _parse_json_col(row["source_ids_json"], [])

            results.append(
                ProductFact(
                    fact_path=row["fact_path"],
                    value=value,
                    verification_status=row["verification_status"],
                    source_ids=source_ids,
                )
            )
        return results
    finally:
        conn.close()


def get_linked_components(product_id: str) -> list[ComponentFact]:
    """
    Return all hardware components linked to a product.
    Both product_component_links and components live in hardware_knowledge.sqlite.
    Returns [] if no links exist for the given product_id.
    """
    conn = _ro(_HARDWARE_DB)
    try:
        rows = conn.execute(
            """
            SELECT c.component_id,
                   c.component_type,
                   c.name       AS component_name,
                   c.specs_json,
                   c.source_ids_json
            FROM product_component_links pcl
            JOIN components c ON c.component_id = pcl.component_id
            WHERE pcl.product_id = ?
            """,
            (product_id,),
        ).fetchall()

        results: list[ComponentFact] = []
        for row in rows:
            facts: dict = _parse_json_col(row["specs_json"], {})
            source_ids: list[str] = _parse_json_col(row["source_ids_json"], [])
            results.append(
                ComponentFact(
                    component_id=row["component_id"],
                    component_type=row["component_type"],
                    component_name=row["component_name"],
                    facts=facts,
                    source_ids=source_ids,
                )
            )
        return results
    finally:
        conn.close()
