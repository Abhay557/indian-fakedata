"""Unit tests for the festival calendar (v2.1.0, item 5)."""

import re

from indian_fakedata import (
    generate, generate_agent_persona, simulate_outcomes, generate_narrative,
)
from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.festivals import generate_festivals


def test_major_festivals_marked():
    diwali = generate_festivals(
        "hindu", "Hindu", "uttar_pradesh", "very_religious",
        create_rng(41), current_year=2026)
    assert "Diwali" in [f["name"] for f in diwali]
    eid = generate_festivals(
        "muslim", "Muslim", "uttar_pradesh", "very_religious",
        create_rng(42), current_year=2026)
    assert "Eid al-Fitr" in [f["name"] for f in eid]
    xmas = generate_festivals(
        "christian", "Christian", "kerala", "very_religious",
        create_rng(40), current_year=2026)
    assert "Christmas" in [f["name"] for f in xmas]


def test_regional_festivals_stay_home():
    tn = generate_festivals(
        "hindu", "Hindu", "tamil_nadu", "very_religious",
        create_rng(44), current_year=2026)
    names = [f["name"] for f in tn]
    assert "Pongal" in names
    assert next(f for f in tn if f["name"] == "Pongal")["regional"] is True
    up = generate_festivals(
        "hindu", "Hindu", "uttar_pradesh", "very_religious",
        create_rng(44), current_year=2026)
    names_up = [f["name"] for f in up]
    assert "Pongal" not in names_up
    assert "Bihu" not in names_up


def test_dates_valid_sorted_and_labelled():
    docs = generate_festivals(
        "sikh", "Sikh", "punjab", "somewhat_religious",
        create_rng(45), current_year=2026)
    assert len(docs) > 0
    dates = [f["date"] for f in docs]
    assert dates == sorted(dates)
    import re
    for d in docs:
        assert re.match(r"^2026-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$", d["date"])
        assert d["religion"] == "Sikh"


def test_deterministic():
    opts = dict(religion_id="hindu", religion_label="Hindu", state_id="bihar",
                religiosity="somewhat_religious", current_year=2026)
    a = generate_festivals(rng=create_rng(46), **opts)
    assert generate_festivals(rng=create_rng(46), **opts) == a


def test_profile_festivals_match_religion_and_state():
    regional_states = {
        "Pongal": ["Tamil Nadu"],
        "Bihu": ["Assam"],
        "Onam": ["Kerala"],
        "Durga Puja": ["West Bengal", "Assam", "Odisha", "Tripura"],
        "Chhath Puja": ["Bihar", "Uttar Pradesh", "Jharkhand"],
        "Teej": ["Rajasthan", "Haryana", "Uttar Pradesh"],
        "Ganesh Chaturthi": ["Maharashtra", "Goa", "Karnataka"],
        "Baisakhi Harvest Fair": ["Punjab", "Haryana"],
        "Hornbill Festival": ["Nagaland"],
    }
    rows = generate(count=300, seed=61)
    checked = 0
    for r in rows:
        for d in r.get("festivals") or []:
            assert d["religion"] == r["religion"]
            assert re.match(r"^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$",
                            d["date"])
            if d["name"] in regional_states:
                assert d["regional"] is True
                assert r["state"] in regional_states[d["name"]]
            checked += 1
    assert checked > 0


def test_festivals_flow_into_memories_and_chats():
    p = generate(count=1, seed=61)[0]
    assert len(p["festivals"]) > 0
    persona = generate_agent_persona(p)
    assert p["festivals"][0]["name"] in " ".join(persona["memorySeeds"])
    outcomes = simulate_outcomes(p, 0.3, create_rng(61))
    chat = generate_narrative(p, outcomes, "hinglish_conversation")
    assert p["festivals"][0]["name"] in chat["content"]
