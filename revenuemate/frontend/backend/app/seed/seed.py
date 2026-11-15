"""
backend/app/seed/seed.py
Purpose: Seed the database with Vale Enterprises laptops, showroom inventory, and realistic leads.
"""

import sys
import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from app.config import settings, DEMO_TENANT_ID
from app.db import create_all, SessionLocal
from app.models.tenant import Tenant
from app.models.product import Product
from app.models.stock_snapshot import StockSnapshot
from app.models.lead import Lead
from app.models.draft import Draft
from app.models.payment_request import PaymentRequest
from app.models.event import Event
from app.schemas.common import LeadStatus, DraftStatus, PaymentStatus

VALE_LAPTOPS = [
    {
        "sku": "X1504VAP",
        "name": "ASUS Vivobook 15 (X1504)",
        "price_paise": 4999000,
        "on_hand": 8,
    },
    {
        "sku": "E70FYPA#ACJ",
        "name": "HP OmniBook 5 Laptop AI 14",
        "price_paise": 7999000,
        "on_hand": 4,
    },
    {
        "sku": "BH4K6PA#ACJ",
        "name": "HP OmniBook 5 Laptop 16",
        "price_paise": 8450000,
        "on_hand": 2,
    },
    {
        "sku": "21MC0071BM",
        "name": "ThinkPad T14 Gen 5 (AMD Ryzen PRO)",
        "price_paise": 9800000,
        "on_hand": 4,
    },
    {
        "sku": "83DV01SJVN",
        "name": "Lenovo LOQ 15IRX9 (RTX 4050 6GB)",
        "price_paise": 7890000,
        "on_hand": 5,
    },
    {
        "sku": "C96J5PA",
        "name": "HP Victus Gaming Laptop 15 (24GB RAM)",
        "price_paise": 8249000,
        "on_hand": 3,
    },
    {
        "sku": "C79V5PA",
        "name": "HP Victus Gaming Laptop 15 (16GB RAM)",
        "price_paise": 6999000,
        "on_hand": 6,
    },
    {
        "sku": "83EM008DIN",
        "name": "Lenovo IdeaPad Slim 3 15IRH8",
        "price_paise": 5699000,
        "on_hand": 7,
    },
    {
        "sku": "21M7004DIG",
        "name": "ThinkPad E14 Gen 6 (Intel Ultra 5)",
        "price_paise": 8990000,
        "on_hand": 0,
    },
    {
        "sku": "H7606WI",
        "name": "ASUS ProArt P16 (RTX 5080 16GB)",
        "price_paise": 24990000,
        "on_hand": 1,
    },
    {
        "sku": "MC6T4HN/A",
        "name": "Apple MacBook Air 13-inch (M5 Chip)",
        "price_paise": 11490000,
        "on_hand": 0,
    },
]

DEMO_LEADS = [
    {
        "customer_name": "Rohan Deshmukh",
        "customer_contact": "+91 98112 34891",
        "raw_text": "Hello Vale Enterprises! We need 1 unit of the ThinkPad T14 Gen 5 (AMD Ryzen PRO with Opal 2.0 encrypted SSD) for our lead architect joining tomorrow. Do you have ready sealed stock at your showroom?",
        "sku": "21MC0071BM",
        "status": LeadStatus.new,
        "priority_score": 92,
        "priority_reasons": ["Urgent corporate deadline", "Exact enterprise SKU match", "High purchase intent"],
        "draft_text": "Namaste Rohan ji! Following up from Vale Enterprises on the ThinkPad T14 Gen 5 AMD Ryzen PRO you requested. We have reserved 1 sealed box for you. We can extend our 5% corporate fleet pricing (₹93,100) + complimentary Targus backpack if you confirm today. Shall we dispatch the secure payment link?",
    },
    {
        "customer_name": "Priya Sharma",
        "customer_contact": "+91 98200 45112",
        "raw_text": "Looking for the ASUS ProArt P16 (RTX 5080 16GB) studio laptop for our VFX agency. Can you offer bulk credit terms for 2 units?",
        "sku": "H7606WI",
        "status": LeadStatus.new,
        "priority_score": 88,
        "priority_reasons": ["High-value workstation lead", "VFX agency commercial enquiry"],
        "draft_text": "Hi Priya, we have 1 sealed unit of ASUS ProArt P16 (RTX 5080) in showroom stock, and can arrange the 2nd unit within 24 hours. Would you like to inspect the demo unit today?",
    },
    {
        "customer_name": "Aditya Verma",
        "customer_contact": "+91 97110 55432",
        "raw_text": "Hey! Need Lenovo LOQ RTX 4050 for college gaming and coding. Is there student discount or free bag?",
        "sku": "83DV01SJVN",
        "status": LeadStatus.new,
        "priority_score": 75,
        "priority_reasons": ["Student gaming segment", "Ready stock available (5 units)"],
        "draft_text": "Hello Aditya! Yes, Lenovo LOQ RTX 4050 is in stock at ₹78,900. We offer a complimentary gaming mouse + mat bundle for students this week. Ready to confirm?",
    },
    {
        "customer_name": "Vikram Mehta",
        "customer_contact": "+91 98220 91823",
        "raw_text": "Walk-in purchase confirmed for ThinkPad T14 Gen 5. Direct counter payment settled via Soundbox UPI.",
        "sku": "21MC0071BM",
        "status": LeadStatus.paid,
        "priority_score": 95,
        "priority_reasons": ["Walk-in sale completed", "Direct UPI settled"],
        "draft_text": None,
    },
]

