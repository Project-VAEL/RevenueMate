from pathlib import Path
import json, sqlite3
ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "databases"
REF = ROOT / "reference"
for name in ("laptop_reference.sqlite", "hardware_knowledge.sqlite"):
    path = DB / name
    assert path.exists(), path
    db = sqlite3.connect(path)
    assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    if name == "laptop_reference.sqlite":
        assert db.execute("SELECT COUNT(*) FROM merchant_offers").fetchone()[0] == 0
        assert db.execute("SELECT COUNT(*) FROM product_variants WHERE merchant_price_inr IS NOT NULL OR merchant_stock_on_hand IS NOT NULL").fetchone()[0] == 0
        assert db.execute("SELECT COUNT(*) FROM product_variants WHERE recommendation_eligible=1").fetchone()[0] > 0
    if name == "hardware_knowledge.sqlite":
        assert db.execute("SELECT COUNT(*) FROM product_component_links l LEFT JOIN components c ON c.component_id=l.component_id WHERE c.component_id IS NULL").fetchone()[0] == 0
        bad = db.execute("SELECT COUNT(*) FROM product_component_links WHERE product_id='P-ASUS-X1504VAP' AND component_id='DISPLAY-HP-OMNI14-OLED'").fetchone()[0]
        assert bad == 0, "Cross-brand display link must not be present"
    print(name, "OK")
    db.close()
products=json.loads((REF/"laptop_catalogue.json").read_text())
components=json.loads((REF/"hardware_components.json").read_text())
sources=json.loads((REF/"source_registry.json").read_text())
links=json.loads((REF/"product_component_links.json").read_text())
assert len({p['product_id'] for p in products}) == len(products)
assert len({c['component_id'] for c in components}) == len(components)
assert len({s['source_id'] for s in sources}) == len(sources)
source_ids={s['source_id'] for s in sources}
component_ids={c['component_id'] for c in components}
product_ids={p['product_id'] for p in products}
for p in products: assert set(p['source_ids']).issubset(source_ids), p['product_id']
for c in components: assert set(c['source_ids']).issubset(source_ids), c['component_id']
for l in links:
    assert l['product_id'] in product_ids, l
    assert l['component_id'] in component_ids, l
print(f"JSON evidence and reference checks OK: {len(products)} products, {len(components)} components, {len(links)} links, {len(sources)} sources")
