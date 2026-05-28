"""
Narrative Text Generation Layer (SSPS — Layer 3)

Converts a DemographicProfile + SimulatedOutcomes into realistic
Indian text documents: loan applications, medical consultation notes,
school enrollment forms, Hinglish conversations, and more.
"""

import re
from datetime import datetime

def to_title_case(s: str) -> str:
    if not s:
        return ""
    return s.title()

def format_income(inr: int) -> str:
    if inr is None:
        return "₹0"
    if inr >= 10000000:
        return f"₹{inr / 10000000:.2f} Cr"
    if inr >= 100000:
        return f"₹{inr / 100000:.2f} Lakh"
    
    # Custom Indian comma grouping for numbers under 1 Lakh
    s = str(int(inr))
    if len(s) <= 3:
        return f"₹{s}"
    last3 = s[-3:]
    remaining = s[:-3]
    out = []
    while len(remaining) > 2:
        out.append(remaining[-2:])
        remaining = remaining[:-2]
    if remaining:
        out.append(remaining)
    out.reverse()
    return f"₹{','.join(out)},{last3}"

def format_date(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        # Format like "28 May 2026"
        return dt.strftime("%d %B %Y")
    except Exception:
        return iso_str

def education_label(edu: str) -> str:
    labels = {
        "illiterate": "Non-literate",
        "literate_below_primary": "Literate (below Primary)",
        "primary": "Primary (Class V)",
        "middle": "Middle (Class VIII)",
        "secondary": "Secondary (Class X / Matriculate)",
        "higher_secondary": "Higher Secondary (Class XII / Intermediate)",
        "graduate": "Graduate (Bachelor's Degree)",
        "postgraduate": "Post-Graduate (Master's Degree)",
        "technical_diploma": "Technical/Vocational Diploma",
        "professional_degree": "Professional Degree (B.Tech / MBBS / LLB)",
    }
    return labels.get(edu, edu)

def occupation_label(occ: str) -> str:
    labels = {
        "cultivator": "Cultivator / Farmer",
        "agricultural_labourer": "Agricultural Labourer",
        "household_industry": "Household Industry Worker",
        "other_worker": "Other Worker",
        "non_worker": "Non-Worker",
    }
    return labels.get(occ, occ)

def count_words(text: str) -> int:
    return len([w for w in text.strip().split() if w])

def extract_entities(content: str, profile: dict) -> list:
    entities = []
    first_name = profile.get("firstName", "")
    last_name = profile.get("lastName", "")
    state = profile.get("state", "")
    district = profile.get("district", "")
    aadhaar = profile.get("aadhaarNumber", "")
    religion = profile.get("religion", "")
    
    if first_name in content:
        entities.append(f"PERSON:{first_name} {last_name}")
    if state in content:
        entities.append(f"LOCATION:{state}")
    if district in content:
        entities.append(f"LOCATION:{district}")
    if aadhaar in content:
        entities.append("ID:AADHAAR")
    if religion in content:
        entities.append(f"RELIGION:{religion}")
        
    # Return unique elements
    return list(dict.fromkeys(entities))

def generate_loan_application(profile, outcomes):
    credit = outcomes.get("credit", {})
    employment = outcomes.get("employment", {})
    
    approved_amt = credit.get("approvedLoanAmountINR")
    if approved_amt:
        loan_amt = format_income(approved_amt)
    else:
        loan_amt = format_income(profile.get("annualIncomeINR", 10000) * 2)

    cyear = datetime.now().year
    cdate = datetime.now().strftime("%d/%m/%Y")
    
    aadhaar_spaced = re.sub(r'(.{4})', r'\1 ', profile.get("aadhaarNumber", "")).strip()

    content = f"""
PERSONAL LOAN APPLICATION FORM
{profile.get("bankName", "Bank").upper()} | IFSC: {profile.get("bankIFSC", "")}
─────────────────────────────────────────────────────────────────

APPLICATION DATE: {cdate}
APPLICATION NO: {profile.get("bankAccountNumber", "")[:6]}-LA-{cyear}

SECTION A — APPLICANT DETAILS
──────────────────────────────
Full Name           : {profile.get("firstName", "")} {profile.get("lastName", "")}
Father's Name       : {profile.get("fatherName", "")}
Date of Birth       : {format_date(profile.get("dateOfBirth", ""))}
Gender              : {to_title_case(profile.get("gender", ""))}
Marital Status      : {to_title_case(profile.get("maritalStatus", "").replace('_', ' '))}
Aadhaar Number      : {aadhaar_spaced}
PAN Card Number     : {profile.get("panNumber", "")}
Voter ID            : {profile.get("voterIdNumber", "")}
Mobile Number       : {profile.get("phoneNumber", "")}
Email Address       : {profile.get("email", "")}

SECTION B — ADDRESS
─────────────────────
Current Address     : {profile.get("addressLine", "")}, {profile.get("locality", "")}
District            : {profile.get("district", "")}
State               : {profile.get("state", "")} — {profile.get("stateCode", "")}
PIN Code            : {profile.get("pinCode", "")}
Residence Type      : {to_title_case(profile.get("areaType", ""))}

SECTION C — EMPLOYMENT & INCOME
─────────────────────────────────
Occupation          : {occupation_label(profile.get("occupation", ""))}
Employment Sector   : {to_title_case(profile.get("employmentSector", "").replace('_', ' '))}
Annual Income       : {format_income(profile.get("annualIncomeINR", 0))}
Monthly Expenditure : {format_income(profile.get("monthlyExpenditureINR", 0))}
Employer/Business   : {'Government of India / State Government' if profile.get("employmentSector") == 'government' else 'Self / Private Employer'}

SECTION D — LOAN REQUEST
──────────────────────────
Loan Amount Requested : {loan_amt}
Purpose of Loan     : {'Business Expansion / Working Capital' if profile.get("culturalProfile", {}).get("careerPreference") == 'business_trade' else 'Agricultural Input / Equipment Purchase' if profile.get("culturalProfile", {}).get("careerPreference") == 'agriculture' else 'Personal / Family Expenses'}
Repayment Tenure    : {'60 months (5 years)' if profile.get("age", 30) < 40 else '36 months (3 years)'}
Mode of Repayment   : {'Online / UPI Auto-Debit' if profile.get("hasSmartphone") == 'Yes' else 'Branch / NACH Mandate'}

SECTION E — BANK DETAILS
──────────────────────────
Bank Name           : {profile.get("bankName", "")}
Account Number      : {profile.get("bankAccountNumber", "")}
Account Type        : {'Savings Account' if profile.get("rationCardType") in ['APL', 'none'] else 'Jan Dhan / Basic Savings Account'}

SECTION F — CREDIT ASSESSMENT (Internal Use Only)
──────────────────────────────────────────────────
Credit Score        : {credit.get("creditScore", 500)} (CIBIL)
Approval Probability: {int(round(credit.get("loanApprovalProbability", 0.0) * 100))}%
Risk Codes          : {', '.join(credit.get("reasonCodes", [])) or 'NONE'}
Employment Quality  : {to_title_case(employment.get("employmentQuality", "informal").replace('_', ' '))}

DECLARATION
────────────
I, {profile.get("firstName", "")} {profile.get("lastName", "")}, hereby declare that the information furnished above is true and correct to the best of my knowledge. I authorize {profile.get("bankName", "Bank")} to verify the information and obtain my credit report from any credit bureau.

Signature: _______________________
Date      : {cdate}
Place     : {profile.get("district", "")}, {profile.get("state", "")}

[For Bank Use Only]
Processed by: _____________ | Verified by: _____________ | Date: _____________
""".strip()

    entities = extract_entities(content, profile)
    return {
        "type": "loan_application",
        "language": "english",
        "content": content,
        "metadata": {
            "wordCount": count_words(content),
            "entities": entities,
            "sensitiveFields": ["aadhaarNumber", "panNumber", "bankAccountNumber", "phoneNumber", "email"],
            "profileId": profile.get("id", "")
        }
    }

def generate_medical_consultation(profile, outcomes):
    health = outcomes.get("health", {})
    conditions_str = ", ".join(health.get("likelyConditions", [])) or "No chronic conditions flagged"
    bmi = profile.get("bmi", 22.0)
    cdate = datetime.now().strftime("%d/%m/%Y")

    content = f"""
OUTPATIENT CONSULTATION RECORD
{'District Hospital / Private Clinic' if profile.get("areaType") == 'urban' else 'Primary Health Centre (PHC) / Community Health Centre'}
{profile.get("district", "")} District, {profile.get("state", "")}
─────────────────────────────────────────────────────────────────

OPD No.       : OPD-{profile.get("id", "")[:8].upper()}
Date          : {cdate}
Consulting Dr.: Dr. [Name], MBBS {'MD' if profile.get("areaType") == 'urban' else ''}

PATIENT INFORMATION
────────────────────
Name          : {profile.get("firstName", "")} {profile.get("lastName", "")}
Age / Sex     : {profile.get("age", 30)} Yrs / {to_title_case(profile.get("gender", ""))}
DOB           : {format_date(profile.get("dateOfBirth", ""))}
Address       : {profile.get("locality", "")}, {profile.get("district", "")}
Phone         : {profile.get("phoneNumber", "")}
Aadhaar       : {profile.get("aadhaarNumber", "")[:4]} XXXX {profile.get("aadhaarNumber", "")[8:]}
Religion      : {to_title_case(profile.get("religion", ""))}
Caste/Category: {profile.get("caste", "")} ({profile.get("socialCategory", "")})
Health Scheme : {'Ayushman Bharat PM-JAY' if profile.get("healthInsurance") == 'pmjay' else 'ESIS' if profile.get("healthInsurance") == 'esis' else 'CGHS' if profile.get("healthInsurance") == 'cghs' else 'None / Self-Pay'}

VITALS
──────
Height        : {profile.get("heightCm", 165)} cm
Weight        : {profile.get("weightKg", 60)} kg
BMI           : {bmi:.1f} kg/m² ({health.get("bmiCategory", "normal").replace('_', ' ')})
Blood Group   : {profile.get("bloodGroup", "B+")}

HISTORY
────────
Chief Complaint: Routine check-up / General illness
Dietary Habit  : {to_title_case(profile.get("dietaryPreference", "").replace('_', ' '))}
Tobacco Use    : {'Non-smoker / Non-tobacco user' if profile.get("habits", {}).get("tobaccoUse", "none") == "none" else f"Yes ({profile.get('habits', {}).get('tobaccoUse')})"}
Alcohol        : {'None' if profile.get("habits", {}).get("alcoholUse", "none") == "none" else f"Yes ({profile.get('habits', {}).get('alcoholUse')})"}
Exercise       : {to_title_case(profile.get("habits", {}).get("exerciseFrequency", "occasional"))}
Sleep          : {profile.get("habits", {}).get("avgSleepHours", 7.0)} hours/night
Disability     : {'None' if profile.get("disability", "none") == "none" else to_title_case(profile.get("disability", "").replace('_', ' '))}
Occupation     : {occupation_label(profile.get("occupation", ""))}
Migrant Status : {f"Yes (from {profile.get('migrationOriginState')})" if profile.get("isMigrant") else 'Local Resident'}

ASSESSMENT
───────────
Health Risk Score   : {health.get("healthRiskScore", 30)}/100
Risk Indicators     : {conditions_str}
Healthcare Access   : {int(round(health.get("healthcareAccessProbability", 0.6) * 100))}% (estimated access probability)

PLAN
─────
{'1. Urgent follow-up investigations required\n2. Lifestyle modification counseling\n3. Referral to specialist recommended' if health.get("healthRiskScore", 30) > 60 else '1. Routine blood work and BP monitoring\n2. Dietary counseling\n3. Follow-up in 3 months' if health.get("healthRiskScore", 30) > 35 else '1. No immediate intervention required\n2. Continue healthy lifestyle\n3. Annual health screening recommended'}

Doctor's Signature: _________________________ Date: {cdate}
""".strip()

    entities = extract_entities(content, profile)
    return {
        "type": "medical_consultation",
        "language": "english",
        "content": content,
        "metadata": {
            "wordCount": count_words(content),
            "entities": entities,
            "sensitiveFields": ["aadhaarNumber", "phoneNumber", "bmi", "bloodGroup", "healthInsurance"],
            "profileId": profile.get("id", "")
        }
    }

def generate_hinglish_conversation(profile, outcomes):
    first_name = profile.get("firstName", "Abhay")
    is_urban = profile.get("areaType") == "urban"
    credit = outcomes.get("credit", {})
    has_loan = credit.get("loanApprovalProbability", 0.0) > 0.5
    religion = profile.get("religion", "hindu").lower()
    district = profile.get("district", "Hisar")
    sport = profile.get("interests", {}).get("primarySport", "none")

    content = ""
    if religion == "muslim":
        content = f"""[WhatsApp Chat — {first_name} & Friend]

Friend: Assalamu Alaikum bhai! Kya chal raha hai?
{first_name}: Wa alaikum assalam! Sab theek hai, aap batao?
Friend: {'Office mein busy tha yaar' if is_urban else 'Khet mein kaam tha bhai'}, isliye reply nahi kar paya.
{first_name}: Koi baat nahi. Sunno, bank ka kaam hua kya?
Friend: Haan, loan ke liye apply kiya tha. {'Approve ho gaya Alhamdulillah!' if has_loan else 'Abhi decision pending hai.'}
{first_name}: Mashallah! Kitna mila?
Friend: Abhi batata hoon. Tum Inshallah kab aoge?
{first_name}: {district} se {'Metro mein' if is_urban else 'shahar mein'} jaana hai, dekhte hain."""
    elif religion == "sikh":
        content = f"""[WhatsApp Chat — {first_name} & Friend]

Friend: Sat Sri Akal paaji! Ki haal hai?
{first_name}: Sat Sri Akal! Changa aa bhai, tu suna.
Friend: {'Office di meeting si' if is_urban else 'Khet wich kaam si'}, tenu phone nahi kar sakya.
{first_name}: Koi gall nahi. Bank wala kaam ho gaya?
Friend: Haan yaar, {'loan approve ho gaya Waheguru di mehar naal!' if has_loan else 'ichi review wich hai.'}
{first_name}: Waheguru Waheguru! Changa hoya.
Friend: Tenu ki khabar Punjab di?
{first_name}: Yaar, {district} wich sab theek aa."""
    else:
        content = f"""[WhatsApp Chat — {first_name} & Friend]

Friend: Arre {first_name} bhai! Kya scene hai? Kitne din baad!
{first_name}: Haan yaar! Bahut kaam tha. {'Office mein pressure zyada tha' if is_urban else 'Gaon mein kuch kaam tha'}.
Friend: Suno, wo bank wala loan approve hua kya?
{first_name}: {'Haan bhai! Finally approve ho gaya. Bahut relief mila.' if has_loan else 'Nahi yaar, abhi pending hai. Documents kuch aur maang rahe hain.'}
Friend: Achha! Kitne ka tha?
{first_name}: Arrey chhod, wo sab baad mein batata hoon. Tu bata, kya plan hai weekend ka?
Friend: Kuch nahi yaar. {f"{sport} dekhne ka plan hai TV pe." if sport != "none" else 'Ghar pe hi rahenge.'}
{first_name}: Chalte hain phir. {'City mein kuch dhundhte hain.' if is_urban else 'Bazaar mein milte hain.'} Kal milte hain!"""

    entities = extract_entities(content, profile)
    return {
        "type": "hinglish_conversation",
        "language": "hinglish",
        "content": content,
        "metadata": {
            "wordCount": count_words(content),
            "entities": entities,
            "sensitiveFields": [],
            "profileId": profile.get("id", "")
        }
    }

def generate_ration_card_application(profile):
    cdate = datetime.now().strftime("%d/%m/%Y")
    cyear = datetime.now().year
    
    cat_applied = (
        'Antyodaya Anna Yojana (AAY)' if profile.get("rationCardType") == 'AAY'
        else 'Below Poverty Line (BPL)' if profile.get("rationCardType") == 'BPL'
        else 'Above Poverty Line (APL)'
    )
    
    assets = profile.get("householdAssets", {})
    fuel = to_title_case(assets.get("cookingFuel", "firewood").replace('_', ' '))
    water = assets.get("drinkingWaterSource", "handpump").replace('_', ' ')
    land = profile.get("landOwnershipAcres", 0.0)

    content = f"""
APPLICATION FOR RATION CARD / NFSA ENTITLEMENT
Department of Food, Civil Supplies & Consumer Affairs
Government of {profile.get("state", "")}
─────────────────────────────────────────────────────────────────

Form No: NFSA-RC-{profile.get("stateCode", "")}-{cyear}
Category Applied For: {cat_applied}

HOUSEHOLD DETAILS
──────────────────
Head of Household   : {profile.get("firstName", "")} {profile.get("lastName", "")}
S/O, D/O, W/O      : {profile.get("fatherName", "")}
Age                 : {profile.get("age", 30)} years
Gender              : {to_title_case(profile.get("gender", ""))}
Aadhaar No.         : {profile.get("aadhaarNumber", "")}
Mobile No.          : {profile.get("phoneNumber", "")}
Religion            : {to_title_case(profile.get("religion", ""))}
Caste Category      : {profile.get("socialCategory", "General")} {f'({profile.get("caste")})' if profile.get("caste") else ''}

ADDRESS
────────
Village/Ward        : {profile.get("locality", "")}
District            : {profile.get("district", "")}
State               : {profile.get("state", "")}
PIN                 : {profile.get("pinCode", "")}
Area Type           : {to_title_case(profile.get("areaType", ""))}

HOUSEHOLD COMPOSITION
──────────────────────
Total Members       : {profile.get("householdSize", 1)}
Married             : {'Yes' if profile.get("maritalStatus") == 'married' else 'No'}
Spouse Name         : {profile.get("spouseName", "N/A")}
No. of Children     : {profile.get("numberOfChildren", 0)}
Annual HH Income    : {format_income(profile.get("annualIncomeINR", 0))}
Primary Occupation  : {occupation_label(profile.get("occupation", ""))}

DWELLING
─────────
House Type          : {assets.get("wallMaterial", "mud")} walls, {assets.get("roofMaterial", "thatch")} roof
Cooking Fuel        : {fuel}
Water Source        : {water}
No. of Rooms        : {assets.get("numberOfRooms", 1)}
Own Land            : {f"{land} acres" if land > 0.0 else 'No'}

DECLARATION
────────────
I declare that the above information is correct and that our household is not in possession of any existing ration card.

Applicant Signature: ____________________
Date: {cdate}

[For Office Use Only]
Verified by Supply Inspector: _____________
Ward/Village Panchayat: _________________
""".strip()

    entities = extract_entities(content, profile)
    return {
        "type": "ration_card_application",
        "language": "english",
        "content": content,
        "metadata": {
            "wordCount": count_words(content),
            "entities": entities,
            "sensitiveFields": ["aadhaarNumber", "phoneNumber"],
            "profileId": profile.get("id", "")
        }
    }

def generate_school_enrollment(profile, outcomes):
    cdate = datetime.now().strftime("%d/%m/%Y")
    cyear = datetime.now().year
    
    edu_details = profile.get("educationDetails", {})
    lit = outcomes.get("education", {}).get("functionalLiteracy", 50)
    grade = 'A Grade (Distinction)' if lit > 70 else 'B Grade (First Division)' if lit > 50 else 'C Grade (Second Division)'
    
    age = profile.get("age", 10)
    class_sought = 'Class I' if age <= 6 else f'Class {age - 5}' if age <= 10 else f'Class {age - 8}' if age <= 14 else 'Class XI / XII'
    
    ration = profile.get("rationCardType", "none")
    social_cat = profile.get("socialCategory", "General")
    income = profile.get("annualIncomeINR", 10000)

    content = f"""
ADMISSION APPLICATION FORM - {edu_details.get("institutionType", "government").upper()} SCHOOL
{profile.get("district", "")} District, {profile.get("state", "")}
Academic Year: {cyear}-{cyear + 1}
─────────────────────────────────────────────────────────────────

STUDENT DETAILS
────────────────
Student Name        : {profile.get("firstName", "")} {profile.get("lastName", "")}
Date of Birth       : {format_date(profile.get("dateOfBirth", ""))}
Age                 : {age} years
Gender              : {to_title_case(profile.get("gender", ""))}
Class Sought        : {class_sought}
Blood Group         : {profile.get("bloodGroup", "B+")}
Aadhaar (Student)   : {profile.get("aadhaarNumber", "")}
Category            : {social_cat} {f"— {profile.get('caste')}" if profile.get("caste") else ''}
Religion            : {to_title_case(profile.get("religion", ""))}
Mother Tongue       : {to_title_case(profile.get("motherTongue", "Hindi"))}
Medium of Instruction Preferred: {edu_details.get("mediumOfInstruction", "Hindi")}
Disability (if any) : {'No disability' if profile.get("disability", "none") == "none" else to_title_case(profile.get("disability", "").replace('_', ' '))}

PARENT/GUARDIAN DETAILS
────────────────────────
Father's Name       : {profile.get("fatherName", "")}
Mother's Name       : {profile.get("motherName", "")}
Guardian's Occupation: {occupation_label(profile.get("occupation", ""))}
Annual Family Income: {format_income(income)}
Mobile No.          : {profile.get("phoneNumber", "")}
Email               : {profile.get("email", "")}

ADDRESS
────────
{profile.get("addressLine", "")}, {profile.get("locality", "")}
{profile.get("district", "")}, {profile.get("state", "")} — {profile.get("pinCode", "")}

PREVIOUS SCHOOL DETAILS
────────────────────────
Last School Attended: {'Government Primary School, ' + profile.get("locality", "") if profile.get("areaType") == 'rural' else 'Private School, ' + profile.get("district", "")}
TC Number           : TC-{profile.get("id", "")[:8].upper()}
Marks/Grade         : {grade}

ENTITLEMENTS CLAIMED
─────────────────────
Free Textbooks     : {'Yes (BPL/AAY household)' if ration in ['BPL', 'AAY'] else 'No'}
Scholarship        : {'Yes (Pre-Matric SC/ST Scholarship)' if social_cat in ['SC', 'ST'] else 'Yes (OBC Scholarship if applicable)' if social_cat == 'OBC' else 'No'}
RTE Admission (25%): {'Applied under RTE Act 2009' if income < 200000 else 'Not applicable'}
Mid-Day Meal       : Yes (Government scheme)

Parent Signature: ____________________  Date: {cdate}
""".strip()

    entities = extract_entities(content, profile)
    return {
        "type": "school_enrollment",
        "language": "english",
        "content": content,
        "metadata": {
            "wordCount": count_words(content),
            "entities": entities,
            "sensitiveFields": ["aadhaarNumber", "phoneNumber", "email"],
            "profileId": profile.get("id", "")
        }
    }

def generate_narrative(profile, outcomes, doc_type):
    """
    Generate a realistic Indian text document from a demographic profile.
    """
    if doc_type == "loan_application":
        return generate_loan_application(profile, outcomes)
    elif doc_type == "medical_consultation":
        return generate_medical_consultation(profile, outcomes)
    elif doc_type == "hinglish_conversation":
        return generate_hinglish_conversation(profile, outcomes)
    elif doc_type == "ration_card_application":
        return generate_ration_card_application(profile)
    elif doc_type == "school_enrollment":
        return generate_school_enrollment(profile, outcomes)
    else:
        return generate_loan_application(profile, outcomes)

def generate_all_narratives(profile, outcomes):
    """
    Generate all supported narrative documents for a profile.
    """
    types = ["loan_application", "medical_consultation", "hinglish_conversation", "ration_card_application", "school_enrollment"]
    return [generate_narrative(profile, outcomes, t) for t in types]
