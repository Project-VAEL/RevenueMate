import sqlite3
from pathlib import Path

DB = Path(__file__).parent / "data" / "databases" / "laptop_reference.sqlite"
conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)

rows = conn.execute(
    "SELECT product_id, fact_path FROM product_facts WHERE value_json IS NULL LIMIT 10"
).fetchall()
print("Facts with NULL value_json:")
for r in rows:
    print(f"  {r[0]}  /  {r[1]}")

if not rows:
    print("  (none)")

# Also show total row count per product
print("\nRow counts per product in product_facts:")
for r in conn.execute("SELECT product_id, COUNT(*) FROM product_facts GROUP BY product_id"):
    print(f"  {r[0]}: {r[1]} rows")

conn.close()
