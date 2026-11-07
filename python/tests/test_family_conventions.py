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


def test_family_is_reproducible_for_same_seed():
    assert generate_family(seed=42) == generate_family(seed=42)


def test_male_profiles_never_marry_below_21():
    profiles = generate_users(
        count=100, seed=404,
        constraints={"gender": "male", "ageRange": {"min": 18, "max": 20}},
    )
    assert all(p["maritalStatus"] == "never_married" for p in profiles)


def test_generations_have_a_legal_age_gap():
    for seed in range(20):
        family = generate_family(seed=seed, constraints={"ageRange": {"min": 20, "max": 60}})
        head = family["head"]
        assert family["parents"]["father"]["age"] - head["age"] >= 21
        assert family["parents"]["mother"]["age"] - head["age"] >= 18
        min_parent_age = 21 if head["gender"] == "male" else 18
        for child in family["children"]:
            assert head["age"] - child["age"] >= min_parent_age
        spouse = family["spouse"]
        if spouse and spouse["gender"] == "male":
            assert spouse["age"] >= 21
