"""
backend/app/services/errors.py
Owner: P1
Purpose: Shared exception types for services and routers.
Depends on: none
Used by: services, api, main.py

PROMPT:
Write only this file. Plain exception classes, each with a docstring saying when to raise
it.

Requirements:
- NotFoundError: a row or tenant does not exist.
- IllegalTransition: a lead status change is not allowed by the transition table.
- ConflictError: the request is valid but the current state forbids it (for example
  approving a draft that is not pending, or re-sending after an uncertain result).
- ProviderUnavailable: an external provider could not be reached for a read-only check.

Do not:
- Import FastAPI or SQLAlchemy.
- Add exception types that nothing uses.

Done when: all four classes import with no side effects.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""


class NotFoundError(Exception):
    """Raised when a requested resource, row, or tenant does not exist."""
    pass


class IllegalTransition(Exception):
    """Raised when an entity status transition is forbidden by the state machine."""
    pass


class ConflictError(Exception):
    """Raised when the request conflicts with current entity state or business rules."""
    pass


class ProviderUnavailable(Exception):
    """Raised when an external third-party provider cannot be reached."""
    pass
