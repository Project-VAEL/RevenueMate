"""
backend/tests/test_idempotency.py
Owner: P1
Purpose: No duplicate actions after a timeout.
Depends on: services.approval_service, services.payment_service, adapters mocks, conftest
Used by: pytest

PROMPT:
Write only this file. Use the mock adapters' calls list and set_mode to drive each case.

Requirements:
- Message timeout: messaging mock returns uncertain on send. After approve there is
  exactly one outbound Message, the lead is uncertain, one action_uncertain event exists.
  A second approve raises ConflictError and the adapter's calls list does not grow.
- Payment timeout after create: payments mock in timeout_after_create. Exactly one
  PaymentRequest, lead uncertain. verify finds the order, moves the lead to
  payment_requested, still one PaymentRequest.
- Payment timeout before create: mock in timeout_before_create. verify finds nothing,
  payment failed, lead back to sent, and a new create_link creates a second request with a
  different order_ref and key.
- Repeating create_link with the same key returns the same row.

Do not:
- Mock the services under test; only adapters may be stubbed.

Done when: all four cases pass and the provider call counts match the expectations.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
