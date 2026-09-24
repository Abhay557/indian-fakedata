"""Regression tests for the v2.0.9 schema + validator."""

from indian_fakedata import generate, validate_profile, get_profile_schema


def test_generated_profiles_validate_clean():
    rows = generate(count=20, seed=55)
    for r in rows:
        result = validate_profile(r)
        assert result["errors"] == []
        assert result["valid"] is True
    # minors carry empty PAN/voter ID but must still validate
    kids = generate(count=5, seed=56, constraints={"ageRange": {"min": 5, "max": 10}})
    for k in kids:
        assert validate_profile(k)["valid"] is True


def test_flags_missing_fields_bad_enums_broken_provenance():
    p = generate(count=1, seed=55)[0]
    del p["firstName"]
    p["gender"] = "unknown"
    p["synthetic"] = False
    result = validate_profile(p)
    assert result["valid"] is False
    joined = "|".join(result["errors"])
    assert "firstName" in joined
    assert "gender" in joined
    assert "synthetic" in joined


def test_rejects_non_objects_and_reports_nested_problems():
    assert validate_profile(None)["valid"] is False
    assert validate_profile([])["valid"] is False
    p = generate(count=1, seed=55)[0]
    del p["appearance"]["skinTone"]
    p["employmentTimeline"] = [{"nope": 1}]
    errors = validate_profile(p)["errors"]
    joined = "|".join(errors)
    assert "appearance is missing: skinTone" in joined
    assert "employmentTimeline[0]" in joined


def test_versioned_machine_readable_schema():
    schema = get_profile_schema()
    assert schema["title"] == "DemographicProfile"
    assert "2.0.9" in schema["$id"]
    assert "firstName" in schema["required"]
    assert "synthetic" in schema["required"]
    assert "female" in schema["properties"]["gender"]["enum"]
