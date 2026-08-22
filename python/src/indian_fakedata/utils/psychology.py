"""
Psychology, Personality & Behavioral Generator

Generates psychographic and behavioral attributes with real-world
statistical biases from actual survey data:

Sources:
- Political: CSDS/Lokniti National Election Studies (2014, 2019, 2024)
- Religiosity: Pew Research Center "Religion in India" (2021)
- Habits: NFHS-5 (2019-21) — tobacco, alcohol by state/gender/religion
- Personality: Cross-cultural Big Five studies (Schmitt et al. 2007)
- Education: AISHE (2020-21) enrollment data
- Cognitive: ASER reports, NFHS-5 nutrition + education access
- Interests: BARC India viewership, ICC surveys
"""

import math
from indian_fakedata.core.sampler import (
    weighted_sample, weighted_sample_from_record, bernoulli_sample,
    gaussian_sample, uniform_sample,
)


def _clamp_score(val):
    return round(max(1, min(100, val)))


# ═══════════════════════════════════════════════════════════════
# 1. POLITICAL LEANING
# ═══════════════════════════════════════════════════════════════

def generate_political_leaning(religion_id, state_id, social_category, education, age, area_type, rng):
    """Political leaning correlated with religion, caste, state, education, area."""
    base_dists = {
        'hindu': {'nationalist_right': 0.38, 'centre_right': 0.18, 'centrist': 0.12, 'centre_left': 0.08, 'leftist': 0.03, 'regionalist': 0.11, 'apolitical': 0.10},
        'muslim': {'nationalist_right': 0.04, 'centre_right': 0.06, 'centrist': 0.22, 'centre_left': 0.18, 'leftist': 0.08, 'regionalist': 0.28, 'apolitical': 0.14},
        'christian': {'nationalist_right': 0.08, 'centre_right': 0.12, 'centrist': 0.20, 'centre_left': 0.15, 'leftist': 0.05, 'regionalist': 0.30, 'apolitical': 0.10},
        'sikh': {'nationalist_right': 0.18, 'centre_right': 0.12, 'centrist': 0.15, 'centre_left': 0.10, 'leftist': 0.05, 'regionalist': 0.30, 'apolitical': 0.10},
        'buddhist': {'nationalist_right': 0.06, 'centre_right': 0.08, 'centrist': 0.15, 'centre_left': 0.25, 'leftist': 0.15, 'regionalist': 0.20, 'apolitical': 0.11},
        'jain': {'nationalist_right': 0.50, 'centre_right': 0.20, 'centrist': 0.10, 'centre_left': 0.05, 'leftist': 0.02, 'regionalist': 0.05, 'apolitical': 0.08},
    }
    dist = dict(base_dists.get(religion_id, {'nationalist_right': 0.20, 'centre_right': 0.15, 'centrist': 0.20, 'centre_left': 0.15, 'leftist': 0.10, 'regionalist': 0.10, 'apolitical': 0.10}))

    # Caste modifiers
    if religion_id == 'hindu':
        if social_category == 'General':
            dist['nationalist_right'] *= 1.4; dist['centre_right'] *= 1.2; dist['centre_left'] *= 0.6
        elif social_category == 'OBC':
            dist['nationalist_right'] *= 1.15; dist['regionalist'] *= 1.1
        elif social_category == 'SC':
            dist['centre_left'] *= 1.5; dist['leftist'] *= 1.3; dist['nationalist_right'] *= 0.75
        elif social_category == 'ST':
            dist['regionalist'] *= 1.4; dist['leftist'] *= 1.5; dist['nationalist_right'] *= 0.6

    # State modifiers
    regionalist_states = ['tamil_nadu', 'andhra_pradesh', 'telangana', 'west_bengal', 'odisha', 'punjab', 'jammu_kashmir', 'sikkim', 'meghalaya', 'nagaland', 'mizoram', 'manipur', 'tripura']
    if state_id in regionalist_states:
        dist['regionalist'] *= 1.8; dist['nationalist_right'] *= 0.6
    if state_id == 'kerala':
        dist['leftist'] *= 3.0; dist['centre_left'] *= 2.0; dist['nationalist_right'] *= 0.4
    hindi_belt = ['uttar_pradesh', 'bihar', 'madhya_pradesh', 'rajasthan', 'haryana', 'gujarat', 'chhattisgarh', 'jharkhand']
    if state_id in hindi_belt:
        dist['nationalist_right'] *= 1.3; dist['regionalist'] *= 0.5

    # Age / Education modifiers
    if age < 30:
        dist['nationalist_right'] *= 1.15; dist['apolitical'] *= 0.8
    elif age > 60:
        dist['centrist'] *= 1.2; dist['apolitical'] *= 1.3

    high_edu = ['graduate', 'postgraduate', 'professional_degree']
    if education in high_edu:
        dist['centrist'] *= 1.2; dist['centre_left'] *= 1.1; dist['apolitical'] *= 0.7
    if education == 'illiterate':
        dist['apolitical'] *= 2.0

    key, _ = weighted_sample_from_record(dist, rng)
    return key


