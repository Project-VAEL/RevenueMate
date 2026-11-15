"""
backend/tests/test_payment_verification.py
Owner: P1
Purpose: Paid only after verified success.
Depends on: services.payment_service, api.mock_pay, adapters.payments.mock, conftest
Used by: pytest

PROMPT:
Write only this file.

Requirements:
- After create_link the lead is payment_requested and not paid.
- A GET of /mock-pay/{order_ref} (only viewing the page) changes nothing; the lead is not
  paid.
- A POST to /mock-pay/{order_ref}/pay sets the mock status and runs verify; afterwards the
  lead is paid with exactly one payment_verified event.
- After mock.set_status(order_ref, 'success'), verify marks the payment success, moves the
  lead to paid and records exactly one payment_verified event.
- Calling verify again changes nothing and records no second event.
- A failed status records payment_failed and leaves the lead payment_requested.

Do not:
- Call the real Paytm adapter.

Done when: the file passes, and fails if anything other than verify can mark a payment
success.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
