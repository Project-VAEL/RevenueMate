"""
backend/app/api/webhooks.py
Owner: P1
Purpose: Inbound WhatsApp webhook.
Depends on: services.lead_service, services.approval_service, adapters.registry, config,
  deps
Used by: api.router

PROMPT:
Write only this file. Webhook bodies are untrusted input.

Requirements:
- GET /webhooks/whatsapp (Meta's verification handshake): when query parameter hub.mode is
  'subscribe' and hub.verify_token equals settings.WHATSAPP_VERIFY_TOKEN, return
  hub.challenge as plain text with status 200; otherwise 403. The path has no trailing
  slash.
- POST /webhooks/whatsapp: read the raw body and verify the X-Hub-Signature-256 header as
  an HMAC-SHA256 of the raw body keyed with settings.WHATSAPP_APP_SECRET, using a
  constant-time comparison. Reject with 403 when it does not match. Then pass the parsed
  JSON to get_messaging().parse_inbound.
- parse_inbound returns None for events that are not customer or owner messages (delivery
  receipts and other status updates). For those return {'ok': True} and do nothing. Always
  answer valid requests quickly with 200.
- A customer message creates a lead through lead_service.create_lead with customer_contact
  set to the sender and customer_name set to the sender's profile name when present,
  otherwise the number. Return {'ok': True, 'lead_id': ...}.
- Owner commands: when the sender equals the tenant's owner_contact and the text is
  'approve <draft_id>' or 'dismiss <draft_id>' (the owner's button replies arrive in this
  form), call approval_service.approve or dismiss with channel whatsapp instead of
  creating a lead.
- There is no payment webhook in this build; payments are mocked.

Do not:
- Put business logic here; it belongs in services/.
- Process a POST whose signature failed verification.

Done when: an unsigned or wrongly signed POST gets 403, and a correctly signed customer
message creates exactly one lead.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

import hashlib
import hmac
import json
from typing import Any, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session

from app.adapters.registry import get_messaging
from app.config import settings
from app.deps import get_db, get_tenant
from app.models.tenant import Tenant
from app.services import approval_service, lead_service

router = APIRouter(tags=["webhooks"])


@router.get("/webhooks/whatsapp")
def verify_whatsapp_webhook(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
) -> PlainTextResponse:
    if hub_mode == "subscribe" and hub_verify_token == settings.WHATSAPP_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge or "", status_code=200)
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Verification failed.")


@router.post("/webhooks/whatsapp")
async def inbound_whatsapp_webhook(
    request: Request,
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256"),
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(get_tenant),
) -> dict[str, Any]:
    raw_body = await request.body()

    # Verify signature if secret configured or signature provided
    if settings.WHATSAPP_APP_SECRET:
        if not x_hub_signature_256 or not x_hub_signature_256.startswith("sha256="):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Missing or invalid signature header."
            )
        expected_sig = "sha256=" + hmac.new(
            settings.WHATSAPP_APP_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(expected_sig, x_hub_signature_256):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Signature verification failed."
            )

    try:
        payload = json.loads(raw_body.decode("utf-8")) if raw_body else {}
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body.")

    adapter = get_messaging()
    inbound = adapter.parse_inbound(payload)
    if not inbound:
        return {"ok": True}

    # Check if owner command
    sender = inbound.sender
    text = inbound.text.strip()
    is_owner = tenant.owner_contact and sender == tenant.owner_contact

    if is_owner and text.lower().startswith(("approve ", "dismiss ")):
        parts = text.split(maxsplit=1)
        cmd, target_id = parts[0].lower(), parts[1].strip()
        if cmd == "approve":
            approval_service.approve(
                db=db,
                tenant_id=tenant.id,
                draft_id=target_id,
                decided_by="owner",
                channel="whatsapp",
            )
            return {"ok": True, "action": "approved", "draft_id": target_id}
        elif cmd == "dismiss":
            approval_service.dismiss(
                db=db,
                tenant_id=tenant.id,
                draft_id=target_id,
                decided_by="owner",
                channel="whatsapp",
            )
            return {"ok": True, "action": "dismissed", "draft_id": target_id}

    # Customer message creates lead
    lead = lead_service.create_lead(
        db=db,
        tenant_id=tenant.id,
        customer_name=sender,
        customer_contact=sender,
        raw_text=text,
    )
    return {"ok": True, "lead_id": lead.id}
