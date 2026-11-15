"""
backend/tests/test_idempotency.py
Owner: P1
Purpose: Idempotency keys and duplicate lookup tests.
Depends on: services.idempotency, models.message, models.payment_request, conftest
Used by: pytest

PROMPT:
Write only this file.

Requirements:
- make_key produces deterministic, readable keys for kinds 'send', 'paylink', 'sendlink'.
- Repeating make_key with the same inputs produces the identical key.
- find_message returns the stored row by key and None for non-existent keys.
- find_payment returns the stored row by key and None for non-existent keys.
- Duplicate idempotency keys on payment_requests are rejected by the database.
- Duplicate idempotency keys on messages are rejected by the database.

Done when: all idempotency tests pass with pytest.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.models.message import Message
from app.models.payment_request import PaymentRequest
from app.models.tenant import Tenant
from app.services.idempotency import find_message, find_payment, make_key


def test_make_key_deterministic():
    k1 = make_key("send", "lead-123", "draft-456")
    k2 = make_key("send", "lead-123", "draft-456")
    assert k1 == "send:lead-123:draft-456"
    assert k1 == k2

    k3 = make_key("paylink", "lead-123", 49900)
    assert k3 == "paylink:lead-123:49900"


def test_find_message(db: Session, tenant: Tenant, lead_sent: Lead):
    key = make_key("send", lead_sent.id, "1")
    assert find_message(db, key) is None

    msg = Message(
        tenant_id=tenant.id,
        lead_id=lead_sent.id,
        direction="outbound",
        recipient="919876543210",
        text="Hello",
        status="pending",
        idempotency_key=key,
    )
    db.add(msg)
    db.commit()

    found = find_message(db, key)
    assert found is not None
    assert found.id == msg.id
    assert found.idempotency_key == key


def test_find_payment(db: Session, tenant: Tenant, lead_sent: Lead):
    key = make_key("paylink", lead_sent.id, 49900)
    assert find_payment(db, key) is None

    pr = PaymentRequest(
        tenant_id=tenant.id,
        lead_id=lead_sent.id,
        amount_paise=49900,
        order_ref="ORD-TEST-123",
        provider="mock",
        status="created",
        idempotency_key=key,
    )
    db.add(pr)
    db.commit()

    found = find_payment(db, key)
    assert found is not None
    assert found.id == pr.id
    assert found.idempotency_key == key


def test_duplicate_key_rejected(db: Session, tenant: Tenant, lead_sent: Lead):
    key = make_key("paylink", lead_sent.id, "dup-test")
    pr1 = PaymentRequest(
        tenant_id=tenant.id,
        lead_id=lead_sent.id,
        amount_paise=1000,
        order_ref="ORD-DUP-1",
        provider="mock",
        status="created",
        idempotency_key=key,
    )
    db.add(pr1)
    db.commit()

    pr2 = PaymentRequest(
        tenant_id=tenant.id,
        lead_id=lead_sent.id,
        amount_paise=1000,
        order_ref="ORD-DUP-2",
        provider="mock",
        status="created",
        idempotency_key=key,
    )
    db.add(pr2)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
