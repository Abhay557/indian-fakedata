"""
Profile JSON Schema + Validator (v2.0.9)

Mirrors the TypeScript implementation (src/utils/schema.ts): a
zero-dependency, hand-written validator for profile dicts. Use it to check
library output (or foreign data claiming the same shape) before feeding it
into training pipelines, exports or agent frameworks::

    from indian_fakedata import generate, validate_profile
    p = generate(count=1, seed=7)[0]
    result = validate_profile(p)  # {"valid": True, "errors": []}

``get_profile_schema()`` returns the machine-readable schema (JSON Schema
draft-07 style) so other tools can validate without this library.
"""

import re

GENERATOR_RE = re.compile(r"^indian-fakedata@\d+\.\d+\.\d+$")

ENUMS = {
    "gender": ["male", "female", "other"],
    "socialCategory": ["SC", "ST", "OBC", "General"],
    "areaType": ["urban", "rural"],
    "education": [
        "illiterate", "literate_below_primary", "primary", "middle", "secondary",
        "higher_secondary", "graduate", "postgraduate", "technical_diploma",
        "professional_degree",
    ],
    "occupation": [
        "cultivator", "agricultural_labourer", "household_industry",
        "other_worker", "non_worker",
    ],
    "maritalStatus": ["never_married", "married", "widowed", "divorced_separated"],
    "dietaryPreference": ["vegetarian", "non_vegetarian", "eggetarian", "vegan"],
    "disability": [
        "none", "visual", "hearing", "speech", "locomotor", "mental_illness",
        "mental_retardation", "multiple",
    ],
    "rationCardType": ["APL", "BPL", "AAY", "AY", "none"],
    "healthInsurance": ["pmjay", "esis", "cghs", "private", "none"],
    "politicalLeaning": [
        "nationalist_right", "centre_right", "centrist", "centre_left",
        "leftist", "regionalist", "apolitical",
    ],
    "religiosity": [
        "very_religious", "somewhat_religious", "not_very_religious",
        "not_at_all_religious",
    ],
    "bloodGroup": ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
}

REQUIRED_STRINGS = [
    "id", "firstName", "lastName", "fatherName", "motherName", "dateOfBirth",
    "aadhaarNumber", "phoneNumber", "email",
    "state", "stateCode", "district", "addressLine", "locality", "pinCode",
    "religion", "caste", "motherTongue", "bankIFSC", "bankName",
    "bankAccountNumber", "generatedAt",
]

# Required keys that may be empty strings (minors have no PAN/voter ID)
REQUIRED_STRINGS_EMPTY_OK = ["panNumber", "voterIdNumber"]

REQUIRED_NUMBERS = [
    "age", "heightCm", "weightKg", "bmi", "annualIncomeINR",
    "monthlyExpenditureINR", "numberOfChildren", "landOwnershipAcres",
    "householdSize", "seed",
]

REQUIRED_BOOLEANS = [
    "synthetic", "isMigrant", "hasInternetAccess", "hasSmartphone",
    "usesSocialMedia",
]

REQUIRED_OBJECTS = [
    "appearance", "personality", "cognitiveProfile", "interests", "habits",
    "educationDetails", "personalityTraits", "moviePreferences",
    "culturalProfile", "householdAssets", "probabilityMetrics",
]

REQUIRED_ARRAYS = ["educationTimeline"]

APPEARANCE_KEYS = [
    "heightCm", "build", "faceShape", "skinTone", "noseType", "eyeColor",
    "eyeShape", "hairColor", "hairTexture", "hairLength",
]


