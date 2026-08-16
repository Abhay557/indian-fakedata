"""
High-Level Generator Module (40+ Fields)

The main profile generation pipeline that orchestrates:
1. Database loading
2. Tree path resolution (via constraint engine)
3. Socioeconomic layer resolution
4. Name generation (self, father, mother, spouse)
5. Identity documents (Aadhaar, PAN, Voter ID, Phone, Email)
6. Biometrics (height, weight, BMI, blood group)
7. Address (street, locality, PIN code)
8. Lifestyle (diet, disability, migration, digital, vehicle)
9. Financial (bank, ration card, health insurance, land)
10. Probability metrics computation
11. Final profile assembly
"""

import math
from datetime import datetime

from indian_fakedata.core.sampler import create_rng
from indian_fakedata.core.engine import resolve_tree_path, resolve_socioeconomic_layers
from indian_fakedata.database.loader import DatabaseLoader

_db_loader = DatabaseLoader()
load_database = _db_loader.load_database
load_names = _db_loader.load_names
from indian_fakedata.utils.names import (
    select_first_name, select_surname, select_mother_tongue,
    select_second_language, select_district,
)
from indian_fakedata.utils.identifiers import (
    generate_aadhaar, generate_pan, generate_voter_id,
    generate_phone_number, generate_email, generate_dob,
    generate_blood_group, generate_height, generate_weight,
    generate_bank_details, generate_vehicle_registration,
    generate_pin_code, generate_address, generate_upi,
)
from indian_fakedata.utils.lifestyle import (
    generate_diet, generate_disability, generate_migration,
    generate_employment_sector, generate_number_of_children,
    generate_monthly_expenditure, generate_ration_card_type,
    generate_health_insurance, generate_land_ownership,
    generate_digital_access, generate_vehicle_type,
)
from indian_fakedata.utils.psychology import (
    generate_political_leaning, generate_religiosity,
    generate_personality, generate_personality_traits,
    generate_cognitive_profile,
    generate_interests, generate_habits, generate_education_details,
)
from indian_fakedata.utils.cultural import generate_cultural_profile
from indian_fakedata.utils.education import generate_education_timeline
from indian_fakedata.utils.media import generate_movie_preferences


def _generate_uuid(rng):
    """UUID v4 generator (no external dependency)."""
    hexchars = '0123456789abcdef'
    uuid = ''
    for i in range(36):
        if i in (8, 13, 18, 23):
            uuid += '-'
        elif i == 14:
            uuid += '4'
        elif i == 19:
            uuid += hexchars[int(math.floor(rng.next() * 4)) + 8]
        else:
            uuid += hexchars[int(math.floor(rng.next() * 16))]
    return uuid


