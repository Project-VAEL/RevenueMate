"""
Tests for Task 1 — LLM Client + Prompts.
All tests use MockProvider or httpx mocking (respx). Zero live HTTP calls.

Run from revenuemate/backend/:
    pytest tests/test_llm_client.py -v
"""
import json
import pytest
import httpx

import app.ai.llm_client as llm_module
from app.ai.llm_client import (
    LLMUnavailable,
    MockProvider,
    SarvamProvider,
    OpenAIProvider,
    GeminiProvider,
    complete,
)
from app.ai import prompts


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_chain():
    """Restore _chain to its original state after each test."""
    original = llm_module._chain[:]
    yield
    llm_module._chain = original


# ── MockProvider ──────────────────────────────────────────────────────────────

def test_mock_plain_text():
    llm_module._chain = [MockProvider("hello world")]
    result = complete("system", "user")
    assert result == "hello world"


def test_mock_json_schema():
    canned = '{"intent": "product_discovery", "budget_max_paise": 6000000}'
    llm_module._chain = [MockProvider(canned)]
    result = complete("sys", "user", json_schema={"type": "object"})
    parsed = json.loads(result)
    assert parsed["budget_max_paise"] == 6000000


def test_mock_call_count_increments():
    mock = MockProvider("hi")
    llm_module._chain = [mock]
    complete("s", "u")
    complete("s", "u")
    assert mock.call_count == 2


def test_mock_simulate_failure_raises():
    llm_module._chain = [MockProvider(simulate_failure=True)]
    with pytest.raises(LLMUnavailable):
        complete("s", "u")


def test_mock_simulate_failure_does_not_increment_call_count():
    mock = MockProvider(simulate_failure=True)
    llm_module._chain = [mock]
    with pytest.raises(LLMUnavailable):
        complete("s", "u")
    assert mock.call_count == 0


# ── Fallback chain ────────────────────────────────────────────────────────────

def test_fallback_chain_skips_failing_provider():
    failing = MockProvider(simulate_failure=True, agent_label="first")
    succeeding = MockProvider("success", agent_label="second")
    llm_module._chain = [failing, succeeding]
    result = complete("s", "u")
    assert result == "success"
    assert failing.call_count == 0
    assert succeeding.call_count == 1


def test_all_providers_fail_raises_unavailable():
    llm_module._chain = [
        MockProvider(simulate_failure=True),
        MockProvider(simulate_failure=True),
        MockProvider(simulate_failure=True),
    ]
    with pytest.raises(LLMUnavailable):
        complete("s", "u")


def test_first_provider_success_does_not_call_second():
    first = MockProvider("first wins")
    second = MockProvider("second")
    llm_module._chain = [first, second]
    result = complete("s", "u")
    assert result == "first wins"
    assert second.call_count == 0


def test_three_provider_chain_uses_third():
    llm_module._chain = [
        MockProvider(simulate_failure=True),
        MockProvider(simulate_failure=True),
        MockProvider("third works"),
    ]
    assert complete("s", "u") == "third works"


# ── agent label does not change routing ──────────────────────────────────────

def test_agent_label_does_not_change_routing():
    mock = MockProvider("same result")
    llm_module._chain = [mock]
    r1 = complete("s", "u", agent="intent")
    r2 = complete("s", "u", agent="response")
    assert r1 == r2 == "same result"
    assert mock.call_count == 2


# ── SarvamProvider ────────────────────────────────────────────────────────────

def test_sarvam_empty_key_raises_at_construction():
    with pytest.raises(LLMUnavailable):
        SarvamProvider(api_key="", model="sarvam-105b")