# ═══════════════════════════════════════════════════════════════
# 2. RELIGIOSITY
# ═══════════════════════════════════════════════════════════════

def generate_religiosity(religion_id, gender, age, education, area_type, rng):
    """Religiosity level from Pew Research Center 'Religion in India' (2021)."""
    base_dists = {
        'muslim': {'very_religious': 0.77, 'somewhat_religious': 0.17, 'not_very_religious': 0.04, 'not_at_all_religious': 0.02},
        'hindu': {'very_religious': 0.64, 'somewhat_religious': 0.24, 'not_very_religious': 0.08, 'not_at_all_religious': 0.04},
        'christian': {'very_religious': 0.68, 'somewhat_religious': 0.22, 'not_very_religious': 0.07, 'not_at_all_religious': 0.03},
        'sikh': {'very_religious': 0.69, 'somewhat_religious': 0.21, 'not_very_religious': 0.07, 'not_at_all_religious': 0.03},
        'buddhist': {'very_religious': 0.52, 'somewhat_religious': 0.30, 'not_very_religious': 0.12, 'not_at_all_religious': 0.06},
        'jain': {'very_religious': 0.92, 'somewhat_religious': 0.06, 'not_very_religious': 0.015, 'not_at_all_religious': 0.005},
    }
    dist = dict(base_dists.get(religion_id, {'very_religious': 0.50, 'somewhat_religious': 0.30, 'not_very_religious': 0.12, 'not_at_all_religious': 0.08}))

    if gender == 'female':
        dist['very_religious'] *= 1.1; dist['not_at_all_religious'] *= 0.7
    if age > 50:
        dist['very_religious'] *= 1.2; dist['not_at_all_religious'] *= 0.5
    elif age < 25:
        dist['very_religious'] *= 0.85; dist['not_very_religious'] *= 1.3; dist['not_at_all_religious'] *= 1.5
    if area_type == 'rural':
        dist['very_religious'] *= 1.1; dist['not_at_all_religious'] *= 0.6

    high_edu = ['graduate', 'postgraduate', 'professional_degree']
    if education in high_edu:
        dist['not_very_religious'] *= 1.3; dist['not_at_all_religious'] *= 1.5; dist['very_religious'] *= 0.9

    key, _ = weighted_sample_from_record(dist, rng)
    return key


# ═══════════════════════════════════════════════════════════════
# 3. PERSONALITY (Big Five / OCEAN)
# ═══════════════════════════════════════════════════════════════

