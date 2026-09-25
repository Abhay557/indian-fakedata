"""Unit tests for the life events timeline (v2.1.0, item 3)."""

from indian_fakedata import generate
from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.life_events import generate_life_events

BASE = dict(
    age=40,
    date_of_birth="1986-01-04",
    marital_status="married",
    number_of_children=2,
    spouse_name="Kishan Das",
    is_migrant=True,
    migration_origin_state="Karnataka",
    state="Andhra Pradesh",
    district="Guntur",
    employment_sector="private",
    employment_timeline=[
        {"jobTitle": "Data Entry Operator", "sector": "private",
         "occupation": "other_worker", "employerType": "private",
         "startYear": 2007, "endYear": 2009, "status": "completed",
         "monthlyWageINR": 48000, "location": "Guntur"},
        {"jobTitle": "Sales Executive", "sector": "private",
         "occupation": "other_worker", "employerType": "private",
         "startYear": 2009, "status": "current",
         "monthlyWageINR": 102900, "location": "Guntur"},
    ],
    current_year=2026,
)


def test_consistent_chronological_timeline():
    ev = generate_life_events(rng=create_rng(11), **BASE)
    years = [e["year"] for e in ev]
    assert ev[0] == {"year": 1986, "event": "born", "detail": "Born in Guntur."}
    assert years == sorted(years)
    assert all(1986 <= y <= 2026 for y in years)
    married = next(e for e in ev if e["event"] == "married")
    assert "Kishan Das" in married["detail"]
    kids = [e for e in ev if e["event"] == "child_born"]
    assert len(kids) == 2
    assert kids[0]["year"] > married["year"]
    mig = next(e for e in ev if e["event"] == "migrated")
    assert "Karnataka" in mig["detail"] and "Andhra Pradesh" in mig["detail"]
    jobs = [e for e in ev if e["event"] in ("job_started", "job_changed")]
    assert [j["year"] for j in jobs] == [2007, 2009]


def test_young_single_non_migrant_gets_only_birth():
    ev = generate_life_events(
        rng=create_rng(12),
        **{**BASE, "age": 10, "date_of_birth": "2016-05-01",
           "marital_status": "never_married", "number_of_children": 0,
           "is_migrant": False, "migration_origin_state": None,
           "employment_sector": "student", "employment_timeline": []},
    )
    assert ev == [{"year": 2016, "event": "born", "detail": "Born in Guntur."}]


def test_deterministic():
    a = generate_life_events(rng=create_rng(13), **BASE)
    assert generate_life_events(rng=create_rng(13), **BASE) == a


def test_consistent_across_generated_profiles():
    rows = generate(count=300, seed=41)
    for r in rows:
        tl = r.get("lifeEvents") or []
        assert len(tl) > 0
        birth_year = int(str(r["dateOfBirth"])[:4])
        years = [e["year"] for e in tl]
        assert years == sorted(years)
        assert all(y >= birth_year for y in years)
        # job events mirror the employment timeline exactly
        job_years = [e["year"] for e in tl
                     if e["event"] in ("job_started", "job_changed")]
        assert job_years == [s["startYear"] for s in r.get("employmentTimeline") or []]
        # every child is recorded, all born after the wedding
        kids = [e for e in tl if e["event"] == "child_born"]
        assert len(kids) == r["numberOfChildren"]
        wedding = next((e for e in tl if e["event"] == "married"), None)
        if wedding and kids:
            assert kids[0]["year"] > wedding["year"]
        # migrants record the move from the right origin
        if r["isMigrant"] and r.get("migrationOriginState"):
            mig = next((e for e in tl if e["event"] == "migrated"), None)
            assert mig is not None
            assert r["migrationOriginState"] in mig["detail"]
