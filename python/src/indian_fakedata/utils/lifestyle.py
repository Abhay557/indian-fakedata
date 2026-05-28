"""
Lifestyle & Socioeconomic Detail Generator

Generates correlated lifestyle attributes:
- Diet (religion + state correlated)
- Disability (Census 2011: 2.21%)
- Migration status
- Digital access (urban/rural + income + age)
- Employment sector
- Financial details (ration card, health insurance, land)
- Vehicle ownership
- Family details (children)
"""

import math
from indian_fakedata.core.sampler import (
    weighted_sample_from_record, weighted_sample, bernoulli_sample,
    gaussian_sample, log_normal_sample, uniform_sample,
)


# ─── Diet ──────────────────────────────────────────────────────

def generate_diet(religion_id, state_id, rng):
    """Dietary preference correlated with religion and state."""
    veg_prob_map = {
        'jain': 0.97, 'hindu': 0.36, 'buddhist': 0.25,
        'sikh': 0.33, 'muslim': 0.03, 'christian': 0.04,
    }
    veg_prob = veg_prob_map.get(religion_id, 0.30)

    if religion_id in ('hindu', 'sikh', 'jain'):
        state_veg = {
            'rajasthan': 0.75, 'gujarat': 0.65, 'madhya_pradesh': 0.50,
            'haryana': 0.55, 'uttar_pradesh': 0.47, 'delhi': 0.40,
            'maharashtra': 0.35, 'punjab': 0.40, 'himachal_pradesh': 0.35,
            'karnataka': 0.30, 'uttarakhand': 0.38,
            'kerala': 0.05, 'west_bengal': 0.08, 'tamil_nadu': 0.15,
            'assam': 0.06, 'meghalaya': 0.03, 'manipur': 0.04,
            'nagaland': 0.02, 'mizoram': 0.03, 'tripura': 0.08,
            'arunachal_pradesh': 0.05, 'jharkhand': 0.12, 'odisha': 0.12,
            'andhra_pradesh': 0.18, 'telangana': 0.20, 'bihar': 0.25,
            'goa': 0.12, 'chhattisgarh': 0.22, 'sikkim': 0.05, 'jammu_kashmir': 0.10,
        }
        if state_id in state_veg:
            veg_prob = state_veg[state_id]

    r = rng.next()
    if r < veg_prob:
        return 'vegan' if rng.next() < 0.02 else 'vegetarian'
    else:
        return 'eggetarian' if rng.next() < 0.15 else 'non_vegetarian'


# ─── Disability ────────────────────────────────────────────────

def generate_disability(rng):
    """Census 2011 disability distribution (2.21% prevalence)."""
    if rng.next() > 0.0221:
        return 'none'

    types = [
        {"type": "locomotor", "weight": 20.3},
        {"type": "hearing", "weight": 18.9},
        {"type": "visual", "weight": 18.8},
        {"type": "speech", "weight": 7.5},
        {"type": "multiple", "weight": 7.9},
        {"type": "mental_retardation", "weight": 5.6},
        {"type": "mental_illness", "weight": 2.7},
    ]
    item, _ = weighted_sample(types, rng)
    return item["type"]


# ─── Migration ─────────────────────────────────────────────────

def generate_migration(state_id, area_type, gender, db, rng):
    """Census 2011: ~37% internal migrants."""
    migration_prob = 0.45 if area_type == 'urban' else 0.30
    if gender == 'female':
        migration_prob += 0.10

    metro_cities = ['delhi', 'maharashtra', 'karnataka', 'tamil_nadu', 'telangana', 'goa']
    if state_id in metro_cities:
        migration_prob += 0.10

    if not bernoulli_sample(migration_prob, rng):
        return {"isMigrant": False}

    states_db = db.get("states", {})
    state_keys = [s for s in states_db.keys() if s != state_id]
    if len(state_keys) == 0:
        return {"isMigrant": False}

    high_emigration = ['bihar', 'uttar_pradesh', 'jharkhand', 'odisha', 'rajasthan', 'madhya_pradesh', 'west_bengal']
    emigration_weights = {}
    for s in state_keys:
        w = states_db.get(s, {}).get("totalPopulation", 50000000)
        if s in high_emigration:
            w *= 2
        emigration_weights[s] = w

    key, _ = weighted_sample_from_record(emigration_weights, rng)
    origin_state = states_db.get(key, {}).get("stateName", key)
    return {"isMigrant": True, "migrationOriginState": origin_state}


# ─── Employment Sector ─────────────────────────────────────────

def generate_employment_sector(occupation, education, age, area_type, gender, rng):
    """Detailed employment sector based on occupation, education, age, and area."""
    if age < 18:
        return 'student'
    if age >= 60 and rng.next() < 0.3:
        return 'retired'

    if occupation == 'non_worker':
        if gender == 'female' and rng.next() < 0.7:
            return 'homemaker'
        if age < 25 and rng.next() < 0.5:
            return 'student'
        return 'unemployed'

    if occupation in ('cultivator', 'agricultural_labourer', 'household_industry'):
        return 'self_employed'

    high_edu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma']
    if education in high_edu:
        dist = {
            'government': 0.15 if area_type == 'urban' else 0.20,
            'private': 0.50 if area_type == 'urban' else 0.30,
            'public_sector': 0.08,
            'self_employed': 0.15,
            'informal': 0.07,
        }
        key, _ = weighted_sample_from_record(dist, rng)
        return key

    dist = {
        'informal': 0.45 if area_type == 'rural' else 0.30,
        'private': 0.30 if area_type == 'urban' else 0.15,
        'self_employed': 0.20,
        'government': 0.05,
        'public_sector': 0.03,
    }
    key, _ = weighted_sample_from_record(dist, rng)
    return key


