"""
backend/app/schemas/catalogue.py
Owner: P1
Purpose: Catalogue request and response models.
Depends on: schemas.common
Used by: stock_service, api.catalogue, ai.parser

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- StockInfo (dataclass): quantity int | None, as_of datetime | None, is_stale bool.
- ProductOut: id, sku, name, price_paise, active, quantity int | None, stock_as_of
  datetime | None, stock_is_stale bool.
- StockUpdate: quantity int with ge=0.

Do not:
- Include tenant_id in responses.

Done when: ProductOut can be built from a Product plus a StockInfo.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
