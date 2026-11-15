"""
backend/app/ai/llm_client.py
Owner: P2 (AI track)
Purpose: Provider-independent LLM client with ordered fallback chain.

All AI modules call complete() from here — never httpx directly.
Every provider in the chain is capable of handling every LLM task:
  - Structured JSON output (intent parsing) — json_schema is passed
  - Free-text prose output (response generation) — json_schema is None

The chain is tried left-to-right; the first provider that succeeds returns.
LLMUnavailable is raised only after all providers in the chain fail.

Providers: sarvam | openai | gemini | mock
Chain config (env):
  LLM_PROVIDERS=sarvam,openai,mock   multi-provider fallback chain
  LLM_PROVIDER=sarvam                single-provider shorthand (backward-compat)
  LLM_{NAME}_API_KEY                 per-provider key (falls back to LLM_API_KEY)
  LLM_{NAME}_MODEL                   per-provider model (falls back to LLM_MODEL)
"""

import json
import logging
import os
import time
from pathlib import Path
from typing import Protocol, runtime_checkable

import httpx
from dotenv import load_dotenv

# Load .env from the repo root (revenuemate/.env) so keys are available
# when running directly with python or pytest without a shell that pre-exports them.
# This is a no-op if the variables are already set in the environment.
_ENV_FILE = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(_ENV_FILE, override=False)

# TODO: replace os.getenv calls with `from app.config import settings` once P1 implements config.py

logger = logging.getLogger(__name__)


# ── Exception ─────────────────────────────────────────────────────────────────

class LLMUnavailable(Exception):
    """Raised when every provider in the chain has failed for a single call."""


# ── Provider protocol ─────────────────────────────────────────────────────────

@runtime_checkable
class _Provider(Protocol):
    name: str

    def call(
        self,
        messages: list[dict],
        json_schema: dict | None,
        timeout: float,
    ) -> str: ...


# ── MockProvider ──────────────────────────────────────────────────────────────

class MockProvider:
    """
    Returns a canned response string without making any network calls.
    Used in all unit/integration tests and when LLM_PROVIDER=mock.

    simulate_failure=True forces the provider to raise LLMUnavailable,
    which advances the fallback chain to the next provider in tests.
    call_count lets tests assert exactly how many times each mock was used.
    """

    name = "mock"

    def __init__(
        self,
        canned_response: str = '{"intent": "product_discovery"}',
        agent_label: str = "default",
        simulate_failure: bool = False,
    ):
        self._canned = canned_response
        self.agent_label = agent_label
        self.simulate_failure = simulate_failure
        self.call_count = 0

    def call(
        self,
        messages: list[dict],
        json_schema: dict | None,
        timeout: float,
    ) -> str:
        if self.simulate_failure:
            raise LLMUnavailable("MockProvider: simulated failure")
        self.call_count += 1
        return self._canned


# ── SarvamProvider ────────────────────────────────────────────────────────────

