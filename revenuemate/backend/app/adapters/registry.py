"""
backend/app/adapters/registry.py
Chooses adapters from configuration. Returns singletons via lru_cache.
"""

from __future__ import annotations

from functools import lru_cache

from app.config import settings


@lru_cache(maxsize=1)
def get_messaging():
    """Return the configured messaging adapter singleton."""
    provider = settings.MESSAGING_PROVIDER
    if provider == "mock":
        from app.adapters.messaging.mock import MockMessagingAdapter
        return MockMessagingAdapter()
    elif provider == "whatsapp":
        from app.adapters.messaging.whatsapp import WhatsAppAdapter  # type: ignore[import]
        return WhatsAppAdapter()
    else:
        raise ValueError(
            f"Unknown MESSAGING_PROVIDER: {provider!r}. Valid values: 'mock', 'whatsapp'."
        )


@lru_cache(maxsize=1)
def get_payments():
    """Return the configured payments adapter singleton."""
    provider = settings.PAYMENT_PROVIDER
    if provider == "mock":
        from app.adapters.payments.mock import MockPaymentAdapter
        return MockPaymentAdapter()
    elif provider == "paytm":
        from app.adapters.payments.paytm import PaytmAdapter  # type: ignore[import]
        return PaytmAdapter()
    else:
        raise ValueError(
            f"Unknown PAYMENT_PROVIDER: {provider!r}. Valid values: 'mock', 'paytm'."
        )


def reset_adapters() -> None:
    """Clear adapter caches. Used by tests to get fresh instances."""
    get_messaging.cache_clear()
    get_payments.cache_clear()