def generate_personality(gender, age, education, area_type, religiosity, occupation, rng):
    """Big Five personality traits with demographic correlations."""
    o_mean, c_mean, e_mean, a_mean, n_mean = 50, 52, 50, 55, 48
    stddev = 12

    if gender == 'female':
        a_mean += 4; n_mean += 5; e_mean += 1
    elif gender == 'male':
        o_mean += 2; e_mean += 2

    if age < 25:
        e_mean += 5; a_mean -= 3; o_mean += 3; n_mean += 3
    elif age > 50:
        c_mean += 4; a_mean += 4; n_mean -= 4; e_mean -= 3

    high_edu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma']
    if education in high_edu:
        o_mean += 8; c_mean += 5; n_mean -= 2
    elif education in ('illiterate', 'literate_below_primary'):
        o_mean -= 8; c_mean -= 3; a_mean += 3

    if area_type == 'urban':
        o_mean += 4; e_mean += 2
    else:
        a_mean += 3; c_mean += 2

    if religiosity == 'very_religious':
        a_mean += 5; c_mean += 4; o_mean -= 5; n_mean -= 2
    elif religiosity == 'not_at_all_religious':
        o_mean += 5; a_mean -= 3

    if occupation in ('cultivator', 'agricultural_labourer'):
        a_mean += 3; o_mean -= 4; c_mean += 2

    return {
        "openness": _clamp_score(gaussian_sample(o_mean, stddev, rng)),
        "conscientiousness": _clamp_score(gaussian_sample(c_mean, stddev, rng)),
        "extraversion": _clamp_score(gaussian_sample(e_mean, stddev, rng)),
        "agreeableness": _clamp_score(gaussian_sample(a_mean, stddev, rng)),
        "neuroticism": _clamp_score(gaussian_sample(n_mean, stddev, rng)),
    }


# ── Descriptive traits derived from Big Five (v2.0.3) ──
# Purely deterministic: derives from the OCEAN scores, so it never
# disturbs the seeded draw sequence.

_TRAIT_MAP = {
    'openness': {
        'high': {'label': 'open-minded', 'strength': 'creative and curious', 'weakness': 'easily distracted by new ideas'},
        'low': {'label': 'practical', 'strength': 'prefers familiar routines', 'weakness': 'resistant to new ideas'},
    },
    'conscientiousness': {
        'high': {'label': 'disciplined', 'strength': 'organized and punctual', 'weakness': 'perfectionist, can be rigid'},
        'low': {'label': 'easy-going', 'strength': 'adapts to change quickly', 'weakness': 'procrastinates under pressure'},
    },
    'extraversion': {
        'high': {'label': 'outgoing', 'strength': 'warm and sociable', 'weakness': 'needs company to feel energised'},
        'low': {'label': 'introspective', 'strength': 'comfortable spending time alone', 'weakness': 'hesitant in large groups'},
    },
    'agreeableness': {
        'high': {'label': 'kind-hearted', 'strength': 'compassionate and helpful', 'weakness': 'has trouble saying no'},
        'low': {'label': 'assertive', 'strength': 'stands their ground', 'weakness': 'can come across as blunt'},
    },
    'neuroticism': {
        'high': {'label': 'sensitive', 'strength': 'emotionally attuned to others', 'weakness': 'worries about small things'},
        'low': {'label': 'composed', 'strength': 'stays calm under pressure', 'weakness': 'can seem emotionally distant'},
    },
}


