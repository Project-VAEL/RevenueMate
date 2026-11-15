"""
backend/app/adapters/payments/base.py
Owner: P1
Purpose: Payment provider interface.
Depends on: schemas.payment
Used by: adapters.registry, mock, paytm, payment_service

PROMPT:
Write only this file. Abstract base class PaymentAdapter.

Requirements:
- name: str class attribute naming the provider ('mock' or 'paytm').
- create_link(self, order_ref: str, amount_paise: int, customer: dict, idempotency_key:
  str) -> LinkResult.
- get_status(self, order_ref: str) -> PaymentStatusResult.
- Docstring contract: implementations catch timeouts and network errors and return status
  uncertain; they never raise for those. They never retry internally.

Do not:
- Add methods beyond the two listed.
- Import any provider SDK.

Done when: a subclass missing either method cannot be instantiated.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from abc import ABC, abstractmethod
from typing import Any

from app.schemas.payment import LinkResult, PaymentStatusResult


class PaymentAdapter(ABC):
    """Abstract base class for payment adapters.

    Implementations catch timeouts and network errors and return status uncertain;
    they never raise for those. They never retry internally.
    """
    name: str

    @abstractmethod
    def create_link(
        self,
        order_ref: str,
        amount_paise: int,
        customer: dict[str, Any],
        idempotency_key: str,
    ) -> LinkResult:
        """Create a payment link for the given order reference and amount."""
        pass

    @abstractmethod
    def get_status(self, order_ref: str) -> PaymentStatusResult:
        """Query the current provider status for an order reference."""
        pass
