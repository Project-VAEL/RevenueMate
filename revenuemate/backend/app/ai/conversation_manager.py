"""
backend/app/ai/conversation_manager.py
Owner: P2 (AI track)
Purpose: Pure in-memory functions that create and evolve ConversationContext across turns.

No LLM calls. No DB access. No side effects.
P1 owns DB persistence — this module only transforms data in memory.

Three public functions:
    new_context(conversation_id, tenant_id)          -> ConversationContext
    update_context(ctx, new_criteria, assistant_reply) -> ConversationContext
    get_llm_messages(ctx, new_message)               -> list[dict]

Merge rules (update_context):
    - Fields in new_criteria.confirmed_fields  → always overwrite existing value
    - Fields NOT in new_criteria.confirmed_fields (inferred) → only fill nulls
    - confirmed_fields list → union across turns (never shrinks)
    - Stage advances discovery→comparison when criteria confirmed + no clarification
    - Never stores price, stock, reservation, payment, or fulfilment state
    - Never elevates user content to role="system"

History window (get_llm_messages):
    - Keeps last MAX_CONTEXT_TURNS=6 turns
    - When truncated, prepends a one-sentence confirmed-fields summary
    - new_message always placed as role="user" — prompt injection boundary
"""

import logging
from copy import deepcopy

from app.schemas.conversation import BuyerCriteria, ConversationContext, HardConstraints, SoftPreferences

logger = logging.getLogger(__name__)

MAX_CONTEXT_TURNS = 6


# ── new_context ───────────────────────────────────────────────────────────────

def new_context(conversation_id: str, tenant_id: str) -> ConversationContext:
    """
    Return a fresh ConversationContext at stage 'discovery' with empty history.
    Always returns a new independent object — never mutates shared state.
    """
    return ConversationContext(
        conversation_id=conversation_id,
        tenant_id=tenant_id,
        stage="discovery",
        buyer_criteria=None,
        discussed_product_ids=[],
        pending_clarification=None,
        turn_count=0,
        history=[],
    )


# ── update_context ────────────────────────────────────────────────────────────

def _merge_criteria(
    existing: BuyerCriteria | None,
    incoming: BuyerCriteria,
) -> BuyerCriteria:
    """
    Merge incoming BuyerCriteria into existing, respecting confirmation provenance.

    Confirmed fields in incoming always overwrite.
    Inferred fields (not in incoming.confirmed_fields) only fill nulls.
    confirmed_fields is the union of both.
    """
    if existing is None:
        return incoming.model_copy(deep=True)

    confirmed = set(incoming.confirmed_fields)

    # ── scalar fields on BuyerCriteria ────────────────────────────────────────
    new_budget = (
        incoming.budget_max_paise
        if "budget_max_paise" in confirmed
        else (incoming.budget_max_paise if existing.budget_max_paise is None else existing.budget_max_paise)
    )

    new_workloads = (
        incoming.workloads
        if "workloads" in confirmed
        else (incoming.workloads if not existing.workloads else existing.workloads)
    )

    new_intent = incoming.intent  # always from latest turn

    # ── hard_constraints ──────────────────────────────────────────────────────
    old_hc = existing.hard_constraints
    new_hc = incoming.hard_constraints

    def _pick(field: str, old_val, new_val):
        """Pick new_val if confirmed or old is None; else keep old."""
        if field in confirmed:
            return new_val
        return new_val if old_val is None else old_val

    merged_hc = HardConstraints(
        os=_pick("os", old_hc.os, new_hc.os),
        min_ram_gb=_pick("min_ram_gb", old_hc.min_ram_gb, new_hc.min_ram_gb),
        min_storage_gb=_pick("min_storage_gb", old_hc.min_storage_gb, new_hc.min_storage_gb),
        discrete_gpu_required=(
            new_hc.discrete_gpu_required
            if "discrete_gpu_required" in confirmed
            else (new_hc.discrete_gpu_required if not old_hc.discrete_gpu_required else old_hc.discrete_gpu_required)
        ),
        max_weight_kg=_pick("max_weight_kg", old_hc.max_weight_kg, new_hc.max_weight_kg),
        required_ports=(
            new_hc.required_ports
            if "required_ports" in confirmed
            else (new_hc.required_ports if not old_hc.required_ports else old_hc.required_ports)
        ),
    )

    # ── soft_preferences ──────────────────────────────────────────────────────
    old_sp = existing.soft_preferences
    new_sp = incoming.soft_preferences

    merged_sp = SoftPreferences(
        battery=_pick("battery", old_sp.battery, new_sp.battery),
        weight=_pick("weight", old_sp.weight, new_sp.weight),
        display=_pick("display", old_sp.display, new_sp.display),
        keyboard=_pick("keyboard", old_sp.keyboard, new_sp.keyboard),
        portability=_pick("portability", old_sp.portability, new_sp.portability),
    )

    # ── confirmed_fields: union (never shrinks) ────────────────────────────────
    merged_confirmed = sorted(set(existing.confirmed_fields) | confirmed)

    return BuyerCriteria(
        intent=new_intent,
        budget_max_paise=new_budget,
        workloads=new_workloads,
        hard_constraints=merged_hc,
        soft_preferences=merged_sp,
        confirmed_fields=merged_confirmed,
        missing_critical_fields=incoming.missing_critical_fields,
        needs_clarification=incoming.needs_clarification,
        clarifying_question=incoming.clarifying_question,
        confidence=incoming.confidence,
    )