def _generate_single_profile(db, constraints, rng, include_probability_metrics):
    """Generate a single demographic profile with all 40+ fields."""
    # Step 1: Resolve tree path
    path = resolve_tree_path(db, constraints, rng)

    # Step 2: Resolve socioeconomic layers
    socio = resolve_socioeconomic_layers(db, dict(path), constraints, rng)

    # Step 3: Generate names
    first_name, _ = select_first_name(db, path["religionId"], path["stateId"], path["gender"], rng)
    selected_last_name, selected_surname_prob = select_surname(db, path["casteId"], path["gender"], rng)
    # Allow family/relational generation to pin the surname explicitly
    last_name = constraints.get("surname") or selected_last_name
    surname_prob = 1.0 if constraints.get("surname") else selected_surname_prob

    father_first, _ = select_first_name(db, path["religionId"], path["stateId"], "male", rng)
    father_name = f"{father_first} {last_name}"

    mother_first, _ = select_first_name(db, path["religionId"], path["stateId"], "female", rng)
    for _ in range(5):
        if mother_first != first_name:
            break
        mother_first, _ = select_first_name(db, path["religionId"], path["stateId"], "female", rng)
    mother_last, _ = select_surname(db, path["casteId"], "female", rng)
    mother_name = f"{mother_first} {mother_last}"

    spouse_name = None
    if socio.get("maritalStatus") in ("married", "widowed"):
        spouse_gender = "female" if path["gender"] == "male" else "male"
        spouse_first, _ = select_first_name(db, path["religionId"], path["stateId"], spouse_gender, rng)
        for _ in range(5):
            if spouse_first != first_name:
                break
            spouse_first, _ = select_first_name(db, path["religionId"], path["stateId"], spouse_gender, rng)
        spouse_name = f"{spouse_first} {last_name}"

    # Step 4: Date of Birth & Biometrics
    date_of_birth = generate_dob(socio["age"], rng)
    blood_group = generate_blood_group(rng)
    height_cm = generate_height(path["gender"], socio["age"], rng)
    weight_kg = generate_weight(path["gender"], socio["age"], height_cm, path["areaType"], rng)
    bmi = round(weight_kg / ((height_cm / 100) ** 2) * 10) / 10

    # Step 5: Identity Documents
    aadhaar = generate_aadhaar(rng)
    pan = generate_pan(last_name, rng) if socio["age"] >= 18 else ""
    voter_id = generate_voter_id(path["stateId"], rng) if socio["age"] >= 18 else ""
    phone = generate_phone_number(path["stateId"], rng)
    email = generate_email(first_name, last_name, rng)

    # Step 6: Location
    district = select_district(db, path["stateId"], rng)
    state_data = db.get("states", {}).get(path["stateId"], {})
    state_code = state_data.get("stateCode", path["stateId"][:2].upper())
    pin_code = generate_pin_code(path["stateId"], rng)
    addr = generate_address(district, path["areaType"], rng)

    # Step 7: Language
    mother_tongue = select_mother_tongue(db, path["stateId"], rng)
    second_language = select_second_language(db, path["stateId"], mother_tongue, socio["education"], rng)

    # Step 8: Employment
    employment_sector = generate_employment_sector(
        socio["occupation"], socio["education"], socio["age"],
        path["areaType"], path["gender"], rng
    )

    # Step 9: Children
    number_of_children = generate_number_of_children(
        socio["age"], socio["maritalStatus"], path["gender"],
        socio["education"], path["areaType"], rng
    )

    # Step 10: Lifestyle
    dietary = generate_diet(path["religionId"], path["stateId"], rng)
    disability = generate_disability(rng)
    migration = generate_migration(path["stateId"], path["areaType"], path["gender"], db, rng)

    # Step 11: Financial
    monthly_exp = generate_monthly_expenditure(socio["income"], path["areaType"], socio["householdSize"], rng)
    bank = generate_bank_details(rng)
    ration_card = generate_ration_card_type(socio["income"], path["areaType"], rng)
    health_insurance = generate_health_insurance(socio["income"], employment_sector, path["socialCategory"], rng)
    land = generate_land_ownership(path["areaType"], socio["occupation"], path["socialCategory"], rng)

    # Step 12: Vehicle
    household_assets = socio.get("householdAssets", {})
    vehicle_type = generate_vehicle_type(
        socio["income"], path["areaType"],
        household_assets.get("hasCar", False),
        household_assets.get("hasScooter", False), rng
    )
    vehicle_reg = generate_vehicle_registration(path["stateId"], rng) if vehicle_type != "none" else None

    # Step 13: Digital
    digital = generate_digital_access(socio["age"], socio["education"], socio["income"], path["areaType"], rng)
    upi_id = generate_upi(phone, first_name, rng) if digital["hasSmartphone"] else None

    # Step 14: Psychology & Behavior
    religiosity_level = generate_religiosity(
        path["religionId"], path["gender"], socio["age"],
        socio["education"], path["areaType"], rng
    )
    political = generate_political_leaning(
        path["religionId"], path["stateId"], path["socialCategory"],
        socio["education"], socio["age"], path["areaType"], rng
    )
    personality = generate_personality(
        path["gender"], socio["age"], socio["education"],
        path["areaType"], religiosity_level, socio["occupation"], rng
    )
    cognitive = generate_cognitive_profile(
        socio["education"], socio["income"], path["areaType"],
        socio["age"], digital["hasSmartphone"], rng
    )
    interests = generate_interests(
        path["gender"], socio["age"], path["religionId"], path["stateId"],
        socio["education"], path["areaType"], digital["hasSmartphone"], rng
    )
    habits = generate_habits(
        path["gender"], socio["age"], path["religionId"], path["stateId"],
        path["areaType"], socio["education"], socio["income"], rng
    )
    edu_details = generate_education_details(
        socio["education"], path["gender"], path["stateId"],
        path["socialCategory"], path["areaType"], socio["income"],
        socio["age"], rng
    )
    cultural = generate_cultural_profile(
        path["casteId"], path["religionId"], path["stateId"],
        path["socialCategory"], socio["education"], path["areaType"],
        path["gender"], socio["age"], socio["income"], rng
    )

    # Step 14b: v2.0.3 enrichment (draws appended AFTER all existing
    # draws so previously generated fields for a seed stay identical)
    personality_traits = generate_personality_traits(personality, socio["age"])
    edu_timeline = generate_education_timeline(
        socio["education"], socio["age"], path["gender"], path["stateId"], district,
        path["areaType"], path["socialCategory"], edu_details["institutionType"],
        edu_details["fieldOfStudy"], rng
    )
    movie_prefs = generate_movie_preferences(
        path["gender"], socio["age"], socio["education"], path["areaType"],
        path["stateId"], mother_tongue, digital["hasSmartphone"], socio["income"], rng
    )

    # Step 15: Probability metrics
    path_metrics = path.get("probMetrics", {})
    prob_metrics = {
        "nationalReligionFreq": path_metrics.get("nationalReligionFreq", 0),
        "stateGivenReligionProb": path_metrics.get("stateGivenReligionProb", 0),
        "casteGivenContextProb": path_metrics.get("casteGivenContextProb", 0),
        "lastNameGivenCasteProb": surname_prob,
        "socialCategoryProb": path_metrics.get("socialCategoryProb", 0),
        "educationProb": socio.get("educationProb", 0),
        "occupationProb": socio.get("occupationProb", 0),
        "jointProbability": path.get("jointProb", 0) * surname_prob * socio.get("educationProb", 1) * socio.get("occupationProb", 1),
    }

    # Assemble profile
    return {
        "id": _generate_uuid(rng),
        "firstName": first_name,
        "lastName": last_name,
        "fatherName": father_name,
        "motherName": mother_name,
        "spouseName": spouse_name,
        "gender": path["gender"],
        "age": socio["age"],
        "dateOfBirth": date_of_birth,
        "bloodGroup": blood_group,
        "heightCm": height_cm,
        "weightKg": weight_kg,
        "bmi": bmi,
        "aadhaarNumber": aadhaar,
        "panNumber": pan,
        "voterIdNumber": voter_id,
        "phoneNumber": phone,
        "email": email,
        "state": path.get("stateName", path["stateId"]),
        "stateCode": state_code,
        "district": district,
        "areaType": path["areaType"],
        "addressLine": addr["addressLine"],
        "locality": addr["locality"],
        "pinCode": pin_code,
        "religion": path.get("religionLabel", path["religionId"]),
        "caste": path.get("casteLabel", path["casteId"]),
        "socialCategory": path["socialCategory"],
        "motherTongue": mother_tongue,
        "secondLanguage": second_language,
        "education": socio["education"],
        "occupation": socio["occupation"],
        "employmentSector": employment_sector,
        "maritalStatus": socio["maritalStatus"],
        "annualIncomeINR": socio["income"],
        "monthlyExpenditureINR": monthly_exp,
        "numberOfChildren": number_of_children,
        "dietaryPreference": dietary,
        "disability": disability,
        "isMigrant": migration["isMigrant"],
        "migrationOriginState": migration.get("migrationOriginState"),
        "bankIFSC": bank["bankIFSC"],
        "bankName": bank["bankName"],
        "bankAccountNumber": bank["bankAccountNumber"],
        "rationCardType": ration_card,
        "healthInsurance": health_insurance,
        "landOwnershipAcres": land,
        "vehicleRegistration": vehicle_reg,
        "vehicleType": vehicle_type,
        "hasInternetAccess": digital["hasInternetAccess"],
        "hasSmartphone": digital["hasSmartphone"],
        "usesSocialMedia": digital["usesSocialMedia"],
        "upiId": upi_id,
        "personality": personality,
        "personalityTraits": personality_traits,
        "politicalLeaning": political,
        "religiosity": religiosity_level,
        "cognitiveProfile": cognitive,
        "interests": interests,
        "habits": habits,
        "educationDetails": edu_details,
        "educationTimeline": edu_timeline,
        "moviePreferences": movie_prefs,
        "culturalProfile": cultural,
        "householdSize": socio["householdSize"],
        "householdAssets": household_assets,
        "probabilityMetrics": prob_metrics if include_probability_metrics else {},
        "generatedAt": datetime.now().isoformat(),
        "seed": rng.seed,
    }


