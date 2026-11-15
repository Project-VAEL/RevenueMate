"""
backend/app/models/stock_snapshot.py
Owner: P1
Purpose: Stock quantity at a point in time.
Depends on: models.base, models.product
Used by: stock_service

PROMPT:
Write only this file. Table name stock_snapshots. Append-only history; the latest as_of is
current stock.

Requirements:
- StockSnapshot(Base, IdMixin, TenantMixin): product_id FK products.id indexed, quantity
  Integer not null, as_of timezone-aware datetime not null.
- Index on (product_id, as_of).

Do not:
- Update existing rows; always insert a new snapshot.

Done when: inserting three snapshots for one product keeps all three rows.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
