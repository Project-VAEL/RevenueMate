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
