"""
scripts/simulate_timeout.py
Owner: P1
Purpose: Demonstrates the no-duplicate guarantee for the demo.
Depends on: app.db, app.services, app.adapters.registry, app.seed.seed
Used by: P1 and P3 during the demo

PROMPT:
Write only this file. Run from backend/ with python ../scripts/simulate_timeout.py; it
uses the service layer directly, not HTTP.

Requirements:
- Seed if needed, create a lead in status sent with a product, then set the payments mock
  to timeout_after_create.
- Call create_link twice; print a table with columns step, lead status, payment requests,
  provider create calls.
- Call verify; print the table again showing the lead moved from uncertain to
  payment_requested with still one payment request.
- Exit with a nonzero code if more than one payment request exists.

Do not:
- Change application code or settings files.

Done when: the printed table shows one payment request and one provider create call after
two attempts.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
