"""
backend/tests/conftest.py
Owner: P1
Purpose: Test database, fixtures and AI stubs.
Depends on: app.db, app.models, adapters.registry, services
Used by: every backend test

PROMPT:
Write only this file. Tests run on in-memory SQLite and mock adapters; they never need the
LLM, WhatsApp or Paytm.

Requirements:
- At the very top, before importing any app module, set os.environ DATABASE_URL to
  sqlite:// (in-memory), MESSAGING_PROVIDER to mock and PAYMENT_PROVIDER to mock.
- Fixtures: db (create all tables, yield a session, drop after), tenant (the demo tenant),
  product_with_stock (price 49900 paise, quantity 10, fresh as_of), lead_sent (a lead in
  status sent with a product, for payment tests), lead_drafted_with_draft (for approval
  tests).
- autouse fixture: call registry.reset_adapters() before each test.
- autouse fixture: monkeypatch ai.parser.parse_enquiry and ai.scorer.score_lead with
  deterministic stubs, so P1 tests do not depend on P2's code.

Do not:
- Import anything from ai/ besides what the stubs patch.
- Hit the network.

Done when: pytest collects the three P1 test files with fixtures resolving and no network
access.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

import os
from collections.abc import Generator
from datetime import datetime, timezone

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["MESSAGING_PROVIDER"] = "mock"
os.environ["PAYMENT_PROVIDER"] = "mock"

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import DEMO_TENANT_ID, get_settings
from app.models.base import Base
from app.models.draft import Draft
from app.models.lead import Lead
from app.models.product import Product
from app.models.stock_snapshot import StockSnapshot
from app.models.tenant import Tenant

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, expire_on_commit=False)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def tenant(db: Session) -> Tenant:
    existing = db.get(Tenant, DEMO_TENANT_ID)
    if existing:
        return existing
    t = Tenant(
        id=DEMO_TENANT_ID,
        name="Demo Merchant",
        owner_contact="919999999999",
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@pytest.fixture
def product_with_stock(db: Session, tenant: Tenant) -> Product:
    p = Product(
        tenant_id=tenant.id,
        sku="TEST-SKU-1",
        name="Test Laptop",
        price_paise=49900,
        active=True,
        on_hand=10,
        reserved=0,
    )
    db.add(p)
    db.flush()
    snap = StockSnapshot(
        tenant_id=tenant.id,
        product_id=p.id,
        quantity=10,
        as_of=datetime.now(timezone.utc),
    )
    db.add(snap)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture
def lead_sent(db: Session, tenant: Tenant, product_with_stock: Product) -> Lead:
    lead = Lead(
        tenant_id=tenant.id,
        customer_name="Alice Smith",
        customer_contact="919876543210",
        raw_text="Interested in buying this laptop",
        product_id=product_with_stock.id,
        quantity=1,
        status="sent",
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@pytest.fixture
def lead_drafted_with_draft(db: Session, tenant: Tenant) -> tuple[Lead, Draft]:
    lead = Lead(
        tenant_id=tenant.id,
        customer_name="Bob Jones",
        customer_contact="919876543211",
        raw_text="Do you have warranty?",
        status="drafted",
    )
    db.add(lead)
    db.flush()
    draft = Draft(
        tenant_id=tenant.id,
        lead_id=lead.id,
        text="Yes, we offer 1 year standard warranty.",
        facts_used={},
        warnings=[],
        status="pending",
    )
    db.add(draft)
    db.commit()
    db.refresh(lead)
    db.refresh(draft)
    return lead, draft