def generate(count=1, seed=None, constraints=None, include_probability_metrics=True):
    """
    Generate one or more demographically consistent profiles.

    :param count: Number of profiles to generate.
    :param seed: Optional seed for reproducibility.
    :param constraints: Dict of constraints (e.g. religion, state, gender).
    :param include_probability_metrics: Whether to include probability metrics.
    :returns: List of profile dicts.

    Example::

        from indian_fakedata import generate
        profiles = generate(count=10, seed=42)
        profiles = generate(constraints={"religion": "Hindu", "state": "Tamil Nadu"})
    """
    if constraints is None:
        constraints = {}

    rng = create_rng(seed)
    db = load_database()

    profiles = []
    for _ in range(count):
        profile = _generate_single_profile(db, constraints, rng, include_probability_metrics)
        profiles.append(profile)

    return profiles


def generate_stream(count=1, seed=None, constraints=None, include_probability_metrics=True):
    """
    Generate profiles as a generator (stream).
    Yields profiles one at a time for memory-efficient large-scale generation.
    """
    if constraints is None:
        constraints = {}

    rng = create_rng(seed)
    db = load_database()

    for _ in range(count):
        yield _generate_single_profile(db, constraints, rng, include_probability_metrics)


def get_distribution_summary(profiles):
    """
    Get statistical summary of generated profiles.
    Useful for validating demographic distributions.
    """
    categories = [
        'religion', 'state', 'gender', 'socialCategory', 'areaType',
        'education', 'occupation', 'maritalStatus', 'dietaryPreference',
        'employmentSector', 'bloodGroup', 'disability', 'rationCardType',
        'healthInsurance', 'vehicleType', 'politicalLeaning', 'religiosity',
    ]
    summary = {cat: {} for cat in categories}

    for p in profiles:
        for cat in categories:
            val = p.get(cat)
            if val is not None:
                summary[cat][val] = summary[cat].get(val, 0) + 1

        # Nested fields
        habits = p.get("habits", {})
        for key in ("tobaccoUse", "alcoholUse"):
            val = habits.get(key)
            if val:
                if key not in summary:
                    summary[key] = {}
                summary[key][val] = summary[key].get(val, 0) + 1

        interests = p.get("interests", {})
        for key in ("primarySport", "petPreference", "readingHabit"):
            val = interests.get(key)
            if val:
                if key not in summary:
                    summary[key] = {}
                summary[key][val] = summary[key].get(val, 0) + 1

    # Convert to percentages
    total = len(profiles) if len(profiles) > 0 else 1
    for category in summary:
        for key in summary[category]:
            summary[category][key] = round(summary[category][key] / total * 10000) / 100

    return summary