# ─── Number of Children ───────────────────────────────────────

def generate_number_of_children(age, marital_status, gender, education, area_type, rng):
    """Number of children correlated with age, marital status, education, area."""
    if marital_status == 'never_married' or age < 20:
        return 0

    if age < 25:
        expected = 0.5
    elif age < 30:
        expected = 1.2
    elif age < 35:
        expected = 1.8
    elif age < 40:
        expected = 2.2
    elif age < 50:
        expected = 2.5
    else:
        expected = 2.8

    edu_effect = {
        'illiterate': 1.4, 'literate_below_primary': 1.3, 'primary': 1.2,
        'middle': 1.1, 'secondary': 1.0, 'higher_secondary': 0.9,
        'graduate': 0.7, 'postgraduate': 0.6, 'technical_diploma': 0.7,
        'professional_degree': 0.5,
    }
    expected *= edu_effect.get(education, 1.0)

    if area_type == 'urban':
        expected *= 0.8

    children = max(0, round(gaussian_sample(expected, expected * 0.5, rng)))
    return min(children, 8)


# ─── Financial Details ─────────────────────────────────────────

def generate_monthly_expenditure(annual_income, area_type, household_size, rng):
    """Monthly expenditure (correlated with income, area, household size)."""
    monthly_income = annual_income / 12
    savings_rate = 0.20 if area_type == 'urban' else 0.12
    base_expenditure = monthly_income * (1 - savings_rate)
    noise = gaussian_sample(1.0, 0.15, rng)
    expenditure = base_expenditure * max(0.5, noise)
    return max(1000, round(expenditure / 100) * 100)


def generate_ration_card_type(annual_income, area_type, rng):
    """Ration card type (income-correlated)."""
    monthly = annual_income / 12
    if monthly < 3000:
        return 'AAY' if rng.next() < 0.4 else 'BPL'
    elif monthly < 8000:
        return 'BPL' if rng.next() < 0.6 else 'APL'
    elif monthly < 20000:
        return 'APL' if rng.next() < 0.8 else 'none'
    return 'APL' if rng.next() < 0.5 else 'none'


def generate_health_insurance(annual_income, employment_sector, social_category, rng):
    """Health insurance type."""
    if employment_sector == 'government':
        return 'cghs' if rng.next() < 0.7 else 'private'
    if employment_sector == 'public_sector':
        return 'esis' if rng.next() < 0.5 else 'private'
    if annual_income < 150000 or social_category in ('SC', 'ST'):
        return 'pmjay' if rng.next() < 0.35 else 'none'
    if annual_income > 500000:
        return 'private' if rng.next() < 0.35 else 'none'
    return 'private' if rng.next() < 0.15 else 'none'


def generate_land_ownership(area_type, occupation, social_category, rng):
    """Land ownership in acres (rural only)."""
    if area_type == 'urban':
        return 0

    if occupation == 'cultivator':
        mean = 2.5
        if social_category in ('SC', 'ST'):
            mean = 1.2
        acres = log_normal_sample(math.log(mean), 0.6, rng)
        return round(max(0.1, min(50, acres)) * 10) / 10

    if occupation == 'agricultural_labourer':
        return round(rng.next() * 1.5 * 10) / 10 if rng.next() < 0.3 else 0

    return round(rng.next() * 2 * 10) / 10 if rng.next() < 0.15 else 0


# ─── Digital Access ────────────────────────────────────────────

def generate_digital_access(age, education, income, area_type, rng):
    """Digital access correlated with age, education, income, area type."""
    internet_prob = 0.70 if area_type == 'urban' else 0.40

    if age < 15:
        internet_prob *= 0.3
    elif age < 30:
        internet_prob *= 1.2
    elif age < 50:
        internet_prob *= 1.0
    elif age < 65:
        internet_prob *= 0.6
    else:
        internet_prob *= 0.3

    high_edu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma']
    if education in high_edu:
        internet_prob *= 1.3
    if education == 'illiterate':
        internet_prob *= 0.3

    if income > 500000:
        internet_prob *= 1.2
    if income < 100000:
        internet_prob *= 0.7

    internet_prob = min(0.98, max(0.05, internet_prob))

    has_internet = bernoulli_sample(internet_prob, rng)
    has_smartphone = bernoulli_sample(0.85, rng) if has_internet else bernoulli_sample(0.15, rng)
    uses_social_media = bernoulli_sample(0.70, rng) if (has_smartphone and age >= 13) else False

    return {
        "hasInternetAccess": has_internet,
        "hasSmartphone": has_smartphone,
        "usesSocialMedia": uses_social_media,
    }


# ─── Vehicle Type ──────────────────────────────────────────────

def generate_vehicle_type(income, area_type, has_car, has_scooter, rng):
    """Vehicle type based on income, area, and household assets."""
    if has_car:
        return 'four_wheeler' if rng.next() < 0.9 else 'two_wheeler'
    if has_scooter:
        return 'two_wheeler'

    if income > 600000 and area_type == 'urban':
        r = rng.next()
        if r < 0.3:
            return 'four_wheeler'
        return 'two_wheeler' if rng.next() < 0.5 else 'none'
    if income > 200000:
        return 'two_wheeler' if rng.next() < 0.4 else 'none'

    return 'two_wheeler' if rng.next() < 0.15 else 'none'
