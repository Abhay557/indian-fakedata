"""
Employment History Timeline Generator (v2.0.9)

Mirrors the TypeScript implementation (src/utils/employment.ts): a
chronological list of job spells with titles, sectors, tenure and wage
progression. Runs AFTER profile assembly so every pre-existing field
(including id) for a given seed stays byte-identical.

Titles are plausible Indian job labels per sector. Wages progress towards
the profile's current annual income. Students, the unemployed and young
homemakers get an empty timeline; retirees get completed-only history.
"""

from indian_fakedata.core.sampler import uniform_sample, weighted_sample_from_record

# Typical age when people with a given education start working
WORK_START_AGE = {
    "illiterate": 14,
    "literate_below_primary": 14,
    "primary": 15,
    "middle": 15,
    "secondary": 17,
    "higher_secondary": 18,
    "technical_diploma": 20,
    "graduate": 21,
    "postgraduate": 23,
    "professional_degree": 23,
}

# Plausible job titles per sector (gender-neutral wording)
TITLES = {
    "government": [
        "Primary School Teacher", "Clerk (LDC)", "Police Constable", "Postman",
        "Railway Ticket Collector", "Anganwadi Worker", "Staff Nurse (GNM)",
        "Junior Engineer", "Patwari", "Bus Conductor",
    ],
    "public_sector": [
        "Bank Clerk", "LIC Agent", "Railway Guard", "BSNL Technician",
        "Post Office Assistant", "Bank Peon", "Insurance Assistant",
    ],
    "private": [
        "Sales Executive", "Software Engineer", "Accountant",
        "Customer Support Associate", "Delivery Partner", "Security Guard",
        "Data Entry Operator", "Marketing Executive", "Electrician",
        "Receptionist",
    ],
    "self_employed": [
        "Kirana Shop Owner", "Tailor", "Tea Stall Owner", "Auto Rickshaw Driver",
        "Barber", "Carpenter", "Mason", "Vegetable Vendor",
        "Mobile Repair Shop Owner", "Dairy Farmer",
    ],
    "informal": [
        "Daily Wage Labourer", "Construction Worker", "Domestic Help",
        "Farm Labourer", "Street Vendor", "Loader/Unloader", "Painter",
        "Plumber Helper",
    ],
    "household_industry": [
        "Handloom Weaver", "Potter", "Bidi Roller", "Papad Maker",
        "Embroidery Worker", "Basket Weaver",
    ],
    "cultivator": [
        "Paddy Farmer", "Wheat Farmer", "Sugarcane Farmer", "Vegetable Grower",
        "Tenant Farmer", "Orchard Keeper",
    ],
}

EMPLOYER_TYPE = {
    "government": "government",
    "public_sector": "government",
    "private": "private",
    "self_employed": "self",
    "informal": "informal",
    "household_industry": "household",
    "cultivator": "self",
}


def _occupation_for_sampled_sector(sector):
    # Census occupation bucket implied by a past sector (non-worker histories only)
    if sector == "cultivator":
        return "cultivator"
    if sector == "informal":
        return "agricultural_labourer"
    if sector == "household_industry":
        return "household_industry"
    return "other_worker"


def generate_employment_timeline(age, education, occupation, employment_sector,
                                 annual_income_inr, district, area_type, gender,
                                 rng, current_year=None):
    """
    Generate a chronological employment history (list of dicts).

    Runs AFTER profile assembly (draws appended at the very end), so it never
    disturbs pre-existing fields for a seed.
    """
    from datetime import datetime
    if current_year is None:
        current_year = datetime.now().year
    start_age = WORK_START_AGE.get(education, 18)

    # no work history yet: students, unemployed, young homemakers, children
    if employment_sector in ("student", "unemployed") or age < start_age + 1:
        return []
    if employment_sector == "homemaker" and age < 30:
        return []

    retired = employment_sector == "retired"
    # career window: school-leaving age -> now (or age 60 for retirees/elders)
    career_end = 60 if (retired or age > 60) else age
    tenure = max(0, career_end - start_age)
    if tenure <= 0:
        return []

    # past sector for retirees/homemakers with history (their current
    # employmentSector label carries no sector info)
    sector = employment_sector
    if retired or employment_sector == "homemaker":
        key, _ = weighted_sample_from_record(
            {"private": 30, "self_employed": 25, "government": 15,
             "informal": 20, "public_sector": 10}, rng)
        sector = key

    # v2.1.0 fix: the timeline is an object of OCCUPATION, not sector.
    # Farm/craft occupations always get their own titles and keep their own
    # occupation label — a cultivator is never a "Kirana Shop Owner", and an
    # urban informal other_worker is never relabelled agricultural_labourer.
    # Only non_worker histories (retired / older homemakers) derive titles
    # and occupation from the sampled past sector.
    if occupation == "cultivator":
        titles = TITLES["cultivator"]
        stage_occupation = "cultivator"
    elif occupation == "agricultural_labourer":
        titles = TITLES["informal"]
        stage_occupation = "agricultural_labourer"
    elif occupation == "household_industry":
        titles = TITLES["household_industry"]
        stage_occupation = "household_industry"
    elif occupation == "other_worker":
        titles = TITLES.get(sector, TITLES["private"])
        stage_occupation = "other_worker"
    else:
        titles = TITLES.get(sector, TITLES["private"])
        stage_occupation = _occupation_for_sampled_sector(sector)

    # number of job spells grows with tenure: mostly 1-2, up to 4
    spells = 1
    if tenure >= 5:
        key, _ = weighted_sample_from_record(
            {"1": 45, "2": 35, "3": 15, "4": 5}, rng)
        spells = int(key)

    # split tenure into spell durations (each at least 1 year)
    durations = []
    remaining = tenure
    for i in range(spells):
        if i == spells - 1:
            durations.append(max(1, remaining))
        else:
            max_share = max(1, remaining - (spells - i - 1))
            dur = 1 + int(rng.next() * max_share)
            durations.append(dur)
            remaining -= dur

    # wage ladder: earlier spells earn less, current spell matches income
    current_monthly = max(1000, round(annual_income_inr / 12 / 100) * 100)
    birth_year = current_year - age
    timeline = []
    year = birth_year + start_age

    for i in range(spells):
        last = i == spells - 1
        progress = 1 if spells == 1 else 0.5 + (0.5 * i) / (spells - 1)
        jitter = 0.9 + rng.next() * 0.2
        monthly = max(800, round(current_monthly * progress * jitter / 100) * 100)
        done = last and not retired

        stage = {
            "jobTitle": uniform_sample(titles, rng),
            "sector": sector,
            "occupation": stage_occupation,
            "employerType": EMPLOYER_TYPE.get(sector, "private"),
            "startYear": year,
            "status": "current" if done else "completed",
            "monthlyWageINR": current_monthly if done else monthly,
            "location": district,
        }
        if not done:
            stage["endYear"] = year + durations[i]
        timeline.append(stage)
        year += durations[i]

    return timeline
