"""
Identity Document & Contact Generator

Generates realistic Indian identity documents, phone numbers,
email addresses, and financial identifiers. All formats follow
real-world patterns with valid checksums where applicable.
"""

import math
from indian_fakedata.core.sampler import weighted_sample, uniform_sample, gaussian_sample, bernoulli_sample

# ─── Verhoeff Tables for Aadhaar Checksum ─────────────────────

VERHOEFF_D = [
    [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0]
]
VERHOEFF_P = [
    [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
]
VERHOEFF_INV = [0,4,3,2,1,5,6,7,8,9]


def _verhoeff_checksum(num_str):
    c = 0
    digits = [int(d) for d in reversed(num_str)]
    for i, d in enumerate(digits):
        c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][d]]
    return VERHOEFF_INV[c]


def generate_aadhaar(rng):
    """Generate a valid 12-digit Aadhaar number with Verhoeff checksum."""
    digits = str(int(math.floor(rng.next() * 8)) + 2)  # First digit: 2-9
    for _ in range(10):
        digits += str(int(math.floor(rng.next() * 10)))
    check = _verhoeff_checksum(digits)
    return digits + str(check)


def generate_pan(last_name, rng):
    """Generate a PAN number with the correct layout AAAAA9999A.
    The 10th character is deterministic from the first 9 (self-consistent),
    but it is NOT the official Income Tax check-digit algorithm."""
    alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    c1 = alpha[int(math.floor(rng.next() * 26))]
    c2 = alpha[int(math.floor(rng.next() * 26))]
    c3 = alpha[int(math.floor(rng.next() * 26))]
    entity_type = 'P'
    last_name_char = (last_name[0] if last_name else 'A').upper()
    num = str(int(math.floor(rng.next() * 9999)) + 1).zfill(4)

    seed = f"{c1}{c2}{c3}{entity_type}{last_name_char}{num}"
    total = 0
    for ch in seed:
        total = (total * 31 + ord(ch)) % 9973
    check_char = alpha[total % 26]

    return f"{c1}{c2}{c3}{entity_type}{last_name_char}{num}{check_char}"


# ─── Voter ID ──────────────────────────────────────────────────

STATE_VOTER_PREFIXES = {
    'andhra_pradesh': ['YAT', 'YSR', 'YAP'], 'arunachal_pradesh': ['SLA', 'SLI'],
    'assam': ['BTX', 'JCH', 'KMJ'], 'bihar': ['BJI', 'BHP', 'BGP'],
    'chhattisgarh': ['CGH', 'RGH'], 'delhi': ['DLI', 'NDL', 'SWD'],
    'goa': ['GOA', 'NGO'], 'gujarat': ['GJN', 'GDN', 'SRT'],
    'haryana': ['HRY', 'FBD', 'GGN'], 'himachal_pradesh': ['HMP', 'SML'],
    'jammu_kashmir': ['JKD', 'JKS'], 'jharkhand': ['JHK', 'RNC'],
    'karnataka': ['KRN', 'BLR', 'MYS'], 'kerala': ['KRL', 'TVM', 'KCH'],
    'madhya_pradesh': ['MPH', 'BPL', 'IND'], 'maharashtra': ['MHR', 'MUM', 'PUN'],
    'manipur': ['MNP'], 'meghalaya': ['MLY'], 'mizoram': ['MZR'],
    'nagaland': ['NGL'], 'odisha': ['ODI', 'BBS'], 'punjab': ['PJB', 'LDH'],
    'rajasthan': ['RJN', 'JPR', 'JDH'], 'sikkim': ['SKM'],
    'tamil_nadu': ['TNJ', 'CHE', 'MDU'], 'telangana': ['TLG', 'HYD'],
    'tripura': ['TRP'], 'uttar_pradesh': ['UPR', 'LKO', 'AGR'],
    'uttarakhand': ['UTK', 'DDN'], 'west_bengal': ['WBN', 'KOL'],
    'chandigarh': ['CHD'], 'puducherry': ['PDY'],
    'andaman_nicobar': ['ANI'], 'dadra_nagar_haveli': ['DNH'],
    'daman_diu': ['DMD'], 'lakshadweep': ['LKS'],
}


def generate_voter_id(state_id, rng):
    """Generate a Voter ID number. Format: ABC1234567"""
    prefixes = STATE_VOTER_PREFIXES.get(state_id, ['IND'])
    prefix = uniform_sample(prefixes, rng)
    digits = ''.join(str(int(math.floor(rng.next() * 10))) for _ in range(7))
    return f"{prefix}{digits}"


# ─── Phone Number ──────────────────────────────────────────────

