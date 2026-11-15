"""
backend/app/services/idempotency.py
Owner: P1
Purpose: Idempotency keys and duplicate lookup.
Depends on: models.message, models.payment_request
Used by: approval_service, payment_service

Write-Ahead Rule:
Always insert the pending row (Message or PaymentRequest) with its deterministic
idempotency key and commit/flush it before calling any external provider.
If the provider call times out, the pending row remains with status 'uncertain',
preventing duplicate provider requests upon retry.

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

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.message import Message
from app.models.payment_request import PaymentRequest


def make_key(kind: str, *parts: object) -> str:
    elements = [kind] + [str(p) for p in parts]
    return ":".join(elements)


def find_message(db: Session, key: str) -> Optional[Message]:
    stmt = select(Message).where(Message.idempotency_key == key)
    return db.scalars(stmt).first()


def find_payment(db: Session, key: str) -> Optional[PaymentRequest]:
    stmt = select(PaymentRequest).where(PaymentRequest.idempotency_key == key)
    return db.scalars(stmt).first()
