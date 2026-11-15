"""
backend/app/adapters/payments/paytm.py
Owner: P1
Purpose: Paytm staging implementation.
Depends on: adapters.payments.base, schemas.payment, config
Used by: adapters.registry (only when PAYMENT_PROVIDER=paytm)

PROMPT:
Do NOT generate this file at the event: the on-site build uses the mock payment provider
by design. Keep this header as the post-event prompt. When it is built later, implement
PaymentAdapter for Paytm staging.

Requirements:
- Before writing any code, open Paytm's current developer docs for the Payment Links
  create-link and fetch-link APIs and the transaction status API. Do not guess endpoints,
  field names, result codes or the checksum method.
- Base URL chosen from settings.PAYTM_ENV. Credentials from settings.PAYTM_MID and
  settings.PAYTM_MERCHANT_KEY.
- Request signing lives in one private function. Amounts convert from paise to the
  provider's format in one private function only.
- Use httpx with a 10 second timeout. Timeouts and network errors return status uncertain.
- One table maps Paytm result codes to PaymentStatus. get_status returns found False when
  Paytm reports the order does not exist.

Do not:
- Log, print or return the merchant key.
- Retry internally.
- Treat a redirect or callback as proof of payment.

Done when: post-event: against staging credentials a link can be created and its status
read, and a timeout returns uncertain.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