STATE_MOBILE_PREFIXES = {
    'andhra_pradesh': ['900', '901', '940', '944', '984', '903'],
    'assam': ['700', '701', '860', '913'],
    'bihar': ['702', '703', '862', '931', '959'],
    'chhattisgarh': ['704', '770', '827'],
    'delhi': ['880', '881', '882', '991', '995', '999', '706', '707'],
    'goa': ['708', '832'],
    'gujarat': ['709', '799', '942', '982', '630'],
    'haryana': ['896', '897', '812', '813'],
    'himachal_pradesh': ['941', '816', '817'],
    'jammu_kashmir': ['622', '797'],
    'jharkhand': ['771', '862', '863'],
    'karnataka': ['720', '721', '944', '984', '630'],
    'kerala': ['730', '731', '944', '984', '949'],
    'madhya_pradesh': ['740', '741', '770', '827'],
    'maharashtra': ['750', '751', '820', '821', '902', '903'],
    'manipur': ['870'], 'meghalaya': ['871'],
    'mizoram': ['872'], 'nagaland': ['873'],
    'odisha': ['760', '761', '943'],
    'punjab': ['780', '781', '988', '628'],
    'rajasthan': ['790', '791', '941', '982'],
    'sikkim': ['759'],
    'tamil_nadu': ['800', '801', '944', '984', '630'],
    'telangana': ['900', '910', '990', '630'],
    'tripura': ['874'],
    'uttar_pradesh': ['810', '811', '839', '905', '906', '941'],
    'uttarakhand': ['830', '831'],
    'west_bengal': ['840', '841', '903'],
    'chandigarh': ['781'], 'puducherry': ['944'],
    'andaman_nicobar': ['914'],
    'dadra_nagar_haveli': ['912'],
    'daman_diu': ['912'], 'lakshadweep': ['912'],
}


def generate_phone_number(state_id, rng):
    """Generate a 10-digit Indian phone number."""
    prefixes = STATE_MOBILE_PREFIXES.get(state_id, ['900', '800', '700'])
    prefix = uniform_sample(prefixes, rng)
    remaining = ''.join(str(int(math.floor(rng.next() * 10))) for _ in range(10 - len(prefix)))
    return prefix + remaining


# ─── Email ─────────────────────────────────────────────────────

EMAIL_DOMAIN_WEIGHTS = [
    {"domain": "gmail.com", "weight": 50},
    {"domain": "yahoo.com", "weight": 15},
    {"domain": "outlook.com", "weight": 10},
    {"domain": "hotmail.com", "weight": 8},
    {"domain": "rediffmail.com", "weight": 8},
    {"domain": "ymail.com", "weight": 3},
    {"domain": "protonmail.com", "weight": 3},
    {"domain": "icloud.com", "weight": 3},
]

import re as _re


def generate_email(first_name, last_name, rng):
    """Generate an email address."""
    domain_obj, _ = weighted_sample(EMAIL_DOMAIN_WEIGHTS, rng)
    domain = domain_obj["domain"]
    style = int(math.floor(rng.next() * 5))
    fn = _re.sub(r'[^a-z]', '', first_name.lower())
    ln = _re.sub(r'[^a-z]', '', last_name.lower())
    num = int(math.floor(rng.next() * 999)) + 1

    if style == 0:
        return f"{fn}.{ln}@{domain}"
    elif style == 1:
        return f"{fn}{ln}{num}@{domain}"
    elif style == 2:
        return f"{fn}_{ln}@{domain}"
    elif style == 3:
        return f"{fn}{num}@{domain}"
    else:
        return f"{fn}.{ln}{num}@{domain}"


# ─── Date of Birth ─────────────────────────────────────────────

import calendar


def generate_dob(age, rng):
    """Generate a date of birth from age."""
    from datetime import datetime
    current_year = datetime.now().year
    birth_year = current_year - age
    month = int(math.floor(rng.next() * 12)) + 1
    max_day = calendar.monthrange(birth_year, month)[1]
    day = int(math.floor(rng.next() * max_day)) + 1
    return f"{birth_year}-{str(month).zfill(2)}-{str(day).zfill(2)}"


# ─── Blood Group ──────────────────────────────────────────────

def generate_blood_group(rng):
    """Generate a blood group following Indian distribution."""
    groups = [
        {"group": "B+", "weight": 32.26},
        {"group": "O+", "weight": 30.13},
        {"group": "A+", "weight": 22.88},
        {"group": "AB+", "weight": 7.74},
        {"group": "B-", "weight": 2.52},
        {"group": "O-", "weight": 2.49},
        {"group": "A-", "weight": 1.36},
        {"group": "AB-", "weight": 0.62},
    ]
    item, _ = weighted_sample(groups, rng)
    return item["group"]