class SarvamProvider:
    """
    POST https://api.sarvam.ai/v1/chat/completions
    Header: api-subscription-key: {api_key}
    Structured output: response_format={"type": "json_schema", "json_schema": schema}
    """

    name = "sarvam"

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise LLMUnavailable("SarvamProvider: LLM_API_KEY is not set")
        self._api_key = api_key
        self._model = model

    def call(
        self,
        messages: list[dict],
        json_schema: dict | None,
        timeout: float,
    ) -> str:
        body: dict = {"model": self._model, "messages": messages}
        if json_schema is not None:
            body["response_format"] = {"type": "json_schema", "json_schema": json_schema}

        start = time.monotonic()
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    "https://api.sarvam.ai/v1/chat/completions",
                    headers={
                        "api-subscription-key": self._api_key,
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise LLMUnavailable("SarvamProvider: request timed out") from exc
        except httpx.HTTPStatusError as exc:
            raise LLMUnavailable(
                f"SarvamProvider: HTTP {exc.response.status_code}"
            ) from exc
        except Exception as exc:
            raise LLMUnavailable(
                f"SarvamProvider: unexpected error — {type(exc).__name__}"
            ) from exc

        elapsed = time.monotonic() - start
        logger.info("provider=%s model=%s latency=%.2fs", self.name, self._model, elapsed)

        try:
            data = response.json()
            choices = data.get("choices") or []
            if not choices:
                raise LLMUnavailable("SarvamProvider: empty choices in response")
            return choices[0]["message"]["content"]
        except (json.JSONDecodeError, KeyError, IndexError) as exc:
            raise LLMUnavailable(
                f"SarvamProvider: could not parse response — {exc}"
            ) from exc


# ── OpenAIProvider ────────────────────────────────────────────────────────────

class OpenAIProvider:
    """
    POST https://api.openai.com/v1/chat/completions
    Header: Authorization: Bearer {api_key}
    Structured output: response_format={"type": "json_object"}
    (OpenAI enforces JSON but not the exact schema shape — sufficient for fallback use.)
    """

    name = "openai"

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise LLMUnavailable("OpenAIProvider: API key is not set")
        self._api_key = api_key
        self._model = model

    def call(
        self,
        messages: list[dict],
        json_schema: dict | None,
        timeout: float,
    ) -> str:
        body: dict = {"model": self._model, "messages": messages}
        if json_schema is not None:
            body["response_format"] = {"type": "json_object"}

        start = time.monotonic()
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json=body,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise LLMUnavailable("OpenAIProvider: request timed out") from exc
        except httpx.HTTPStatusError as exc:
            raise LLMUnavailable(
                f"OpenAIProvider: HTTP {exc.response.status_code}"
            ) from exc
        except Exception as exc:
            raise LLMUnavailable(
                f"OpenAIProvider: unexpected error — {type(exc).__name__}"
            ) from exc

        elapsed = time.monotonic() - start
        logger.info("provider=%s model=%s latency=%.2fs", self.name, self._model, elapsed)

        try:
            data = response.json()
            choices = data.get("choices") or []
            if not choices:
                raise LLMUnavailable("OpenAIProvider: empty choices in response")
            return choices[0]["message"]["content"]
        except (json.JSONDecodeError, KeyError, IndexError) as exc:
            raise LLMUnavailable(
                f"OpenAIProvider: could not parse response — {exc}"
            ) from exc


# ── GeminiProvider ────────────────────────────────────────────────────────────

class GeminiProvider:
    """
    POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
    Auth via ?key={api_key} query param.
    Converts OpenAI-style messages → Gemini contents format.
    Structured output: generationConfig.response_mime_type="application/json"
    """

    name = "gemini"

    def __init__(self, api_key: str, model: str):
        if not api_key:
            raise LLMUnavailable("GeminiProvider: API key is not set")
        self._api_key = api_key
        self._model = model

    def call(
        self,
        messages: list[dict],
        json_schema: dict | None,
        timeout: float,
    ) -> str:
        # Convert OpenAI-style messages to Gemini contents format.
        # Both "system" and "user" roles map to "user" on the Gemini side;
        # "assistant" maps to "model".
        contents = []
        for msg in messages:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        body: dict = {"contents": contents}
        if json_schema is not None:
            body["generationConfig"] = {"response_mime_type": "application/json"}

        url = (
            f"https://generativelanguage.googleapis.com/v1beta"
            f"/models/{self._model}:generateContent"
        )

        start = time.monotonic()
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    url,
                    params={"key": self._api_key},
                    headers={"Content-Type": "application/json"},
                    json=body,
                )
                response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise LLMUnavailable("GeminiProvider: request timed out") from exc
        except httpx.HTTPStatusError as exc:
            raise LLMUnavailable(
                f"GeminiProvider: HTTP {exc.response.status_code}"
            ) from exc
        except Exception as exc:
            raise LLMUnavailable(
                f"GeminiProvider: unexpected error — {type(exc).__name__}"
            ) from exc

        elapsed = time.monotonic() - start
        logger.info("provider=%s model=%s latency=%.2fs", self.name, self._model, elapsed)

        try:
            data = response.json()
            candidates = data.get("candidates") or []
            if not candidates:
                raise LLMUnavailable("GeminiProvider: empty candidates in response")
            return candidates[0]["content"]["parts"][0]["text"]
        except (json.JSONDecodeError, KeyError, IndexError) as exc:
            raise LLMUnavailable(
                f"GeminiProvider: could not parse response — {exc}"
            ) from exc


