"""
backend/app/schemas/lead.py
Owner: P1
Purpose: Lead models and parser and scorer result types.
Depends on: schemas.common, schemas.catalogue, schemas.draft, schemas.payment
Used by: lead_service, ai (P2), api.leads

PROMPT:
Write only this file. Pydantic v2. Use ConfigDict(from_attributes=True) on every response
model. Money fields are integer paise.

Requirements:
- LeadCreate: customer_name str, customer_contact str, raw_text str with min_length=1.
- LeadOut: id, customer_name, customer_contact, raw_text, product_id, quantity, status
  (LeadStatus), priority_score, priority_reasons list[str], rule_version, intent, urgency,
  created_at.
- LeadDetail(LeadOut): product ProductOut | None, latest_draft DraftOut | None,
  latest_payment PaymentOut | None.
- ParsedEnquiry (dataclass): product_id str | None, quantity int | None, intent str,
  urgency str, confidence float.
- Score (dataclass): value int, reasons list[str], rule_version str.

Do not:
- Change the ParsedEnquiry or Score field names; P2 builds against them.

Done when: LeadDetail serialises a lead with no draft and no payment as nulls.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
