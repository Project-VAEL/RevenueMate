"""
backend/app/services/payment_service.py
Owner: P1
Purpose: Payment link creation and verification.
Depends on: models, services.state_machine, services.idempotency, services.event_service,
  adapters.registry, schemas.payment, services.errors
Used by: api.leads, api.payments, api.webhooks

PROMPT:
Write only this file. This is where the no-duplicate and verified-only guarantees for
payments live.

Requirements:
- create_link(db, tenant_id, lead_id, amount_paise=None) -> PaymentRequest. The lead
  status must be sent or payment_requested, otherwise ConflictError. Amount defaults to
  product.price_paise times (quantity or 1); raise ConflictError when there is no product.
- n = number of existing payment requests for the lead plus 1; order_ref =
  f'RM-{lead.id[:8]}-{n}'; key = make_key('paylink', lead.id, n). Return the existing row
  if the key exists.
- Write-ahead: insert PaymentRequest status created with the key, commit, then call
  get_payments().create_link(order_ref, amount_paise, customer, key).
- Result created: store link_url and provider_ref, record payment_link_created, then send
  the link to the customer through get_messaging() with key make_key('sendlink',
  payment.id) using the same write-ahead Message pattern. When sent, set payment sent and
  transition the lead sent -> payment_requested (or payment_requested -> payment_requested
  for a new link).
- Any uncertain result (link creation or sending) sets the PaymentRequest to uncertain,
  and the Message too when sending was the uncertain step. It transitions the lead to
  uncertain with action_uncertain, commits, and stops. Never retry.
- verify(db, tenant_id, payment_id) -> PaymentRequest: call
  get_payments().get_status(order_ref). Save last_status_raw.
- found False on an uncertain payment: the provider never saw the order. Set payment
  failed, record payment_failed, move the lead back to its stored previous status, so a
  new link can be requested.
- found True on an uncertain payment: set the payment to the reported status, move the
  lead out of uncertain to payment_requested, then continue with the status rules below.
- status success: set payment success, transition the lead payment_requested -> paid
  (event payment_verified). Verifying a payment that is already success changes nothing
  and writes no second event.
- status failed or expired: update the payment, record payment_failed, leave the lead
  payment_requested. status pending: unchanged. status uncertain from the provider: raise
  ProviderUnavailable and change nothing.
- Only verify may mark a payment success or a lead paid.

Do not:
- Mark anything paid from a redirect, callback body or request parameter.
- Log or return any secret.
- Convert amounts to rupees; adapters do that.

Done when: the payment tests pass: not paid until a verified success, one payment request
per timeout, and a reconcile that recovers from both timeout cases.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.adapters.registry import get_messaging, get_payments
from app.models.lead import Lead
from app.models.message import Message
from app.models.payment_request import PaymentRequest
from app.models.product import Product
from app.schemas.common import EventType, LeadStatus, PaymentStatus
from app.services.errors import ConflictError, NotFoundError, ProviderUnavailable
from app.services.event_service import record_event
from app.services.idempotency import find_message, find_payment, make_key
from app.services.state_machine import transition


def create_link(
    db: Session,
    tenant_id: str,
    lead_id: str,
    amount_paise: Optional[int] = None,
    order_id: Optional[str] = None,
) -> PaymentRequest:
    lead = db.get(Lead, lead_id)
    if not lead or lead.tenant_id != tenant_id:
        raise NotFoundError(f"Lead '{lead_id}' not found.")

    if lead.status not in (LeadStatus.sent.value, LeadStatus.payment_requested.value):
        raise ConflictError(
            f"Cannot create payment link for lead in status '{lead.status}'. Expected 'sent' or 'payment_requested'."
        )

    if amount_paise is None:
        if not lead.product_id:
            raise ConflictError("Cannot determine amount: lead has no associated product.")
        product = db.get(Product, lead.product_id)
        if not product or product.tenant_id != tenant_id:
            raise NotFoundError(f"Product '{lead.product_id}' not found.")
        qty = lead.quantity or 1
        amount_paise = product.price_paise * qty

    # Count existing payment requests for this lead
    stmt_count = select(func.count(PaymentRequest.id)).where(
        PaymentRequest.tenant_id == tenant_id,
        PaymentRequest.lead_id == lead_id,
    )
    count = db.scalar(stmt_count) or 0
    n = count + 1

    order_ref = f"RM-{lead.id[:8]}-{n}"
    key = make_key("paylink", lead.id, n)

    existing = find_payment(db, key)
    if existing:
        return existing

    # Write-ahead: insert PaymentRequest status created with key, commit before external call
    payment = PaymentRequest(
        tenant_id=tenant_id,
        lead_id=lead_id,
        order_id=order_id,
        amount_paise=amount_paise,
        order_ref=order_ref,
        provider="mock",
        status=PaymentStatus.created.value,
        idempotency_key=key,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    customer_info = {
        "name": lead.customer_name or "",
        "contact": lead.customer_contact,
    }

    # Call payment adapter
    adapter = get_payments()
    link_res = adapter.create_link(
        order_ref=order_ref,
        amount_paise=amount_paise,
        customer=customer_info,
        idempotency_key=key,
    )

    if link_res.status == PaymentStatus.uncertain:
        payment.status = PaymentStatus.uncertain.value
        transition(
            db=db,
            lead=lead,
            new_status=LeadStatus.uncertain,
            event_type="action_uncertain",
            reason=f"Payment link creation uncertain for {order_ref}",
            payload={"order_ref": order_ref, "key": key},
        )
        db.commit()
        return payment

    payment.link_url = link_res.link_url
    payment.provider_ref = link_res.provider_ref
    record_event(
        db=db,
        tenant_id=tenant_id,
        type=EventType.payment_link_created,
        reason=f"Payment link created: {link_res.link_url}",
        lead_id=lead.id,
        payload={"order_ref": order_ref, "link_url": link_res.link_url},
    )
    db.commit()

    # Write-ahead send link message
    sendlink_key = make_key("sendlink", payment.id)
    outbound_msg = find_message(db, sendlink_key)
    if not outbound_msg:
        msg_text = f"Here is your payment link: {link_res.link_url}"
        outbound_msg = Message(
            tenant_id=tenant_id,
            lead_id=lead.id,
            direction="outbound",
            recipient=lead.customer_contact,
            text=msg_text,
            status="pending",
            idempotency_key=sendlink_key,
        )
        db.add(outbound_msg)
        db.commit()
        db.refresh(outbound_msg)

    # Send link message
    msg_res = get_messaging().send_message(
        recipient=lead.customer_contact,
        text=outbound_msg.text,
        idempotency_key=sendlink_key,
    )

    if msg_res.status == "sent":
        outbound_msg.status = "sent"
        outbound_msg.provider_message_id = msg_res.provider_message_id
        payment.status = PaymentStatus.sent.value
        transition(
            db=db,
            lead=lead,
            new_status=LeadStatus.payment_requested,
            event_type=EventType.payment_created,
            reason="Payment link sent to customer",
            payload={"payment_id": payment.id, "link_url": link_res.link_url},
        )
    elif msg_res.status == "uncertain":
        outbound_msg.status = "uncertain"
        payment.status = PaymentStatus.uncertain.value
        transition(
            db=db,
            lead=lead,
            new_status=LeadStatus.uncertain,
            event_type="action_uncertain",
            reason="Timeout sending payment link",
            payload={"sendlink_key": sendlink_key},
        )
    else:
        outbound_msg.status = "failed"
        record_event(
            db=db,
            tenant_id=tenant_id,
            type="message_failed",
            reason=f"Failed to send payment link: {msg_res.error}",
            lead_id=lead.id,
            payload={"error": msg_res.error},
        )

    db.commit()
    db.refresh(payment)
    return payment


def verify(db: Session, tenant_id: str, payment_id: str) -> PaymentRequest:
    payment = db.get(PaymentRequest, payment_id)
    if not payment or payment.tenant_id != tenant_id:
        raise NotFoundError(f"PaymentRequest '{payment_id}' not found.")

    lead = db.get(Lead, payment.lead_id) if payment.lead_id else None

    # Idempotent return if already success
    if payment.status == PaymentStatus.success.value:
        return payment

    adapter = get_payments()
    status_res = adapter.get_status(payment.order_ref)
    payment.last_status_raw = status_res.raw

    # Provider unavailable check
    if status_res.status == PaymentStatus.uncertain:
        db.commit()
        raise ProviderUnavailable(f"Provider returned uncertain status for {payment.order_ref}.")

    # Uncertain reconciliation:
    if payment.status == PaymentStatus.uncertain.value:
        if not status_res.found:
            # Provider never saw the order
            payment.status = PaymentStatus.failed.value
            record_event(
                db=db,
                tenant_id=tenant_id,
                type=EventType.payment_failed,
                reason="Reconciliation: provider has no record of payment request.",
                lead_id=lead.id if lead else None,
                payload={"payment_id": payment.id, "order_ref": payment.order_ref},
            )
            if lead and lead.status == LeadStatus.uncertain.value:
                stored = lead.status_before_uncertain or LeadStatus.sent.value
                transition(
                    db=db,
                    lead=lead,
                    new_status=stored,
                    event_type=EventType.lead_status_changed,
                    reason="Reconciled uncertain payment: reverted to previous status",
                )
            db.commit()
            return payment
        else:
            # Provider found the order: move lead out of uncertain to payment_requested
            if lead and lead.status == LeadStatus.uncertain.value:
                transition(
                    db=db,
                    lead=lead,
                    new_status=LeadStatus.payment_requested,
                    event_type=EventType.lead_status_changed,
                    reason="Reconciled uncertain payment: provider confirmed request",
                )

    # Process status
    if status_res.status == PaymentStatus.success:
        payment.status = PaymentStatus.success.value
        if lead and lead.status == LeadStatus.payment_requested.value:
            transition(
                db=db,
                lead=lead,
                new_status=LeadStatus.paid,
                event_type=EventType.payment_verified,
                reason=f"Payment verified for {payment.order_ref}",
                payload={"payment_id": payment.id, "amount_paise": payment.amount_paise},
            )
        record_event(
            db=db,
            tenant_id=tenant_id,
            type=EventType.payment_verified,
            reason=f"Payment {payment.order_ref} verified successfully",
            lead_id=lead.id if lead else None,
            payload={"payment_id": payment.id, "provider_ref": status_res.provider_ref},
        )
    elif status_res.status in (PaymentStatus.failed, PaymentStatus.expired):
        payment.status = status_res.status.value
        record_event(
            db=db,
            tenant_id=tenant_id,
            type=EventType.payment_failed,
            reason=f"Payment {payment.order_ref} marked {status_res.status.value}",
            lead_id=lead.id if lead else None,
            payload={"payment_id": payment.id},
        )

    db.commit()
    db.refresh(payment)
    return payment