# ─── Biometrics ────────────────────────────────────────────────

def generate_height(gender, age, rng):
    """Generate height in cm based on gender and age (NFHS-5 data)."""
    if age < 5:
        mean = 85 if gender == 'female' else 87
        stddev = 8
    elif age < 12:
        mean = (120 + (age - 5) * 5) if gender == 'female' else (122 + (age - 5) * 5)
        stddev = 6
    elif age < 18:
        mean = (150 + (age - 12) * 1.5) if gender == 'female' else (148 + (age - 12) * 3)
        stddev = 5
    else:
        mean = 152 if gender == 'female' else 165
        stddev = 5.5 if gender == 'female' else 6.5
        if age > 60:
            mean -= (age - 60) * 0.3

    return round(gaussian_sample(mean, stddev, rng) * 10) / 10


def generate_weight(gender, age, height_cm, area_type, rng):
    """Generate weight in kg correlated with height, gender, age, and area."""
    bmi_mean = 23.5 if area_type == 'urban' else 21.5
    bmi_stddev = 3.5

    if age < 18:
        bmi_mean = 16 + age * 0.3
    if age > 65:
        bmi_mean -= 1

    bmi = max(14, min(40, gaussian_sample(bmi_mean, bmi_stddev, rng)))
    height_m = height_cm / 100
    weight = bmi * height_m * height_m
    return round(weight * 10) / 10


# ─── Bank Details ──────────────────────────────────────────────

BANKS = [
    {"name": "State Bank of India", "ifscPrefix": "SBIN0", "weight": 25},
    {"name": "Bank of Baroda", "ifscPrefix": "BARB0", "weight": 8},
    {"name": "Punjab National Bank", "ifscPrefix": "PUNB0", "weight": 8},
    {"name": "HDFC Bank", "ifscPrefix": "HDFC0", "weight": 12},
    {"name": "ICICI Bank", "ifscPrefix": "ICIC0", "weight": 10},
    {"name": "Axis Bank", "ifscPrefix": "UTIB0", "weight": 7},
    {"name": "Kotak Mahindra Bank", "ifscPrefix": "KKBK0", "weight": 5},
    {"name": "Union Bank of India", "ifscPrefix": "UBIN0", "weight": 5},
    {"name": "Canara Bank", "ifscPrefix": "CNRB0", "weight": 5},
    {"name": "Indian Bank", "ifscPrefix": "IDIB0", "weight": 4},
    {"name": "Bank of India", "ifscPrefix": "BKID0", "weight": 4},
    {"name": "Central Bank of India", "ifscPrefix": "CBIN0", "weight": 3},
    {"name": "Indian Overseas Bank", "ifscPrefix": "IOBA0", "weight": 2},
    {"name": "UCO Bank", "ifscPrefix": "UCBA0", "weight": 2},
]


def generate_bank_details(rng):
    """Generate bank name, IFSC, and account number."""
    bank, _ = weighted_sample(BANKS, rng)
    branch_code = ''.join(str(int(math.floor(rng.next() * 10))) for _ in range(6))
    account_number = ''.join(str(int(math.floor(rng.next() * 10))) for _ in range(11))
    return {
        "bankName": bank["name"],
        "bankIFSC": bank["ifscPrefix"] + branch_code,
        "bankAccountNumber": account_number,
    }


# ─── Vehicle Registration ─────────────────────────────────────

