"""
backend/app/ai/response_generator.py
Owner: P2 (AI track)
Purpose: Convert a RecommendationResult into a buyer-facing ConversationReply.

Single public function:
    generate_response(criteria, result, context) -> ConversationReply

Design:
- Builds a structured JSON payload from verified data and passes it to the LLM.
  The LLM can only explain what is in the payload — it cannot invent facts.
- Calls llm_client.complete() with agent="response", json_schema=None (free-text).
- Runs guardrails.check_draft() on the returned text.
  Warnings are appended to ConversationReply.warnings.
  Transactional language ("reserve", "buy", "order") is neutralised when
  transaction_allowed=False.
- On LLMUnavailable: returns a deterministic template reply built from verified fields.
- Never raises to the caller.
- Never logs buyer message text or raw LLM response body.
"""

from __future__ import annotations

import json
import logging
import re

from app.ai import prompts
from app.ai.guardrails import check_draft
from app.ai.llm_client import LLMUnavailable, complete
from app.schemas.conversation import BuyerCriteria, ConversationContext
from app.schemas.recommendation import CandidateProduct, ConversationReply, RecommendationResult

logger = logging.getLogger(__name__)

# Phrases that imply a transaction when transaction_allowed=False
_TRANSACTIONAL_PHRASES = re.compile(
    r"\b(reserve|reservation|buy|purchase|order|checkout|check[\s-]out|add to cart)\b",
    re.IGNORECASE,
)
_TRANSACTIONAL_REPLACEMENT = "Ask the merchant about availability"


# ── Internal helpers ──────────────────────────────────────────────────────────

def _build_llm_payload(
    criteria: BuyerCriteria,
    result: RecommendationResult,
) -> str:
    """
    Build the structured JSON payload sent as the user message to the LLM.
    The LLM receives only pre-verified data — it cannot know anything beyond this.
    """
    candidates_data = []
    for c in result.candidates:
        candidates_data.append({
            "product_id": c.product_id,
            "product_name": c.product_name,
            "brand": c.brand,
            "facts": c.facts,
            "unknown_fields": c.unknown_fields,
            "fit_reasons": c.fit_reasons,
            "trade_offs": c.trade_offs,
            "source_ids": c.source_ids,
        })

    payload = {
        "buyer_requirements": criteria.model_dump(
            include={
                "intent",
                "budget_max_paise",
                "workloads",
                "hard_constraints",
                "soft_preferences",
                "confirmed_fields",
            }
        ),
        "candidates": candidates_data,
        "reference_only": result.reference_only,
        "transaction_allowed": result.transaction_allowed,
        "merchant_offer_status": result.merchant_offer_status,
    }
    return json.dumps(payload, ensure_ascii=False, default=str)


def _aggregate_facts(candidates: list[CandidateProduct]) -> dict:
    """
    Merge facts from all candidates into one flat dict for guardrail checking.
    Keys are prefixed with product_id to avoid collisions.
    Also returns top-level keys from the first candidate for simple cases.
    """
    merged: dict = {}
    for candidate in candidates:
        for k, v in candidate.facts.items():
            merged[k] = v  # last-write wins; sufficient for guardrail checking
    return merged


def _neutralise_transactional(text: str) -> tuple[str, list[str]]:
    """
    Replace transactional phrases in text with a safe alternative.
    Returns (cleaned_text, list_of_warnings).
    """
    warnings: list[str] = []
    matches = list(_TRANSACTIONAL_PHRASES.finditer(text))
    if not matches:
        return text, warnings

    for match in matches:
        warnings.append(
            f"Transactional language removed: '{match.group()}' — "
            f"transaction_allowed=False"
        )
    cleaned = _TRANSACTIONAL_PHRASES.sub(_TRANSACTIONAL_REPLACEMENT, text)
    return cleaned, warnings


def _build_template_reply(result: RecommendationResult) -> str:
    """
    Deterministic fallback reply when the LLM is unavailable.
    Built only from verified fields — no invented data.
    """
    candidates = result.candidates
    if not candidates:
        return (
            "I could not find any laptops matching your requirements in the reference catalogue. "
            "Please try adjusting your criteria."
        )

    names = ", ".join(c.product_name for c in candidates)
    unknown_count = sum(len(c.unknown_fields) for c in candidates)

    parts = [
        f"Based on your requirements, I found {len(candidates)} matching laptop(s): {names}.",
    ]

    # Summarise fit reasons from first candidate as a brief signal
    all_fit = [r for c in candidates for r in c.fit_reasons]
    if all_fit:
        parts.append(f"Key highlights: {'; '.join(all_fit[:3])}.")

    if unknown_count > 0:
        parts.append(
            f"Note: {unknown_count} specification(s) could not be confirmed from source data."
        )

    parts.append(
        "These are reference products — availability in the merchant's shop is not confirmed."
    )

    return " ".join(parts)


# ── Public interface ──────────────────────────────────────────────────────────

def generate_response(
    criteria: BuyerCriteria,
    result: RecommendationResult,
    context: ConversationContext,
) -> ConversationReply:
    """
    Convert a RecommendationResult into a buyer-facing ConversationReply.

    Parameters
    ----------
    criteria  Validated buyer requirements from intent_parser.
    result    Candidates and metadata from the recommendation pipeline.
    context   Current conversation context (used for LLM message history).

    Returns
    -------
    ConversationReply — never raises.
    """
    all_warnings: list[str] = []

    # ── Build LLM payload and call ────────────────────────────────────────────
    try:
        user_payload = _build_llm_payload(criteria, result)
        raw_reply = complete(
            system=prompts.RESPONSE_GENERATOR_SYSTEM,
            user=user_payload,
            json_schema=None,       # free-text output
            agent="response",
        )
        reply_text = raw_reply.strip()

    except LLMUnavailable as exc:
        logger.warning(
            "response_generator: LLM unavailable (%s) — using template reply",
            type(exc).__name__,
        )
        reply_text = _build_template_reply(result)

    except Exception as exc:
        logger.warning(
            "response_generator: unexpected error (%s) — using template reply",
            type(exc).__name__,
        )
        reply_text = _build_template_reply(result)

    # ── Guardrail: check for ungrounded claims ────────────────────────────────
    aggregated_facts = _aggregate_facts(result.candidates)
    draft_warnings = check_draft(reply_text, aggregated_facts)
    if draft_warnings:
        all_warnings.extend(draft_warnings)
        logger.warning(
            "response_generator: guardrail flagged %d claim(s) in draft",
            len(draft_warnings),
        )

    # ── Guardrail: neutralise transactional language ──────────────────────────
    if not result.transaction_allowed:
        reply_text, transactional_warnings = _neutralise_transactional(reply_text)
        all_warnings.extend(transactional_warnings)

    # ── Build reply ───────────────────────────────────────────────────────────
    candidate_ids = [c.product_id for c in result.candidates]
    evidence_ids = list(dict.fromkeys(
        sid for c in result.candidates for sid in c.source_ids
    ))

    logger.info(
        "response_generator: reply built candidates=%d evidence_ids=%d warnings=%d",
        len(result.candidates),
        len(evidence_ids),
        len(all_warnings),
    )

    return ConversationReply(
        reply_text=reply_text,
        intent=criteria.intent,
        needs_clarification=False,
        candidates=result.candidates,
        candidate_ids=candidate_ids,
        evidence_ids=evidence_ids,
        merchant_offer_status=result.merchant_offer_status,
        transaction_allowed=False,   # always False until P1 seeds active merchant offers
        recommended_action="show_comparison",
        warnings=all_warnings,
    )
