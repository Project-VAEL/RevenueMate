"""
backend/app/config.py
Single settings object read from environment variables.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Load .env from the repo root (revenuemate/.env)
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+psycopg://revenuemate:revenuemate@localhost:5432/revenuemate"

    # ── LLM ───────────────────────────────────────────────────────────────────
    LLM_PROVIDERS: str = "mock"          # comma-separated: sarvam,openai,mock
    LLM_PROVIDER: str = "mock"           # single-provider backward-compat
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "sarvam-105b"

    # Per-provider overrides
    LLM_SARVAM_API_KEY: str = ""
    LLM_SARVAM_MODEL: str = "sarvam-105b"
    LLM_OPENAI_API_KEY: str = ""
    LLM_OPENAI_MODEL: str = "gpt-4o-mini"
    LLM_GEMINI_API_KEY: str = ""
    LLM_GEMINI_MODEL: str = "gemini-1.5-flash"

    # ── Messaging ─────────────────────────────────────────────────────────────
    MESSAGING_PROVIDER: Literal["mock", "whatsapp"] = "mock"
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = ""
    WHATSAPP_APP_SECRET: str = ""
    OWNER_CONTACT: str = ""

    # ── Payments ──────────────────────────────────────────────────────────────
    PAYMENT_PROVIDER: Literal["mock", "paytm"] = "mock"
    PAYTM_ENV: Literal["staging", "production"] = "staging"
    PAYTM_MID: str = ""
    PAYTM_MERCHANT_KEY: str = ""

    # ── Server ────────────────────────────────────────────────────────────────
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    STOCK_STALE_MINUTES: int = 60
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # ── SQLite DBs (AI layer) ─────────────────────────────────────────────────
    LAPTOP_DB_PATH: str = ""
    HARDWARE_DB_PATH: str = ""

    # ── Demo constant ─────────────────────────────────────────────────────────
    # Not an env var — fixed for the hackathon demo tenant.
    DEMO_TENANT_ID: str = "00000000-0000-0000-0000-000000000001"

    @model_validator(mode="after")
    def _validate_provider_credentials(self) -> "Settings":
        if self.PAYMENT_PROVIDER == "paytm":
            if not self.PAYTM_MID or not self.PAYTM_MERCHANT_KEY:
                raise ValueError(
                    "PAYMENT_PROVIDER=paytm requires PAYTM_MID and PAYTM_MERCHANT_KEY to be set."
                )
        if self.MESSAGING_PROVIDER == "whatsapp":
            missing = [
                name
                for name, val in {
                    "WHATSAPP_TOKEN": self.WHATSAPP_TOKEN,
                    "WHATSAPP_PHONE_NUMBER_ID": self.WHATSAPP_PHONE_NUMBER_ID,
                    "WHATSAPP_VERIFY_TOKEN": self.WHATSAPP_VERIFY_TOKEN,
                    "WHATSAPP_APP_SECRET": self.WHATSAPP_APP_SECRET,
                }.items()
                if not val
            ]
            if missing:
                raise ValueError(
                    f"MESSAGING_PROVIDER=whatsapp requires these env vars to be set: "
                    f"{', '.join(missing)}"
                )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