# ─── Enriched Generation ──────────────────────────────────────

from indian_fakedata.utils.outcomes import simulate_outcomes
from indian_fakedata.utils.narrative import generate_narrative, generate_all_narratives
from indian_fakedata.utils.agent import generate_agent_persona


def generate_enriched(
    count=1, seed=None, constraints=None,
    include_probability_metrics=True,
    include_outcomes=False, bias_level=0.3,
    narrative_types=None, include_agent_persona=False
):
    """
    Generate enriched profiles with optional layers:
    - Layer 2: Outcome Simulation
    - Layer 3: Narrative Documents
    - Layer 4: Agent Persona Schema

    Example::

        from indian_fakedata import generate_enriched
        enriched = generate_enriched(
            count=10,
            include_outcomes=True,
            bias_level=0.3,
            narrative_types=['loan_application', 'hinglish_conversation'],
            include_agent_persona=True,
        )
    """
    profiles = generate(count, seed, constraints, include_probability_metrics)
    enrichment_seed = (seed if seed else int(datetime.now().timestamp())) + 999999
    rng = create_rng(enrichment_seed)

    results = []
    for profile in profiles:
        enriched = {"profile": profile}

        if include_outcomes:
            enriched["outcomes"] = simulate_outcomes(profile, bias_level, rng)

        if narrative_types and len(narrative_types) > 0:
            outcomes = enriched.get("outcomes") or simulate_outcomes(profile, bias_level, rng)
            if "all" in narrative_types:
                enriched["narratives"] = generate_all_narratives(profile, outcomes)
            else:
                enriched["narratives"] = [
                    generate_narrative(profile, outcomes, t) for t in narrative_types
                ]

        if include_agent_persona:
            enriched["agentPersona"] = generate_agent_persona(profile)

        results.append(enriched)

    return results


def generate_enriched_stream(
    count=1, seed=None, constraints=None,
    include_probability_metrics=True,
    include_outcomes=False, bias_level=0.3,
    narrative_types=None, include_agent_persona=False
):
    """
    Generator stream variant of generate_enriched() for large-scale use.
    """
    enrichment_seed = (seed if seed else int(datetime.now().timestamp())) + 999999
    rng = create_rng(enrichment_seed)

    for profile in generate_stream(count, seed, constraints, include_probability_metrics):
        enriched = {"profile": profile}

        if include_outcomes:
            enriched["outcomes"] = simulate_outcomes(profile, bias_level, rng)

        if narrative_types and len(narrative_types) > 0:
            outcomes = enriched.get("outcomes") or simulate_outcomes(profile, bias_level, rng)
            if "all" in narrative_types:
                enriched["narratives"] = generate_all_narratives(profile, outcomes)
            else:
                enriched["narratives"] = [
                    generate_narrative(profile, outcomes, t) for t in narrative_types
                ]

        if include_agent_persona:
            enriched["agentPersona"] = generate_agent_persona(profile)

        yield enriched
