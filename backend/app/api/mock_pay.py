"""
backend/app/api/mock_pay.py
Owner: P1
Purpose: Demo payment page for the mock payment provider.
Depends on: adapters.registry, adapters.payments.mock, services.payment_service,
  models.payment_request, db
Used by: api.router; the payment link sent to customers

PROMPT:
Write only this file. It stands in for a provider's hosted checkout page, so the demo link
opens on a phone. It must say clearly that it is a demo and no money moves.

Requirements:
- Return small self-contained HTML (inline CSS, no external assets, mobile friendly) built
  with f-strings.
- GET /mock-pay/{order_ref}: find the PaymentRequest by order_ref (404 if missing, or if
  the active payment provider is not the mock). Show the merchant name, the amount in
  rupees formatted from paise, the order reference, a Pay button, a Fail button, and the
  line 'Demo payment page. No real money moves.'
- POST /mock-pay/{order_ref}/pay: call the mock adapter's set_status(order_ref,
  'success'), then payment_service.verify(db, payment.tenant_id, payment.id). Return a
  confirmation page. The order becomes paid only through verify.
- POST /mock-pay/{order_ref}/fail: set_status(order_ref, 'failed'), then verify; return a
  failure page.
- The buttons are plain HTML forms posting to those paths; the routes read no body.

Do not:
- Change payment or lead rows directly; only payment_service.verify may.
- Respond when PAYMENT_PROVIDER is not mock.

Done when: opening the link on a phone shows the page, Pay moves the lead to paid with one
payment_verified event, and just opening the page changes nothing.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.adapters.registry import get_payments
from app.config import settings
from app.db import get_db
from app.models.payment_request import PaymentRequest
from app.models.tenant import Tenant
from app.services import payment_service

router = APIRouter(tags=["mock-pay"])


def _get_mock_payment(db: Session, order_ref: str) -> tuple[PaymentRequest, str]:
    if settings.PAYMENT_PROVIDER != "mock":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mock payment provider is not enabled.",
        )
    stmt = select(PaymentRequest).where(PaymentRequest.order_ref == order_ref)
    payment = db.scalars(stmt).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    tenant = db.get(Tenant, payment.tenant_id)
    tenant_name = tenant.name if tenant else "Merchant"
    return payment, tenant_name


@router.get("/mock-pay/{order_ref}", response_class=HTMLResponse)
def mock_pay_page(order_ref: str, db: Session = Depends(get_db)) -> HTMLResponse:
    payment, merchant_name = _get_mock_payment(db, order_ref)
    amount_rupees = f"{payment.amount_paise / 100:.2f}"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>RevenueMate Demo Checkout</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f5f7; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }}
    .card {{ background: white; border-radius: 12px; padding: 24px; max-width: 400px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: center; }}
    h2 {{ margin: 0 0 8px; color: #111827; }}
    .merchant {{ color: #6b7280; font-size: 14px; margin-bottom: 20px; }}
    .amount {{ font-size: 32px; font-weight: 700; color: #0284c7; margin: 16px 0; }}
    .ref {{ font-size: 12px; color: #9ca3af; margin-bottom: 24px; font-family: monospace; }}
    .btn {{ display: block; width: 100%; padding: 12px; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer; margin-bottom: 12px; }}
    .btn-pay {{ background: #0284c7; color: white; }}
    .btn-fail {{ background: #f3f4f6; color: #ef4444; }}
    .notice {{ font-size: 12px; color: #9ca3af; margin-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <h2>Secure Checkout</h2>
    <div class="merchant">{merchant_name}</div>
    <div class="amount">₹{amount_rupees}</div>
    <div class="ref">Order Ref: {order_ref}</div>
    <form action="/mock-pay/{order_ref}/pay" method="post">
      <button type="submit" class="btn btn-pay">Pay ₹{amount_rupees}</button>
    </form>
    <form action="/mock-pay/{order_ref}/fail" method="post">
      <button type="submit" class="btn btn-fail">Simulate Failed Payment</button>
    </form>
    <div class="notice">Demo payment page. No real money moves.</div>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html)


@router.post("/mock-pay/{order_ref}/pay", response_class=HTMLResponse)
def mock_pay_action(order_ref: str, db: Session = Depends(get_db)) -> HTMLResponse:
    payment, merchant_name = _get_mock_payment(db, order_ref)
    adapter = get_payments()
    adapter.set_status(order_ref, "success")
    payment_service.verify(db, payment.tenant_id, payment.id)

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Successful</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f5f7; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }}
    .card {{ background: white; border-radius: 12px; padding: 32px 24px; max-width: 400px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: center; }}
    .icon {{ font-size: 48px; color: #10b981; margin-bottom: 16px; }}
    h2 {{ margin: 0 0 8px; color: #111827; }}
    p {{ color: #4b5563; font-size: 14px; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h2>Payment Successful</h2>
    <p>Thank you! Your payment for order <b>{order_ref}</b> has been received and verified by {merchant_name}.</p>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html)


@router.post("/mock-pay/{order_ref}/fail", response_class=HTMLResponse)
def mock_fail_action(order_ref: str, db: Session = Depends(get_db)) -> HTMLResponse:
    payment, merchant_name = _get_mock_payment(db, order_ref)
    adapter = get_payments()
    adapter.set_status(order_ref, "failed")
    payment_service.verify(db, payment.tenant_id, payment.id)

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment Failed</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f5f7; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }}
    .card {{ background: white; border-radius: 12px; padding: 32px 24px; max-width: 400px; width: 100%; box-shadow: 0 4px 12px rgba(0,0,0,0.08); text-align: center; }}
    .icon {{ font-size: 48px; color: #ef4444; margin-bottom: 16px; }}
    h2 {{ margin: 0 0 8px; color: #111827; }}
    p {{ color: #4b5563; font-size: 14px; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✕</div>
    <h2>Payment Failed</h2>
    <p>The simulated payment for <b>{order_ref}</b> was declined.</p>
  </div>
</body>
</html>"""
    return HTMLResponse(content=html)
