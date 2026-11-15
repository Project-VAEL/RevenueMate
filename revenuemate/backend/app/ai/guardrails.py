"""
backend/app/ai/guardrails.py
Owner: P2 (AI track)
Purpose: Input and output safety checks for the AI pipeline.
         validate_parsed: rejects product IDs not in the known catalogue.
         check_draft: flags price, stock, or battery runtime claims in LLM
                      output that are not grounded in the input facts.
         No LLM calls. Regex detection only.
Depends on: none (stdlib only)
Used by: ai.response_generator (Task 7)
"""

from __future__ import annotations

import re

# ── Regex patterns (compiled once at module load) ──────────────────────────

# Matches Indian Rupee price expressions: ₹55,000  ₹ 1,20,000  ₹999
_RE_PRICE = re.compile(r"₹\s*\d[\d,]+", re.IGNORECASE)

# Matches stock availability claims
_RE_STOCK = re.compile(
    r"\b(in[\s\-]?stock|available\s+now|units?\s+remaining|in[\s\-]?store)\b",
    re.IGNORECASE,
)

# Matches battery runtime claims: "10 hours battery", "8.5 hour life", "12 hr backup"
_RE_BATTERY_RUNTIME = re.compile(
    r"\b\d+(?:\.\d+)?\s*h(?:ou)?rs?\b(?:\s*(?:battery|life|backup|charge))?",
    re.IGNORECASE,
)


# ── Public interface ───────────────────────────────────────────────────────

def validate_parsed(output: dict, catalogue: list[str]) -> bool:
    """
    Return False if output contains any product_id not present in catalogue.

    Checks both a top-level "product_id" key and product_id values inside
    a "candidates" list. An output with no product_id fields returns True.
    """
    catalogue_set = set(catalogue)

    # Top-level product_id
    top_id = output.get("product_id")
    if top_id is not None and top_id not in catalogue_set:
        return False

    # product_id inside a candidates list
    for candidate in output.get("candidates", []):
        if isinstance(candidate, dict):
            cid = candidate.get("product_id")
            if cid is not None and cid not in catalogue_set:
                return False

    return True


def check_draft(text: str, facts: dict) -> list[str]:
    """
    Return a list of warning strings for any claim in text that is not
    grounded in facts. An empty list means the draft is clean.

    Checks:
    - Price claims (₹ amounts) not found in facts
    - Stock availability claims not backed by facts
    - Battery runtime claims (hours) not backed by facts
    """
    warnings: list[str] = []

    # ── Price claims ───────────────────────────────────────────────────────
    for match in _RE_PRICE.finditer(text):
        matched_text = match.group()
        # Extract numeric value (strip ₹ and commas)
        raw_num = re.sub(r"[₹,\s]", "", matched_text)
        try:
            claimed_amount = int(raw_num)
        except ValueError:
            claimed_amount = None

        grounded = False
        for key in ("price_paise", "merchant_price_paise", "merchant_price_inr"):
            fact_val = facts.get(key)
            if fact_val is not None and claimed_amount is not None:
                # Allow 1% tolerance for rounding differences
                if abs(fact_val - claimed_amount) / max(fact_val, 1) <= 0.01:
                    grounded = True
                    break

        if not grounded:
            warnings.append(
                f"Ungrounded price claim: '{matched_text}' not confirmed in source data"
            )

    # ── Stock claims ───────────────────────────────────────────────────────
    for match in _RE_STOCK.finditer(text):
        matched_text = match.group()
        stock_val = facts.get("stock") or facts.get("merchant_stock_on_hand")
        if not stock_val:
            warnings.append(
                f"Ungrounded stock claim: '{matched_text}' not in source data"
            )

    # ── Battery runtime claims ─────────────────────────────────────────────
    for match in _RE_BATTERY_RUNTIME.finditer(text):
        matched_text = match.group()
        battery = facts.get("battery")
        runtime_grounded = (
            isinstance(battery, dict) and battery.get("runtime_hours") is not None
        )
        if not runtime_grounded:
            warnings.append(
                f"Ungrounded battery runtime claim: '{matched_text}' not confirmed in source data"
            )

    return warnings
