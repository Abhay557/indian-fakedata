"""Regression tests for v2.0.7 correctness fixes."""
from datetime import date

from indian_fakedata import generate


def test_age_matches_date_of_birth_exactly():
    """v2.0.7: DOB can no longer land after today within the birth year."""
    rows = generate(count=300)
    today = date.today()
    for r in rows:
        y, m, d = (int(x) for x in r["dateOfBirth"].split("-"))
        exact = today.year - y - ((today.month, today.day) < (m, d))
        assert exact == r["age"], (
            f"age drift: dob={r['dateOfBirth']} age={r['age']} expected={exact}")


def test_rng_no_longer_head_biased():
    """v2.0.7: states across the whole table must be reachable, not just
    the first few entries (old RNG never produced draws >= 0.5)."""
    rows = generate(count=1500)
    states = {r["state"] for r in rows}
    # 32+ states/UTs exist; biased RNG reached ~6-10 in 2000 rows
    assert len(states) >= 25, f"only {len(states)} states seen"
    religions = {r["religion"] for r in rows}
    assert {"Hindu", "Muslim", "Christian", "Sikh"} <= religions