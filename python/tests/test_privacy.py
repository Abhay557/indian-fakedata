"""Regression tests for the v2.0.9 strip_pii helper."""

from indian_fakedata import generate, strip_pii, validate_profile, PII_FIELDS


def test_empties_identifiers_keeps_shape_and_provenance():
    p = generate(count=1, seed=61)[0]
    clean = strip_pii(p)
    for f in PII_FIELDS:
        assert clean[f] == ""
    assert clean["piiStripped"] is True
    # provenance retained
    assert clean["synthetic"] is True
    assert clean["generator"] == p["generator"]
    # everything else identical
    assert clean["firstName"] == p["firstName"]
    assert clean["district"] == p["district"]
    assert clean["employmentTimeline"] == p["employmentTimeline"]
    # input never mutated
    assert len(p["phoneNumber"]) > 0
    assert "piiStripped" not in p


def test_mask_names_replaces_with_initials():
    p = generate(count=1, seed=61)[0]
    clean = strip_pii(p, mask_names=True)
    assert clean["firstName"] == p["firstName"][0] + "."
    assert p["lastName"] not in clean["lastName"]
    assert "." in clean["fatherName"]


def test_stripped_copies_fail_strict_validation():
    p = generate(count=1, seed=61)[0]
    assert validate_profile(p)["valid"] is True
    clean = strip_pii(p)
    result = validate_profile(clean)
    assert result["valid"] is False
    assert "aadhaarNumber" in "|".join(result["errors"])
