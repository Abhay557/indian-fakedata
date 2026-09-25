"""Tests for the SFT pair builder (v2.1.0, item 7)."""

import json

from indian_fakedata import (
    generate, simulate_outcomes, generate_all_narratives,
    build_sft_pairs, sft_pairs_to_jsonl,
)
from indian_fakedata.core.sampler import create_rng


def test_five_grounded_persona_pairs():
    p = generate(count=1, seed=71)[0]
    pairs = build_sft_pairs(p)
    assert len(pairs) == 5
    for pair in pairs:
        assert len(pair["instruction"]) > 0
        assert len(pair["output"]) > 0
        assert pair["source"] == "persona"
    blob = " ".join(x["output"] for x in pairs)
    assert p["firstName"] in blob
    assert p["district"] in blob


def test_narrative_comprehension_pairs():
    p = generate(count=1, seed=72)[0]
    outcomes = simulate_outcomes(p, 0.3, create_rng(72))
    docs = generate_all_narratives(p, outcomes)
    pairs = build_sft_pairs(p, docs)
    assert len(pairs) == 5 + len(docs)
    for pair in pairs[5:]:
        assert len(pair["input"]) > 50
        assert p["firstName"] in pair["output"]
    assert len({r["source"] for r in pairs[5:]}) == len(docs)


def test_jsonl_round_trip():
    p = generate(count=1, seed=73)[0]
    text = sft_pairs_to_jsonl(build_sft_pairs(p))
    lines = text.strip().split("\n")
    assert len(lines) == 5
    for line in lines:
        row = json.loads(line)
        assert row["instruction"] and row["output"] and row["source"]
    assert sft_pairs_to_jsonl([]) == ""


def test_deterministic():
    p = generate(count=1, seed=74)[0]
    assert build_sft_pairs(p) == build_sft_pairs(p)
