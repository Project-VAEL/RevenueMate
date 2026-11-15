"""
backend/app/models/__init__.py
Owner: P1
Purpose: Registers every model with Base.
Depends on: all model modules
Used by: db.create_all, tests

PROMPT:
Write only this file.

Requirements:
- Import Base and every model class: Tenant, Product, StockSnapshot, Lead, Draft,
  Approval, PaymentRequest, Message, Event.
- List them all in __all__.

Do not:
- Define classes here.

Done when: import app.models makes Base.metadata contain all nine tables.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