def generate_personality_traits(personality, age):
    """Convert Big Five OCEAN scores into descriptive, roleplay-friendly traits."""
    def pick_traits(score, bucket):
        return bucket['high'] if score >= 55 else bucket['low']

    o = pick_traits(personality['openness'], _TRAIT_MAP['openness'])
    c = pick_traits(personality['conscientiousness'], _TRAIT_MAP['conscientiousness'])
    e = pick_traits(personality['extraversion'], _TRAIT_MAP['extraversion'])
    a = pick_traits(personality['agreeableness'], _TRAIT_MAP['agreeableness'])
    n = pick_traits(personality['neuroticism'], _TRAIT_MAP['neuroticism'])

    trait_labels = [o['label'], c['label'], e['label'], a['label'], n['label']]

    # Social behavior from extraversion
    if personality['extraversion'] >= 60:
        social_behavior = 'outgoing'
    elif personality['extraversion'] <= 40:
        social_behavior = 'introverted'
    else:
        social_behavior = 'ambivert'

    # Communication style from agreeableness + extraversion
    if personality['extraversion'] >= 60 and personality['agreeableness'] <= 45:
        communication_style = 'direct'
    elif personality['agreeableness'] >= 60:
        communication_style = 'polite_indirect'
    elif personality['extraversion'] >= 55:
        communication_style = 'expressive'
    else:
        communication_style = 'reserved'

    # Decision style from openness + conscientiousness
    if personality['openness'] >= 60 and personality['conscientiousness'] <= 45:
        decision_style = 'impulsive'
    elif personality['conscientiousness'] >= 60:
        decision_style = 'analytical'
    elif personality['agreeableness'] >= 60:
        decision_style = 'family_consulting'
    else:
        decision_style = 'intuitive'

    strengths = [o['strength'], c['strength'], a['strength']]
    weaknesses = [n['weakness'], e['weakness'], c['weakness']]

    if social_behavior == 'outgoing':
        head = 'An outgoing, people-oriented person'
    elif social_behavior == 'introverted':
        head = 'A quiet, introspective person'
    else:
        head = 'A balanced, adaptable person'
    if age < 25:
        mid = 'Still finding their footing in life, they '
    elif age > 50:
        mid = 'With years of life experience, they '
    else:
        mid = 'They '
    if n['strength'] == 'composed':
        tail = 'generally stay calm and level-headed'
    else:
        tail = 'feel things deeply and care about those around them'
    summary = '%s who is %s, %s and %s. %s%s.' % (
        head, o['label'], c['label'], a['label'], mid, tail,
    )

    return {
        'summary': summary,
        'strengths': strengths,
        'weaknesses': weaknesses,
        'traitLabels': trait_labels,
        'communicationStyle': communication_style,
        'decisionStyle': decision_style,
        'socialBehavior': social_behavior,
    }


# ═══════════════════════════════════════════════════════════════
# 4. COGNITIVE PROFILE
# ═══════════════════════════════════════════════════════════════

def generate_cognitive_profile(education, income, area_type, age, has_smartphone, rng):
    """Cognitive aptitude correlated with education, SES, area, age."""
    edu_base = {
        'illiterate': 25, 'literate_below_primary': 32, 'primary': 38,
        'middle': 45, 'secondary': 55, 'higher_secondary': 62,
        'graduate': 72, 'postgraduate': 80, 'technical_diploma': 75,
        'professional_degree': 85,
    }
    base_mean = edu_base.get(education, 50)

    if income > 500000: base_mean += 5
    elif income > 200000: base_mean += 2
    elif income < 60000: base_mean -= 5
    elif income < 100000: base_mean -= 2

    if area_type == 'urban': base_mean += 3
    else: base_mean -= 2

    if age < 10: base_mean -= 15
    elif age < 18: base_mean -= 5
    elif age > 65: base_mean -= 8
    elif age > 50: base_mean -= 3

    stddev = 10
    aptitude = _clamp_score(gaussian_sample(base_mean, stddev, rng))

    numeracy_base = base_mean - 10 if education == 'illiterate' else base_mean + (5 if education == 'professional_degree' else 0)
    numeracy = _clamp_score(gaussian_sample(numeracy_base, stddev, rng))

    literacy_base = 10 if education == 'illiterate' else base_mean + 5
    literacy = _clamp_score(gaussian_sample(literacy_base, stddev, rng))

    dig_base = base_mean + 5 if has_smartphone else base_mean - 15
    if age > 50: dig_base -= 10
    if age < 30: dig_base += 5
    digital = _clamp_score(gaussian_sample(dig_base, 12, rng))

    fin_base = base_mean - 5
    if income > 300000: fin_base += 5
    if area_type == 'urban': fin_base += 3
    financial = _clamp_score(gaussian_sample(fin_base, 12, rng))

    return {
        "aptitudeScore": aptitude,
        "numeracyScore": numeracy,
        "literacyScore": literacy,
        "digitalLiteracyScore": digital,
        "financialLiteracyScore": financial,
    }


