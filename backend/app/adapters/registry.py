"""
backend/app/adapters/registry.py
Owner: P1
Purpose: Chooses adapters from configuration.
Depends on: config, adapters.messaging (P2), adapters.payments
Used by: approval_service, payment_service, api.webhooks, tests

PROMPT:
Write only this file.

Requirements:
- get_messaging() and get_payments() return a singleton per process (functools.lru_cache),
  so the mock adapters keep their in-memory state.
- The code default is mock for both; .env.example selects whatsapp for messaging and mock
  for payments. Import whatsapp.py or paytm.py only inside the branch that selects it, so
  missing keys never break the mock path.
- reset_adapters() clears the caches; tests call it.
- An unknown provider name raises ValueError listing the valid values.

Do not:
- Instantiate real adapters at import time.

Done when: the mock adapters are returned by default, and the same instance is returned on
every call.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from functools import lru_cache

from app.adapters.payments.base import PaymentAdapter
from app.config import settings


@lru_cache
def get_payments() -> PaymentAdapter:
    provider = settings.PAYMENT_PROVIDER
    if provider == "mock":
        from app.adapters.payments.mock import MockPaymentAdapter
        return MockPaymentAdapter()
    elif provider == "paytm":
        from app.adapters.payments.paytm import PaytmPaymentAdapter
        return PaytmPaymentAdapter()
    else:
        raise ValueError(
            f"Unknown payment provider: '{provider}'. Valid options are 'mock', 'paytm'."
        )


@lru_cache
def get_messaging():
    provider = settings.MESSAGING_PROVIDER
    if provider == "mock":
        from app.adapters.messaging.mock import MockMessagingAdapter
        return MockMessagingAdapter()
    elif provider == "whatsapp":
        from app.adapters.messaging.whatsapp import WhatsAppMessagingAdapter
        return WhatsAppMessagingAdapter()
    else:
        raise ValueError(
            f"Unknown messaging provider: '{provider}'. Valid options are 'mock', 'whatsapp'."
        )


def reset_adapters() -> None:
    get_payments.cache_clear()
    get_messaging.cache_clear()
