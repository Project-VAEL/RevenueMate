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

from sqlalchemy import Boolean, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, IdMixin, TenantMixin


class Product(Base, IdMixin, TenantMixin):
    __tablename__ = "products"

    sku: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    on_hand: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    __table_args__ = (
        UniqueConstraint("tenant_id", "sku", name="uq_products_tenant_sku"),
    )

    @property
    def available(self) -> int:
        return self.on_hand - self.reserved
