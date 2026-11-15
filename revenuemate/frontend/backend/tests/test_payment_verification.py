"""
backend/tests/test_payment_verification.py
Owner: P1
Purpose: Paid only after verified success.
Depends on: services.payment_service, adapters.payments.mock, conftest
Used by: pytest
"""

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.registry import get_payments
from app.models.event import Event
from app.models.lead import Lead
from app.models.tenant import Tenant
from app.schemas.common import EventType, LeadStatus, PaymentStatus
from app.services.payment_service import create_link, verify


def test_payment_link_creation(db: Session, tenant: Tenant, lead_sent: Lead):
    payment = create_link(db, tenant.id, lead_sent.id)
    assert payment.status == PaymentStatus.sent.value
    assert lead_sent.status == LeadStatus.payment_requested.value
    assert payment.link_url is not None


def test_verify_success_flow(db: Session, tenant: Tenant, lead_sent: Lead):
    payment = create_link(db, tenant.id, lead_sent.id)
    adapter = get_payments()

    # Lead is payment_requested and not paid yet
    assert lead_sent.status == LeadStatus.payment_requested.value
    assert payment.status != PaymentStatus.success.value

    # Simulate payment success in mock provider
    adapter.set_status(payment.order_ref, "success")

    # Verify marks payment success and lead paid
    verified = verify(db, tenant.id, payment.id)
    assert verified.status == PaymentStatus.success.value
    assert lead_sent.status == LeadStatus.paid.value

    events = db.scalars(
        select(Event).where(
            Event.lead_id == lead_sent.id,
            Event.type == EventType.payment_verified.value,
        )
    ).all()
    assert len(events) >= 1

    # Calling verify again changes nothing and records no extra events
    initial_event_count = len(events)
    verified_again = verify(db, tenant.id, payment.id)
    assert verified_again.status == PaymentStatus.success.value

    events_after = db.scalars(
        select(Event).where(
            Event.lead_id == lead_sent.id,
            Event.type == EventType.payment_verified.value,
        )
    ).all()
    assert len(events_after) == initial_event_count


def test_verify_failed_leaves_payment_requested(db: Session, tenant: Tenant, lead_sent: Lead):
    payment = create_link(db, tenant.id, lead_sent.id)
    adapter = get_payments()

    adapter.set_status(payment.order_ref, "failed")
    verified = verify(db, tenant.id, payment.id)

    assert verified.status == PaymentStatus.failed.value
    assert lead_sent.status == LeadStatus.payment_requested.value


def test_timeout_reconciliation_before_create(db: Session, tenant: Tenant, lead_sent: Lead):
    adapter = get_payments()
    adapter.set_mode("timeout_before_create")

    payment = create_link(db, tenant.id, lead_sent.id)
    assert payment.status == PaymentStatus.uncertain.value
    assert lead_sent.status == LeadStatus.uncertain.value

    adapter.set_mode("ok")
    # Provider never saw the order -> reconciles to failed, reverts lead to sent
    verified = verify(db, tenant.id, payment.id)
    assert verified.status == PaymentStatus.failed.value
    assert lead_sent.status == LeadStatus.sent.value
