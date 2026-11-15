# API contract — revised v4

No path prefix. Bodies are Pydantic schemas in `backend/app/schemas/`. Money is integer paise. Every endpoint must enforce tenant scoping and role permissions.

## Existing endpoints
| Method and path | Purpose |
|---|---|
| `GET /health` | Liveness |
| `GET /leads` | List leads |
| `POST /leads` | Create a manual lead |
| `GET /leads/{id}` | Lead detail |
| `POST /leads/{id}/draft` | Generate response draft |
| `POST /drafts/{id}/approve` | Approve/edit and send |
| `POST /drafts/{id}/dismiss` | Dismiss draft |
| `GET /catalogue/products` | Catalogue and stock |
| `PUT /catalogue/products/{id}/stock` | Update stock |
| `GET /events?lead_id=&order_id=` | Audit timeline |
| `GET /webhooks/whatsapp` | Meta verification |
| `POST /webhooks/whatsapp` | WhatsApp inbound webhook |
| `GET /payments/{id}` | Payment record |
| `POST /payments/{id}/verify` | Provider status reconciliation |
| `GET /mock-pay/{order_ref}` | Mock payment page |
| `POST /mock-pay/{order_ref}/pay` | Simulate payment then verify |
| `POST /mock-pay/{order_ref}/fail` | Simulate failure then verify |

## New order and reservation endpoints
| Method and path | Purpose |
|---|---|
| `POST /orders` | Create draft order from a lead and selected products |
| `GET /orders` | List/filter tenant orders |
| `GET /orders/{id}` | Order detail |
| `POST /orders/{id}/request-reservation` | Request merchant-approved reservation |
| `POST /orders/{id}/approve-reservation` | Merchant approves; atomically reserve stock |
| `POST /orders/{id}/reject-reservation` | Merchant rejects reservation |
| `POST /orders/{id}/cancel` | Cancel order and release reservation if active |
| `GET /reservations/lookup/{reservation_code}` | Receptionist lookup; minimal fields only |
| `POST /reservations/{id}/ready-for-pickup` | Mark product prepared |
| `POST /orders/{id}/payment-link` | Create payment link for exact order amount |
| `POST /orders/{id}/complete-pickup` | Confirm handover; requires policy checks |
| `POST /orders/{id}/dispatch` | Record delivery dispatch |
| `POST /orders/{id}/complete-delivery` | Confirm delivery |

## Security and correctness
- Lookup codes must be random/non-sequential and rate-limited. Consider an additional buyer phone/OTP check for sensitive actions.
- Receptionist role can lookup and fulfil orders but cannot browse all leads or customer conversations.
- Payment success comes only from verified provider webhook/status check.
- Payment amount and currency must match the order.
- Handover is blocked until the configured payment policy is satisfied.
- Every mutation is tenant-scoped, permission-checked, idempotent where appropriate, and audited.
- `complete-pickup` must be a two-step confirmation: validate then commit handover. Do not complete merely because the record was viewed.

## Errors
`404` not found; `403` forbidden/invalid webhook signature; `409` illegal transition, insufficient stock or stale reservation; `422` validation; `503` provider unavailable.


## Product intelligence and conversational commerce endpoints (v5 proposal)
| Method and path | Purpose |
|---|---|
| `POST /conversations` | Start or resume a tenant-scoped customer conversation |
| `POST /conversations/{id}/messages` | Process buyer message, update confirmed preference profile and return conversational response |
| `GET /products/reference/search` | Search reference laptop models; response must label them reference-only |
| `GET /products/reference/{product_id}` | Read exact manufacturer-sourced model facts and provenance |
| `GET /products/reference/{product_id}/components` | Return linked component-level details |
| `POST /products/compare` | Compare exact model variants against buyer criteria with per-field source IDs |
| `GET /products/merchant/search` | Search tenant-specific offers and stock only |

Do not return a reference-only product as an available merchant offer. A merchant offer is a separate object requiring merchant_id, exact variant ID, approved store price, physical stock count, timestamp and active status.
