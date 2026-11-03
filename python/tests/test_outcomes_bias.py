"""Tests for the outcome bias dial and the value ranges it produces."""
from indian_fakedata import generate, generate_user
from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.outcomes import simulate_outcomes


def _make_profiles(social_category, count):
    """Make a few profiles for the given social category."""
    profiles = []
    for i in range(count):
        profile = generate(count=1, seed=i + 1,
                           constraints={"socialCategory": social_category})[0]
        profiles.append(profile)
    return profiles


def _simulate(profile, bias_level):
    rng = create_rng(1000 + profile["seed"])
    return simulate_outcomes(profile, bias_level, rng)


def _average_credit(profiles, bias_level):
    total = 0
    for profile in profiles:
        total += _simulate(profile, bias_level)["credit"]["creditScore"]
    return total / len(profiles)


def test_at_bias_zero_sc_and_general_have_similar_credit():
    general = _make_profiles("General", 150)
    sc = _make_profiles("SC", 150)
    diff = abs(_average_credit(general, 0) - _average_credit(sc, 0))
    assert diff < 25


def test_at_bias_one_sc_credit_is_clearly_lower():
    general = _make_profiles("General", 150)
    sc = _make_profiles("SC", 150)
    diff = _average_credit(general, 1) - _average_credit(sc, 1)
    assert diff > 25


def test_caste_penalty_is_recorded_exactly():
    sc = _make_profiles("SC", 1)[0]
    general = _make_profiles("General", 1)[0]

    at_zero = _simulate(sc, 0)["_biasAuditTrail"]["credit_caste_penalty"]
    at_one = _simulate(sc, 1)["_biasAuditTrail"]["credit_caste_penalty"]
    general_at_one = _simulate(general, 1)["_biasAuditTrail"]["credit_caste_penalty"]

    assert at_zero == 0
    assert at_one == -65
    assert general_at_one == 0


def test_muslim_religion_penalty_applies():
    muslim = generate_user(seed=42, constraints={"religion": "Muslim"})
    trail = _simulate(muslim, 1)["_biasAuditTrail"]
    assert trail["credit_religion_penalty"] == -30


def test_wage_gap_ratio_follows_caste_and_gender_tables():
    male_general = generate_user(seed=5, constraints={"socialCategory": "General", "gender": "male"})
    female_sc = generate_user(seed=6, constraints={"socialCategory": "SC", "gender": "female"})

    assert _simulate(male_general, 0)["employment"]["wageGapRatio"] == 1.0
    assert _simulate(male_general, 1)["employment"]["wageGapRatio"] == 1.0

    female_sc_at_one = _simulate(female_sc, 1)["employment"]["wageGapRatio"]
    assert abs(female_sc_at_one - 0.73 * 0.78) < 0.01

    female_sc_at_zero = _simulate(female_sc, 0)["employment"]["wageGapRatio"]
    assert abs(female_sc_at_zero - 1.0) < 0.01


def test_outcome_values_stay_within_limits():
    profiles = generate(count=100, seed=13)
    for profile in profiles:
        result = _simulate(profile, 0.3)

        credit = result["credit"]
        assert 300 <= credit["creditScore"] <= 900
        assert 0.02 <= credit["loanApprovalProbability"] <= 0.97

        health = result["health"]
        assert 0 <= health["healthRiskScore"] <= 100
        assert health["bmiCategory"] in ("underweight", "normal", "overweight", "obese")
        assert 0.1 <= health["healthcareAccessProbability"] <= 0.98

        education = result["education"]
        assert 0 <= education["functionalLiteracy"] <= 100
        assert 0 <= education["dropoutRisk"] <= 0.95
        assert 0.05 <= education["educationalMobility"] <= 0.95

        employment = result["employment"]
        assert employment["employmentQuality"] in (
            "formal_high", "formal_mid", "formal_low",
            "informal", "underemployed", "unemployed")
        assert 3000 <= employment["expectedMonthlyWageINR"] <= 500000
        assert 0.5 <= employment["wageGapRatio"] <= 1.0
        assert 0 <= employment["vulnerabilityIndex"] <= 0.95
