Create a new file at:
f:\Shreyash DOC\shreyash\Agent\Workspace\revenuemate\docs\FRONTEND_ENDPOINTS.md

Write exactly this content:

---

# Frontend Endpoint Reference — RevenueMate

Base URL: `http://localhost:8000` (dev) / `PUBLIC_BASE_URL` (demo tunnel)
Auth: every request needs `Authorization: Bearer <token>` except `/health` and webhooks.
Money: always integer paise. Divide by 100 to display as rupees.

---

## Merchant Dashboard — Lead & Sales Feed

| What the UI does | Method | Endpoint |
|---|---|---|
| Show all incoming leads | `GET` | `/leads` |
| Open a lead detail view | `GET` | `/leads/{id}` |
| Manually create a lead | `POST` | `/leads` |
| Generate AI draft for a lead | `POST` | `/leads/{id}/draft` |
| Approve a draft and send it | `POST` | `/drafts/{id}/approve` |
| Dismiss a draft | `POST` | `/drafts/{id}/dismiss` |
| Show audit timeline for a lead | `GET` | `/events?lead_id={id}` |

---

## Order Management

| What the UI does | Method | Endpoint |
|---|---|---|
| Create a new order from a lead | `POST` | `/orders` |
| List all orders | `GET` | `/orders` |
| Open an order detail view | `GET` | `/orders/{id}` |
| Request a reservation (merchant action) | `POST` | `/orders/{id}/request-reservation` |
| Approve reservation + allocate stock | `POST` | `/orders/{id}/approve-reservation` |
| Reject reservation | `POST` | `/orders/{id}/reject-reservation` |
| Cancel order and release stock | `POST` | `/orders/{id}/cancel` |
| Generate payment link for order | `POST` | `/orders/{id}/payment-link` |
| Confirm pickup handover | `POST` | `/orders/{id}/complete-pickup` |
| Record delivery dispatch | `POST` | `/orders/{id}/dispatch` |
| Confirm delivery complete | `POST` | `/orders/{id}/complete-delivery` |
| Show audit timeline for an order | `GET` | `/events?order_id={id}` |

---

## Receptionist View (restricted — lookup + fulfil only)

| What the UI does | Method | Endpoint |
|---|---|---|
| Look up a reservation by code | `GET` | `/reservations/lookup/{reservation_code}` |
| Mark item ready for pickup | `POST` | `/reservations/{id}/ready-for-pickup` |

> Receptionist cannot see leads, conversations, or full customer data.
> Only reservation lookup and fulfil actions are permitted.

---

## Catalogue & Stock Management

| What the UI does | Method | Endpoint |
|---|---|---|
| List all products with stock | `GET` | `/catalogue/products` |
| Update stock for a product | `PUT` | `/catalogue/products/{id}/stock` |

---

## Payments

| What the UI does | Method | Endpoint |
|---|---|---|
| View a payment record | `GET` | `/payments/{id}` |
| Manually reconcile payment status | `POST` | `/payments/{id}/verify` |
| Mock payment page (demo only) | `GET` | `/mock-pay/{order_ref}` |
| Simulate successful payment (demo only) | `POST` | `/mock-pay/{order_ref}/pay` |
| Simulate failed payment (demo only) | `POST` | `/mock-pay/{order_ref}/fail` |

---

## Conversational Product Discovery (P2 — v5)

| What the UI does | Method | Endpoint |
|---|---|---|
| Start or resume a customer conversation | `POST` | `/conversations` |
| Send a buyer message, get AI response | `POST` | `/conversations/{id}/messages` |
| Search reference product catalogue | `GET` | `/products/reference/search` |
| Get exact model facts + provenance | `GET` | `/products/reference/{product_id}` |
| Get component-level details for a model | `GET` | `/products/reference/{product_id}/components` |
| Compare models against buyer criteria | `POST` | `/products/compare` |
| Search merchant's own offers + stock | `GET` | `/products/merchant/search` |

> These are P2 endpoints — owned by the AI/messaging team.
> The frontend calls them but does not implement them.

---

## System

| What the UI does | Method | Endpoint |
|---|---|---|
| Health check / connection test | `GET` | `/health` |

---

## Screen → endpoint map

Use this table when wiring up each frontend page.

| Screen | Endpoints needed |
|---|---|
| **Lead feed** | `GET /leads`, `GET /leads/{id}`, `POST /leads/{id}/draft`, `POST /drafts/{id}/approve`, `POST /drafts/{id}/dismiss` |
| **Order detail** | `GET /orders/{id}`, `POST /orders/{id}/approve-reservation`, `POST /orders/{id}/payment-link`, `POST /orders/{id}/complete-pickup`, `GET /events?order_id=` |
| **Orders list** | `GET /orders`, `POST /orders` |
| **Receptionist lookup** | `GET /reservations/lookup/{code}`, `POST /reservations/{id}/ready-for-pickup` |
| **Catalogue / stock** | `GET /catalogue/products`, `PUT /catalogue/products/{id}/stock` |
| **Payment status** | `GET /payments/{id}`, `POST /payments/{id}/verify` |
| **Demo mock pay** | `GET /mock-pay/{order_ref}`, `POST /mock-pay/{order_ref}/pay`, `POST /mock-pay/{order_ref}/fail` |
| **Product discovery chat** | `POST /conversations`, `POST /conversations/{id}/messages`, `GET /products/reference/search`, `POST /products/compare`, `GET /products/merchant/search` |

---

## Error codes

| Code | Meaning |
|---|---|
| `404` | Record not found |
| `403` | Forbidden / invalid webhook signature |
| `409` | Illegal transition, insufficient stock, or stale reservation |
| `422` | Validation error (wrong types, missing fields) |
| `503` | Provider (WhatsApp / Paytm) unavailable |

---

## Notes for P3

- All amounts returned from the API are **integer paise**. Display as `₹{amount/100}`.
- `reservation_code` is a random non-sequential string — treat it as opaque.
- `complete-pickup` is a two-step action: call the endpoint once to validate, confirm in the UI, then call again to commit. Do not complete on first call.
- Payment status is independent from order status and fulfillment status — read all three separately.
- Reference products (`/products/reference/...`) must be labeled "not confirmed in this shop" in the UI unless a matching merchant offer exists.

Total endpoints: 37
Source of truth: `docs/api-contract.md`
