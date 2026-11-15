"""
backend/app/seed/seed.py
Owner: P1
Purpose: Loads the demo merchant and sample data.
Depends on: db, models, config, services.lead_service, seed/catalogue.json,
  seed/enquiries.json
Used by: Makefile (make seed)

PROMPT:
Write only this file. Run with python -m app.seed.seed [--leads] from backend/. Safe to
run twice.

Requirements:
- Call db.create_all(). Upsert the demo Tenant with id settings.DEMO_TENANT_ID, name 'Demo
  Merchant', owner_contact settings.OWNER_CONTACT.
- Read catalogue.json; ignore keys that start with an underscore. Upsert each product by
  (tenant_id, sku). Insert an initial stock snapshot (quantity, as_of now) only when the
  product has none.
- With --leads, read enquiries.json and create a lead for each case through
  lead_service.create_lead using customer_name 'Sample Customer N'. Skip when leads
  already exist.
- Print a short summary: tenants, products, snapshots and leads created or skipped.

Do not:
- Hard-code products; they come from catalogue.json.
- Delete existing data.

Done when: running it twice leaves the same row counts and the dashboard shows the
catalogue.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
