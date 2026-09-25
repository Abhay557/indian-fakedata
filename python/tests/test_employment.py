"""Regression tests for the v2.0.9 employment timeline."""

from indian_fakedata import generate
from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.employment import (
    generate_employment_timeline, FIELD_TITLES, DOCTOR_TITLES,
)


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


def test_timeline_stages_carry_profile_occupation():
    rows = generate(count=200, seed=5)
    checked = 0
    for r in rows:
        if r["occupation"] == "non_worker":
            continue
        for s in r.get("employmentTimeline") or []:
            assert s["occupation"] == r["occupation"]
            checked += 1
    assert checked > 0


def test_cultivators_get_farm_titles():
    import re
    rows = generate(count=40, seed=9, constraints={"occupation": "cultivator",
                                                  "ageRange": {"min": 25, "max": 50}})
    pat = re.compile(r"Farm|Grow|Keeper|Cutter")
    stages = 0
    for r in rows:
        for s in r.get("employmentTimeline") or []:
            assert s["occupation"] == "cultivator"
            assert pat.search(s["jobTitle"])
            stages += 1
    assert stages > 0


def test_informal_other_workers_keep_label():
    rows = generate(count=80, seed=11, constraints={"occupation": "other_worker",
                                                   "ageRange": {"min": 25, "max": 50}})
    checked = 0
    for r in rows:
        if r["employmentSector"] != "informal":
            continue
        for s in r.get("employmentTimeline") or []:
            assert s["occupation"] == "other_worker"
            checked += 1
    assert checked > 0


def test_timeline_sits_below_occupation_not_at_end():
    p = generate(count=1, seed=42)[0]
    keys = list(p.keys())
    assert keys.index("employmentTimeline") == keys.index("occupation") + 1
    assert keys.index("employmentTimeline") < keys.index("seed")


def test_current_job_matches_field_of_study():
    import re
    base = dict(age=30, education="graduate", occupation="other_worker",
                employment_sector="private", annual_income_inr=360000,
                district="Lucknow", area_type="urban", gender="male")
    # BTech-style graduate works as an engineer, never a teacher/nurse
    eng = generate_employment_timeline(field_of_study="Engineering/Technology",
                                       rng=create_rng(21), **base)
    assert len(eng) > 0
    assert re.search(r"Engineer|Technician|Draughtsman|Supervisor|Trainee",
                     eng[-1]["jobTitle"])
    # medicine without a professional degree: no doctor titles
    med = generate_employment_timeline(field_of_study="Medicine/Health",
                                       rng=create_rng(22), **base)
    assert not re.search(r"Doctor|Medical Officer", med[-1]["jobTitle"])
    # B.Ed graduate teaches
    bed = generate_employment_timeline(field_of_study="Education/B.Ed",
                                       rng=create_rng(23), **base)
    assert re.search(r"Teacher|Tutor|Anganwadi|Librarian", bed[-1]["jobTitle"])
    # professional degree unlocks the doctor pool
    doc = generate_employment_timeline(field_of_study="Medicine/Health",
                                       rng=create_rng(24),
                                       **{**base, "education": "professional_degree"})
    assert doc[-1]["jobTitle"] in FIELD_TITLES["Medicine/Health"] + DOCTOR_TITLES


def test_current_job_from_field_pool_in_the_wild():
    rows = generate(count=500, seed=21)
    checked = 0
    for r in rows:
        field = r["educationDetails"].get("fieldOfStudy")
        tl = r.get("employmentTimeline") or []
        if not field or field not in FIELD_TITLES or not tl:
            continue
        if r["occupation"] not in ("other_worker", "non_worker"):
            continue
        pool = list(FIELD_TITLES[field])
        if field == "Medicine/Health" and r["education"] == "professional_degree":
            pool += DOCTOR_TITLES
        assert tl[-1]["jobTitle"] in pool
        checked += 1
    assert checked > 0
