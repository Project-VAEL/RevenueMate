"""
backend/tests/test_orders.py
Owner: P1
Purpose: Tests for order lifecycle transitions, invariants, and cancellation.
Depends on: services.order_service, services.reservation_service, conftest
Used by: pytest
"""

import pytest
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.tenant import Tenant
from app.schemas.common import OrderStatus, ReservationStatus
from app.services.errors import ConflictError, IllegalTransition, NotFoundError
from app.services.order_service import (
    cancel_order,
    complete_order,
    confirm_order,
    create_order,
    get_order,
    list_orders,
    transition_order,
)
from app.services.reservation_service import approve_reservation, request_reservation


@pytest.fixture
def product(db: Session, tenant: Tenant) -> Product:
    p = Product(
        tenant_id=tenant.id,
        sku="SKU-ORDER-TEST",
        name="Order Test Laptop",
        price_paise=50000,
        active=True,
        on_hand=5,
        reserved=0,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def test_create_order(db: Session, tenant: Tenant, product: Product):
    order = create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact="919876543210",
        customer_name="Test Customer",
        items=[{"product_id": product.id, "quantity": 2}],
    )
    assert order.status == OrderStatus.draft.value
    assert order.total_amount_paise == 100000
    assert len(order.items) == 1
    assert order.items[0].unit_price_paise == 50000


def test_allowed_order_transitions(db: Session, tenant: Tenant, product: Product):
    order = create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact="919876543210",
        items=[{"product_id": product.id, "quantity": 1}],
    )

    # draft -> reservation_pending
    transition_order(db, order, OrderStatus.reservation_pending)
    assert order.status == OrderStatus.reservation_pending.value

    # reservation_pending -> reserved
    transition_order(db, order, OrderStatus.reserved)
    assert order.status == OrderStatus.reserved.value

    # reserved -> confirmed
    confirm_order(db, tenant.id, order.id)
    assert order.status == OrderStatus.confirmed.value


def test_illegal_order_transitions_raise(db: Session, tenant: Tenant, product: Product):
    order = create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact="919876543210",
        items=[{"product_id": product.id, "quantity": 1}],
    )

    # draft -> completed is illegal
    with pytest.raises(IllegalTransition):
        transition_order(db, order, OrderStatus.completed)

    # draft -> confirmed is illegal
    with pytest.raises(IllegalTransition):
        confirm_order(db, tenant.id, order.id)


def test_cancel_order_releases_reservation(db: Session, tenant: Tenant, product: Product):
    order = create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact="919876543210",
        items=[{"product_id": product.id, "quantity": 2}],
    )
    res = request_reservation(db, tenant.id, order.id)
    approve_reservation(db, tenant.id, res.id)

    db.refresh(product)
    assert product.reserved == 2

    # Cancel order releases reservation
    cancel_order(db, tenant.id, order.id)
    assert order.status == OrderStatus.cancelled.value

    db.refresh(product)
    assert product.reserved == 0

    # Terminal state: cannot transition out of cancelled
    with pytest.raises(IllegalTransition):
        transition_order(db, order, OrderStatus.draft)


def test_complete_order_requires_reservation(db: Session, tenant: Tenant, product: Product):
    order = create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact="919876543210",
        items=[{"product_id": product.id, "quantity": 1}],
    )
    # Moving through transitions
    transition_order(db, order, OrderStatus.reservation_pending)
    transition_order(db, order, OrderStatus.reserved)
    transition_order(db, order, OrderStatus.confirmed)

    # Without reservation, completion fails
    with pytest.raises(ConflictError):
        complete_order(db, tenant.id, order.id)
