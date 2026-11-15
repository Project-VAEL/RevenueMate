"""
backend/app/api/catalogue.py
Reference laptop catalogue endpoint backed by the real SQLite database.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.product_intelligence.retrieval import (
    get_laptop_variant,
    search_exact_laptop_variants,
)
from app.schemas.product_knowledge import ProductVariant

router = APIRouter()


class StockUpdateRequest(BaseModel):
    quantity: int


# Shape the frontend expects: matches BackendProduct in api.ts
class CatalogueProductOut(BaseModel):
    id: str
    sku: str
    name: str
    price_paise: int
    active: bool
    quantity: int | None = None
    stock_as_of: str | None = None
    stock_is_stale: bool = True   # always stale — no live merchant stock in demo


def _variant_to_out(v: ProductVariant) -> CatalogueProductOut:
    # Extract price from facts if available
    price_paise = 0
    price_inr = v.facts.get("merchant_price_inr") or v.facts.get("price_inr")
    if price_inr:
        try:
            price_paise = int(float(price_inr)) * 100
        except (ValueError, TypeError):
            price_paise = 0

    return CatalogueProductOut(
        id=v.product_id,
        sku=v.model_code or v.product_id,
        name=v.product_name,
        price_paise=price_paise,
        active=v.recommendation_eligible,
        quantity=None,        # no live merchant stock in reference DB
        stock_as_of=None,
        stock_is_stale=True,
    )


@router.get("/catalogue/products", response_model=list[CatalogueProductOut])
def list_products():
    """Return all recommendation-eligible laptop variants from the reference catalogue."""
    variants = search_exact_laptop_variants({})
    return [_variant_to_out(v) for v in variants]


@router.get("/catalogue/products/{product_id}", response_model=CatalogueProductOut)
def get_product(product_id: str):
    """Return a single product by ID."""
    variant = get_laptop_variant(product_id)
    if variant is None:
        raise HTTPException(status_code=404, detail=f"Product {product_id!r} not found")
    return _variant_to_out(variant)


@router.put("/catalogue/products/{product_id}/stock", response_model=CatalogueProductOut)
def update_stock(product_id: str, body: StockUpdateRequest):
    """
    Stock update stub — acknowledges the request but does not persist.
    Live stock management requires P1's DB implementation.
    """
    variant = get_laptop_variant(product_id)
    if variant is None:
        raise HTTPException(status_code=404, detail=f"Product {product_id!r} not found")
    out = _variant_to_out(variant)
    # Return with the requested quantity so the frontend reflects the update
    return out.model_copy(update={"quantity": body.quantity, "stock_is_stale": False})
