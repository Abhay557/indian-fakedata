"""
Skills & Language Proficiency Generator (v2.0.9)

Mirrors the TypeScript implementation (src/utils/skills.ts): a `skills`
block with technical skills, soft skills, certifications and per-language
speaking/reading/writing levels. Runs on an isolated RNG stream AFTER
profile assembly, so it never disturbs pre-existing fields for a seed.
"""

from indian_fakedata.core.sampler import uniform_sample, weighted_sample_from_record

HIGHER_EDU = {
    "higher_secondary", "technical_diploma", "graduate",
    "postgraduate", "professional_degree",
}

GENERAL_TECHNICAL = [
    "Mobile Phone Repair Basics", "Two-Wheeler Driving", "Commercial Cooking",
    "Basic Electrical Work", "Plumbing Basics", "Painting & Whitewash",
    "Tailoring Basics", "Beautician Basics",
]

EDU_TECHNICAL = {
    "graduate": [
        "Computer Basics", "MS Excel", "Data Entry", "Tally Accounting",
        "Internet & Email", "Typing (English/Hindi)",
    ],
    "postgraduate": [
        "Computer Basics", "MS Excel", "Data Analysis Basics", "Tally Accounting",
        "Report Writing", "Presentation Skills",
    ],
    "professional_degree": [
        "Programming Basics", "Database Basics", "Engineering Drawing",
        "Project Documentation", "Lab Techniques",
    ],
    "technical_diploma": [
        "ITI Fitter Trade", "Electrician Trade", "Welding Basics",
        "Motor Winding", "Refrigeration Basics",
    ],
    "higher_secondary": ["Computer Basics", "Typing (English/Hindi)", "Data Entry"],
}

OCC_TECHNICAL = {
    "cultivator": [
        "Crop Planning", "Soil Testing Basics", "Tractor Operation",
        "Drip Irrigation", "Pesticide Handling", "Seed Selection",
    ],
    "agricultural_labourer": [
        "Harvesting", "Transplantation", "Threshing", "Livestock Care",
    ],
    "household_industry": [
        "Handloom Weaving", "Embroidery", "Pottery", "Food Processing",
        "Basket Weaving", "Bidi Rolling",
    ],
}

SOFT_SKILLS = [
    "Communication", "Teamwork", "Time Management", "Leadership",
    "Problem Solving", "Customer Handling", "Negotiation",
]

CERTIFICATIONS = [
    "CCC Computer Course", "ITI Certificate", "Tally Certification",
    "B.Ed Degree", "GNM Nursing", "Diploma in Computer Applications",
    "Driving Licence (Commercial)", "Food Safety Training",
]


def _pick_many(pool, n, rng):
    # pick n distinct items from a pool using the rng stream
    bag = list(pool)
    out = []
    while len(out) < n and bag:
        out.append(bag.pop(int(rng.next() * len(bag))))
    return out


def generate_skills(age, education, occupation, employment_sector,
                    mother_tongue, second_language, area_type, rng):
    """
    Generate the skills block for a profile (dict).

    Runs on an isolated stream AFTER profile assembly (draws never touch
    the main stream), so pre-existing fields for a seed stay identical.
    """
    child = age < 15

    # technical skills: education pool + occupation pool
    technical = []
    if not child:
        pool = (EDU_TECHNICAL.get(education, []) +
                OCC_TECHNICAL.get(occupation, []) + GENERAL_TECHNICAL)
        max_pick = 4 if education in HIGHER_EDU else 2
        key, _ = weighted_sample_from_record(
            {"1": 40, "2": 35, "3": 20, "4": 5}, rng)
        technical = _pick_many(pool, min(int(key), max_pick, len(pool)), rng)
        if education == "illiterate":
            technical = _pick_many(GENERAL_TECHNICAL, 1, rng)

    # soft skills: 1-3 for working-age profiles
    soft = []
    if not child and employment_sector != "student":
        key, _ = weighted_sample_from_record({"1": 30, "2": 45, "3": 25}, rng)
        soft = _pick_many(SOFT_SKILLS, int(key), rng)

    # certifications: schooled profiles sometimes hold one
    certifications = []
    if not child and education in HIGHER_EDU and rng.next() < 0.35:
        certifications = [uniform_sample(CERTIFICATIONS, rng)]

    # languages: mother tongue + second language + English/Hindi
    schooled = education not in ("illiterate", "literate_below_primary")
    languages = [{
        "language": mother_tongue,
        "speaking": "native",
        "reading": "fluent" if schooled else "basic",
        "writing": "fluent" if schooled else "basic",
    }]
    if second_language and second_language != mother_tongue:
        key, _ = weighted_sample_from_record(
            {"intermediate": 40, "fluent": 55, "native": 5}, rng)
        lvl = key
        languages.append({
            "language": second_language,
            "speaking": lvl,
            "reading": lvl if schooled else "basic",
            "writing": lvl if schooled else "basic",
        })
    if (education in HIGHER_EDU and mother_tongue != "English"
            and second_language != "English"):
        key, _ = weighted_sample_from_record(
            {"basic": 30, "intermediate": 55, "fluent": 15}, rng)
        lvl = key
        languages.append({"language": "English", "speaking": lvl,
                          "reading": lvl, "writing": lvl})

    return {"technical": technical, "soft": soft,
            "certifications": certifications, "languages": languages}
