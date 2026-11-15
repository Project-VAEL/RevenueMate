"""
backend/app/services/approval_service.py
Owner: P1
Purpose: Records owner decisions and sends only after approval.
Depends on: models, services.state_machine, services.idempotency, services.event_service,
  adapters.registry, services.errors
Used by: api.drafts, api.webhooks

PROMPT:
Write only this file. This is where the no-duplicate guarantee for messages lives.

Requirements:
- approve(db, tenant_id, draft_id, decided_by, channel, edited_text=None) -> Draft. The
  draft must be pending and its lead drafted, otherwise raise ConflictError.
- Step 1: save the Approval, set draft.status approved, transition the lead drafted ->
  approved (event draft_approved), commit.
- Step 2 (write-ahead): key = make_key('send', lead.id, draft.id). If find_message returns
  a row, return without calling the provider. Otherwise insert an outbound Message with
  status pending and that key, commit.
- Step 3: call get_messaging().send_message(lead.customer_contact, final_text, key), where
  final_text is edited_text or the draft text.
- Result sent: message sent, transition approved -> sent (event message_sent). Result
  failed: message failed, lead stays approved, record message_failed. Result uncertain:
  message uncertain, transition approved -> uncertain (event action_uncertain), and never
  resend automatically. Commit.
- dismiss(db, tenant_id, draft_id, decided_by, channel) -> Draft: draft must be pending;
  save the Approval with decision dismissed, draft dismissed, transition drafted ->
  dismissed (event draft_dismissed), commit.
- Known limitation to keep in the docstring: an uncertain message is resolved by the owner
  checking manually; there is no automatic message reconciliation.

Do not:
- Retry a send.
- Call the AI layer.
- Send before the Approval and the pending Message are committed.

Done when: the idempotency tests pass: a simulated timeout leaves exactly one Message, an
uncertain lead, and zero extra provider calls on a second approve.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
