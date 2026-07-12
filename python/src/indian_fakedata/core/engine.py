"""
Core Engine Module

Implements the constraint masking engine that ensures consistent profiles. Handles:
- Forward constraint checks (parent → child)
- Backward constraint checks (child → parent)
- Probability normalization
- Joint probability computation
"""

import re
import math
from indian_fakedata.core.sampler import (
    weighted_sample,
    weighted_sample_from_record,
    uniform_sample,
    bernoulli_sample,
    age_sample,
    household_size_sample,
    income_sample,
    gaussian_sample
)

def normalize_key(s: str) -> str:
    """Normalize a string key for matching"""
    if not s:
        return ""
    return re.sub(r'[\s\-_]+', '_', s.lower()).strip()

def find_key_match(keys, target):
    """Find a key match in a list of keys, allowing flexible matching"""
    if not target:
        return None
    # Exact match
    if target in keys:
        return target
        
    normalized = normalize_key(target)
    for key in keys:
        if normalize_key(key) == normalized:
            return key
            
    # Try ignoring non-alphanumeric chars
    alpha_target = re.sub(r'[^a-z0-9]', '', normalized)
    clean_target = re.sub(r'[^a-z0-9_]', '', normalized.replace('_and_', '_').replace('_&_', '_'))
    
    for key in keys:
        key_norm = normalize_key(key)
        if re.sub(r'[^a-z0-9]', '', key_norm) == alpha_target:
            return key
        if re.sub(r'[^a-z0-9_]', '', key_norm.replace('_and_', '_').replace('_&_', '_')) == clean_target:
            return key
            
    # Partial match on cleaned strings
    for key in keys:
        key_clean = re.sub(r'[^a-z0-9_]', '', normalize_key(key).replace('_and_', '_').replace('_&_', '_'))
        if key_clean and (clean_target in key_clean or key_clean in clean_target):
            return key
            
    # Partial match fallback
    for key in keys:
        if normalized in normalize_key(key) or normalize_key(key) in normalized:
            return key
            
    return None

def get_castes_for_context(db, religion_id, state_id):
    """Get castes for a religion-state context"""
    caste_map = db.get("casteMap", {})
    by_religion = caste_map.get(religion_id, {})
    if not by_religion:
        return []
        
    # Try exact state match
    if state_id in by_religion:
        return by_religion[state_id]
        
    # Try normalized match
    normalized_state = normalize_key(state_id)
    for key, castes in by_religion.items():
        if normalize_key(key) == normalized_state:
            return castes
            
    # Fallback: use 'default' or first available
    if "default" in by_religion:
        return by_religion["default"]
        
    first_key = list(by_religion.keys())[0] if by_religion else None
    return by_religion[first_key] if first_key else []

def create_fallback_state_data(state_id):
    """Create fallback state data when census data is missing"""
    state_name = state_id.replace("_", " ").title()
    return {
        "stateCode": state_id[:2].upper(),
        "stateName": state_name,
        "totalPopulation": 50000000,
        "urbanPopulation": 15000000,
        "ruralPopulation": 35000000,
        "sexRatio": 943,
        "literacyRate": 74.04,
        "religionDistribution": { "hindu": 0.80, "muslim": 0.14, "christian": 0.02, "sikh": 0.02, "buddhist": 0.01, "jain": 0.004, "other": 0.006 },
        "scProportion": 0.166,
        "stProportion": 0.084,
        "educationDistribution": {
            "urban": { "illiterate": 0.10, "literate_below_primary": 0.05, "primary": 0.10, "middle": 0.15, "secondary": 0.20, "higher_secondary": 0.15, "graduate": 0.15, "postgraduate": 0.05, "technical_diploma": 0.03, "professional_degree": 0.02 },
            "rural": { "illiterate": 0.30, "literate_below_primary": 0.10, "primary": 0.15, "middle": 0.15, "secondary": 0.12, "higher_secondary": 0.08, "graduate": 0.06, "postgraduate": 0.02, "technical_diploma": 0.01, "professional_degree": 0.01 }
        },
        "occupationDistribution": {
            "male": { "cultivator": 0.25, "agricultural_labourer": 0.15, "household_industry": 0.04, "other_worker": 0.35, "non_worker": 0.21 },
            "female": { "cultivator": 0.15, "agricultural_labourer": 0.20, "household_industry": 0.05, "other_worker": 0.10, "non_worker": 0.50 },
            "other": { "cultivator": 0.20, "agricultural_labourer": 0.18, "household_industry": 0.04, "other_worker": 0.25, "non_worker": 0.33 }
        },
        "languageDistribution": { "hindi": 0.50, "english": 0.10 },
        "assetDistribution": {
            "urban": {},
            "rural": {}
        }
    }

