"""
backend/app/services/errors.py
Shared exception types for services and routers.
"""


class NotFoundError(Exception):
    """Raised when a requested row or tenant does not exist."""


class IllegalTransition(Exception):
    """Raised when a lead status change is not allowed by the transition table."""


class ConflictError(Exception):
    """
    Raised when the request is valid but the current state forbids it.
    Examples: approving a draft that is not pending, re-sending after uncertain result.
    """


class ProviderUnavailable(Exception):
    """Raised when an external provider (LLM, payment, messaging) could not be reached."""
