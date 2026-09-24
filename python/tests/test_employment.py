"""Regression tests for the v2.0.9 employment timeline."""

from indian_fakedata import generate
from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.employment import generate_employment_timeline


def test_every_profile_has_employment_timeline():
    rows = generate(count=50)
    for r in rows:
        assert isinstance(r.get("employmentTimeline"), list)


def test_same_seed_reproduces_same_timeline():
    a = generate(count=1, seed=42)[0]["employmentTimeline"]
    b = generate(count=1, seed=42)[0]["employmentTimeline"]
    assert a == b


def test_timelines_are_chronological_with_sane_wages():
    rows = generate(count=40)
    for r in rows:
        tl = r.get("employmentTimeline") or []
        for i, s in enumerate(tl):
            assert s["jobTitle"]
            assert s["monthlyWageINR"] > 0
            assert s["location"] == r["district"]
            if i > 0:
                assert s["startYear"] >= tl[i - 1]["startYear"]
            if s["status"] == "completed":
                assert s["endYear"] is not None
                assert s["endYear"] > s["startYear"]
            else:
                assert s.get("endYear") is None
        if tl and tl[-1]["status"] == "current":
            expected = max(1000, round(r["annualIncomeINR"] / 12 / 100) * 100)
            assert tl[-1]["monthlyWageINR"] == expected


def test_children_have_empty_timeline():
    rows = generate(count=10, constraints={"ageRange": {"min": 5, "max": 10}})
    for r in rows:
        assert r["employmentTimeline"] == []


def test_student_unemployed_retired_unit():
    rng = create_rng(7)
    base = dict(age=30, education="graduate", occupation="other_worker",
                annual_income_inr=360000, district="Lucknow",
                area_type="urban", gender="male")
    assert generate_employment_timeline(employment_sector="student", rng=rng, **base) == []
    assert generate_employment_timeline(employment_sector="unemployed", rng=rng, **base) == []
    retired = generate_employment_timeline(employment_sector="retired", rng=rng,
                                           **{**base, "age": 65})
    assert len(retired) > 0
    assert all(s["status"] == "completed" for s in retired)