def get_default_education_dist(area_type, social_category):
    """Default education distribution based on area and social category"""
    sc_st_penalty = 1.5 if social_category in ["SC", "ST"] else 1.0
    if area_type == "urban":
        return {
            "illiterate": 0.08 * sc_st_penalty,
            "literate_below_primary": 0.04,
            "primary": 0.09,
            "middle": 0.14,
            "secondary": 0.20,
            "higher_secondary": 0.17,
            "graduate": 0.17 / sc_st_penalty,
            "postgraduate": 0.06 / sc_st_penalty,
            "technical_diploma": 0.03,
            "professional_degree": 0.02 / sc_st_penalty
        }
    return {
        "illiterate": 0.28 * sc_st_penalty,
        "literate_below_primary": 0.08,
        "primary": 0.14,
        "middle": 0.16,
        "secondary": 0.13,
        "higher_secondary": 0.09,
        "graduate": 0.07 / sc_st_penalty,
        "postgraduate": 0.02 / sc_st_penalty,
        "technical_diploma": 0.02,
        "professional_degree": 0.01 / sc_st_penalty
    }

def get_default_occupation_dist(gender, area_type):
    """Default occupation distribution"""
    if gender == "female":
        if area_type == "urban":
            return { "cultivator": 0.02, "agricultural_labourer": 0.03, "household_industry": 0.05, "other_worker": 0.25, "non_worker": 0.65 }
        else:
            return { "cultivator": 0.20, "agricultural_labourer": 0.25, "household_industry": 0.06, "other_worker": 0.09, "non_worker": 0.40 }
    if area_type == "urban":
        return { "cultivator": 0.03, "agricultural_labourer": 0.04, "household_industry": 0.05, "other_worker": 0.55, "non_worker": 0.33 }
    return { "cultivator": 0.30, "agricultural_labourer": 0.20, "household_industry": 0.04, "other_worker": 0.20, "non_worker": 0.26 }

def sample_marital_status(age, gender, rng):
    """Sample marital status conditioned on age and gender"""
    if age < 18:
        return "never_married"
        
    if age < 25:
        married_prob = 0.45 if gender == "female" else 0.20
        widowed_prob = 0.001
        divorced_prob = 0.005
    elif age < 35:
        married_prob = 0.75
        widowed_prob = 0.01
        divorced_prob = 0.02
    elif age < 50:
        married_prob = 0.85
        widowed_prob = 0.05 if gender == "female" else 0.02
        divorced_prob = 0.03
    elif age < 65:
        married_prob = 0.80
        widowed_prob = 0.15 if gender == "female" else 0.05
        divorced_prob = 0.02
    else:
        married_prob = 0.60
        widowed_prob = 0.35 if gender == "female" else 0.15
        divorced_prob = 0.01

    never_married_prob = max(0.0, 1.0 - married_prob - widowed_prob - divorced_prob)
    dist = {
        "married": married_prob,
        "never_married": never_married_prob,
        "widowed": widowed_prob,
        "divorced_separated": divorced_prob
    }
    key, _ = weighted_sample_from_record(dist, rng)
    return key

