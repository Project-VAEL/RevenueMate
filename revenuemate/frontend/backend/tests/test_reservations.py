"""
backend/tests/test_reservations.py
Owner: P1
Purpose: Tests for atomic stock reservation, oversell prevention, lookup, and expiry release.
Depends on: services.reservation_service, conftest
Used by: pytest
"""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.tenant import Tenant
from app.schemas.common import OrderStatus, ReservationStatus
from app.services.errors import ConflictError, NotFoundError
from app.services.reservation_service import (
    approve_reservation,
    consume_reservation,
    expire_reservations,
    lookup_reservation,
    release_reservation,
    request_reservation,
)


@pytest.fixture
def product_with_limited_stock(db: Session, tenant: Tenant) -> Product:
    p = Product(
        tenant_id=tenant.id,
        sku="TEST-LAPTOP-LIMITED",
        name="Limited Edition Laptop",
        price_paise=100000,
        active=True,
        on_hand=2,
        reserved=0,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@pytest.fixture
def draft_order(db: Session, tenant: Tenant, product_with_limited_stock: Product) -> Order:
    order = Order(
        tenant_id=tenant.id,
        customer_contact="919999999999",
        status=OrderStatus.draft.value,
        total_amount_paise=100000,
    )
    db.add(order)
    db.flush()

    item = OrderItem(
        order_id=order.id,
        product_id=product_with_limited_stock.id,
        quantity=1,
        unit_price_paise=100000,
    )
    db.add(item)
    db.commit()
    db.refresh(order)
    return order


def test_reservation_request_and_approval(db: Session, tenant: Tenant, draft_order: Order, product_with_limited_stock: Product):
    res = request_reservation(db, tenant.id, draft_order.id)
    assert res.status == ReservationStatus.pending.value
    assert res.reservation_code.startswith("RES-")

    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.reserved == 0

    approved = approve_reservation(db, tenant.id, res.id)
    assert approved.status == ReservationStatus.active.value

    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.reserved == 1
    assert product_with_limited_stock.available == 1


def test_oversell_prevention(db: Session, tenant: Tenant, product_with_limited_stock: Product):
    # Stock is 2
    order1 = Order(tenant_id=tenant.id, customer_contact="919111111111", status="draft", total_amount_paise=200000)
    db.add(order1)
    db.flush()
    db.add(OrderItem(order_id=order1.id, product_id=product_with_limited_stock.id, quantity=2, unit_price_paise=100000))
    db.commit()

    res1 = request_reservation(db, tenant.id, order1.id)
    approve_reservation(db, tenant.id, res1.id)

    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.available == 0

    # Next reservation for 1 unit must fail
    order2 = Order(tenant_id=tenant.id, customer_contact="919222222222", status="draft", total_amount_paise=100000)
    db.add(order2)
    db.flush()
    db.add(OrderItem(order_id=order2.id, product_id=product_with_limited_stock.id, quantity=1, unit_price_paise=100000))
    db.commit()

    res2 = request_reservation(db, tenant.id, order2.id)
    with pytest.raises(ConflictError) as exc_info:
        approve_reservation(db, tenant.id, res2.id)
    assert "Insufficient stock" in str(exc_info.value)


def test_release_and_expiry_restores_stock(db: Session, tenant: Tenant, draft_order: Order, product_with_limited_stock: Product):
    res = request_reservation(db, tenant.id, draft_order.id)
    approve_reservation(db, tenant.id, res.id)

    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.reserved == 1

    # Release
    release_reservation(db, tenant.id, res.id)
    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.reserved == 0

    # Expire test: create a new reservation on a fresh order with past expires_at
    order_expiry = Order(
        tenant_id=tenant.id,
        customer_contact="919999999998",
        status=OrderStatus.draft.value,
        total_amount_paise=100000,
    )
    db.add(order_expiry)
    db.flush()
    db.add(OrderItem(order_id=order_expiry.id, product_id=product_with_limited_stock.id, quantity=1, unit_price_paise=100000))
    db.commit()

    res2 = request_reservation(db, tenant.id, order_expiry.id)
    approve_reservation(db, tenant.id, res2.id)
    res2.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    db.commit()

    expired = expire_reservations(db, tenant.id)
    assert len(expired) == 1
    assert expired[0].id == res2.id
    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.reserved == 0


def test_receptionist_lookup(db: Session, tenant: Tenant, draft_order: Order):
    res = request_reservation(db, tenant.id, draft_order.id)
    code = res.reservation_code

    found = lookup_reservation(db, tenant.id, code)
    assert found.id == res.id

    with pytest.raises(NotFoundError):
        lookup_reservation(db, tenant.id, "NONEXISTENT-CODE")


def test_consume_reservation(db: Session, tenant: Tenant, draft_order: Order, product_with_limited_stock: Product):
    res = request_reservation(db, tenant.id, draft_order.id)
    approve_reservation(db, tenant.id, res.id)

    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.on_hand == 2
    assert product_with_limited_stock.reserved == 1

    consume_reservation(db, tenant.id, res.id)
    db.refresh(product_with_limited_stock)
    assert product_with_limited_stock.on_hand == 1
    assert product_with_limited_stock.reserved == 0
    assert product_with_limited_stock.available == 1
