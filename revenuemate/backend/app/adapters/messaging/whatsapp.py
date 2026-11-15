"""
backend/app/adapters/messaging/whatsapp.py
Owner: P2
Purpose: Real WhatsApp implementation (required for the demo).
Depends on: adapters.messaging.base, schemas.message, config
Used by: adapters.registry (when MESSAGING_PROVIDER=whatsapp)

PROMPT:
Write only this file.

Requirements:
- Implement MessagingAdapter against the WhatsApp Cloud API. This file is REQUIRED for the
  demo. Before writing code, open Meta's current WhatsApp Cloud API docs for sending
  messages and for webhook payloads; do not guess endpoint versions, field names or
  payload shapes.
- Settings: WHATSAPP_TOKEN (bearer token) and WHATSAPP_PHONE_NUMBER_ID from config. Use
  httpx with a 10 second timeout. Never log the token.
- send_message(to, text, idempotency_key): send a plain text message. The API call itself
  is not assumed to be idempotent; duplicates are prevented by approval_service's
  write-ahead check.
- send_owner_prompt(owner_contact, draft_id, text): send an interactive message with two
  reply buttons whose ids are 'approve:<draft_id>' and 'dismiss:<draft_id>'. Editing
  happens on the dashboard.
- parse_inbound(payload) -> InboundMessage | None: handle text messages, and interactive
  button replies by converting the button id to text 'approve <draft_id>' or 'dismiss
  <draft_id>'. Include the sender's number and profile name when present. Return None for
  delivery receipts, read receipts and any other non-message event.
- Result mapping: success -> SendResult sent with the provider message id. Timeout or
  network error -> status uncertain, no retry. A definite API rejection (recipient not in
  the allowed list, outside the 24-hour window, invalid number) -> status failed with the
  provider's error text in error.
- Free-form sends work only inside the customer's 24-hour window; do not implement
  templates in this build.

Do not:
- Retry a send internally.
- Log or return the access token or any message body outside the result objects.
- Create leads or touch the database; the webhook route does that.

Done when: a text sent to an allowed number arrives, a customer message parses into an
InboundMessage, a delivery receipt parses to None, and a timeout returns uncertain.

Context to paste first: README.md ground rules, docs/statuses-and-events.md,
docs/api-contract.md, docs/P1_CONTEXT.md (provider decision and WhatsApp constraints).
"""