def sample_household_assets(db, state_id, area_type, income, rng):
    """Sample household assets based on state, area type, and income"""
    income_level = "low" if income < 100000 else "mid" if income < 300000 else "high" if income < 600000 else "very_high"
    
    base_probs = {
        "low":       { "radio": 0.15, "tv": 0.35, "computer": 0.03, "phone": 0.60, "bicycle": 0.45, "scooter": 0.08, "car": 0.01, "banking": 0.30, "water": 0.40, "latrine": 0.30 },
        "mid":       { "radio": 0.20, "tv": 0.65, "computer": 0.12, "phone": 0.85, "bicycle": 0.50, "scooter": 0.25, "car": 0.05, "banking": 0.60, "water": 0.55, "latrine": 0.60 },
        "high":      { "radio": 0.22, "tv": 0.85, "computer": 0.35, "phone": 0.95, "bicycle": 0.45, "scooter": 0.45, "car": 0.20, "banking": 0.80, "water": 0.70, "latrine": 0.85 },
        "very_high": { "radio": 0.20, "tv": 0.95, "computer": 0.65, "phone": 0.99, "bicycle": 0.35, "scooter": 0.55, "car": 0.45, "banking": 0.95, "water": 0.85, "latrine": 0.95 }
    }
    
    probs = base_probs[income_level]
    urban_boost = 1.2 if area_type == "urban" else 0.85
    clamp = lambda v: min(1.0, max(0.0, v))

    # Roof material
    roof_options = (
        [{ "value": "concrete", "weight": 0.55 }, { "value": "metal_sheet", "weight": 0.25 }, { "value": "tiles", "weight": 0.15 }, { "value": "thatch", "weight": 0.03 }, { "value": "other", "weight": 0.02 }]
        if area_type == "urban"
        else [{ "value": "tiles", "weight": 0.25 }, { "value": "thatch", "weight": 0.25 }, { "value": "metal_sheet", "weight": 0.25 }, { "value": "concrete", "weight": 0.20 }, { "value": "other", "weight": 0.05 }]
    )
    
    # Wall material
    wall_options = (
        [{ "value": "burnt_brick", "weight": 0.65 }, { "value": "stone", "weight": 0.15 }, { "value": "mud", "weight": 0.10 }, { "value": "wood", "weight": 0.05 }, { "value": "other", "weight": 0.05 }]
        if area_type == "urban"
        else [{ "value": "mud", "weight": 0.35 }, { "value": "burnt_brick", "weight": 0.30 }, { "value": "stone", "weight": 0.15 }, { "value": "wood", "weight": 0.10 }, { "value": "other", "weight": 0.10 }]
    )

    # Cooking fuel
    fuel_options = (
        [{ "value": "lpg", "weight": 0.65 }, { "value": "firewood", "weight": 0.10 }, { "value": "kerosene", "weight": 0.10 }, { "value": "electricity", "weight": 0.05 }, { "value": "biogas", "weight": 0.03 }, { "value": "coal", "weight": 0.03 }, { "value": "crop_residue", "weight": 0.02 }, { "value": "cowdung", "weight": 0.01 }, { "value": "other", "weight": 0.01 }]
        if area_type == "urban"
        else [{ "value": "firewood", "weight": 0.40 }, { "value": "lpg", "weight": 0.20 }, { "value": "crop_residue", "weight": 0.12 }, { "value": "cowdung", "weight": 0.12 }, { "value": "kerosene", "weight": 0.06 }, { "value": "coal", "weight": 0.04 }, { "value": "biogas", "weight": 0.03 }, { "value": "electricity", "weight": 0.02 }, { "value": "other", "weight": 0.01 }]
    )

    # Lighting source
    light_options = (
        [{ "value": "electricity", "weight": 0.93 }, { "value": "kerosene", "weight": 0.04 }, { "value": "solar", "weight": 0.02 }, { "value": "other", "weight": 0.01 }]
        if area_type == "urban"
        else [{ "value": "electricity", "weight": 0.67 }, { "value": "kerosene", "weight": 0.25 }, { "value": "solar", "weight": 0.05 }, { "value": "other", "weight": 0.03 }]
    )

    # Drinking water
    water_options = (
        [{ "value": "tap_treated", "weight": 0.50 }, { "value": "tap_untreated", "weight": 0.15 }, { "value": "handpump", "weight": 0.10 }, { "value": "tubewell", "weight": 0.10 }, { "value": "well_covered", "weight": 0.05 }, { "value": "well_uncovered", "weight": 0.03 }, { "value": "river", "weight": 0.02 }, { "value": "other", "weight": 0.05 }]
        if area_type == "urban"
        else [{ "value": "handpump", "weight": 0.30 }, { "value": "tap_untreated", "weight": 0.15 }, { "value": "tubewell", "weight": 0.15 }, { "value": "well_uncovered", "weight": 0.12 }, { "value": "tap_treated", "weight": 0.10 }, { "value": "well_covered", "weight": 0.08 }, { "value": "river", "weight": 0.05 }, { "value": "other", "weight": 0.05 }]
    )

    rooms = max(1, min(6, int(round(
        gaussian_sample(2.5, 1.0, rng) if area_type == "urban" else gaussian_sample(2.0, 0.8, rng)
    ))))

    return {
        "hasRadioTransistor": bernoulli_sample(clamp(probs["radio"] * urban_boost), rng),
        "hasTelevision": bernoulli_sample(clamp(probs["tv"] * urban_boost), rng),
        "hasComputer": bernoulli_sample(clamp(probs["computer"] * urban_boost), rng),
        "hasPhone": bernoulli_sample(clamp(probs["phone"] * urban_boost), rng),
        "hasBicycle": bernoulli_sample(clamp(probs["bicycle"]), rng),
        "hasScooter": bernoulli_sample(clamp(probs["scooter"] * urban_boost), rng),
        "hasCar": bernoulli_sample(clamp(probs["car"] * urban_boost), rng),
        "bankingService": bernoulli_sample(clamp(probs["banking"] * urban_boost), rng),
        "treatedWaterSource": bernoulli_sample(clamp(probs["water"] * urban_boost), rng),
        "latrineFacility": bernoulli_sample(clamp(probs["latrine"] * urban_boost), rng),
        "numberOfRooms": rooms,
        "roofMaterial": weighted_sample(roof_options, rng)[0]["value"],
        "wallMaterial": weighted_sample(wall_options, rng)[0]["value"],
        "cookingFuel": weighted_sample(fuel_options, rng)[0]["value"],
        "lightingSource": weighted_sample(light_options, rng)[0]["value"],
        "drinkingWaterSource": weighted_sample(water_options, rng)[0]["value"]
    }