# ═══════════════════════════════════════════════════════════════
# 5. INTERESTS
# ═══════════════════════════════════════════════════════════════

def generate_interests(gender, age, religion_id, state_id, education, area_type, has_smartphone, rng):
    """Interests correlated with gender, age, religion, state, education, area."""
    # Sport
    # cricket ka dominance dekho — baaki sab sports milke bhi utna nahi.
    # kabaddi/wrestling rural me strong hain, ye BARC data se match karta hai.
    sport_dist = {
        'cricket': 55 if gender == 'male' else 30,
        'kabaddi': 8 if area_type == 'rural' else 3,
        'football': 5, 'badminton': 4,
        'volleyball': 5 if area_type == 'rural' else 2,
        'hockey': 2, 'athletics': 2,
        'wrestling': 3 if area_type == 'rural' else 1,
        'none': 20 if gender == 'female' else 8,
        'kho_kho': 2, 'carrom': 3,
        'chess': 3 if education in ('graduate', 'postgraduate') else 1,
    }
    football_states = ['west_bengal', 'kerala', 'goa', 'manipur', 'meghalaya', 'mizoram', 'sikkim']
    if state_id in football_states:
        sport_dist['football'] *= 5; sport_dist['cricket'] *= 0.7
    if state_id in ('haryana', 'punjab'):
        sport_dist['wrestling'] *= 4; sport_dist['kabaddi'] *= 2
    primary_sport, _ = weighted_sample_from_record(sport_dist, rng)

    # Pet
    pet_dist = {'dogs': 25, 'cats': 8, 'birds': 5 if area_type == 'rural' else 2, 'fish': 3 if area_type == 'urban' else 1, 'none': 55}
    if religion_id == 'muslim':
        pet_dist['dogs'] *= 0.3; pet_dist['cats'] *= 3; pet_dist['birds'] *= 2
    if area_type == 'rural':
        pet_dist['dogs'] *= 1.5
    pet_pref, _ = weighted_sample_from_record(pet_dist, rng)

    # Entertainment
    entertainment = []
    entertainment_pool = [
        ('Bollywood', 0.80),
        ('TV Serials', 0.65 if gender == 'female' else 0.35),
        ('Cricket Matches', 0.70 if gender == 'male' else 0.35),
        ('News', 0.50 if age > 30 else 0.20),
        ('YouTube', 0.65 if has_smartphone else 0.10),
        ('OTT/Netflix', 0.35 if (has_smartphone and area_type == 'urban') else 0.05),
        ('Regional Cinema', 0.60 if state_id in ['tamil_nadu', 'kerala', 'andhra_pradesh', 'telangana', 'karnataka', 'west_bengal'] else 0.20),
        ('Gaming', 0.35 if (age < 30 and has_smartphone) else 0.05),
        ('Religious Programs', 0.45 if religion_id in ('muslim', 'jain') else 0.25),
        ('Devotional Music', 0.35 if religion_id == 'hindu' else (0.40 if religion_id == 'sikh' else 0.15)),
    ]
    for name, prob in entertainment_pool:
        if bernoulli_sample(prob, rng):
            entertainment.append(name)
    if len(entertainment) == 0:
        entertainment.append('Bollywood')

    # Reading
    read_dist = {
        'avid_reader': 15 if education in ('postgraduate', 'professional_degree') else 5,
        'occasional': 25 if education in ('graduate', 'higher_secondary') else 10,
        'rare': 30,
        'non_reader': 80 if education == 'illiterate' else 35,
    }
    reading_habit, _ = weighted_sample_from_record(read_dist, rng)

    # Music
    music_dist = {
        'Bollywood': 40,
        'Devotional': 15 if religion_id == 'hindu' else (10 if religion_id == 'muslim' else (20 if religion_id == 'sikh' else 8)),
        'Regional_Folk': 20 if area_type == 'rural' else 8,
        'Pop_Western': 12 if (area_type == 'urban' and age < 30) else 3,
        'Classical': 8 if education in ('graduate', 'postgraduate') else 2,
        'Qawwali': 15 if religion_id == 'muslim' else 2,
        'Bhangra': 25 if state_id == 'punjab' else 3,
        'Carnatic': 12 if state_id in ('tamil_nadu', 'karnataka', 'kerala', 'andhra_pradesh') else 1,
        'Hip_Hop': 10 if (age < 25 and area_type == 'urban') else 1,
        'Bhojpuri': 15 if state_id in ('uttar_pradesh', 'bihar', 'jharkhand') else 1,
    }
    music_pref, _ = weighted_sample_from_record(music_dist, rng)

    # Social media
    preferred_social_media = None
    if has_smartphone and age >= 13:
        sm_dist = {
            'WhatsApp': 50,
            'Instagram': 20 if age < 35 else 5,
            'Facebook': 15 if age > 25 else 5,
            'YouTube': 15,
            'Twitter_X': 5 if education in ('graduate', 'postgraduate') else 1,
            'Telegram': 3,
            'ShareChat': 8 if area_type == 'rural' else 2,
            'Koo': 2 if (religion_id == 'hindu' and age > 30) else 0.5,
        }
        preferred_social_media, _ = weighted_sample_from_record(sm_dist, rng)

    return {
        "primarySport": primary_sport,
        "petPreference": pet_pref,
        "entertainment": entertainment,
        "readingHabit": reading_habit,
        "musicPreference": music_pref.replace('_', ' '),
        "preferredSocialMedia": preferred_social_media,
    }


