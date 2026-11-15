"""
backend/app/ai/product_comparator.py
Owner: P2 (AI track)
Purpose: Deterministic field-by-field comparison of candidate laptops against buyer criteria.
         Populates fit_reasons and trade_offs on each CandidateProduct.
         No LLM calls. No scoring formula. Never drops candidates.
Depends on: schemas.conversation, schemas.recommendation
Used by: ai.recommendation_agent (Task 7)
"""

from __future__ import annotations

from app.schemas.conversation import BuyerCriteria
from app.schemas.recommendation import CandidateProduct


def _get(facts: dict, *keys: str):
    """
    Safe nested dict access. Returns None on any missing key or non-dict intermediate.
    e.g. _get(facts, "memory", "capacity_GB")
    """
    val = facts
    for key in keys:
        if not isinstance(val, dict):
            return None
        val = val.get(key)
    return val


def compare_candidates(
    criteria: BuyerCriteria,
    candidates: list[CandidateProduct],
) -> list[CandidateProduct]:
    """
    Populate fit_reasons and trade_offs for each candidate based on buyer criteria.

    Rules:
    - fit_reasons: facts that satisfy a stated criterion
    - trade_offs: verified facts that may concern this buyer, or unknown fields
      that the buyer explicitly cared about
    - Null/unknown fact for a cared-about field -> trade_offs as "X not confirmed in source data"
    - Candidates with no confirmed merchant price are kept as reference-only — never dropped
    - Purely deterministic — no scoring, no percentages
    """
    result: list[CandidateProduct] = []

    for candidate in candidates:
        fit_reasons: list[str] = []
        trade_offs: list[str] = []
        facts = candidate.facts
        hc = criteria.hard_constraints
        sp = criteria.soft_preferences

        # ── Hard constraint: RAM ───────────────────────────────────────────
        if hc.min_ram_gb is not None:
            ram = _get(facts, "memory", "capacity_GB")
            if ram is None:
                trade_offs.append("RAM not confirmed in source data")
            elif ram >= hc.min_ram_gb:
                fit_reasons.append(f"{ram}GB RAM meets workload requirement")
            else:
                trade_offs.append(
                    f"Only {ram}GB RAM — below the {hc.min_ram_gb}GB minimum"
                )

        # ── Hard constraint: Storage ───────────────────────────────────────
        if hc.min_storage_gb is not None:
            storage = _get(facts, "storage", "capacity_GB")
            if storage is None:
                trade_offs.append("Storage capacity not confirmed in source data")
            elif storage >= hc.min_storage_gb:
                fit_reasons.append(f"{storage}GB storage meets minimum")
            else:
                trade_offs.append(
                    f"Only {storage}GB storage — below the {hc.min_storage_gb}GB minimum"
                )

        # ── Hard constraint: Discrete GPU ──────────────────────────────────
        if hc.discrete_gpu_required:
            gpu_type = _get(facts, "graphics", "type")
            if gpu_type is None:
                trade_offs.append("GPU type not confirmed in source data")
            elif gpu_type != "integrated":
                fit_reasons.append("Discrete GPU present")
            else:
                trade_offs.append("Integrated GPU only — no discrete GPU")

        # ── Hard constraint: OS ────────────────────────────────────────────
        if hc.os is not None:
            os_val = facts.get("operating_system") or facts.get("operating_system_options")
            if os_val is None:
                trade_offs.append("Operating system not confirmed in source data")
            else:
                # os_val may be a string or list
                os_str = (
                    " ".join(os_val) if isinstance(os_val, list) else str(os_val)
                )
                if hc.os.lower() in os_str.lower():
                    fit_reasons.append(f"{hc.os} matches OS requirement")
                else:
                    trade_offs.append(
                        f"OS in source data ({os_str!r}) does not match required {hc.os!r}"
                    )

        # ── Hard constraint: Weight ────────────────────────────────────────
        if hc.max_weight_kg is not None:
            weight = facts.get("weight_kg")
            if weight is None:
                trade_offs.append("Weight not confirmed in source data")
            elif weight <= hc.max_weight_kg:
                fit_reasons.append(f"{weight}kg is within weight limit")
            else:
                trade_offs.append(
                    f"{weight}kg exceeds the {hc.max_weight_kg}kg weight limit"
                )

        # ── Hard constraint: Required ports ───────────────────────────────
        if hc.required_ports:
            ports = facts.get("ports")
            if ports is None:
                trade_offs.append("Port layout not confirmed in source data")
            else:
                ports_str = (
                    " ".join(ports).lower()
                    if isinstance(ports, list)
                    else str(ports).lower()
                )
                for required_port in hc.required_ports:
                    if required_port.lower() in ports_str:
                        fit_reasons.append(f"{required_port} confirmed in ports")
                    else:
                        trade_offs.append(
                            f"{required_port} not found in confirmed port list"
                        )

        # ── Soft preference: Battery ───────────────────────────────────────
        if sp.battery is not None:
            battery = facts.get("battery")
            if battery is None:
                trade_offs.append("Battery capacity not confirmed in source data")
            else:
                fit_reasons.append("Battery information available in source data")

        # ── Soft preference: Weight ────────────────────────────────────────
        if sp.weight is not None:
            weight = facts.get("weight_kg")
            if weight is None:
                trade_offs.append("Weight not confirmed in source data")
            else:
                fit_reasons.append(f"Weight: {weight}kg")

        # ── Soft preference: Display ───────────────────────────────────────
        if sp.display is not None:
            panel = _get(facts, "display", "panel")
            if panel is None:
                trade_offs.append("Display panel type not confirmed in source data")
            elif panel.upper() == "OLED":
                fit_reasons.append("OLED display")
            else:
                fit_reasons.append(f"{panel} display")

        # ── Budget: no confirmed merchant price ────────────────────────────
        if criteria.budget_max_paise is not None:
            # merchant_price_inr lives in product_variants, not in the facts dict.
            # The retrieval layer filters by budget but cannot confirm price when null.
            # Always flag when no price is confirmed so the buyer knows to verify.
            price = facts.get("merchant_price_paise") or facts.get("merchant_price_inr")
            if price is None:
                trade_offs.append(
                    "Merchant price not confirmed — verify availability with the merchant"
                )

        result.append(
            candidate.model_copy(
                update={
                    "fit_reasons": fit_reasons,
                    "trade_offs": trade_offs,
                }
            )
        )

    return result
