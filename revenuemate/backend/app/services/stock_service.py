"""
backend/app/services/stock_service.py
Owner: P1
Purpose: Current stock, staleness and updates.
Depends on: models.product, models.stock_snapshot, services.event_service,
  schemas.catalogue, config
Used by: draft_service (P2), lead_service, api.catalogue

PROMPT:
Write only this file.

Requirements:
- get_stock(db, tenant_id, product_id, lead_id=None) -> StockInfo: take the latest
  snapshot by as_of. With no snapshot return quantity None, as_of None, is_stale True.
  is_stale is True when as_of is older than settings.STOCK_STALE_MINUTES. When stale and
  lead_id is given, record stock_stale_flagged.
- list_products_with_stock(db, tenant_id) -> list[ProductOut], active products first.
- update_stock(db, tenant_id, product_id, quantity) -> ProductOut: reject negative
  quantity with ValueError, insert a new snapshot, record stock_updated, commit.
- Raise NotFoundError for an unknown product.

Do not:
- Overwrite old snapshots.
- Treat missing stock as zero; it is unknown.

Done when: a product with an old snapshot reports is_stale True and the event is written
once per read with a lead_id.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