# ═══════════════════════════════════════════════════════════════
# 6. HABITS
# ═══════════════════════════════════════════════════════════════

def generate_habits(gender, age, religion_id, state_id, area_type, education, income, rng):
    """Habits correlated with gender, religion, age, state, area (NFHS-5 data)."""
    high_edu = ['graduate', 'postgraduate', 'professional_degree']

    # Tobacco
    tobacco_prob = 0.38 if gender == 'male' else 0.089
    high_tobacco = {'mizoram': 2.0, 'tripura': 1.7, 'manipur': 1.5, 'meghalaya': 1.4, 'nagaland': 1.3, 'assam': 1.3, 'odisha': 1.2, 'jharkhand': 1.2, 'chhattisgarh': 1.2, 'bihar': 1.1, 'madhya_pradesh': 1.1}
    low_tobacco = {'goa': 0.35, 'punjab': 0.4, 'himachal_pradesh': 0.5, 'delhi': 0.6, 'chandigarh': 0.5, 'kerala': 0.6}
    tobacco_prob *= high_tobacco.get(state_id, low_tobacco.get(state_id, 1.0))
    if religion_id == 'sikh': tobacco_prob *= 0.4
    if religion_id == 'jain': tobacco_prob *= 0.2
    if age < 18: tobacco_prob *= 0.1
    elif age < 25: tobacco_prob *= 0.5
    elif age > 60: tobacco_prob *= 0.8
    if education in high_edu: tobacco_prob *= 0.5

    tobacco_use = 'none'
    if bernoulli_sample(min(tobacco_prob, 0.9), rng):
        type_dist = {'smoking': 0.4, 'chewing': 0.45, 'both': 0.15}
        if state_id in ('mizoram', 'manipur', 'nagaland', 'meghalaya'):
            type_dist = {'smoking': 0.7, 'chewing': 0.2, 'both': 0.1}
        if religion_id == 'muslim':
            type_dist = {'smoking': 0.3, 'chewing': 0.6, 'both': 0.1}
        tobacco_use, _ = weighted_sample_from_record(type_dist, rng)

    # Alcohol
    alcohol_prob = 0.222 if gender == 'male' else 0.013
    if religion_id == 'muslim': alcohol_prob *= 0.05
    if religion_id == 'jain': alcohol_prob *= 0.1
    if religion_id == 'christian': alcohol_prob *= 1.6
    high_alcohol = {'arunachal_pradesh': 2.5, 'goa': 1.6, 'chhattisgarh': 1.5, 'telangana': 1.4, 'andhra_pradesh': 1.3, 'jharkhand': 1.3, 'sikkim': 1.4, 'meghalaya': 1.3, 'manipur': 1.2}
    low_alcohol = {'gujarat': 0.2, 'bihar': 0.3, 'lakshadweep': 0.1}
    alcohol_prob *= high_alcohol.get(state_id, low_alcohol.get(state_id, 1.0))
    if age < 18: alcohol_prob *= 0.02
    elif age < 25: alcohol_prob *= 0.6

    alcohol_use = 'none'
    if bernoulli_sample(min(alcohol_prob, 0.8), rng):
        alc_dist = {'occasional': 0.55, 'regular': 0.35, 'heavy': 0.10}
        if income < 100000: alc_dist['heavy'] *= 1.5
        alcohol_use, _ = weighted_sample_from_record(alc_dist, rng)

    # Exercise
    ex_dist = {
        'daily': 15 if (area_type == 'urban' and education in high_edu) else 5,
        'weekly': 15 if area_type == 'urban' else 8,
        'occasional': 25,
        'never': 50 if area_type == 'rural' else 40,
    }
    if age > 60: ex_dist['never'] *= 1.5
    if age < 25: ex_dist['daily'] *= 1.5
    exercise_frequency, _ = weighted_sample_from_record(ex_dist, rng)

    # Sleep
    sleep_mean = 7.0
    if area_type == 'rural': sleep_mean += 0.5
    if age > 60: sleep_mean += 0.5
    if age < 18: sleep_mean += 0.8
    avg_sleep = round(gaussian_sample(sleep_mean, 0.8, rng) * 10) / 10
    avg_sleep = max(4, min(12, avg_sleep))

    # Cooking
    cooks_at_home = bernoulli_sample(0.85, rng) if gender == 'female' else bernoulli_sample(0.25 if area_type == 'urban' else 0.10, rng)

    # Chronotype
    chron_dist = {
        'early_riser': 55 if area_type == 'rural' else 30,
        'moderate': 35,
        'night_owl': 25 if (area_type == 'urban' and age < 30) else 10,
    }
    chronotype, _ = weighted_sample_from_record(chron_dist, rng)

    return {
        "tobaccoUse": tobacco_use,
        "alcoholUse": alcohol_use,
        "exerciseFrequency": exercise_frequency,
        "avgSleepHours": avg_sleep,
        "cooksAtHome": cooks_at_home,
        "chronotype": chronotype,
    }