STATE_RTO_CODES = {
    'andhra_pradesh': ['AP 01', 'AP 02', 'AP 03', 'AP 05', 'AP 07', 'AP 09', 'AP 10', 'AP 16', 'AP 21', 'AP 28', 'AP 31', 'AP 36', 'AP 39'],
    'arunachal_pradesh': ['AR 01', 'AR 02'], 'assam': ['AS 01', 'AS 02', 'AS 03', 'AS 04', 'AS 06'],
    'bihar': ['BR 01', 'BR 02', 'BR 03', 'BR 04', 'BR 06', 'BR 19', 'BR 21', 'BR 22'],
    'chhattisgarh': ['CG 04', 'CG 07', 'CG 10'],
    'delhi': ['DL 01', 'DL 02', 'DL 03', 'DL 04', 'DL 05', 'DL 06', 'DL 07', 'DL 08', 'DL 09', 'DL 10', 'DL 12', 'DL 13'],
    'goa': ['GA 01', 'GA 02', 'GA 03', 'GA 04'],
    'gujarat': ['GJ 01', 'GJ 02', 'GJ 03', 'GJ 05', 'GJ 06', 'GJ 15', 'GJ 18', 'GJ 27'],
    'haryana': ['HR 01', 'HR 02', 'HR 03', 'HR 05', 'HR 06', 'HR 10', 'HR 20', 'HR 26', 'HR 51', 'HR 55'],
    'himachal_pradesh': ['HP 01', 'HP 03', 'HP 04'], 'jammu_kashmir': ['JK 01', 'JK 02', 'JK 03', 'JK 05'],
    'jharkhand': ['JH 01', 'JH 02', 'JH 03', 'JH 04', 'JH 05', 'JH 10'],
    'karnataka': ['KA 01', 'KA 02', 'KA 03', 'KA 04', 'KA 05', 'KA 09', 'KA 19', 'KA 50', 'KA 51', 'KA 53'],
    'kerala': ['KL 01', 'KL 02', 'KL 03', 'KL 04', 'KL 05', 'KL 07', 'KL 08', 'KL 10', 'KL 14'],
    'madhya_pradesh': ['MP 01', 'MP 02', 'MP 04', 'MP 07', 'MP 09', 'MP 20'],
    'maharashtra': ['MH 01', 'MH 02', 'MH 03', 'MH 04', 'MH 05', 'MH 06', 'MH 12', 'MH 14', 'MH 20', 'MH 31', 'MH 43', 'MH 46', 'MH 47'],
    'manipur': ['MN 01', 'MN 02'], 'meghalaya': ['ML 01', 'ML 02', 'ML 05'],
    'mizoram': ['MZ 01', 'MZ 02'], 'nagaland': ['NL 01', 'NL 02', 'NL 07'],
    'odisha': ['OD 01', 'OD 02', 'OD 03', 'OD 05', 'OD 06'],
    'punjab': ['PB 01', 'PB 02', 'PB 03', 'PB 04', 'PB 05', 'PB 06', 'PB 08', 'PB 10', 'PB 65'],
    'rajasthan': ['RJ 01', 'RJ 02', 'RJ 06', 'RJ 07', 'RJ 09', 'RJ 14', 'RJ 19', 'RJ 20', 'RJ 27'],
    'sikkim': ['SK 01', 'SK 02'],
    'tamil_nadu': ['TN 01', 'TN 02', 'TN 03', 'TN 04', 'TN 05', 'TN 07', 'TN 09', 'TN 10', 'TN 14', 'TN 18', 'TN 20', 'TN 22', 'TN 38'],
    'telangana': ['TS 01', 'TS 02', 'TS 07', 'TS 08', 'TS 09', 'TS 10', 'TS 12', 'TS 13'],
    'tripura': ['TR 01', 'TR 02'],
    'uttar_pradesh': ['UP 01', 'UP 02', 'UP 11', 'UP 12', 'UP 13', 'UP 14', 'UP 15', 'UP 16', 'UP 20', 'UP 25', 'UP 32', 'UP 50', 'UP 65', 'UP 70', 'UP 78', 'UP 80', 'UP 81'],
    'uttarakhand': ['UK 01', 'UK 02', 'UK 04', 'UK 07'],
    'west_bengal': ['WB 01', 'WB 02', 'WB 06', 'WB 10', 'WB 19', 'WB 24', 'WB 26', 'WB 74'],
    'chandigarh': ['CH 01', 'CH 02', 'CH 03', 'CH 04'], 'puducherry': ['PY 01', 'PY 02', 'PY 03', 'PY 05'],
    'andaman_nicobar': ['AN 01'], 'dadra_nagar_haveli': ['DN 09'],
    'daman_diu': ['DD 01', 'DD 02'], 'lakshadweep': ['LD 01'],
}


def generate_vehicle_registration(state_id, rng):
    """Generate a vehicle registration number."""
    codes = STATE_RTO_CODES.get(state_id, ['DL 01'])
    rto_code = uniform_sample(codes, rng)
    alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    c1 = alpha[int(math.floor(rng.next() * 26))]
    c2 = alpha[int(math.floor(rng.next() * 26))]
    num = str(int(math.floor(rng.next() * 9999)) + 1).zfill(4)
    return f"{rto_code} {c1}{c2} {num}"


# ─── PIN Code ──────────────────────────────────────────────────

