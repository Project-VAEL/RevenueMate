"""
backend/tests/test_state_machine.py
Owner: P1
Purpose: State machine tests.
Depends on: services.state_machine, schemas.common, conftest
Used by: pytest

PROMPT:
Write only this file.

Requirements:
- Parametrize every legal (from, to) pair from TRANSITIONS: the move succeeds and exactly
  one event is recorded.
- At least six illegal moves raise IllegalTransition, for example new -> paid, new ->
  sent, drafted -> paid, sent -> approved, paid -> new, dismissed -> drafted.
- Moving to uncertain stores status_before_uncertain; leaving uncertain to an unrelated
  status raises; leaving to the stored status or the status it would have produced
  succeeds and clears the field.
- Self-transition new -> new raises; drafted -> drafted is allowed.

Do not:
- Test anything that is not in the transition table.

Done when: the file passes with pytest -q and fails if a transition in the table is
removed.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.lead import Lead
from app.models.tenant import Tenant
from app.schemas.common import EventType, LeadStatus
from app.services.errors import IllegalTransition
from app.services.state_machine import TRANSITIONS, transition


LEGAL_PAIRS = [
    (from_s, to_s)
    for from_s, targets in TRANSITIONS.items()
    for to_s in targets
]


@pytest.mark.parametrize("from_status,to_status", LEGAL_PAIRS)
def test_legal_transitions(db: Session, tenant: Tenant, from_status: LeadStatus, to_status: LeadStatus):
    lead = Lead(
        tenant_id=tenant.id,
        customer_contact="919999999999",
        raw_text="Test legal transition",
        status=from_status.value,
    )
    db.add(lead)
    db.flush()

    initial_events_count = len(
        db.scalars(select(Event).where(Event.lead_id == lead.id)).all()
    )

    transition(
        db=db,
        lead=lead,
        new_status=to_status,
        event_type=EventType.lead_status_changed,
        reason=f"Transition from {from_status.value} to {to_status.value}",
    )

    assert lead.status == to_status.value
    new_events = db.scalars(select(Event).where(Event.lead_id == lead.id)).all()
    assert len(new_events) == initial_events_count + 1
    assert new_events[-1].type == EventType.lead_status_changed.value


ILLEGAL_PAIRS = [
    (LeadStatus.new, LeadStatus.paid),
    (LeadStatus.new, LeadStatus.sent),
    (LeadStatus.drafted, LeadStatus.paid),
    (LeadStatus.sent, LeadStatus.approved),
    (LeadStatus.paid, LeadStatus.new),
    (LeadStatus.dismissed, LeadStatus.drafted),
    (LeadStatus.new, LeadStatus.new),
]


@pytest.mark.parametrize("from_status,to_status", ILLEGAL_PAIRS)
def test_illegal_transitions_raise(db: Session, tenant: Tenant, from_status: LeadStatus, to_status: LeadStatus):
    lead = Lead(
        tenant_id=tenant.id,
        customer_contact="919999999999",
        raw_text="Test illegal transition",
        status=from_status.value,
    )
    db.add(lead)
    db.flush()

    with pytest.raises(IllegalTransition):
        transition(
            db=db,
            lead=lead,
            new_status=to_status,
            event_type=EventType.lead_status_changed,
            reason="Illegal attempt",
        )


def test_self_transitions(db: Session, tenant: Tenant):
    # drafted -> drafted is allowed
    lead = Lead(
        tenant_id=tenant.id,
        customer_contact="919999999999",
        raw_text="Test draft self transition",
        status=LeadStatus.drafted.value,
    )
    db.add(lead)
    db.flush()

    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.drafted,
        event_type=EventType.draft_created,
        reason="Draft re-generated",
    )
    assert lead.status == LeadStatus.drafted.value

    # payment_requested -> payment_requested is allowed
    lead.status = LeadStatus.payment_requested.value
    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.payment_requested,
        event_type=EventType.payment_created,
        reason="Payment link resent",
    )
    assert lead.status == LeadStatus.payment_requested.value

    # new -> new raises
    lead.status = LeadStatus.new.value
    with pytest.raises(IllegalTransition):
        transition(
            db=db,
            lead=lead,
            new_status=LeadStatus.new,
            event_type=EventType.lead_status_changed,
            reason="Self transition on new",
        )


def test_uncertain_transition_lifecycle(db: Session, tenant: Tenant):
    lead = Lead(
        tenant_id=tenant.id,
        customer_contact="919999999999",
        raw_text="Payment link creation",
        status=LeadStatus.approved.value,
    )
    db.add(lead)
    db.flush()

    # Move to uncertain
    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.uncertain,
        event_type=EventType.payment_uncertain,
        reason="Timeout during send",
    )
    assert lead.status == LeadStatus.uncertain.value
    assert lead.status_before_uncertain == LeadStatus.approved.value

    # Leaving uncertain to unrelated status raises (e.g. paid)
    with pytest.raises(IllegalTransition):
        transition(
            db=db,
            lead=lead,
            new_status=LeadStatus.paid,
            event_type=EventType.lead_status_changed,
            reason="Invalid recovery",
        )

    # Leaving uncertain back to stored status (approved - action did not happen)
    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.approved,
        event_type=EventType.lead_status_changed,
        reason="Recovery: action did not happen",
    )
    assert lead.status == LeadStatus.approved.value
    assert lead.status_before_uncertain is None

    # Move to uncertain again from approved
    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.uncertain,
        event_type=EventType.payment_uncertain,
        reason="Timeout during send attempt 2",
    )
    assert lead.status == LeadStatus.uncertain.value
    assert lead.status_before_uncertain == LeadStatus.approved.value

    # Leaving uncertain to sent (action DID happen)
    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.sent,
        event_type=EventType.message_sent,
        reason="Recovery: provider confirmed message was sent",
    )
    assert lead.status == LeadStatus.sent.value
    assert lead.status_before_uncertain is None
