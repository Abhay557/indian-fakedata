"""Regression tests for the v2.0.9 persona language option."""

import pytest

from indian_fakedata import generate, generate_enriched
from indian_fakedata.utils.agent import generate_agent_persona
from indian_fakedata.utils.user import generate_persona


def test_default_english_output_is_unchanged():
    p = generate(count=1, seed=31)[0]
    assert generate_agent_persona(p, "english") == generate_agent_persona(p)
    assert generate_agent_persona(p)["systemPrompt"].startswith("You are ")
    assert "IDENTITY" in generate_agent_persona(p)["fullPrompt"]


def test_hindi_renders_devanagari_prompt_and_headers():
    p = generate(count=1, seed=31)[0]
    persona = generate_agent_persona(p, "hindi")
    assert "आप" in persona["systemPrompt"]
    assert p["firstName"] in persona["systemPrompt"]
    assert p["district"] in persona["systemPrompt"]
    assert "PEHCHAAN" in persona["fullPrompt"]
    assert "ROOP-RANG" in persona["fullPrompt"]
    assert "\nIDENTITY\n" not in persona["fullPrompt"]


def test_hinglish_renders_roman_mix_with_english_headers():
    p = generate(count=1, seed=31)[0]
    persona = generate_agent_persona(p, "hinglish")
    assert f"Tum {p['firstName']}" in persona["systemPrompt"]
    assert "IDENTITY" in persona["fullPrompt"]
    assert "Tum " in persona["fullPrompt"]


def test_invalid_language_raises():
    p = generate(count=1, seed=31)[0]
    with pytest.raises(ValueError):
        generate_agent_persona(p, "french")


def test_plumbing_through_persona_and_enriched():
    out = generate_persona(seed=31, language="hindi")
    assert "आप" in out["persona"]["systemPrompt"]
    enriched = generate_enriched(count=1, seed=31, include_agent_persona=True,
                                 agent_persona_language="hinglish")
    assert "Tum " in enriched[0]["agentPersona"]["systemPrompt"]
