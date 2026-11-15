"""
backend/app/models/product.py
Owner: P1
Purpose: Catalogue item.
Depends on: models.base
Used by: stock_service, lead model, schemas.catalogue

PROMPT:
Write only this file. Table name products.

Requirements:
- Product(Base, IdMixin, TenantMixin): sku String not null, name String not null,
  price_paise Integer not null, active Boolean default True.
- UniqueConstraint on (tenant_id, sku).

Do not:
- Store money as float or decimal; integer paise only.
- Put stock on this table; it lives in stock_snapshots.

Done when: two products with the same sku in one tenant are rejected, and in different
tenants are allowed.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