def resolve_tree_path(db, constraints, rng):
    """
    Resolves a complete demographic path through the hierarchical tree,
    applying constraints.
    """
    prob_metrics = {}

    # -- Layer 1: Religion --
    religion_id = None
    religion_prob = 1.0
    
    constraint_religion = constraints.get("religion")
    religions_db = db.get("religions", {})
    if constraint_religion:
        key = normalize_key(constraint_religion)
        match = find_key_match(list(religions_db.keys()), key)
        if not match:
            raise ValueError(f"Constraint error: religion '{constraint_religion}' not found in database")
        religion_id = match
        religion_prob = religions_db[match].get("nationalProportion", 0.0)
    else:
        religion_weights = {r_id: data.get("nationalProportion", 0.0) for r_id, data in religions_db.items()}
        religion_id, religion_prob = weighted_sample_from_record(religion_weights, rng)
        
    prob_metrics["nationalReligionFreq"] = religion_prob

    # -- Layer 2: State (conditioned on religion) --
    state_id = None
    state_prob = 1.0
    state_data = None
    states_db = db.get("states", {})

    constraint_state = constraints.get("state")
    if constraint_state:
        key = normalize_key(constraint_state)
        match = find_key_match(list(states_db.keys()), key)
        if not match:
            raise ValueError(f"Constraint error: state '{constraint_state}' not found in database")
        state_id = match
        state_conditionals = religions_db.get(religion_id, {}).get("stateConditionals", {})
        state_prob = state_conditionals.get(state_id, 1.0 / max(1, len(states_db)))
        state_data = states_db[state_id]
    else:
        state_conditionals = religions_db.get(religion_id, {}).get("stateConditionals", {})
        if state_conditionals:
            state_id, state_prob = weighted_sample_from_record(state_conditionals, rng)
        else:
            pop_weights = {s_id: data.get("totalPopulation", 0.0) for s_id, data in states_db.items()}
            state_id, state_prob = weighted_sample_from_record(pop_weights, rng)
        state_data = states_db.get(state_id)

    if not state_data:
        state_data = create_fallback_state_data(state_id)
        
    prob_metrics["stateGivenReligionProb"] = state_prob

    # -- Layer 3: Caste (conditioned on religion + state) --
    caste_id = None
    caste_label = None
    caste_prob = 1.0
    social_category = "General"

    constraint_caste = constraints.get("caste")
    if constraint_caste:
        key = normalize_key(constraint_caste)
        castes_for_context = get_castes_for_context(db, religion_id, state_id)
        match = next((c for c in castes_for_context if normalize_key(c.get("id")) == key or normalize_key(c.get("label")) == key), None)
        if match:
            caste_id = match["id"]
            caste_label = match["label"]
            total_weight = sum(c.get("weight", 0) for c in castes_for_context)
            caste_prob = match.get("weight", 1) / max(1.0, total_weight)
            social_category = match.get("socialCategory", "General")
        else:
            caste_id = key
            caste_label = constraint_caste
            caste_prob = 0.01
            social_category = constraints.get("socialCategory", "General")
    else:
        castes_for_context = get_castes_for_context(db, religion_id, state_id)
        if castes_for_context:
            filtered_castes = castes_for_context
            constraint_social_cat = constraints.get("socialCategory")
            if constraint_social_cat:
                filtered_castes = [c for c in castes_for_context if c.get("socialCategory") == constraint_social_cat]
                if not filtered_castes:
                    filtered_castes = castes_for_context
            
            item, probability = weighted_sample(filtered_castes, rng)
            caste_id = item["id"]
            caste_label = item["label"]
            caste_prob = probability
            social_category = item.get("socialCategory", "General")
        else:
            caste_id = "general"
            caste_label = "General"
            caste_prob = 1.0
            social_category = "General"

    if constraints.get("socialCategory"):
        social_category = constraints["socialCategory"]
        
    prob_metrics["casteGivenContextProb"] = caste_prob

    # -- Layer 4: Area Type --
    area_type = None
    constraint_area = constraints.get("areaType")
    if constraint_area:
        area_type = constraint_area
    else:
        total_pop = max(1.0, state_data.get("totalPopulation", 1.0))
        urban_frac = state_data.get("urbanPopulation", 0.0) / total_pop
        area_type = "urban" if rng.next() < urban_frac else "rural"

    # -- Layer 5: Gender --
    gender = None
    constraint_gender = constraints.get("gender")
    if constraint_gender:
        gender = constraint_gender
    else:
        sex_ratio = state_data.get("sexRatio", 943.0)
        female_prop = sex_ratio / (1000.0 + sex_ratio)
        gender = "female" if rng.next() < female_prop else "male"

    # Joint Probability
    joint_prob = religion_prob * state_prob * caste_prob

    return {
        "religionId": religion_id,
        "stateId": state_id,
        "casteId": caste_id,
        "socialCategory": social_category,
        "jointProb": joint_prob,
        "gender": gender,
        "areaType": area_type,
        "stateName": state_data.get("stateName", state_id.title()),
        "religionLabel": religions_db.get(religion_id, {}).get("label", religion_id.title()),
        "casteLabel": caste_label,
        "probMetrics": prob_metrics
    }