# ═══════════════════════════════════════════════════════════════
# 7. EDUCATION DETAILS
# ═══════════════════════════════════════════════════════════════

def generate_education_details(education, gender, state_id, social_category, area_type, income, age, rng):
    """Expanded education details from AISHE data."""
    higher_edu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma']

    # Field of study
    field_of_study = None
    if education in higher_edu:
        field_dist = {
            'Arts/Humanities': 30 if gender == 'female' else 20,
            'Commerce/Business': 18, 'Science': 15,
            'Engineering/Technology': 20 if gender == 'male' else 8,
            'Medicine/Health': 8 if gender == 'female' else 5,
            'Law': 4,
            'Education/B.Ed': 8 if gender == 'female' else 3,
            'Computer Science/IT': 8 if area_type == 'urban' else 3,
            'Agriculture': 5 if area_type == 'rural' else 1,
            'Management/MBA': 5 if income > 300000 else 2,
        }
        if education == 'technical_diploma':
            field_dist['Engineering/Technology'] *= 3; field_dist['Computer Science/IT'] *= 2; field_dist['Arts/Humanities'] *= 0.2
        if education == 'professional_degree':
            field_dist['Medicine/Health'] *= 3; field_dist['Law'] *= 3; field_dist['Engineering/Technology'] *= 2
        field_of_study, _ = weighted_sample_from_record(field_dist, rng)

    # Institution type
    institution_type = 'none'
    if education in higher_edu:
        inst_dist = {'government': 35, 'private': 40, 'aided': 15, 'central_university': 5, 'iit_nit': 2}
        if area_type == 'rural': inst_dist['iit_nit'] *= 0.3
        if income < 200000: inst_dist['iit_nit'] *= 0.3
        if social_category in ('SC', 'ST'):
            inst_dist['iit_nit'] *= 0.5; inst_dist['government'] *= 1.5; inst_dist['private'] *= 0.7
        if gender == 'female': inst_dist['iit_nit'] *= 0.4
        institution_type, _ = weighted_sample_from_record(inst_dist, rng)
    elif education in ('secondary', 'higher_secondary', 'middle', 'primary'):
        school_dist = {
            'government': 60 if area_type == 'rural' else 35,
            'private': 45 if area_type == 'urban' else 20,
            'aided': 15,
        }
        if income > 300000: school_dist['private'] *= 2
        institution_type, _ = weighted_sample_from_record(school_dist, rng)

    # Medium of instruction
    state_lang_map = {
        'tamil_nadu': 'Tamil', 'kerala': 'Malayalam', 'karnataka': 'Kannada',
        'andhra_pradesh': 'Telugu', 'telangana': 'Telugu', 'west_bengal': 'Bengali',
        'maharashtra': 'Marathi', 'gujarat': 'Gujarati', 'odisha': 'Odia',
        'punjab': 'Punjabi', 'assam': 'Assamese', 'goa': 'Konkani',
    }
    if institution_type in ('iit_nit', 'central_university'):
        medium = 'English'
    elif area_type == 'urban' and income > 300000:
        medium = 'English' if rng.next() < 0.6 else state_lang_map.get(state_id, 'Hindi')
    else:
        local_lang = state_lang_map.get(state_id, 'Hindi')
        medium = 'English' if rng.next() < 0.2 else local_lang

    # Qualification year
    qualification_year = None
    if education not in ('illiterate', 'literate_below_primary'):
        from datetime import datetime
        current_year = datetime.now().year
        edu_age_map = {
            'primary': 11, 'middle': 14, 'secondary': 16,
            'higher_secondary': 18, 'graduate': 22, 'postgraduate': 24,
            'technical_diploma': 21, 'professional_degree': 25,
        }
        completion_age = edu_age_map.get(education, 18)
        qualification_year = min(current_year, max(1960, current_year - age + completion_age))

    # Competitive exam percentile
    competitive_exam_percentile = None
    if institution_type == 'iit_nit':
        competitive_exam_percentile = round(gaussian_sample(95, 3, rng) * 10) / 10
    elif institution_type == 'central_university':
        competitive_exam_percentile = round(gaussian_sample(85, 8, rng) * 10) / 10
    elif education in higher_edu and rng.next() < 0.3:
        competitive_exam_percentile = round(gaussian_sample(65, 15, rng) * 10) / 10
    if competitive_exam_percentile is not None:
        competitive_exam_percentile = max(1, min(99.9, competitive_exam_percentile))

    return {
        "fieldOfStudy": field_of_study,
        "institutionType": institution_type,
        "mediumOfInstruction": medium,
        "qualificationYear": qualification_year,
        "competitiveExamPercentile": competitive_exam_percentile,
    }