STATE_PIN_RANGES = {
    'delhi': (110001, 110097), 'chandigarh': (160001, 160101),
    'haryana': (121001, 136156), 'himachal_pradesh': (171001, 177601),
    'jammu_kashmir': (180001, 194404), 'punjab': (140001, 160104),
    'rajasthan': (301001, 345034), 'uttarakhand': (244001, 263680),
    'uttar_pradesh': (200001, 285223), 'bihar': (800001, 855126),
    'jharkhand': (813101, 835325), 'odisha': (750001, 770076),
    'west_bengal': (700001, 743711), 'chhattisgarh': (490001, 497778),
    'madhya_pradesh': (450001, 488448), 'gujarat': (360001, 396590),
    'maharashtra': (400001, 445402), 'goa': (403001, 403806),
    'andhra_pradesh': (500001, 535593), 'karnataka': (560001, 591346),
    'kerala': (670001, 695615), 'tamil_nadu': (600001, 643253),
    'telangana': (500001, 509412), 'assam': (781001, 788931),
    'meghalaya': (793001, 794115), 'tripura': (799001, 799290),
    'mizoram': (796001, 796901), 'manipur': (795001, 795159),
    'nagaland': (797001, 798627), 'arunachal_pradesh': (790001, 792131),
    'sikkim': (737101, 737139), 'andaman_nicobar': (744101, 744304),
    'lakshadweep': (682551, 682559), 'puducherry': (605001, 609607),
    'dadra_nagar_haveli': (396191, 396240), 'daman_diu': (396210, 396220),
}


def generate_pin_code(state_id, rng):
    """Generate a PIN code mapped to the state.
    NOTE: drawn uniformly from the state's overall range only — state-plausible,
    not guaranteed to match the district (no district->PIN dataset bundled)."""
    pin_range = STATE_PIN_RANGES.get(state_id, (100001, 999999))
    pin = int(math.floor(rng.next() * (pin_range[1] - pin_range[0]))) + pin_range[0]
    return str(pin).zfill(6)


# ─── Address ───────────────────────────────────────────────────

URBAN_LOCALITIES = [
    'Indira Nagar', 'Gandhi Nagar', 'Nehru Colony', 'Rajiv Gandhi Nagar', 'Shastri Nagar',
    'Ambedkar Colony', 'Laxmi Nagar', 'Ram Nagar', 'Shivaji Nagar', 'Patel Nagar',
    'Vikas Nagar', 'Adarsh Colony', 'Jawahar Nagar', 'Subhash Nagar', 'Model Town',
    'Civil Lines', 'Sadar Bazar', 'Station Road', 'MG Road', 'Ring Road',
    'Sector 1', 'Sector 5', 'Sector 10', 'Sector 15', 'Sector 22',
    'Phase 1', 'Phase 2', 'Block A', 'Block B', 'Block C',
    'Vasant Kunj', 'Rohini', 'Dwarka', 'Malviya Nagar', 'Saket',
    'Koramangala', 'Indiranagar', 'JP Nagar', 'HSR Layout', 'Whitefield',
    'Bandra West', 'Andheri East', 'Powai', 'Goregaon', 'Thane West',
]

RURAL_LOCALITIES = [
    'Village Main Road', 'Gram Panchayat', 'Near Primary School', 'Near Temple',
    'Near Mosque', 'Near Church', 'Near Gurudwara', 'Post Office Road',
    'Kisan Colony', 'Harijan Basti', 'New Colony', 'Old Village',
    'Near Bus Stand', 'Near Railway Station', 'Mill Road', 'Tank Road',
    'Near PHC', 'Near Govt School', 'Panchayat Bhawan', 'Near Market',
]

STREET_TYPES = ['Street', 'Road', 'Lane', 'Gali', 'Marg', 'Path', 'Cross', 'Main Road']


def generate_address(district, area_type, rng):
    """Generate a street address with locality."""
    localities = URBAN_LOCALITIES if area_type == 'urban' else RURAL_LOCALITIES
    locality = uniform_sample(localities, rng)

    if area_type == 'urban':
        house_num = f"{int(math.floor(rng.next() * 999)) + 1}/{chr(65 + int(math.floor(rng.next() * 8)))}"
    else:
        house_num = str(int(math.floor(rng.next() * 500)) + 1)

    address_line = f"{house_num}, {locality}, {district}"
    return {"addressLine": address_line, "locality": locality}


# ─── UPI ID ────────────────────────────────────────────────────

UPI_SUFFIXES = ['@ybl', '@paytm', '@oksbi', '@okicici', '@okaxis', '@upi', '@apl', '@ibl']


def generate_upi(phone_number, first_name, rng):
    """Generate a UPI ID."""
    style = int(math.floor(rng.next() * 3))
    suffix = uniform_sample(UPI_SUFFIXES, rng)
    if style == 1:
        return f"{first_name.lower()}{suffix}"
    return f"{phone_number}{suffix}"
