"""
backend/tests/test_state_machine.py
Owner: P1
Purpose: State machine tests.
Depends on: services.state_machine, schemas.common, conftest
Used by: pytest

PROMPT:
Write only this file.

Requirements:
- Parametrize every legal (from, to) pair from TRANSITIONS: the move succeeds and exactly
  one event is recorded.
- At least six illegal moves raise IllegalTransition, for example new -> paid, new ->
  sent, drafted -> paid, sent -> approved, paid -> new, dismissed -> drafted.
- Moving to uncertain stores status_before_uncertain; leaving uncertain to an unrelated
  status raises; leaving to the stored status or the status it would have produced
  succeeds and clears the field.
- Self-transition new -> new raises; drafted -> drafted is allowed.

Do not:
- Test anything that is not in the transition table.

Done when: the file passes with pytest -q and fails if a transition in the table is
removed.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
