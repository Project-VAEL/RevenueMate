"""
backend/app/config.py
Owner: P1
Purpose: Single settings object read from environment variables.
Depends on: none
Used by: every module that needs configuration

PROMPT:
Write only this file. Define Settings with pydantic-settings (v2) and export one cached
instance named settings.

Requirements:
- Fields with defaults: DATABASE_URL
  (postgresql+psycopg://revenuemate:revenuemate@localhost:5432/revenuemate), LLM_API_KEY
  and LLM_MODEL (empty), MESSAGING_PROVIDER (mock), PAYMENT_PROVIDER (mock), PAYTM_ENV
  (staging), PAYTM_MID and PAYTM_MERCHANT_KEY (empty), WHATSAPP_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN and WHATSAPP_APP_SECRET (all empty),
  OWNER_CONTACT (empty; the owner's WhatsApp number, international format, digits only),
  PUBLIC_BASE_URL (http://localhost:8000; the public HTTPS tunnel URL during the demo),
  STOCK_STALE_MINUTES (60), NEXT_PUBLIC_API_URL (http://localhost:8000), FRONTEND_ORIGIN
  (http://localhost:3000).
- Constant DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001'.
- MESSAGING_PROVIDER is Literal['mock','whatsapp']; PAYMENT_PROVIDER is
  Literal['mock','paytm']; PAYTM_ENV is Literal['staging','production'].
- Read the .env file at the repository root. A model validator raises a clear error if
  PAYMENT_PROVIDER is paytm and PAYTM_MID or PAYTM_MERCHANT_KEY is empty, or if
  MESSAGING_PROVIDER is whatsapp and any of WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_VERIFY_TOKEN or WHATSAPP_APP_SECRET is empty.
- get_settings() is cached with lru_cache; settings = get_settings().

Do not:
- Print or log any secret value.
- Import any other module from this project.

Done when: importing settings works with no .env present, and picking paytm without keys
fails with a readable message.

Context to paste first: docs/P1_CONTEXT.md, docs/statuses-and-events.md,
docs/api-contract.md, plus the headers of the files listed under Depends on.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000001"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql+psycopg://revenuemate:revenuemate@localhost:5432/revenuemate"
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""
    MESSAGING_PROVIDER: Literal["mock", "whatsapp"] = "mock"
    PAYMENT_PROVIDER: Literal["mock", "paytm"] = "mock"
    PAYTM_ENV: Literal["staging", "production"] = "staging"
    PAYTM_MID: str = ""
    PAYTM_MERCHANT_KEY: str = ""
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = ""
    WHATSAPP_APP_SECRET: str = ""
    OWNER_CONTACT: str = ""
    PUBLIC_BASE_URL: str = "http://localhost:8000"
    STOCK_STALE_MINUTES: int = 60
    NEXT_PUBLIC_API_URL: str = "http://localhost:8000"
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    @model_validator(mode="after")
    def validate_provider_credentials(self) -> "Settings":
        missing: list[str] = []
        if self.PAYMENT_PROVIDER == "paytm":
            if not self.PAYTM_MID:
                missing.append("PAYTM_MID")
            if not self.PAYTM_MERCHANT_KEY:
                missing.append("PAYTM_MERCHANT_KEY")
        if self.MESSAGING_PROVIDER == "whatsapp":
            for name in (
                "WHATSAPP_TOKEN",
                "WHATSAPP_PHONE_NUMBER_ID",
                "WHATSAPP_VERIFY_TOKEN",
                "WHATSAPP_APP_SECRET",
            ):
                if not getattr(self, name):
                    missing.append(name)
        if missing:
            raise ValueError(
                "Missing required credentials for the selected provider: "
                + ", ".join(missing)
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
