"""
backend/tests/test_api_routers.py
Owner: P1
Purpose: Smoke tests for all API routers using FastAPI TestClient.
"""

import pytest
from fastapi.testclient import TestClient

from app.adapters.registry import get_payments
from app.config import DEMO_TENANT_ID
from app.deps import get_db
from app.main import app
from app.models.lead import Lead
from app.models.order import Order, OrderItem
from app.models.payment_request import PaymentRequest
from app.models.product import Product
from app.models.tenant import Tenant
from app.schemas.common import FulfillmentMethod, OrderStatus
from app.services.order_service import create_order, transition_order
from app.services.reservation_service import approve_reservation, request_reservation


@pytest.fixture
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_catalogue_products(client, db, tenant, product_with_stock):
    res = client.get("/catalogue/products")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["sku"] == "TEST-SKU-1"
    assert data[0]["quantity"] == 10


def test_create_and_list_leads(client, db, tenant, product_with_stock):
    payload = {
        "customer_name": "Test Customer",
        "customer_contact": "919876543210",
        "channel": "manual",
        "raw_text": "I want to buy a laptop",
    }
    res = client.post("/leads", json=payload)
    assert res.status_code == 201
    lead_data = res.json()
    assert lead_data["customer_name"] == "Test Customer"
    assert lead_data["status"] == "new"

    list_res = client.get("/leads")
    assert list_res.status_code == 200
    leads = list_res.json()
    assert any(l["customer_name"] == "Test Customer" for l in leads)


def test_orders_flow(client, db, tenant, product_with_stock):
    payload = {
        "customer_name": "Bob Buyer",
        "customer_contact": "919123456789",
        "items": [
            {
                "product_id": product_with_stock.id,
                "quantity": 2,
            }
        ],
    }
    res = client.post("/orders", json=payload)
    assert res.status_code == 201
    order_data = res.json()
    assert order_data["status"] == "draft"
    assert order_data["total_amount_paise"] == 49900 * 2
    order_id = order_data["id"]

    get_res = client.get(f"/orders/{order_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == order_id

    list_res = client.get("/orders")
    assert list_res.status_code == 200
    assert any(o["id"] == order_id for o in list_res.json())


def test_reservations_request_and_lookup(client, db, tenant, product_with_stock):
    order = create_order(
        db,
        tenant_id=tenant.id,
        customer_contact="919999888777",
        customer_name="Reserver",
        items=[{"product_id": product_with_stock.id, "quantity": 1}],
    )

    # Request reservation via order endpoint
    res = client.post(f"/orders/{order.id}/request-reservation")
    assert res.status_code == 200
    data = res.json()
    assert data["order_id"] == order.id
    code = data["reservation_code"]

    lookup_res = client.get(f"/reservations/lookup/{code}")
    assert lookup_res.status_code == 200
    assert lookup_res.json()["reservation_code"] == code


def test_payments_link_and_verify(client, db, tenant, lead_sent, product_with_stock):
    order = create_order(
        db,
        tenant_id=tenant.id,
        customer_contact=lead_sent.customer_contact,
        customer_name=lead_sent.customer_name,
        lead_id=lead_sent.id,
        items=[{"product_id": product_with_stock.id, "quantity": 1}],
    )

    # Request & approve reservation
    resv = request_reservation(db, tenant.id, order.id)
    approve_reservation(db, tenant.id, resv.id)

    # Create link on order
    link_res = client.post(f"/orders/{order.id}/payment-link")
    assert link_res.status_code == 200
    link_data = link_res.json()
    assert "link_url" in link_data or "id" in link_data
    payment_id = link_data["id"]

    # Mark success in mock adapter
    payment_req = db.get(PaymentRequest, payment_id)
    get_payments().set_status(payment_req.order_ref, "success")

    # Verify payment
    verify_res = client.post(f"/payments/{payment_id}/verify")
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "success"


def test_fulfillment_endpoints(client, db, tenant, product_with_stock):
    order = create_order(
        db,
        tenant_id=tenant.id,
        customer_contact="919999333444",
        customer_name="FulfillUser",
        items=[{"product_id": product_with_stock.id, "quantity": 1}],
    )
    resv = request_reservation(db, tenant.id, order.id)
    approve_reservation(db, tenant.id, resv.id)

    # Transition order to confirmed (paid)
    transition_order(db, order, OrderStatus.confirmed)
    db.commit()

    # Select fulfillment method
    method_res = client.post(
        f"/orders/{order.id}/fulfillment/select-method",
        json={"method": "store_pickup"},
    )
    assert method_res.status_code == 200
    assert method_res.json()["method"] == "store_pickup"

    # Mark pickup ready
    ready_res = client.post(f"/orders/{order.id}/fulfillment/mark-pickup-ready")
    assert ready_res.status_code == 200
    assert ready_res.json()["status"] == "ready_for_pickup"

    # Complete pickup
    complete_res = client.post(f"/orders/{order.id}/fulfillment/complete-pickup")
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "handed_over"


def test_events_log(client, db, tenant):
    res = client.get("/events")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
