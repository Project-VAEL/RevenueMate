"""
backend/app/services/approval_service.py
Owner: P1
Purpose: Records owner decisions and sends only after approval.
Depends on: models, services.state_machine, services.idempotency, services.event_service,
  adapters.registry, services.errors
Used by: api.drafts, api.webhooks

Known limitation:
An uncertain message is resolved by the owner checking manually; there is no automatic
message reconciliation.

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

Do not:
- Retry a send.
- Call the AI layer.
- Send before the Approval and the pending Message are committed.

Done when: the idempotency tests pass: a simulated timeout leaves exactly one Message, an
uncertain lead, and zero extra provider calls on a second approve.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Optional

from sqlalchemy.orm import Session

from app.adapters.registry import get_messaging
from app.models.approval import Approval
from app.models.draft import Draft
from app.models.lead import Lead
from app.models.message import Message
from app.schemas.common import DraftStatus, EventType, LeadStatus
from app.services.errors import ConflictError, NotFoundError
from app.services.event_service import record_event
from app.services.idempotency import find_message, make_key
from app.services.state_machine import transition


def approve(
    db: Session,
    tenant_id: str,
    draft_id: str,
    decided_by: str,
    channel: str,
    edited_text: Optional[str] = None,
) -> Draft:
    draft = db.get(Draft, draft_id)
    if not draft or draft.tenant_id != tenant_id:
        raise NotFoundError(f"Draft '{draft_id}' not found.")

    lead = db.get(Lead, draft.lead_id)
    if not lead or lead.tenant_id != tenant_id:
        raise NotFoundError(f"Lead '{draft.lead_id}' not found.")

    if draft.status != DraftStatus.pending.value:
        raise ConflictError(f"Draft is not pending (status='{draft.status}').")

    if lead.status != LeadStatus.drafted.value:
        raise ConflictError(f"Lead is not in drafted status (status='{lead.status}').")

    # Step 1: Save Approval, mark draft approved, transition lead drafted -> approved
    approval = Approval(
        tenant_id=tenant_id,
        draft_id=draft.id,
        decision="approved",
        decided_by=decided_by,
        channel=channel,
        edited_text=edited_text,
    )
    db.add(approval)
    draft.status = DraftStatus.approved.value

    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.approved,
        event_type=EventType.draft_approved,
        reason=f"Draft approved by {decided_by} via {channel}",
        payload={"draft_id": draft.id, "edited": bool(edited_text)},
    )
    db.commit()
    db.refresh(draft)
    db.refresh(lead)

    # Step 2: Write-ahead idempotency check & pending Message creation
    key = make_key("send", lead.id, draft.id)
    existing_msg = find_message(db, key)
    if existing_msg:
        # Already initiated or sent
        return draft

    final_text = edited_text if edited_text is not None else draft.text
    outbound_msg = Message(
        tenant_id=tenant_id,
        lead_id=lead.id,
        direction="outbound",
        recipient=lead.customer_contact,
        text=final_text,
        status="pending",
        idempotency_key=key,
    )
    db.add(outbound_msg)
    db.commit()
    db.refresh(outbound_msg)

    # Step 3: Call messaging adapter
    adapter = get_messaging()
    result = adapter.send_message(lead.customer_contact, final_text, key)

    if result.status == "sent":
        outbound_msg.status = "sent"
        outbound_msg.provider_message_id = result.provider_message_id
        transition(
            db=db,
            lead=lead,
            new_status=LeadStatus.sent,
            event_type=EventType.message_sent,
            reason="Approved draft message sent to customer",
            payload={"message_id": outbound_msg.id},
        )
    elif result.status == "failed":
        outbound_msg.status = "failed"
        record_event(
            db=db,
            tenant_id=tenant_id,
            type="message_failed",
            reason=f"Failed to send approved message: {result.error}",
            lead_id=lead.id,
            payload={"error": result.error},
        )
    elif result.status == "uncertain":
        outbound_msg.status = "uncertain"
        transition(
            db=db,
            lead=lead,
            new_status=LeadStatus.uncertain,
            event_type="action_uncertain",
            reason="Messaging timeout: delivery uncertain",
            payload={"key": key},
        )

    db.commit()
    db.refresh(draft)
    return draft


def dismiss(
    db: Session,
    tenant_id: str,
    draft_id: str,
    decided_by: str,
    channel: str,
) -> Draft:
    draft = db.get(Draft, draft_id)
    if not draft or draft.tenant_id != tenant_id:
        raise NotFoundError(f"Draft '{draft_id}' not found.")

    lead = db.get(Lead, draft.lead_id)
    if not lead or lead.tenant_id != tenant_id:
        raise NotFoundError(f"Lead '{draft.lead_id}' not found.")

    if draft.status != DraftStatus.pending.value:
        raise ConflictError(f"Draft is not pending (status='{draft.status}').")

    approval = Approval(
        tenant_id=tenant_id,
        draft_id=draft.id,
        decision="dismissed",
        decided_by=decided_by,
        channel=channel,
    )
    db.add(approval)
    draft.status = DraftStatus.dismissed.value

    transition(
        db=db,
        lead=lead,
        new_status=LeadStatus.dismissed,
        event_type=EventType.draft_dismissed,
        reason=f"Draft dismissed by {decided_by} via {channel}",
        payload={"draft_id": draft.id},
    )
    db.commit()
    db.refresh(draft)
    return draft