def _apply_age_education_mask(age, education):
    """
    Apply age-based constraints to education level.
    Returns the corrected education level that is plausible for the given age.

    Age bands (based on Indian education system):
      0-5:   Must be illiterate (pre-school)
      6-10:  At most primary
      11-13: At most middle
      14-15: At most secondary
      16-17: At most higher_secondary
      18+:   No restriction
    """
    EDU_ORDER = [
        "illiterate", "literate_below_primary", "primary", "middle",
        "secondary", "higher_secondary", "graduate", "postgraduate",
        "technical_diploma", "professional_degree"
    ]

    if age < 6:
        return "illiterate"

    if age <= 10:
        max_level = "primary"  # index 2
    elif age <= 13:
        max_level = "middle"  # index 3
    elif age <= 15:
        max_level = "secondary"  # index 4
    elif age <= 17:
        max_level = "higher_secondary"  # index 5
    else:
        return education  # adults: no restriction

    max_idx = EDU_ORDER.index(max_level)
    cur_idx = EDU_ORDER.index(education) if education in EDU_ORDER else 0
    if cur_idx > max_idx:
        return EDU_ORDER[max_idx]
    return education


def _apply_age_occupation_mask(age, occupation):
    """
    Apply age-based constraints to occupation.
    Children under 6 must be non_worker.
    Children 6-14 should be non_worker (child labor laws).
    Ages 15-17 can do limited work but not heavy labor.
    """
    if age < 15:
        return "non_worker"
    if age < 18 and occupation in ("cultivator", "agricultural_labourer", "household_industry"):
        return "non_worker"
    return occupation