# ── Provider factory ──────────────────────────────────────────────────────────

def _make_provider(name: str, api_key: str, model: str) -> _Provider:
    """Instantiate a provider by name. Raises LLMUnavailable or ValueError on failure."""
    if name == "mock":
        return MockProvider()
    elif name == "sarvam":
        return SarvamProvider(api_key=api_key, model=model)
    elif name == "openai":
        return OpenAIProvider(api_key=api_key, model=model)
    elif name == "gemini":
        return GeminiProvider(api_key=api_key, model=model)
    else:
        raise ValueError(f"Unknown LLM provider: {name!r}")


# ── Chain builder ─────────────────────────────────────────────────────────────

def _build_chain() -> list[_Provider]:
    """
    Build the ordered provider fallback chain from environment variables.

    LLM_PROVIDERS=sarvam,openai,mock  — multi-provider chain (tried left-to-right)
    LLM_PROVIDER=sarvam               — single-provider shorthand (backward-compatible)
    Falls back to [MockProvider()] if neither is set or all configured providers fail
    to initialise (e.g. missing API keys).

    Per-provider overrides (optional):
      LLM_{NAME}_API_KEY  — falls back to LLM_API_KEY
      LLM_{NAME}_MODEL    — falls back to LLM_MODEL
    """
    # TODO: replace os.getenv calls with `from app.config import settings` once P1 implements config.py
    providers_str = (
        os.getenv("LLM_PROVIDERS")            # multi: "sarvam,openai,mock"
        or os.getenv("LLM_PROVIDER", "mock")  # single (backward-compat)
    )
    names = [n.strip() for n in providers_str.split(",") if n.strip()]

    chain: list[_Provider] = []
    for name in names:
        api_key = (
            os.getenv(f"LLM_{name.upper()}_API_KEY")
            or os.getenv("LLM_API_KEY", "")
        )
        model = (
            os.getenv(f"LLM_{name.upper()}_MODEL")
            or os.getenv("LLM_MODEL", "sarvam-105b")
        )
        try:
            chain.append(_make_provider(name, api_key, model))
        except (LLMUnavailable, ValueError) as exc:
            logger.warning(
                "Skipping provider %r during chain build: %s", name, exc
            )

    if not chain:
        logger.warning("No providers configured — falling back to MockProvider")
        chain = [MockProvider()]

    return chain


# ── Module-level chain (injectable for tests) ─────────────────────────────────

_chain: list[_Provider] = _build_chain()


# ── Public interface ──────────────────────────────────────────────────────────

def complete(
    system: str,
    user: str,
    json_schema: dict | None = None,
    timeout: float = 20,
    agent: str = "default",
) -> str:
    """
    Call the LLM with a system prompt and user message.

    Tries each provider in _chain in order; returns on the first success.
    Raises LLMUnavailable only after every provider in the chain has failed.

    Parameters
    ----------
    system      System prompt string.
    user        User message string. Buyer text must be quoted as data by the caller.
    json_schema Optional JSON Schema dict. When provided, tells the provider to return
                a JSON object conforming to that schema (structured output mode).
                When None, the provider returns free-text prose.
    timeout     Per-provider HTTP timeout in seconds.
    agent       Label for logging only — "intent" or "response". Does NOT route to
                different providers; every provider in the chain handles every task.
    """
    messages = [
        {"role": "system", "content": system},
        {"role": "user",   "content": user},
    ]
    last_error: LLMUnavailable | None = None
    for provider in _chain:
        try:
            result = provider.call(messages, json_schema, timeout)
            logger.debug("agent=%s provider=%s succeeded", agent, provider.name)
            return result
        except LLMUnavailable as exc:
            logger.warning(
                "agent=%s provider=%s failed: %s — trying next",
                agent, provider.name, exc,
            )
            last_error = exc
    raise last_error or LLMUnavailable("No providers configured")
