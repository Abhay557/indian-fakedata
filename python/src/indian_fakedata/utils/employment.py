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
        "Junior Engineer", "Patwari", "Bus Conductor", "Gram Panchayat Secretary",
        "Forest Guard", "Health Visitor (ANM)", "Data Entry Operator (Govt)",
        "Lineman (Electricity Board)", "Sanitary Inspector",
    ],
    "public_sector": [
        "Bank Clerk", "LIC Agent", "Railway Guard", "BSNL Technician",
        "Post Office Assistant", "Bank Peon", "Insurance Assistant",
        "Railway Booking Clerk", "Bank Cashier", "Postman (GDS)",
        "Customer Service Associate (Bank)", "Recovery Agent",
    ],
    "private": [
        "Sales Executive", "Software Engineer", "Accountant",
        "Customer Support Associate", "Delivery Partner", "Security Guard",
        "Data Entry Operator", "Marketing Executive", "Electrician",
        "Receptionist", "HR Executive", "Quality Analyst",
        "Telecaller", "Warehouse Supervisor", "Pharmacy Assistant",
        "Logistics Coordinator",
    ],
    "self_employed": [
        "Kirana Shop Owner", "Tailor", "Tea Stall Owner", "Auto Rickshaw Driver",
        "Barber", "Carpenter", "Mason", "Vegetable Vendor",
        "Mobile Repair Shop Owner", "Dairy Farmer", "Dhaba Owner",
        "Photocopy/Printing Shop Owner", "Tour Guide", "Poultry Farmer",
        "Beauty Parlour Owner", "Cycle Repair Mechanic",
    ],
    "informal": [
        "Daily Wage Labourer", "Construction Worker", "Domestic Help",
        "Farm Labourer", "Street Vendor", "Loader/Unloader", "Painter",
        "Plumber Helper", "Brick Kiln Worker", "Rag Picker",
        "Rickshaw Puller", "Hotel Waiter (Dhaba)", "Gardener (Mali)",
        "Watchman",
    ],
    "household_industry": [
        "Handloom Weaver", "Potter", "Bidi Roller", "Papad Maker",
        "Embroidery Worker", "Basket Weaver", "Carpet Weaver",
        "Jewellery Polisher", "Incense Stick Maker", "Pickle Maker",
    ],
    "cultivator": [
        "Paddy Farmer", "Wheat Farmer", "Sugarcane Farmer", "Vegetable Grower",
        "Tenant Farmer", "Orchard Keeper", "Cotton Farmer", "Mustard Farmer",
        "Fish Farmer", "Sugarcane Cutter",
    ],
}

# Job titles per field of study (matches educationDetails.fieldOfStudy).
# The most recent spell draws from here so the education timeline and the
# employment timeline agree with each other.
FIELD_TITLES = {
    "Engineering/Technology": [
        "Junior Engineer", "Site Engineer", "Maintenance Technician",
        "Draughtsman", "Quality Engineer", "Workshop Supervisor",
        "Diploma Trainee", "Service Engineer",
    ],
    "Computer Science/IT": [
        "Software Engineer", "Computer Operator", "IT Support Executive",
        "Data Entry Operator", "Web Designer", "System Administrator",
        "QA Tester", "Technical Support Associate",
    ],
    "Medicine/Health": [
        "Staff Nurse (GNM)", "Lab Technician", "Pharmacist",
        "Health Worker (ASHA)", "Ward Assistant", "Physiotherapy Assistant",
        "ANM Nurse", "Blood Bank Technician",
    ],
    "Education/B.Ed": [
        "Primary School Teacher", "Secondary School Teacher", "Private Tutor",
        "Anganwadi Worker", "Coaching Institute Teacher", "Librarian",
    ],
    "Commerce/Business": [
        "Accountant", "Tally Operator", "Bank Clerk", "Sales Executive",
        "Cashier", "Billing Assistant", "Purchase Assistant",
    ],
    "Management/MBA": [
        "Marketing Executive", "HR Executive", "Branch Manager",
        "Business Development Executive", "Operations Supervisor",
        "Customer Relationship Manager",
    ],
    "Law": [
        "Junior Advocate", "Legal Assistant", "Court Clerk",
        "Documentation Assistant", "Notary Assistant",
    ],
    "Agriculture": [
        "Agricultural Extension Worker", "Soil Testing Assistant",
        "Seed Production Assistant", "Dairy Supervisor", "Paddy Farmer",
        "Nursery Worker",
    ],
    "Science": [
        "Lab Assistant", "Research Assistant", "Science Teacher",
        "Quality Control Assistant", "Survey Assistant",
    ],
    "Arts/Humanities": [
        "Clerk (LDC)", "Content Writer (Hindi)", "Social Worker",
        "Library Assistant", "Data Entry Operator", "Receptionist",
    ],
}

# Doctor-grade titles need a professional degree, not just any graduate
DOCTOR_TITLES = ["Doctor (MBBS)", "Medical Officer (PHC)"]

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
                                 rng, current_year=None, field_of_study=None):
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

    # Field-of-study match (v2.1.0): when the profile studied a known field
    # and works as other_worker (or has a sampled non-worker history), the
    # most recent spell draws from that field's titles — so a BTech graduate
    # works as an engineer, not a medical teacher. Farm/craft occupations
    # keep their own pools (occupation beats field there). Doctor-grade
    # titles additionally need a professional degree.
    # Same draw count either way (one uniform pick per spell), so existing
    # stream positions never shift.
    field_titles = None
    if (field_of_study and field_of_study in FIELD_TITLES
            and occupation in ("other_worker", "non_worker")):
        field_titles = list(FIELD_TITLES[field_of_study])
        if field_of_study == "Medicine/Health" and education == "professional_degree":
            field_titles += DOCTOR_TITLES

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
            "jobTitle": uniform_sample(field_titles if (last and field_titles) else titles, rng),
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
