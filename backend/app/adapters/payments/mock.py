"""
backend/app/adapters/payments/mock.py
Owner: P1
Purpose: Mock payment provider. Used for the demo and tests.
Depends on: adapters.payments.base, schemas.payment, config
Used by: adapters.registry, tests, scripts/simulate_timeout.py

PROMPT:
Write only this file. MockPaymentAdapter keeps orders in memory and can simulate failures.

Requirements:
- In-memory dict order_ref -> {amount_paise, status, link_url, provider_ref}. calls: list
  of (method, order_ref) for tests to count.
- mode attribute and set_mode(mode) with values: 'ok'; 'timeout_after_create' (create_link
  stores the order but returns uncertain); 'timeout_before_create' (create_link stores
  nothing and returns uncertain); 'status_timeout' (get_status returns uncertain).
- create_link in ok mode: link_url = f'{settings.PUBLIC_BASE_URL}/mock-pay/{order_ref}'
  (served by api/mock_pay.py), status created. get_status: found False when the order is
  unknown, otherwise the stored status with found True.
- set_status(order_ref, status) lets a test or the demo move an order to success, failed
  or expired.

Do not:
- Call the network.
- Define routes; api/mock_pay.py serves the link page.

Done when: the idempotency and verification tests can drive every branch through set_mode
and set_status.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Any

from app.adapters.payments.base import PaymentAdapter
from app.config import settings
from app.schemas.common import PaymentStatus
from app.schemas.payment import LinkResult, PaymentStatusResult


class MockPaymentAdapter(PaymentAdapter):
    name: str = "mock"

    def __init__(self) -> None:
        self.orders: dict[str, dict[str, Any]] = {}
        self.calls: list[tuple[str, str]] = []
        self.mode: str = "ok"

    def set_mode(self, mode: str) -> None:
        valid_modes = {"ok", "timeout_after_create", "timeout_before_create", "status_timeout"}
        if mode not in valid_modes:
            raise ValueError(f"Unknown mock mode: {mode}")
        self.mode = mode

    def set_status(self, order_ref: str, status: PaymentStatus | str) -> None:
        st = status if isinstance(status, PaymentStatus) else PaymentStatus(status)
        if order_ref in self.orders:
            self.orders[order_ref]["status"] = st

    def reset(self) -> None:
        self.orders.clear()
        self.calls.clear()
        self.mode = "ok"

    def create_link(
        self,
        order_ref: str,
        amount_paise: int,
        customer: dict[str, Any],
        idempotency_key: str,
    ) -> LinkResult:
        self.calls.append(("create_link", order_ref))

        if self.mode == "timeout_before_create":
            return LinkResult(
                link_url=None,
                provider_ref=None,
                status=PaymentStatus.uncertain,
            )

        provider_ref = f"MOCK-{order_ref}"
        link_url = f"{settings.PUBLIC_BASE_URL}/mock-pay/{order_ref}"
        self.orders[order_ref] = {
            "amount_paise": amount_paise,
            "status": PaymentStatus.created,
            "link_url": link_url,
            "provider_ref": provider_ref,
            "customer": customer,
            "idempotency_key": idempotency_key,
        }

        if self.mode == "timeout_after_create":
            return LinkResult(
                link_url=None,
                provider_ref=None,
                status=PaymentStatus.uncertain,
            )

        return LinkResult(
            link_url=link_url,
            provider_ref=provider_ref,
            status=PaymentStatus.created,
        )

    def get_status(self, order_ref: str) -> PaymentStatusResult:
        self.calls.append(("get_status", order_ref))

        if self.mode == "status_timeout":
            return PaymentStatusResult(
                status=PaymentStatus.uncertain,
                found=False,
                provider_ref=None,
                raw={},
            )

        if order_ref not in self.orders:
            return PaymentStatusResult(
                status=PaymentStatus.failed,
                found=False,
                provider_ref=None,
                raw={},
            )

        ord_data = self.orders[order_ref]
        return PaymentStatusResult(
            status=ord_data["status"],
            found=True,
            provider_ref=ord_data["provider_ref"],
            raw=ord_data,
        )