def resolve_socioeconomic_layers(db, path, constraints, rng):
    """
    Resolves the socioeconomic layers conditioned on the demographic path.
    Age is sampled FIRST so that education and occupation can be masked
    for age-plausibility (e.g., a 2-year-old cannot be a graduate).
    """
    state_id = path["stateId"]
    states_db = db.get("states", {})
    state_data = states_db.get(state_id)

    # -- Age (sampled FIRST — everything else depends on it) --
    age = None
    constraint_age_range = constraints.get("ageRange")
    if constraint_age_range:
        age = age_sample(rng, constraint_age_range.get("min", 0), constraint_age_range.get("max", 100))
    else:
        age = age_sample(rng)

    # -- Education (with age mask) --
    education = None
    education_prob = 1.0

    constraint_edu = constraints.get("education")
    if constraint_edu:
        education = constraint_edu
        education_prob = 0.1
    elif state_data and "educationDistribution" in state_data and path["areaType"] in state_data["educationDistribution"]:
        edu_dist = state_data["educationDistribution"][path["areaType"]]
        education, education_prob = weighted_sample_from_record(edu_dist, rng)
    else:
        fallback = get_default_education_dist(path["areaType"], path["socialCategory"])
        education, education_prob = weighted_sample_from_record(fallback, rng)

    # Apply age mask: clamp education to what is plausible for this age
    education = _apply_age_education_mask(age, education)

    # -- Occupation (with age mask) --
    occupation = None
    occupation_prob = 1.0

    constraint_occ = constraints.get("occupation")
    if constraint_occ:
        occupation = constraint_occ
        occupation_prob = 0.1
    elif state_data and "occupationDistribution" in state_data and path["gender"] in state_data["occupationDistribution"]:
        occ_dist = state_data["occupationDistribution"][path["gender"]]
        occupation, occupation_prob = weighted_sample_from_record(occ_dist, rng)
    else:
        fallback = get_default_occupation_dist(path["gender"], path["areaType"])
        occupation, occupation_prob = weighted_sample_from_record(fallback, rng)

    # Apply age mask: children cannot be workers
    occupation = _apply_age_occupation_mask(age, occupation)

    # -- Marital Status --
    marital_status = None
    constraint_marital = constraints.get("maritalStatus")
    if constraint_marital:
        marital_status = constraint_marital
    else:
        marital_status = sample_marital_status(age, path["gender"], rng)

    # -- Household Size --
    household_size = household_size_sample(rng, path["areaType"])

    # -- Income (conditioned on age-corrected education and occupation) --
    income = income_sample(rng, {
        "areaType": path["areaType"],
        "education": education,
        "occupation": occupation,
        "state": path["stateId"]
    })

    # Children don't earn independently
    if age < 15:
        income = max(10000, income // 4)

    # -- Household Assets --
    household_assets = sample_household_assets(
        db, path["stateId"], path["areaType"], income, rng
    )

    return {
        "education": education,
        "educationProb": education_prob,
        "occupation": occupation,
        "occupationProb": occupation_prob,
        "maritalStatus": marital_status,
        "age": age,
        "householdSize": household_size,
        "income": income,
        "householdAssets": household_assets
    }
