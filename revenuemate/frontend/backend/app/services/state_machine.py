"""
backend/app/services/state_machine.py
Owner: P1
Purpose: Allowed lead status transitions.
Depends on: models.lead, services.event_service, services.errors, schemas.common
Used by: lead_service, approval_service, payment_service, draft_service (P2)

PROMPT:
Write only this file. It is the only place that may assign lead.status.

Requirements:
- TRANSITIONS: dict[LeadStatus, set[LeadStatus]] exactly as in
  docs/statuses-and-events.md.
- transition(db, lead, new_status, event_type, reason, payload=None) -> None. Reject
  illegal moves with IllegalTransition(f'{old} -> {new}').
- Allowed self-transitions are only drafted -> drafted and payment_requested ->
  payment_requested.
- Moving to uncertain stores the old status in lead.status_before_uncertain. Leaving
  uncertain is allowed only to that stored status (the action did not happen) or to the
  status the action would have produced, meaning a status in TRANSITIONS[stored status]
  (the action did happen). Clear status_before_uncertain when leaving.
- On success set lead.status and record the event through event_service (flush, no
  commit).

Do not:
- Commit.
- Call any provider or adapter.
- Allow any other module to set lead.status directly.

Done when: the transition tests pass: every legal move succeeds and records an event, and
illegal moves raise IllegalTransition.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.common import EventType, LeadStatus
from app.services.errors import IllegalTransition
from app.services.event_service import record_event

TRANSITIONS: dict[LeadStatus, set[LeadStatus]] = {
    LeadStatus.new: {LeadStatus.drafted, LeadStatus.dismissed, LeadStatus.uncertain},
    LeadStatus.drafted: {LeadStatus.drafted, LeadStatus.approved, LeadStatus.dismissed, LeadStatus.uncertain},
    LeadStatus.approved: {LeadStatus.sent, LeadStatus.dismissed, LeadStatus.uncertain},
    LeadStatus.sent: {LeadStatus.payment_requested, LeadStatus.drafted, LeadStatus.dismissed, LeadStatus.uncertain},
    LeadStatus.payment_requested: {LeadStatus.payment_requested, LeadStatus.paid, LeadStatus.dismissed, LeadStatus.uncertain},
    LeadStatus.paid: set(),
    LeadStatus.dismissed: set(),
    LeadStatus.uncertain: set(),
}


def transition(
    db: Session,
    lead: Lead,
    new_status: LeadStatus | str,
    event_type: EventType | str,
    reason: str,
    payload: Optional[dict[str, Any]] = None,
) -> None:
    current_status = LeadStatus(lead.status)
    target_status = LeadStatus(new_status)

    old_str = current_status.value
    new_str = target_status.value

    if current_status == target_status:
        if current_status not in (LeadStatus.drafted, LeadStatus.payment_requested):
            raise IllegalTransition(f"{old_str} -> {new_str}")

    if current_status == LeadStatus.uncertain:
        if not lead.status_before_uncertain:
            raise IllegalTransition(f"{old_str} -> {new_str}")
        stored_status = LeadStatus(lead.status_before_uncertain)
        allowed_leaving = {stored_status} | TRANSITIONS.get(stored_status, set())
        allowed_leaving.discard(LeadStatus.uncertain)
        if target_status not in allowed_leaving:
            raise IllegalTransition(f"{old_str} -> {new_str}")
        lead.status_before_uncertain = None
    else:
        allowed = TRANSITIONS.get(current_status, set())
        if target_status not in allowed:
            raise IllegalTransition(f"{old_str} -> {new_str}")
        if target_status == LeadStatus.uncertain:
            lead.status_before_uncertain = current_status.value

    lead.status = target_status.value

    record_event(
        db=db,
        tenant_id=lead.tenant_id,
        type=event_type,
        reason=reason,
        lead_id=lead.id,
        payload=payload or {},
    )
    db.flush()
