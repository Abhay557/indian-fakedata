"""Range and structure tests for the smaller profile blocks."""
from indian_fakedata import generate, generate_persona


def test_personality_scores_are_integers_between_1_and_100():
    profiles = generate(count=200, seed=55)
    keys = ("openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism")
    for p in profiles:
        for key in keys:
            score = p["personality"][key]
            assert isinstance(score, int)
            assert 1 <= score <= 100


def test_cognitive_scores_are_integers_between_1_and_100():
    profiles = generate(count=200, seed=13)
    keys = ("aptitudeScore", "numeracyScore", "literacyScore",
            "digitalLiteracyScore", "financialLiteracyScore")
    for p in profiles:
        for key in keys:
            score = p["cognitiveProfile"][key]
            assert isinstance(score, int)
            assert 1 <= score <= 100


def test_cultural_scores_are_integers_between_1_and_100():
    profiles = generate(count=200, seed=41)
    keys = ("entrepreneurialScore", "academicOrientation", "artisticInclination",
            "militaryTradition", "agriculturalRootedness", "artisanTradition",
            "bureaucraticOrientation", "socialActivism", "communityBonding",
            "migrationTendency", "savingsOrientation", "riskAppetite")
    for p in profiles:
        for key in keys:
            score = p["culturalProfile"][key]
            assert isinstance(score, int)
            assert 1 <= score <= 100


def test_habits_values_are_valid():
    profiles = generate(count=200, seed=31)
    for p in profiles:
        habits = p["habits"]
        assert habits["tobaccoUse"] in ("none", "smoking", "chewing", "both")
        assert habits["alcoholUse"] in ("none", "occasional", "regular", "heavy")
        assert habits["exerciseFrequency"] in ("daily", "weekly", "occasional", "never")
        assert habits["chronotype"] in ("early_riser", "moderate", "night_owl")
        assert 4 <= habits["avgSleepHours"] <= 12


def test_interests_values_are_valid():
    profiles = generate(count=200, seed=17)
    sports = {"cricket", "kabaddi", "football", "badminton", "volleyball",
              "hockey", "athletics", "wrestling", "none", "kho_kho",
              "carrom", "chess", "boxing"}
    pets = {"dogs", "cats", "birds", "fish", "none"}
    for p in profiles:
        interests = p["interests"]
        assert interests["primarySport"] in sports
        assert interests["petPreference"] in pets
        assert len(interests["entertainment"]) > 0
        assert interests["readingHabit"] in ("avid_reader", "occasional", "rare", "non_reader")

        if p["hasSmartphone"] and p["age"] >= 13:
            assert interests.get("preferredSocialMedia") is not None
        else:
            assert interests.get("preferredSocialMedia") is None


def test_persona_has_all_expected_parts():
    user, persona = generate_persona(seed=2024)["user"], generate_persona(seed=2024)["persona"]
    assert persona["systemPrompt"]
    assert persona["fullPrompt"]
    assert persona["identityLine"]
    assert persona["beliefs"]
    assert persona["memorySeeds"]
    assert persona["behaviorRules"]
    assert persona["communicationStyle"]
    assert persona["profileId"] == user["id"]
    assert persona["nationalPrevalence"] > 0
