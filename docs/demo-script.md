# RevenueMate live demo — revised flow

## Roles
1. Buyer: sends messages from WhatsApp.
2. Merchant: uses the merchant dashboard to review leads, stock and reservation requests.
3. Receptionist: uses the restricted fulfilment screen and handles the physical laptop.

## Scenario
A buyer needs a programming laptop under ₹60,000. The shop has a suitable model in stock.

## Live sequence
1. Buyer sends a WhatsApp enquiry.
2. RevenueMate creates a lead; Sarvam AI extracts budget, purpose and intent.
3. Backend checks the real seeded catalogue and stock. AI must not invent product facts.
4. Merchant reviews the recommendation and approves the response.
5. Buyer chooses a model and requests `Reserve & Collect`.
6. Merchant approves the reservation. Backend atomically allocates stock and generates a unique reservation code with an expiry.
7. Buyer receives reservation confirmation and store pickup instructions on WhatsApp.
8. Receptionist searches the reservation code. Screen reveals only product, quantity, reservation validity and payment/fulfilment status.
9. Receptionist retrieves the physical laptop and places it on the counter for inspection.
10. Buyer sends a WhatsApp request for the payment link. RevenueMate creates a link for the exact order amount.
11. Buyer completes payment using the mock/sandbox payment page.
12. Backend verifies the provider event/status and amount. The receptionist sees `PAID / VERIFIED`.
13. Receptionist confirms physical handover. Backend marks fulfilment complete, consumes the reservation and records audit events.
14. Buyer receives a completion message/receipt.

## Critical demo truthfulness
- If payment is simulated, explicitly say "sandbox/mock payment".
- Never treat an AI-generated message, screenshot or frontend toggle as payment verification.
- If live provider verification is unavailable, do not claim a live payment integration.
- Keep a pre-recorded fallback demo in case WhatsApp or network connectivity fails.

## Fallback
Use a prepared demo customer and seeded catalogue. If WhatsApp fails, demonstrate the same backend flow through the API/demo interface and clearly explain the adapter boundary.


## Conversational product recommendation demonstration (v5)
Use a merchant-activated model only after the merchant has confirmed its exact SKU, selling price and physical stock. The shared reference dataset may support product explanation/comparison, but it must be labelled reference-only until activated.

Buyer example: “I need a laptop for Python, VS Code and Docker. My budget is ₹60,000 and battery life matters.”

The system should: (1) ask a clarifying question if an essential constraint is missing; (2) retrieve exact model variants; (3) filter by the customer's hard budget; (4) retrieve CPU/RAM/storage/battery specifications with manufacturer sources; (5) explain trade-offs without invented benchmarks; (6) check the merchant's active offers and current stock; and (7) offer reservation only for an active merchant offer. If no matching model is in the shop's stock, say so and do not claim the reference catalogue is store stock.


## Conversational recommendation stage
Before reservation, ask the buyer to describe budget and intended workload in natural language. RevenueMate should ask a clarification question if needed, retrieve exact laptop model specifications and component facts from the two local databases, compare only verified catalogue models, explain trade-offs and show unknown fields. Do not make up a price or stock state: the merchant must confirm a live offer before reservation.


## Conversational recommendation stage
Before reservation, ask the buyer to describe budget and intended workload in natural language. RevenueMate should ask a clarification question if needed, retrieve exact laptop model specifications and component facts from the two local databases, compare only verified catalogue models, explain trade-offs and show unknown fields. Do not make up a price or stock state: the merchant must confirm a live offer before reservation.
