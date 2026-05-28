"""
Name Generator Module

Handles first name and surname selection based on the resolved
demographic path. Uses religion, state, caste, and gender context
to pick culturally accurate names.
"""

import re
from indian_fakedata.core.sampler import weighted_sample, uniform_sample


def _get_state_region(state_id):
    """Map a state to its cultural region."""
    south = ['karnataka', 'kerala', 'tamil_nadu', 'andhra_pradesh', 'telangana', 'puducherry', 'lakshadweep']
    east = ['west_bengal', 'odisha', 'bihar', 'jharkhand', 'assam', 'sikkim',
            'arunachal_pradesh', 'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya']
    north = ['punjab', 'haryana', 'delhi', 'himachal_pradesh', 'jammu_kashmir', 'uttarakhand', 'chandigarh', 'ladakh']
    west = ['maharashtra', 'gujarat', 'goa', 'rajasthan', 'dadra_nagar_haveli', 'daman_diu']

    if state_id in south:
        return 'south'
    if state_id in east:
        return 'east'
    if state_id in north:
        return 'north'
    if state_id in west:
        return 'west'
    return 'default'


def _sample_from_name_list(names, rng):
    """Sample a name from a NameEntry list, returns (name, probability)."""
    item, probability = weighted_sample(names, rng)
    name_str = item.get("name", "Unknown") if isinstance(item, dict) else getattr(item, "name", "Unknown")
    return name_str, probability


def select_first_name(db, religion_id, state_id, gender, rng):
    """
    Select a first name based on religion, state, and gender.
    Cascading lookup: religion+state → religion+region → religion+default → any default
    """
    by_religion = db.get("firstNames", {}).get(religion_id)

    if by_religion:
        # Try state-specific names first
        by_state = by_religion.get(state_id)
        if not by_state:
            region_id = _get_state_region(state_id)
            by_state = by_religion.get(region_id)

        if by_state and by_state.get(gender) and len(by_state[gender]) > 0:
            return _sample_from_name_list(by_state[gender], rng)

        # Fallback to default names for this religion
        by_default = by_religion.get('default')
        if by_default and by_default.get(gender) and len(by_default[gender]) > 0:
            return _sample_from_name_list(by_default[gender], rng)

        # Try 'other' gender
        if by_default and by_default.get('other') and len(by_default['other']) > 0:
            return _sample_from_name_list(by_default['other'], rng)

    # Last resort: pick from Hindu defaults (most common)
    hindu_default = db.get("firstNames", {}).get('hindu', {}).get('default', {}).get(gender)
    if hindu_default and len(hindu_default) > 0:
        return _sample_from_name_list(hindu_default, rng)

    return ('Arjun' if gender == 'male' else 'Priya', 0.01)


def select_surname(db, caste_id, gender, rng):
    """
    Select a surname based on caste/community.
    Cascading lookup: casteId → normalized casteId → generic
    """
    surnames_db = db.get("surnames", {})

    # Direct caste match
    surname_list = surnames_db.get(caste_id)

    if not surname_list or len(surname_list) == 0:
        # Try normalized key
        normalized_key = re.sub(r'[\s\-]+', '_', caste_id.lower())
        surname_list = surnames_db.get(normalized_key)

    if not surname_list or len(surname_list) == 0:
        # Try partial match
        for key, lst in surnames_db.items():
            if key in caste_id or caste_id in key:
                surname_list = lst
                break

    if surname_list and len(surname_list) > 0:
        # Filter by gender if applicable (e.g., Sikh: Singh/Kaur)
        gender_filtered = [s for s in surname_list
                           if s.get("gender") == gender or s.get("gender") == "unisex"]
        if len(gender_filtered) > 0:
            return _sample_from_name_list(gender_filtered, rng)
        return _sample_from_name_list(surname_list, rng)

    # Generic fallback surnames
    generic_surnames = [
        {"name": "Kumar", "weight": 15, "gender": "male"},
        {"name": "Kumari", "weight": 10, "gender": "female"},
        {"name": "Devi", "weight": 10, "gender": "female"},
        {"name": "Singh", "weight": 12, "gender": "male"},
        {"name": "Prasad", "weight": 8, "gender": "male"},
        {"name": "Das", "weight": 8, "gender": "unisex"},
        {"name": "Ram", "weight": 5, "gender": "male"},
        {"name": "Lal", "weight": 5, "gender": "male"},
    ]

    filtered = [s for s in generic_surnames if s["gender"] == gender or s["gender"] == "unisex"]
    if len(filtered) > 0:
        return _sample_from_name_list(filtered, rng)
    return _sample_from_name_list(generic_surnames, rng)


def select_mother_tongue(db, state_id, rng):
    """Select a mother tongue based on state's language distribution."""
    state_data = db.get("states", {}).get(state_id)
    if not state_data or not state_data.get("languageDistribution"):
        return "Hindi"

    lang_dist = state_data["languageDistribution"]
    if len(lang_dist) == 0:
        return "Hindi"

    items = [{"name": lang, "weight": w} for lang, w in lang_dist.items()]
    item, _ = weighted_sample(items, rng)
    name = item["name"]
    return name[0].upper() + name[1:] if name else "Hindi"


def select_second_language(db, state_id, mother_tongue, education, rng):
    """Select a second language (different from mother tongue)."""
    # Lower-educated people are less likely to know a second language
    low_edu = ['illiterate', 'literate_below_primary', 'primary']
    if education in low_edu:
        if rng.next() > 0.3:
            return None

    second_languages = [
        {"name": "Hindi", "weight": 30},
        {"name": "English", "weight": 25},
        {"name": "Urdu", "weight": 5},
        {"name": "Bengali", "weight": 3},
        {"name": "Tamil", "weight": 3},
        {"name": "Telugu", "weight": 3},
        {"name": "Marathi", "weight": 3},
        {"name": "Gujarati", "weight": 2},
        {"name": "Kannada", "weight": 2},
        {"name": "Malayalam", "weight": 2},
        {"name": "Punjabi", "weight": 2},
        {"name": "Odia", "weight": 1},
    ]

    mt_lower = mother_tongue.lower()
    available = [l for l in second_languages if l["name"].lower() != mt_lower]

    if len(available) == 0:
        return None

    item, _ = weighted_sample(available, rng)
    return item["name"]


def select_district(db, state_id, rng):
    """Select a district based on state."""
    district_list = db.get("districts", {}).get(state_id)
    if not district_list or len(district_list) == 0:
        state_data = db.get("states", {}).get(state_id, {})
        return state_data.get("stateName", "Unknown")
    return uniform_sample(district_list, rng)
