"""
backend/tests/test_fulfillment.py
Owner: P1
Purpose: Tests for fulfillment operations (blocked unpaid handover, duplicate handover, delivery completion).
Depends on: services.fulfillment_service, services.order_service, services.reservation_service, conftest
Used by: pytest
"""

import pytest
from sqlalchemy.orm import Session

from app.models.payment_request import PaymentRequest
from app.models.product import Product
from app.models.tenant import Tenant
from app.schemas.common import (
    DeliveryStatus,
    FulfillmentMethod,
    OrderStatus,
    PaymentStatus,
    PickupStatus,
)
from app.services.errors import ConflictError
from app.services.fulfillment_service import (
    complete_delivery,
    complete_pickup,
    dispatch_delivery,
    mark_pickup_ready,
    select_fulfillment_method,
)
from app.services.order_service import confirm_order, create_order
from app.services.reservation_service import approve_reservation, request_reservation


@pytest.fixture
def product(db: Session, tenant: Tenant) -> Product:
    p = Product(
        tenant_id=tenant.id,
        sku="FULFILL-PROD-1",
        name="Fulfillment Product",
        price_paise=25000,
        active=True,
        on_hand=5,
        reserved=0,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def test_pickup_flow_blocked_when_unpaid(db: Session, tenant: Tenant, product: Product):
    order = create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact="919999999999",
        items=[{"product_id": product.id, "quantity": 1}],
    )
    res = request_reservation(db, tenant.id, order.id)
    approve_reservation(db, tenant.id, res.id)
    confirm_order(db, tenant.id, order.id)

    select_fulfillment_method(db, tenant.id, order.id, FulfillmentMethod.store_pickup)
    mark_pickup_ready(db, tenant.id, order.id)

    # Attempting handover without verified payment raises ConflictError
    with pytest.raises(ConflictError) as exc_info:
        complete_pickup(db, tenant.id, order.id, payment_policy="online_before_handover")
    assert "payment policy requires verified payment" in str(exc_info.value)

    # Now add verified payment
    pr = PaymentRequest(
        tenant_id=tenant.id,
        order_id=order.id,
        amount_paise=25000,
        order_ref="ORD-FULFILL-1",
        provider="mock",
        status=PaymentStatus.success.value,
        idempotency_key="paylink:fulfill:1",
    )
    db.add(pr)
    db.commit()

    # Handover now succeeds
    f = complete_pickup(db, tenant.id, order.id, payment_policy="online_before_handover")
    assert f.status == PickupStatus.handed_over.value
    assert order.status == OrderStatus.completed.value

    # Duplicate handover raises ConflictError
    with pytest.raises(ConflictError) as exc_info:
        complete_pickup(db, tenant.id, order.id)
    assert "already been handed over" in str(exc_info.value)


def test_delivery_flow(db: Session, tenant: Tenant, product: Product):
    order = create_order(
        db=db,
        tenant_id=tenant.id,
        customer_contact="919999999999",
        items=[{"product_id": product.id, "quantity": 1}],
    )
    res = request_reservation(db, tenant.id, order.id)
    approve_reservation(db, tenant.id, res.id)
    confirm_order(db, tenant.id, order.id)

    f = select_fulfillment_method(
        db, tenant.id, order.id, FulfillmentMethod.home_delivery, delivery_address="123 High Street"
    )
    assert f.status == DeliveryStatus.awaiting_dispatch.value

    # Dispatch
    dispatch_delivery(db, tenant.id, order.id, tracking_reference="TRACK-12345")
    assert f.status == DeliveryStatus.dispatched.value

    # Complete delivery
    complete_delivery(db, tenant.id, order.id)
    assert f.status == DeliveryStatus.delivered.value
    assert order.status == OrderStatus.completed.value
