"""Regression tests for the v2.0.9 strip_pii helper."""

from indian_fakedata import (
    generate,
    generate_family,
    strip_pii,
    strip_family_pii,
    redact_pii,
    validate_profile,
    PII_FIELDS,
)


def test_empties_identifiers_keeps_shape_and_provenance():
    p = generate(count=1, seed=61)[0]
    clean = strip_pii(p)
    for f in PII_FIELDS:
        assert clean[f] == ""
    assert clean["geo"] == {"latitude": 0, "longitude": 0}
    assert clean["nativeScript"]["addressLine"] == ""
    assert len(p["nativeScript"]["addressLine"]) > 0
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
    assert "." in clean["nativeScript"]["firstName"]
    assert clean["nativeScript"]["firstName"] != p["nativeScript"]["firstName"]
    assert clean["nativeScript"]["lastName"] != p["nativeScript"]["lastName"]


def test_strips_every_member_of_a_family_unit():
    family = generate_family(seed=7)
    original_phone = family["head"]["phoneNumber"]
    clean = strip_family_pii(family)
    members = [
        clean["head"],
        clean.get("spouse"),
        clean["parents"].get("father"),
        clean["parents"].get("mother"),
        *clean["children"],
        *clean["siblings"],
    ]
    members = [member for member in members if member]

    assert len(members) > 1
    for member in members:
        assert member["aadhaarNumber"] == ""
        assert member["phoneNumber"] == ""
        assert member["piiStripped"] is True
    assert family["head"]["phoneNumber"] == original_phone


def test_redacts_identifiers_from_generated_text():
    p = generate(count=1, seed=61)[0]
    spaced = " ".join(p["aadhaarNumber"][i:i + 4] for i in range(0, 12, 4))
    text = "\n".join([
        f"Aadhaar: {p['aadhaarNumber']} ({spaced})",
        f"PAN: {p['panNumber']}",
        f"Voter: {p['voterIdNumber']}",
        f"Phone: +91 {p['phoneNumber']}",
        f"Email: {p['email']}",
        f"Account: {p['bankAccountNumber']}",
        f"Address: {p['addressLine']}",
        f"PIN: {p['pinCode']}",
        f"UPI: {p.get('upiId') or ''}",
    ])
    clean = redact_pii(text, p)
    assert "[REDACTED]" in clean
    for value in [
        p["aadhaarNumber"], p["panNumber"], p["voterIdNumber"],
        p["phoneNumber"], p["email"], p["bankAccountNumber"],
        p["addressLine"], p["pinCode"], p.get("upiId"),
    ]:
        if value:
            assert value not in clean


def test_redacts_patterns_without_profile():
    clean = redact_pii("Call 9876543210 or mail a@b.com")
    assert clean == "Call [REDACTED] or mail [REDACTED]"


def test_mask_names_applies_to_generated_text():
    p = generate(count=1, seed=61)[0]
    clean = redact_pii(f"Hello {p['firstName']} {p['lastName']}", p, mask_names=True)
    assert p["firstName"] not in clean
    assert p["lastName"] not in clean
    assert p["firstName"][0] + "." in clean


def test_stripped_copies_fail_strict_validation():
    p = generate(count=1, seed=61)[0]
    assert validate_profile(p)["valid"] is True
    clean = strip_pii(p)
    result = validate_profile(clean)
    assert result["valid"] is False
    assert "aadhaarNumber" in "|".join(result["errors"])
