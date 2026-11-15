# RevenueMate verified product and hardware reference data

Snapshot retrieved: 2026-11-13. The reference facts below are transcribed from the OEM/semiconductor manufacturer sources in `source_registry.json`. No LLM-generated specifications, generated benchmark scores, inferred merchant prices, or synthetic stock values are included.

## Database contents
- `../databases/laptop_reference.sqlite`: laptop families, exact model/SKU variants, field-level specifications, evidence-source registry, and an intentionally empty `merchant_offers` table.
- `../databases/hardware_knowledge.sqlite`: normalized CPU/SoC/GPU/memory/storage/display/battery/wireless component facts and product-to-component links.

Human-readable exports: `laptop_catalogue.json`, `product_families.json`, `family_only_profiles.json`, `hardware_components.json`, `product_component_links.json`, `source_registry.json`, `evidence_map.json`.

## Snapshot coverage
- 11 laptop model/configuration records; 10 are eligible for fact-grounded recommendations and one ASUS Vivobook record is retained for discovery only because some exact variant attributes remain unresolved.
- 12 product families. Two family-level reference profiles (ASUS TUF Gaming A15 2024 and Apple MacBook Pro 14-inch M5 Pro) are stored separately and excluded from exact-variant recommendation until a specific configuration is established.
- 53 component reference records.
- 21 source entries (mostly official OEM and chip-vendor pages).

The coverage is a deliberately curated cross-section of India/global model variants: mainstream/student, business, thin-and-light, creator, gaming, and Apple silicon. It is not an exhaustive global laptop catalogue.

## Reference catalogue != shop inventory
This dataset is not a representation of any real shop's current stock. `merchant_price_inr` and `merchant_stock_on_hand` are intentionally null; the `merchant_offers` table has zero rows. `merchant_offer_template.json` is empty by design. A merchant must confirm the precise model, store selling price, unit count, location and timestamp before the product can be offered or reserved. OEM store prices, retailer listings and general web search prices are not the hackathon merchant's prices.

## Variant and evidence integrity
- `recommendation_eligible=true` means the exact model/SKU has enough source-backed attributes for a limited, evidence-grounded product comparison. It does not mean the laptop is in stock or best for all buyers.
- Family-only profiles are not exact purchasable variants.
- Unresolved values remain null or are omitted; see `unknown_or_unresolved_fields`.
- A shared processor/GPU capability is not proof of identical laptop performance. Laptop power limits, cooling, memory channels, firmware and display panels vary by exact machine configuration.
- Product fields and component facts retain `source_ids`; use `evidence_map.json` and `source_registry.json` to trace them to the source page.
- Marketing segment tags are internal categorization labels, not manufacturer-certified labels.

## Known source limitations
Some OEM technical-specification pages list multiple configurable options. Where the page did not map a feature to the exact model number, that feature is not populated in the exact-variant record or the model is excluded from recommendation. Some pages may change after the retrieval date; this is a dated snapshot, not a live data service.

## Refresh and data governance
Before a shop uses this catalogue, re-check current regional SKU, warranty, availability and merchant offer fields. Refresh OEM specs when the manufacturer changes the support page. Preserve prior source snapshots and retrieval dates if values change. Do not use LLM outputs to fill factual fields; LLM can summarize sourced facts at query time but should not write back unverified facts.

## Validation
Run: `python data/reference/validate_reference_databases.py`
