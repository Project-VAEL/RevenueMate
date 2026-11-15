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

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.product import Product
from app.models.stock_snapshot import StockSnapshot
from app.schemas.catalogue import ProductOut, StockInfo
from app.services.errors import NotFoundError
from app.services.event_service import record_event


def get_stock(
    db: Session,
    tenant_id: str,
    product_id: str,
    lead_id: Optional[str] = None,
) -> StockInfo:
    stmt = (
        select(StockSnapshot)
        .where(
            StockSnapshot.tenant_id == tenant_id,
            StockSnapshot.product_id == product_id,
        )
        .order_by(StockSnapshot.as_of.desc())
    )
    snap = db.scalars(stmt).first()
    if not snap:
        return StockInfo(quantity=None, as_of=None, is_stale=True)

    now = datetime.now(timezone.utc)
    # Ensure snap.as_of is timezone aware
    as_of = snap.as_of
    if as_of.tzinfo is None:
        as_of = as_of.replace(tzinfo=timezone.utc)

    is_stale = (now - as_of) > timedelta(minutes=settings.STOCK_STALE_MINUTES)

    if is_stale and lead_id:
        record_event(
            db=db,
            tenant_id=tenant_id,
            type="stock_stale_flagged",
            reason=f"Stock snapshot for product '{product_id}' is stale (> {settings.STOCK_STALE_MINUTES} mins old)",
            lead_id=lead_id,
            payload={"product_id": product_id, "snapshot_as_of": as_of.isoformat()},
        )
        db.flush()

    return StockInfo(quantity=snap.quantity, as_of=as_of, is_stale=is_stale)


def list_products_with_stock(db: Session, tenant_id: str) -> list[ProductOut]:
    stmt = (
        select(Product)
        .where(Product.tenant_id == tenant_id)
        .order_by(Product.active.desc(), Product.name.asc())
    )
    products = db.scalars(stmt).all()
    results: list[ProductOut] = []

    for p in products:
        stock = get_stock(db, tenant_id, p.id)
        results.append(
            ProductOut(
                id=p.id,
                sku=p.sku,
                name=p.name,
                price_paise=p.price_paise,
                active=p.active,
                quantity=stock.quantity,
                stock_as_of=stock.as_of,
                stock_is_stale=stock.is_stale,
            )
        )
    return results


def update_stock(
    db: Session,
    tenant_id: str,
    product_id: str,
    quantity: int,
) -> ProductOut:
    if quantity < 0:
        raise ValueError("Quantity cannot be negative.")

    product = db.get(Product, product_id)
    if not product or product.tenant_id != tenant_id:
        raise NotFoundError(f"Product '{product_id}' not found.")

    product.on_hand = quantity
    now = datetime.now(timezone.utc)

    snapshot = StockSnapshot(
        tenant_id=tenant_id,
        product_id=product_id,
        quantity=quantity,
        as_of=now,
    )
    db.add(snapshot)

    record_event(
        db=db,
        tenant_id=tenant_id,
        type="stock_updated",
        reason=f"Stock for '{product.name}' updated to {quantity}",
        payload={"product_id": product_id, "quantity": quantity},
    )
    db.commit()
    db.refresh(product)

    return ProductOut(
        id=product.id,
        sku=product.sku,
        name=product.name,
        price_paise=product.price_paise,
        active=product.active,
        quantity=quantity,
        stock_as_of=now,
        stock_is_stale=False,
    )
