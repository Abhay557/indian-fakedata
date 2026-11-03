"""Tests for name conventions inside families (head, spouse, parents, kids)."""
from indian_fakedata import generate_family, generate_users


def test_father_name_ends_with_profile_surname():
    profiles = generate_users(count=200, seed=123)
    for p in profiles:
        assert p["fatherName"].split()[-1] == p["lastName"]


def test_mother_keeps_own_maiden_surname():
    profiles = generate_users(count=200, seed=123)
    for p in profiles:
        parts = p["motherName"].split()
        assert len(parts) == 2
        assert parts[0] != p["firstName"]


def test_spouse_ends_with_same_surname():
    profiles = generate_users(count=300, seed=123)
    married = 0
    for p in profiles:
        if p.get("spouseName"):
            married += 1
            assert p["spouseName"].split()[-1] == p["lastName"]
    assert married > 50


def test_everyone_except_mother_shares_head_surname():
    family = generate_family(seed=2024)
    head = family["head"]

    members = [family["spouse"], family["parents"].get("father")]
    members += family["children"]
    members += family["siblings"]
    members = [m for m in members if m]

    for member in members:
        assert member["lastName"] == head["lastName"]


def test_children_are_younger_than_head():
    family = generate_family(seed=2024)
    for child in family["children"]:
        assert child["age"] < family["head"]["age"]


def _strip_timestamp(member):
    """The generatedAt timestamp is wall-clock time, so ignore it."""
    if isinstance(member, dict):
        return {k: _strip_timestamp(v) for k, v in member.items() if k != "generatedAt"}
    if isinstance(member, list):
        return [_strip_timestamp(v) for v in member]
    return member


def test_family_is_reproducible_for_same_seed():
    first = _strip_timestamp(generate_family(seed=42))
    second = _strip_timestamp(generate_family(seed=42))
    assert first == second