def get_profile_schema():
    """
    Machine-readable JSON Schema (draft-07 style) for a profile dict.
    Versioned with a $id so consumers can pin the shape they validate against.
    """
    props = {}
    for k in REQUIRED_STRINGS + REQUIRED_STRINGS_EMPTY_OK:
        props[k] = {"type": "string"}
    for k in REQUIRED_NUMBERS:
        props[k] = {"type": "number"}
    for k in REQUIRED_BOOLEANS:
        props[k] = {"type": "boolean"}
    for k in REQUIRED_OBJECTS:
        props[k] = {"type": "object"}
    for k in REQUIRED_ARRAYS:
        props[k] = {"type": "array"}
    for k, values in ENUMS.items():
        props[k] = {"type": "string", "enum": values}
    props["synthetic"] = {"const": True}
    props["generator"] = {"type": "string", "pattern": GENERATOR_RE.pattern}

    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://github.com/abhay557/indian-fakedata/schema/profile-2.0.9.json",
        "title": "DemographicProfile",
        "type": "object",
        "required": (REQUIRED_STRINGS + REQUIRED_STRINGS_EMPTY_OK + REQUIRED_NUMBERS +
                     REQUIRED_BOOLEANS + REQUIRED_OBJECTS + REQUIRED_ARRAYS +
                     list(ENUMS.keys()) + ["generator"]),
        "properties": props,
    }


def validate_profile(profile):
    """
    Validate a profile dict. Returns {"valid": bool, "errors": [...]}
    with every problem found (empty list = valid). Pure function —
    no RNG, no I/O, works on plain JSON-decoded dicts too.
    """
    errors = []
    if not isinstance(profile, dict):
        return {"valid": False, "errors": ["profile must be a dict"]}
    p = profile

    for k in REQUIRED_STRINGS:
        if not isinstance(p.get(k), str) or not p.get(k):
            errors.append(f"missing or empty string field: {k}")
    for k in REQUIRED_STRINGS_EMPTY_OK:
        if not isinstance(p.get(k), str):
            errors.append(f"missing string field: {k}")
    for k in REQUIRED_NUMBERS:
        v = p.get(k)
        if not isinstance(v, (int, float)) or isinstance(v, bool):
            errors.append(f"missing or invalid number field: {k}")
    for k in REQUIRED_BOOLEANS:
        if not isinstance(p.get(k), bool):
            errors.append(f"missing or invalid boolean field: {k}")
    for k in REQUIRED_OBJECTS:
        if not isinstance(p.get(k), dict):
            errors.append(f"missing or invalid object field: {k}")
    for k in REQUIRED_ARRAYS:
        if not isinstance(p.get(k), list):
            errors.append(f"missing or invalid array field: {k}")
    for k, values in ENUMS.items():
        if p.get(k) not in values:
            errors.append(f"field {k} must be one of: {', '.join(values)}")

    # Provenance markers must be present and well-formed
    if p.get("synthetic") is not True:
        errors.append('provenance marker "synthetic" must be true')
    if not isinstance(p.get("generator"), str) or not GENERATOR_RE.match(p.get("generator")):
        errors.append('provenance marker "generator" must look like "indian-fakedata@x.y.z"')

    # Appearance block (required since v2.0.8)
    a = p.get("appearance")
    if isinstance(a, dict):
        for k in APPEARANCE_KEYS:
            if a.get(k) in (None, ""):
                errors.append(f"appearance is missing: {k}")

    # Optional v2.0.9 blocks: validated lightly when present
    if "employmentTimeline" in p:
        tl = p["employmentTimeline"]
        if not isinstance(tl, list):
            errors.append("employmentTimeline must be an array when present")
        else:
            for i, s in enumerate(tl):
                if (not isinstance(s, dict) or not isinstance(s.get("jobTitle"), str)
                        or not isinstance(s.get("startYear"), (int, float))):
                    errors.append(f"employmentTimeline[{i}] needs jobTitle (string) "
                                  f"and startYear (number)")
    if "skills" in p:
        s = p["skills"]
        if (not isinstance(s, dict) or not isinstance(s.get("technical"), list)
                or not isinstance(s.get("languages"), list)):
            errors.append("skills must have technical[] and languages[] when present")

    return {"valid": len(errors) == 0, "errors": errors}
