"""
backend/app/db.py
Owner: P1
Purpose: Database engine and session factory.
Depends on: config.py
Used by: deps.py, main.py, seed, tests

PROMPT:
Write only this file. SQLAlchemy 2.0 synchronous engine and sessions.

Requirements:
- engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True). When the URL starts
  with sqlite add connect_args check_same_thread=False, and when it is the in-memory URL
  (sqlite:// or contains :memory:) also use poolclass=StaticPool so every connection
  shares one database.
- SessionLocal = sessionmaker(bind=engine, expire_on_commit=False).
- get_db() generator: yield a session and always close it in finally.
- create_all(): import app.models (this registers every table), then
  Base.metadata.create_all(engine). Base comes from app.models.base.

Do not:
- Add async engines or session helpers.
- Commit inside get_db; services commit.

Done when: create_all() builds every table on a fresh PostgreSQL database and on SQLite.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""
