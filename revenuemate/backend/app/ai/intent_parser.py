"""
backend/app/ai/intent_parser.py
Owner: P2 (AI track)
Purpose: Convert a buyer's natural-language message into a validated BuyerCriteria.

Single public function:
    parse_buyer_message(message, context) -> BuyerCriteria

Design:
- Calls llm_client.complete() once in structured JSON mode, passing the full
  BuyerCriteria JSON schema so the provider enforces the shape.
- Budget normalisation ("60k" → 6000000 paise) is handled entirely by the LLM
  via INTENT_PARSER_SYSTEM. This module only validates the structured output.
- Defensive check: if LLM returns budget_max_paise=0, it is corrected to None.
- On any failure (LLMUnavailable, JSONDecodeError, ValidationError): returns a
  safe fallback BuyerCriteria — never raises.
- Never logs buyer message text or raw LLM response.
- No DB access. No conversation persistence. No LLM retries (llm_client handles
  the provider fallback chain).
"""

import json
import logging

from pydantic import ValidationError

from app.ai import prompts
from app.ai.llm_client import LLMUnavailable, complete
from app.schemas.conversation import BuyerCriteria, ConversationContext

logger = logging.getLogger(__name__)

# ── Safe fallback ─────────────────────────────────────────────────────────────
# Module-level template — never mutate this directly.
# _safe_fallback() returns a fresh copy so callers cannot affect future calls.

_FALLBACK_TEMPLATE = BuyerCriteria(
    intent="other",
    needs_clarification=True,
    clarifying_question="Could you tell me more about what you need?",
)


def _safe_fallback() -> BuyerCriteria:
    """Return a fresh copy of the safe fallback BuyerCriteria."""
    return _FALLBACK_TEMPLATE.model_copy(deep=True)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _build_user_message(message: str, context: ConversationContext | None) -> str:
    """
    Build the user message for the LLM call.

    - Buyer text is always triple-quoted as data — the LLM cannot mistake its boundary.
    - If context carries confirmed fields, a one-line summary is prepended so the LLM
      knows what has already been established without re-asking.
    - The summary is never embedded inside the buyer data quotes (prompt injection boundary).
    """
    parts: list[str] = []

    if (
        context is not None
        and context.buyer_criteria is not None
        and context.buyer_criteria.confirmed_fields
    ):
        confirmed = ", ".join(context.buyer_criteria.confirmed_fields)
        parts.append(
            f"Already confirmed from earlier in this conversation: {confirmed}."
        )

    parts.append(f'Buyer message: """{message}"""')
    return "\n".join(parts)


# ── Public interface ──────────────────────────────────────────────────────────

def parse_buyer_message(
    message: str,
    context: ConversationContext | None = None,
) -> BuyerCriteria:
    """
    Convert a buyer's natural-language message into a validated BuyerCriteria.

    Parameters
    ----------
    message  The raw buyer message string.
    context  Optional conversation context. When provided, confirmed fields from
             previous turns are summarised in the LLM prompt so the model does not
             re-ask for already-established information.

    Returns
    -------
    BuyerCriteria
        A validated object. On any failure, returns a safe fallback with
        needs_clarification=True rather than raising.

    Notes
    -----
    - budget_max_paise=0 is corrected to None (LLM must use null for missing budget).
    - Buyer message content is never logged.
    """
    user_msg = _build_user_message(message, context)
    schema = BuyerCriteria.model_json_schema()

    try:
        raw = complete(
            system=prompts.INTENT_PARSER_SYSTEM,
            user=user_msg,
            json_schema=schema,
            agent="intent",
        )
        data = json.loads(raw)
        criteria = BuyerCriteria.model_validate(data)

    except LLMUnavailable as exc:
        logger.warning(
            "intent_parser: LLM unavailable (%s) — returning safe fallback",
            type(exc).__name__,
        )
        return _safe_fallback()

    except json.JSONDecodeError as exc:
        logger.warning(
            "intent_parser: JSON parse error (%s) — returning safe fallback",
            type(exc).__name__,
        )
        return _safe_fallback()

    except ValidationError as exc:
        logger.warning(
            "intent_parser: schema validation failed (%s) — returning safe fallback",
            type(exc).__name__,
        )
        return _safe_fallback()

    except Exception as exc:  # catch-all — never crash the caller
        logger.warning(
            "intent_parser: unexpected error (%s) — returning safe fallback",
            type(exc).__name__,
        )
        return _safe_fallback()

    # Defensive: the prompt says never return 0 for missing budget, but we cannot
    # unconditionally trust the LLM.
    if criteria.budget_max_paise == 0:
        criteria = criteria.model_copy(update={"budget_max_paise": None})
        logger.warning(
            "intent_parser: corrected budget_max_paise=0 → None "
            "(LLM returned 0 for missing budget)"
        )

    logger.info(
        "intent_parser: succeeded intent=%s confidence=%.2f",
        criteria.intent,
        criteria.confidence,
    )
    return criteria