def test_sarvam_timeout_raises_unavailable(respx_mock):
    respx_mock.post("https://api.sarvam.ai/v1/chat/completions").mock(
        side_effect=httpx.TimeoutException("timed out")
    )
    provider = SarvamProvider(api_key="test-key", model="sarvam-105b")
    with pytest.raises(LLMUnavailable, match="timed out"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_sarvam_http_500_raises_unavailable(respx_mock):
    respx_mock.post("https://api.sarvam.ai/v1/chat/completions").mock(
        return_value=httpx.Response(500)
    )
    provider = SarvamProvider(api_key="test-key", model="sarvam-105b")
    with pytest.raises(LLMUnavailable, match="HTTP 500"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_sarvam_malformed_json_raises_unavailable(respx_mock):
    respx_mock.post("https://api.sarvam.ai/v1/chat/completions").mock(
        return_value=httpx.Response(200, content=b"not json at all")
    )
    provider = SarvamProvider(api_key="test-key", model="sarvam-105b")
    with pytest.raises(LLMUnavailable):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_sarvam_empty_choices_raises_unavailable(respx_mock):
    respx_mock.post("https://api.sarvam.ai/v1/chat/completions").mock(
        return_value=httpx.Response(200, json={"choices": []})
    )
    provider = SarvamProvider(api_key="test-key", model="sarvam-105b")
    with pytest.raises(LLMUnavailable, match="empty choices"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_sarvam_success_returns_content(respx_mock):
    respx_mock.post("https://api.sarvam.ai/v1/chat/completions").mock(
        return_value=httpx.Response(200, json={
            "choices": [{"message": {"content": "laptop answer"}}]
        })
    )
    provider = SarvamProvider(api_key="test-key", model="sarvam-105b")
    result = provider.call([{"role": "user", "content": "hi"}], None, 5.0)
    assert result == "laptop answer"


def test_sarvam_passes_json_schema_in_body(respx_mock):
    captured: dict = {}

    def capture(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": "{}"}}]})

    respx_mock.post("https://api.sarvam.ai/v1/chat/completions").mock(side_effect=capture)
    provider = SarvamProvider(api_key="test-key", model="sarvam-105b")
    provider.call([{"role": "user", "content": "hi"}], {"type": "object"}, 5.0)
    assert "response_format" in captured["body"]
    assert captured["body"]["response_format"]["type"] == "json_schema"


def test_sarvam_no_schema_omits_response_format(respx_mock):
    captured: dict = {}

    def capture(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": "text"}}]})

    respx_mock.post("https://api.sarvam.ai/v1/chat/completions").mock(side_effect=capture)
    provider = SarvamProvider(api_key="test-key", model="sarvam-105b")
    provider.call([{"role": "user", "content": "hi"}], None, 5.0)
    assert "response_format" not in captured["body"]


# ── OpenAIProvider ────────────────────────────────────────────────────────────

def test_openai_empty_key_raises_at_construction():
    with pytest.raises(LLMUnavailable):
        OpenAIProvider(api_key="", model="gpt-4o-mini")


def test_openai_success_returns_content(respx_mock):
    respx_mock.post("https://api.openai.com/v1/chat/completions").mock(
        return_value=httpx.Response(200, json={
            "choices": [{"message": {"content": "openai answer"}}]
        })
    )
    provider = OpenAIProvider(api_key="test-key", model="gpt-4o-mini")
    result = provider.call([{"role": "user", "content": "hi"}], None, 5.0)
    assert result == "openai answer"


def test_openai_passes_json_object_format_when_schema_given(respx_mock):
    captured: dict = {}

    def capture(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={"choices": [{"message": {"content": "{}"}}]})

    respx_mock.post("https://api.openai.com/v1/chat/completions").mock(side_effect=capture)
    provider = OpenAIProvider(api_key="test-key", model="gpt-4o-mini")
    provider.call([{"role": "user", "content": "hi"}], {"type": "object"}, 5.0)
    assert captured["body"]["response_format"] == {"type": "json_object"}


def test_openai_http_500_raises_unavailable(respx_mock):
    respx_mock.post("https://api.openai.com/v1/chat/completions").mock(
        return_value=httpx.Response(500)
    )
    provider = OpenAIProvider(api_key="test-key", model="gpt-4o-mini")
    with pytest.raises(LLMUnavailable, match="HTTP 500"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_openai_empty_choices_raises_unavailable(respx_mock):
    respx_mock.post("https://api.openai.com/v1/chat/completions").mock(
        return_value=httpx.Response(200, json={"choices": []})
    )
    provider = OpenAIProvider(api_key="test-key", model="gpt-4o-mini")
    with pytest.raises(LLMUnavailable, match="empty choices"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_openai_timeout_raises_unavailable(respx_mock):
    respx_mock.post("https://api.openai.com/v1/chat/completions").mock(
        side_effect=httpx.TimeoutException("timed out")
    )
    provider = OpenAIProvider(api_key="test-key", model="gpt-4o-mini")
    with pytest.raises(LLMUnavailable, match="timed out"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


# ── GeminiProvider ────────────────────────────────────────────────────────────

def test_gemini_empty_key_raises_at_construction():
    with pytest.raises(LLMUnavailable):
        GeminiProvider(api_key="", model="gemini-1.5-flash")


def test_gemini_success_returns_content(respx_mock):
    respx_mock.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    ).mock(
        return_value=httpx.Response(200, json={
            "candidates": [{"content": {"parts": [{"text": "gemini answer"}]}}]
        })
    )
    provider = GeminiProvider(api_key="test-key", model="gemini-1.5-flash")
    result = provider.call([{"role": "user", "content": "hi"}], None, 5.0)
    assert result == "gemini answer"


def test_gemini_empty_candidates_raises_unavailable(respx_mock):
    respx_mock.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    ).mock(
        return_value=httpx.Response(200, json={"candidates": []})
    )
    provider = GeminiProvider(api_key="test-key", model="gemini-1.5-flash")
    with pytest.raises(LLMUnavailable, match="empty candidates"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_gemini_passes_json_mime_type_when_schema_given(respx_mock):
    captured: dict = {}

    def capture(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={
            "candidates": [{"content": {"parts": [{"text": "{}"}]}}]
        })

    respx_mock.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    ).mock(side_effect=capture)
    provider = GeminiProvider(api_key="test-key", model="gemini-1.5-flash")
    provider.call([{"role": "user", "content": "hi"}], {"type": "object"}, 5.0)
    assert captured["body"]["generationConfig"]["response_mime_type"] == "application/json"


def test_gemini_http_500_raises_unavailable(respx_mock):
    respx_mock.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    ).mock(
        return_value=httpx.Response(500)
    )
    provider = GeminiProvider(api_key="test-key", model="gemini-1.5-flash")
    with pytest.raises(LLMUnavailable, match="HTTP 500"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_gemini_timeout_raises_unavailable(respx_mock):
    respx_mock.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    ).mock(
        side_effect=httpx.TimeoutException("timed out")
    )
    provider = GeminiProvider(api_key="test-key", model="gemini-1.5-flash")
    with pytest.raises(LLMUnavailable, match="timed out"):
        provider.call([{"role": "user", "content": "hi"}], None, 5.0)


def test_gemini_converts_system_message_to_user_role(respx_mock):
    """System messages must be converted to 'user' role for Gemini format."""
    captured: dict = {}

    def capture(request: httpx.Request) -> httpx.Response:
        captured["body"] = json.loads(request.content)
        return httpx.Response(200, json={
            "candidates": [{"content": {"parts": [{"text": "ok"}]}}]
        })

    respx_mock.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    ).mock(side_effect=capture)
    provider = GeminiProvider(api_key="test-key", model="gemini-1.5-flash")
    provider.call([{"role": "system", "content": "be helpful"}], None, 5.0)
    # system → user in Gemini format
    assert captured["body"]["contents"][0]["role"] == "user"


# ── _build_chain ──────────────────────────────────────────────────────────────

def test_build_chain_single_mock_env(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.delenv("LLM_PROVIDERS", raising=False)
    chain = llm_module._build_chain()
    assert len(chain) == 1
    assert isinstance(chain[0], MockProvider)


def test_build_chain_multi_provider_env(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDERS", "mock,mock")
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    chain = llm_module._build_chain()
    assert len(chain) == 2
    assert all(isinstance(p, MockProvider) for p in chain)


def test_build_chain_missing_key_skips_sarvam(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDERS", "sarvam,mock")
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.setenv("LLM_API_KEY", "")
    monkeypatch.delenv("LLM_SARVAM_API_KEY", raising=False)
    chain = llm_module._build_chain()
    # Sarvam skipped (empty key), only mock remains
    assert len(chain) == 1
    assert isinstance(chain[0], MockProvider)


def test_build_chain_no_env_falls_back_to_mock(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDERS", raising=False)
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    chain = llm_module._build_chain()
    assert len(chain) >= 1
    assert isinstance(chain[0], MockProvider)


def test_build_chain_three_providers(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDERS", "mock,mock,mock")
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    chain = llm_module._build_chain()
    assert len(chain) == 3


# ── prompts ───────────────────────────────────────────────────────────────────

def test_intent_parser_system_non_empty():
    assert len(prompts.INTENT_PARSER_SYSTEM.strip()) > 0


def test_response_generator_system_non_empty():
    assert len(prompts.RESPONSE_GENERATOR_SYSTEM.strip()) > 0


def test_intent_system_mentions_paise():
    assert "paise" in prompts.INTENT_PARSER_SYSTEM


def test_response_system_mentions_reference():
    assert "reference" in prompts.RESPONSE_GENERATOR_SYSTEM


def test_intent_system_mentions_null_not_zero():
    # Must instruct model to use null for missing budget, not 0
    assert "null" in prompts.INTENT_PARSER_SYSTEM


def test_response_system_forbids_invented_specs():
    # Must instruct model not to invent facts
    text = prompts.RESPONSE_GENERATOR_SYSTEM.lower()
    assert "invent" in text or "only" in text


def test_intent_system_covers_confirmed_fields():
    # Must distinguish confirmed from inferred
    assert "confirmed" in prompts.INTENT_PARSER_SYSTEM.lower()


def test_response_system_mentions_no_transactional_language():
    text = prompts.RESPONSE_GENERATOR_SYSTEM.lower()
    assert "reserv" in text or "buy" in text or "transact" in text


# ── Demo checkpoint ───────────────────────────────────────────────────────────

def test_demo_fallback_chain():
    """
    Simulates: primary provider is down, fallback provider answers.
    Proves any capable provider in the chain can answer any task.
    """
    failing = MockProvider(simulate_failure=True, agent_label="primary")
    succeeding = MockProvider(
        '{"intent":"product_discovery","budget_max_paise":6000000}',
        agent_label="fallback",
    )
    llm_module._chain = [failing, succeeding]

    result = complete(
        "system prompt",
        'Buyer message: """Python laptop 60k"""',
        json_schema={"type": "object"},
        agent="intent",
    )
    parsed = json.loads(result)
    assert parsed["budget_max_paise"] == 6000000
    assert failing.call_count == 0
    assert succeeding.call_count == 1


def test_demo_all_agents_can_handle_structured_output():
    """Every provider must return valid JSON when json_schema is passed."""
    canned_json = '{"intent":"product_discovery","budget_max_paise":6000000,"needs_clarification":false}'
    for label in ["intent", "response", "default"]:
        mock = MockProvider(canned_json, agent_label=label)
        llm_module._chain = [mock]
        result = complete("sys", "user", json_schema={"type": "object"}, agent=label)
        parsed = json.loads(result)
        assert "intent" in parsed


def test_demo_all_agents_can_handle_free_text():
    """Every provider must return prose when json_schema is None."""
    canned_text = "The HP OmniBook 14 has 16GB RAM and an OLED display."
    for label in ["intent", "response", "default"]:
        mock = MockProvider(canned_text, agent_label=label)
        llm_module._chain = [mock]
        result = complete("sys", "user", json_schema=None, agent=label)
        assert result == canned_text
