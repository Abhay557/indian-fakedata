"""Regression tests for the v2.0.9 skills block."""

from indian_fakedata import generate

LEVELS = {"basic", "intermediate", "fluent", "native"}


def test_every_profile_has_valid_skills():
    rows = generate(count=50)
    for r in rows:
        s = r.get("skills")
        assert s is not None
        assert isinstance(s["technical"], list)
        assert isinstance(s["soft"], list)
        assert isinstance(s["certifications"], list)
        assert len(s["languages"]) >= 1
        # mother tongue first, always native speaking
        assert s["languages"][0]["language"] == r["motherTongue"]
        assert s["languages"][0]["speaking"] == "native"
        for lang in s["languages"]:
            assert lang["speaking"] in LEVELS
            assert lang["reading"] in LEVELS
            assert lang["writing"] in LEVELS


def test_same_seed_reproduces_same_skills():
    a = generate(count=1, seed=42)[0]["skills"]
    b = generate(count=1, seed=42)[0]["skills"]
    assert a == b


def test_children_get_languages_but_no_technical():
    rows = generate(count=10, constraints={"ageRange": {"min": 5, "max": 10}})
    for r in rows:
        assert r["skills"]["technical"] == []
        assert len(r["skills"]["languages"]) >= 1


def test_graduates_tend_to_hold_computer_skills():
    import re
    rows = generate(count=60, seed=11, constraints={"education": "graduate",
                                                   "ageRange": {"min": 25, "max": 40}})
    pat = re.compile(r"computer|excel|tally|data|typing|internet", re.I)
    with_computer = [r for r in rows
                     if any(pat.search(t) for t in r["skills"]["technical"])]
    assert len(with_computer) > len(rows) / 2
