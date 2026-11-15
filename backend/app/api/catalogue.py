"""
backend/app/api/catalogue.py
Owner: P1
Purpose: Catalogue endpoints.
Depends on: services.stock_service, schemas.catalogue, deps
Used by: api.router

PROMPT:
Write only this file.

Requirements:
- GET /catalogue/products -> list[ProductOut] using list_products_with_stock.
- PUT /catalogue/products/{id}/stock takes StockUpdate -> ProductOut using update_stock.

Do not:
- Put business logic here; it belongs in services/.

Done when: updating stock changes quantity and stock_as_of in the next GET.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, get_tenant
from app.models.tenant import Tenant
from app.schemas.catalogue import ProductOut, StockUpdate
from app.services import stock_service

router = APIRouter(tags=["catalogue"])


@router.get("/catalogue/products", response_model=list[ProductOut])
def list_catalogue_products(
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> list[ProductOut]:
    return stock_service.list_products_with_stock(db, tenant.id)


@router.put("/catalogue/products/{id}/stock", response_model=ProductOut)
def update_catalogue_product_stock(
    id: str,
    payload: StockUpdate,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> ProductOut:
    return stock_service.update_stock(db, tenant.id, id, payload.quantity)
