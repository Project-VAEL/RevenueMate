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
