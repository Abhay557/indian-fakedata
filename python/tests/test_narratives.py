"""Regression tests for the v2.0.9 narrative types."""

from indian_fakedata import generate, simulate_outcomes
from indian_fakedata import generate_narrative, generate_all_narratives
from indian_fakedata.core.sampler import create_rng


def _enriched(seed):
    profile = generate(count=1, seed=seed)[0]
    outcomes = simulate_outcomes(profile, 0.3, create_rng(seed))
    return profile, outcomes


def test_resume_is_grounded_in_profile():
    profile, outcomes = _enriched(21)
    doc = generate_narrative(profile, outcomes, "resume")
    assert doc["type"] == "resume"
    assert doc["language"] == "english"
    assert doc["metadata"]["profileId"] == profile["id"]
    assert doc["metadata"]["wordCount"] > 30
    # header prints the name uppercased
    assert profile["firstName"].upper() in doc["content"]
    assert profile["lastName"].upper() in doc["content"]
    assert "RESUME" in doc["content"]
    tl = profile.get("employmentTimeline") or []
    if tl:
        assert tl[0]["jobTitle"] in doc["content"]
    assert "phoneNumber" in doc["metadata"]["sensitiveFields"]


def test_customer_support_chat_is_hinglish_and_masked():
    profile, outcomes = _enriched(22)
    doc = generate_narrative(profile, outcomes, "customer_support_chat")
    assert doc["type"] == "customer_support_chat"
    assert doc["language"] == "hinglish"
    assert doc["metadata"]["profileId"] == profile["id"]
    assert doc["metadata"]["wordCount"] > 30
    assert profile["firstName"] in doc["content"]
    assert "Support Agent" in doc["content"]
    # phone is masked, full number never printed
    assert profile["phoneNumber"] not in doc["content"]


def test_all_narratives_appends_new_types_at_end():
    profile, outcomes = _enriched(23)
    docs = generate_all_narratives(profile, outcomes)
    assert [d["type"] for d in docs] == [
        "loan_application",
        "medical_consultation",
        "hinglish_conversation",
        "ration_card_application",
        "school_enrollment",
        "resume",
        "customer_support_chat",
    ]


def test_narratives_are_deterministic():
    profile, outcomes = _enriched(24)
    assert (generate_narrative(profile, outcomes, "resume") ==
            generate_narrative(profile, outcomes, "resume"))
