"""
Relational / Family Generation

Given a seed (numeric or string, e.g. "011"), generates the head
profile plus its relational household:

    head -> spouse   (if married/widowed, matching surname & age)
         -> parents  (father + mother, older, same community)
         -> children (age-appropriate, matching surname)
         -> siblings (0-2, overlapping ages, same community)

All relatives are derived deterministically from the SAME seed, so
generate_family(seed="011") always reproduces the same family.
"""

import math

from indian_fakedata.utils.generator import generate
from indian_fakedata.core.sampler import create_rng, normalize_seed


def _role_seed(base, role, index=0):
    """Deterministic sub-seed for a family role derived from the base seed.
    FNV-1a of the role string — distinct roles never share a stream."""
    h = 0x811C9DC5
    for ch in str(role):
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    mix = (h ^ ((index + 1) * 0x9E3779B9) ^ base) & 0xFFFFFFFF
    return mix


def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def generate_family(seed=None, constraints=None, max_siblings=2,
                    include_probability_metrics=True, data_dir=None):
    """
    Generate a full relational household from a single seed.

    Returns a dict with keys: head, spouse, parents, children, siblings.
    """
    base = normalize_seed(seed)
    base_constraints = dict(constraints) if constraints else {}

    head = generate(
        count=1, seed=base, constraints=base_constraints,
        include_probability_metrics=include_probability_metrics,
    )[0]

    head_surname = head["lastName"]
    community = {
        "religion": head["religion"],
        "state": head["state"],
        "caste": head["caste"],
        "surname": head_surname,
    }

    family = {"head": head, "spouse": None, "parents": {}, "children": [], "siblings": []}

    # ── Spouse ────────────────────────────────────────────────
    if head.get("maritalStatus") in ("married", "widowed"):
        spouse_gender = "female" if head["gender"] == "male" else "male"
        spouse = generate(
            count=1, seed=_role_seed(base, "spouse"),
            constraints={
                **community,
                "gender": spouse_gender,
                "ageRange": {
                    "min": _clamp(head["age"] - 5, 18, 100),
                    "max": _clamp(head["age"] + 5, 18, 100),
                },
                "maritalStatus": "married",
            },
            include_probability_metrics=include_probability_metrics,
        )[0]
        spouse_tokens = (head.get("spouseName") or "").split()
        if spouse_tokens:
            spouse["firstName"] = spouse_tokens[0]
            spouse["lastName"] = " ".join(spouse_tokens[1:]) or head_surname
        family["spouse"] = spouse

    # ── Parents ───────────────────────────────────────────────
    parent_rng = create_rng(_role_seed(base, "parents"))
    father_age = _clamp(head["age"] + 20 + int(round(parent_rng.next() * 25)), 38, 100)
    mother_age = _clamp(head["age"] + 16 + int(round(parent_rng.next() * 24)), 34, 100)

    father_tokens = (head.get("fatherName") or "").split()
    mother_tokens = (head.get("motherName") or "").split()

    father = generate(
        count=1, seed=_role_seed(base, "father"),
        constraints={
            **community, "gender": "male",
            "ageRange": {"min": father_age - 2, "max": father_age + 2},
            "maritalStatus": "married",
        },
        include_probability_metrics=include_probability_metrics,
    )[0]
    if father_tokens:
        father["firstName"] = father_tokens[0]
        father["lastName"] = " ".join(father_tokens[1:]) or head_surname
    family["parents"]["father"] = father

    mother = generate(
        count=1, seed=_role_seed(base, "mother"),
        constraints={
            **community, "gender": "female",
            "ageRange": {"min": mother_age - 2, "max": mother_age + 2},
            "maritalStatus": "married",
        },
        include_probability_metrics=include_probability_metrics,
    )[0]
    if mother_tokens:
        mother["firstName"] = mother_tokens[0]
        mother["lastName"] = " ".join(mother_tokens[1:]) or head_surname
    family["parents"]["mother"] = mother

    if head.get("fatherName"):
        mother["spouseName"] = head["fatherName"]
    if head.get("motherName"):
        father["spouseName"] = head["motherName"]

    # ── Children ──────────────────────────────────────────────
    child_count = 0 if head.get("maritalStatus") == "never_married" else head.get("numberOfChildren", 0)
    max_child_age = _clamp(head["age"] - 16, 0, 100)
    for i in range(child_count):
        child_rng = create_rng(_role_seed(base, "child", i))
        child_age = _clamp(
            max(0, max_child_age - int(round(child_rng.next() * 8))), 0, max_child_age
        )
        child_gender = "male" if child_rng.next() < 0.5 else "female"
        child = generate(
            count=1, seed=_role_seed(base, "child", i),
            constraints={
                **community, "gender": child_gender,
                "ageRange": {"min": max(0, child_age - 2), "max": child_age + 2},
                "maritalStatus": "never_married",
            },
            include_probability_metrics=include_probability_metrics,
        )[0]
        child["lastName"] = head_surname
        if head["gender"] == "female":
            child["motherName"] = f"{head['firstName']} {head['lastName']}"
        else:
            child["fatherName"] = f"{head['firstName']} {head['lastName']}"
        family["children"].append(child)

    # ── Siblings ──────────────────────────────────────────────
    sibling_rng = create_rng(_role_seed(base, "siblings"))
    sibling_count = min(max_siblings, int(math.floor(sibling_rng.next() * 3)))
    for i in range(sibling_count):
        sibling_gender = "male" if sibling_rng.next() < 0.5 else "female"
        sibling_age = _clamp(head["age"] - 15 + int(round(sibling_rng.next() * 25)), 0, 100)
        sibling = generate(
            count=1, seed=_role_seed(base, "sibling", i),
            constraints={
                **community, "gender": sibling_gender,
                "ageRange": {"min": max(0, sibling_age - 2), "max": sibling_age + 2},
            },
            include_probability_metrics=include_probability_metrics,
        )[0]
        sibling["lastName"] = head_surname
        if head.get("fatherName"):
            sibling["fatherName"] = head["fatherName"]
        if head.get("motherName"):
            sibling["motherName"] = head["motherName"]
        family["siblings"].append(sibling)

    return family