def _advance_stage(ctx: ConversationContext, merged: BuyerCriteria) -> str:
    """
    Advance stage based on current context state.
    Stage never goes backward.
    discovery → comparison: criteria has at least one confirmed field and no clarification needed.
    """
    if ctx.stage == "discovery":
        if merged.confirmed_fields and not merged.needs_clarification:
            return "comparison"
    return ctx.stage


def update_context(
    ctx: ConversationContext,
    new_criteria: BuyerCriteria,
    assistant_reply: str | None = None,
) -> ConversationContext:
    """
    Merge new_criteria into ctx and return an updated ConversationContext.

    - Confirmed fields overwrite; inferred fields only fill nulls.
    - Appends a user-turn summary and (optionally) the assistant reply to history.
    - Advances stage when appropriate.
    - Returns a new object — does not mutate ctx.

    Parameters
    ----------
    ctx             Current context.
    new_criteria    BuyerCriteria from the latest intent_parser call.
    assistant_reply The reply text sent back to the buyer, if available.
    """
    merged_criteria = _merge_criteria(ctx.buyer_criteria, new_criteria)
    new_stage = _advance_stage(ctx, merged_criteria)
    new_history = list(ctx.history)  # shallow copy — dicts are not mutated

    # Append a user-turn entry summarising what was confirmed this turn.
    # Raw buyer text is not available here (it was consumed upstream) so we
    # record intent + confirmed fields as the user turn summary.
    confirmed_this_turn = [
        f for f in new_criteria.confirmed_fields
        if f not in ctx.buyer_criteria.confirmed_fields
    ] if ctx.buyer_criteria else new_criteria.confirmed_fields

    user_summary = f"[intent={new_criteria.intent}"
    if confirmed_this_turn:
        user_summary += f" confirmed={','.join(confirmed_this_turn)}"
    if new_criteria.needs_clarification:
        user_summary += " needs_clarification=true"
    user_summary += "]"

    new_history.append({"role": "user", "content": user_summary})

    if assistant_reply is not None:
        new_history.append({"role": "assistant", "content": assistant_reply})

    return ConversationContext(
        conversation_id=ctx.conversation_id,
        tenant_id=ctx.tenant_id,
        stage=new_stage,
        buyer_criteria=merged_criteria,
        discussed_product_ids=list(ctx.discussed_product_ids),
        pending_clarification=(
            new_criteria.clarifying_question if new_criteria.needs_clarification else None
        ),
        turn_count=ctx.turn_count + 1,
        history=new_history,
    )


# ── get_llm_messages ──────────────────────────────────────────────────────────

def get_llm_messages(ctx: ConversationContext, new_message: str) -> list[dict]:
    """
    Return the message list for an LLM call: bounded history + new user message.

    - Keeps last MAX_CONTEXT_TURNS (6) turns from ctx.history.
    - When history is longer than MAX_CONTEXT_TURNS, the oldest turns are dropped
      and a one-sentence confirmed-fields summary is prepended as a system message
      so the LLM retains essential context.
    - new_message is ALWAYS placed as role="user" — never role="system".
      This is the prompt injection boundary: buyer content cannot escalate its role.

    Parameters
    ----------
    ctx         Current conversation context.
    new_message The raw buyer message for this turn.

    Returns
    -------
    list[dict]  List of {"role": str, "content": str} dicts.
    """
    messages: list[dict] = []

    history = ctx.history
    if len(history) > MAX_CONTEXT_TURNS:
        # Truncate to the last MAX_CONTEXT_TURNS turns and prepend a summary.
        history = history[-MAX_CONTEXT_TURNS:]
        summary = _build_context_summary(ctx)
        messages.append({"role": "system", "content": summary})

    messages.extend(history)

    # new_message always role="user" — never elevated regardless of content.
    messages.append({"role": "user", "content": new_message})

    return messages


def _build_context_summary(ctx: ConversationContext) -> str:
    """
    Build a one-sentence summary of confirmed fields for use when history is truncated.
    """
    if ctx.buyer_criteria and ctx.buyer_criteria.confirmed_fields:
        confirmed = ", ".join(ctx.buyer_criteria.confirmed_fields)
        return f"Confirmed so far in this conversation: {confirmed}."
    return "No fields confirmed so far in this conversation."