def seed():
    create_all()
    db = SessionLocal()
    try:
        # 1. Upsert Demo Tenant
        tenant = db.get(Tenant, DEMO_TENANT_ID)
        if not tenant:
            tenant = Tenant(
                id=DEMO_TENANT_ID,
                name="Vale Enterprises",
                owner_contact=settings.OWNER_CONTACT or "919811234891",
            )
            db.add(tenant)
            db.commit()
            print(f"Created Tenant: {tenant.name} ({tenant.id})")
        else:
            tenant.name = "Vale Enterprises"
            db.commit()
            print(f"Tenant exists: {tenant.name} ({tenant.id})")

        # 2. Upsert Products
        now = datetime.now(timezone.utc)
        product_map = {}
        for item in VALE_LAPTOPS:
            stmt = select(Product).where(
                Product.tenant_id == DEMO_TENANT_ID,
                Product.sku == item["sku"]
            )
            prod = db.execute(stmt).scalar_one_or_none()
            if not prod:
                prod = Product(
                    id=str(uuid.uuid4()),
                    tenant_id=DEMO_TENANT_ID,
                    sku=item["sku"],
                    name=item["name"],
                    price_paise=item["price_paise"],
                    active=True,
                    on_hand=item["on_hand"],
                    reserved=0,
                )
                db.add(prod)
                db.commit()

                # Snapshot
                snap = StockSnapshot(
                    id=str(uuid.uuid4()),
                    tenant_id=DEMO_TENANT_ID,
                    product_id=prod.id,
                    quantity=item["on_hand"],
                    as_of=now,
                )
                db.add(snap)
                db.commit()
                print(f"Added product: {prod.name} (SKU: {prod.sku})")
            else:
                prod.name = item["name"]
                prod.price_paise = item["price_paise"]
                prod.on_hand = item["on_hand"]
                db.commit()
            product_map[item["sku"]] = prod

        # 3. Upsert Demo Leads
        for ldata in DEMO_LEADS:
            stmt = select(Lead).where(
                Lead.tenant_id == DEMO_TENANT_ID,
                Lead.customer_contact == ldata["customer_contact"]
            )
            lead = db.execute(stmt).scalar_one_or_none()
            prod = product_map.get(ldata["sku"])

            if not lead:
                lead = Lead(
                    id=str(uuid.uuid4()),
                    tenant_id=DEMO_TENANT_ID,
                    customer_name=ldata["customer_name"],
                    customer_contact=ldata["customer_contact"],
                    raw_text=ldata["raw_text"],
                    product_id=prod.id if prod else None,
                    quantity=1,
                    status=ldata["status"].value if hasattr(ldata["status"], "value") else str(ldata["status"]),
                    priority_score=ldata["priority_score"],
                    priority_reasons=ldata["priority_reasons"],
                    intent="buy_laptop",
                    urgency="high" if ldata["priority_score"] > 80 else "medium",
                )
                db.add(lead)
                db.commit()
                print(f"Created Lead: {lead.customer_name} ({lead.id})")

                # If lead has a draft
                if ldata.get("draft_text"):
                    draft = Draft(
                        id=str(uuid.uuid4()),
                        tenant_id=DEMO_TENANT_ID,
                        lead_id=lead.id,
                        text=ldata["draft_text"],
                        facts_used={"sku": prod.sku if prod else "", "store": "Vale Enterprises"},
                        warnings=[],
                        status=DraftStatus.pending.value,
                    )
                    db.add(draft)
                    db.commit()
                    print(f"  Added draft for {lead.customer_name}")
            else:
                print(f"Lead exists: {lead.customer_name}")

        print("Seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
