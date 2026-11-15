"""
backend/app/ai/recommendation_agent.py
Owner: P2 (AI track)
Purpose: Orchestrate the full buyer-message → ConversationReply pipeline.

Single public function:
    handle_buyer_message(message, context) -> ConversationReply

Orchestration sequence (9 steps):
    1. intent_parser  → BuyerCriteria
    2. Early return if clarification needed
    3. retrieval      → list[ProductVariant]  (recommendation_eligible only)
    4. retrieval      → attach evidence + components per candidate
    5. comparator     → populate fit_reasons / trade_offs
    6. Build RecommendationResult
    7. response_generator → ConversationReply
    8. conversation_manager → updated context (returned, not persisted — P1 owns persistence)
    9. Return reply

Constraints:
    - Never opens a DB connection directly
    - Never calls a messaging or payment adapter
    - Never creates orders, reservations, or payment links
    - Never mutates shared state
    - transaction_allowed is always False until P1 seeds active merchant offers
    - On any unhandled exception → returns safe error reply, never raises
"""

from __future__ import annotations

import logging

from app.ai import conversation_manager, intent_parser, response_generator
from app.ai.product_comparator import compare_candidates
from app.product_intelligence import retrieval
from app.schemas.conversation import ConversationContext
from app.schemas.recommendation import (
    CandidateProduct,
    ConversationReply,
    RecommendationResult,
    SourceEvidence,
)

logger = logging.getLogger(__name__)

_SAFE_ERROR_REPLY = ConversationReply(
    reply_text="I'm having trouble right now. Could you try again?",
    warnings=["service_error"],
    transaction_allowed=False,
)


def _safe_error() -> ConversationReply:
    """Return a fresh copy of the safe error reply."""
    return _SAFE_ERROR_REPLY.model_copy(deep=True)


def _variant_to_candidate(variant) -> CandidateProduct:
    """
    Convert a ProductVariant (from retrieval) into a CandidateProduct (for comparator
    and response_generator).
    """
    return CandidateProduct(
        product_id=variant.product_id,
        brand=variant.brand,
        product_name=variant.product_name,
        model_code=variant.model_code or "",
        facts=variant.facts,
        unknown_fields=variant.unknown_fields,
        source_ids=variant.source_ids,
        evidence=[SourceEvidence(source_id=sid) for sid in variant.source_ids],
        recommendation_eligible=variant.recommendation_eligible,
    )


def handle_buyer_message(
    message: str,
    context: ConversationContext,
) -> ConversationReply:
    """
    Process a buyer's message end-to-end and return a ConversationReply.

    Parameters
    ----------
    message   Raw buyer message string.
    context   Current ConversationContext. Not mutated — an updated copy is
              built internally but persistence is P1's responsibility.

    Returns
    -------
    ConversationReply — never raises.
    """
    try:
        return _orchestrate(message, context)
    except Exception as exc:
        logger.error(
            "recommendation_agent: unhandled exception (%s) — returning safe error reply",
            type(exc).__name__,
            exc_info=True,
        )
        return _safe_error()


def _orchestrate(message: str, context: ConversationContext) -> ConversationReply:
    """
    Inner orchestration. Exceptions bubble up to handle_buyer_message's catch-all.
    """

    # ── Step 1: Parse intent ──────────────────────────────────────────────────
    criteria = intent_parser.parse_buyer_message(message, context)

    # ── Step 2: Early return if clarification needed ──────────────────────────
    if criteria.needs_clarification:
        logger.info(
            "recommendation_agent: needs_clarification=True — returning clarification reply"
        )
        return ConversationReply(
            reply_text=criteria.clarifying_question
            or "Could you tell me more about what you need?",
            needs_clarification=True,
            recommended_action="ask_clarification",
            transaction_allowed=False,
        )

    # ── Step 3: Retrieve recommendation-eligible candidates ───────────────────
    search_criteria: dict = {}
    if criteria.budget_max_paise is not None:
        search_criteria["budget_max_paise"] = criteria.budget_max_paise

    raw_variants = retrieval.search_exact_laptop_variants(search_criteria)
    logger.info(
        "recommendation_agent: retrieval returned %d variants", len(raw_variants)
    )

    # ── Step 4: Attach evidence and convert to CandidateProduct ───────────────
    candidates: list[CandidateProduct] = []
    for variant in raw_variants:
        candidate = _variant_to_candidate(variant)

        # Attach per-fact evidence (source IDs from product_facts rows)
        try:
            fact_rows = retrieval.get_product_fact_evidence(variant.product_id)
            extra_source_ids = list(dict.fromkeys(
                sid for fact in fact_rows for sid in fact.source_ids
            ))
            # Merge into candidate source_ids (deduplicated)
            merged_source_ids = list(dict.fromkeys(
                candidate.source_ids + extra_source_ids
            ))
            candidate = candidate.model_copy(update={"source_ids": merged_source_ids})
        except Exception as exc:
            logger.warning(
                "recommendation_agent: could not fetch evidence for %s (%s)",
                variant.product_id, type(exc).__name__,
            )

        candidates.append(candidate)

    # ── Step 5: Deterministic comparison ─────────────────────────────────────
    compared = compare_candidates(criteria, candidates)

    # ── Step 6: Build RecommendationResult ───────────────────────────────────
    result = RecommendationResult(
        candidates=compared,
        merchant_offer_status="not_checked",   # stays not_checked until P1 seeds offers
        transaction_allowed=False,
        reference_only=True,
        warnings=[] if compared else ["no_candidates"],
    )

    # ── Step 7: Generate natural-language reply ───────────────────────────────
    reply = response_generator.generate_response(criteria, result, context)

    # ── Step 8: Update context (returned; P1 owns DB persistence) ────────────
    # pylint: disable=unused-variable
    _updated_context = conversation_manager.update_context(
        context, criteria, reply.reply_text
    )
    # _updated_context is available for callers who want to persist it;
    # the API layer (P1) will store it. We do not mutate the passed-in context.

    # ── Step 9: Return reply ──────────────────────────────────────────────────
    logger.info(
        "recommendation_agent: reply ready candidates=%d warnings=%d",
        len(reply.candidates),
        len(reply.warnings),
    )
    return reply
