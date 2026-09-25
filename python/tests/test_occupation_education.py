"""Occupation follows education (v2.1.0, item 6)."""

from indian_fakedata import generate

FARM = {"cultivator", "agricultural_labourer", "household_industry"}


def test_graduates_rarely_farm_mostly_white_collar():
    rows = generate(count=500, seed=77,
                    constraints={"education": "graduate",
                                 "ageRange": {"min": 25, "max": 60}})
    farm = sum(1 for r in rows if r["occupation"] in FARM)
    white = sum(1 for r in rows if r["occupation"] == "other_worker")
    assert farm < 100
    assert white > 200


def test_unschooled_skew_farm():
    rows = generate(count=500, seed=77,
                    constraints={"education": "illiterate",
                                 "ageRange": {"min": 25, "max": 60}})
    farm = sum(1 for r in rows if r["occupation"] in FARM)
    assert farm > 125


def test_explicit_occupation_constraint_wins():
    rows = generate(count=20, seed=78,
                    constraints={"education": "graduate",
                                 "occupation": "cultivator"})
    for r in rows:
        assert r["occupation"] == "cultivator"


def test_deterministic():
    def strip(rows):
        return [{k: v for k, v in r.items() if k != "generatedAt"} for r in rows]

    assert strip(generate(count=5, seed=79)) == strip(generate(count=5, seed=79))
