"""
backend/app/services/idempotency.py
Owner: P1
Purpose: Idempotency keys and duplicate lookup.
Depends on: models.message, models.payment_request
Used by: approval_service, payment_service

PROMPT:
Write only this file. Keys make a repeated action return the earlier result instead of
creating a duplicate.

Requirements:
- make_key(kind: str, *parts) -> str returns f'{kind}:' joined with ':' by str(part),
  deterministic and readable. Kinds: 'send' (draft message), 'paylink' (payment link),
  'sendlink' (message carrying the link).
- find_message(db, key) -> Message | None and find_payment(db, key) -> PaymentRequest |
  None.
- Document the write-ahead rule in the module docstring: insert the pending row with its
  key and commit it before calling any provider.

Do not:
- Use random or time-based keys.
- Call any provider.

Done when: calling make_key twice with the same arguments returns the same string, and
find_* returns the stored row.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
