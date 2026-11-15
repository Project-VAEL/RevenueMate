# Product data provenance and truthfulness rules

Snapshot date: 2026-11-13. See `data/reference/source_registry.json` for the full source list and direct URLs. Product/device fields are taken from OEM pages (ASUS, HP, Lenovo, Acer, Apple); CPU/SoC fields may also use Intel/AMD manufacturer pages.

## What is included
- 11 exact or selected published laptop configurations; recommendation-eligible flags identify records sufficiently mapped to a model/part number for structured comparison.
- 2 family-only profiles kept out of exact SKU recommendation.
- Normalized component records and explicit product-component links.
- Each record holds source IDs; `evidence_map.json` connects entities to their supporting sources.

## What is deliberately not included
- Merchant selling price, merchant stock quantity, store location, reservation availability: not known until a real shop supplies them.
- Made-up benchmark scores, battery runtimes, “best for coding” labels, inferred performance ranks, or user reviews.
- Exact specifications when the OEM matrix did not clearly map options to an exact model code.

## Important interpretation rules
- CPU base/max power specifications are silicon limits/reference values, not laptop power draw or battery runtime.
- Battery Wh is capacity, not an estimate of hours. Runtime depends on workload, screen, battery age and vendor testing method.
- Shared processor family capability does not guarantee that every OEM laptop exposes the same ports, graphics, memory channels, thermal power or NPU features.
- Display brightness/gamut and GPU TGP must be tied to exact configurations.
- “Up to” values remain maximum capability and are not automatically attributed to a specific configuration.
- Segment tags (student, business, creator, gaming) are internal navigation tags, not a manufacturer technical fact.

## Refresh
This is a dated reference snapshot. Revalidate specifications and commercial availability before a buyer relies on them. Keep a source history when values change.
