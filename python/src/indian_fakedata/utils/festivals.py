"""
Festival Calendar Generator (v2.1.0, item 5)

Mirrors the TypeScript implementation (src/utils/festivals.ts): every
profile gets a ``festivals`` list with observances dated for the current
calendar year, driven by religion and state. Major pan-Indian festivals
come from the profile's religion; regional ones (Pongal, Bihu, Onam,
Durga Puja, Chhath, Teej, Baisakhi, Ganesh Chaturthi) only appear in
their states.

Dates are typical Gregorian dates for lunisolar festivals, which shift a
few weeks year to year — the docs say so plainly.

Runs on an isolated per-profile stream: zero impact on seeded output.
"""

from datetime import datetime

FESTIVALS = [
    # Hindu pan-Indian
    {"name": "Diwali", "month": 10, "day": 20,
     "religions": ["hindu", "sikh", "jain"], "weight": 95},
    {"name": "Holi", "month": 3, "day": 8,
     "religions": ["hindu"], "weight": 85},
    {"name": "Dussehra", "month": 10, "day": 12,
     "religions": ["hindu"], "weight": 80},
    {"name": "Raksha Bandhan", "month": 8, "day": 19,
     "religions": ["hindu", "sikh"], "weight": 75},
    {"name": "Janmashtami", "month": 8, "day": 26,
     "religions": ["hindu"], "weight": 60},
    {"name": "Maha Shivaratri", "month": 2, "day": 26,
     "religions": ["hindu"], "weight": 55},
    {"name": "Navratri", "month": 10, "day": 3,
     "religions": ["hindu"], "weight": 50},
    # Muslim pan-Indian
    {"name": "Eid al-Fitr", "month": 3, "day": 31,
     "religions": ["muslim"], "weight": 95},
    {"name": "Eid al-Adha", "month": 6, "day": 7,
     "religions": ["muslim"], "weight": 85},
    {"name": "Muharram", "month": 7, "day": 7,
     "religions": ["muslim"], "weight": 50},
    # Christian pan-Indian
    {"name": "Christmas", "month": 12, "day": 25,
     "religions": ["christian"], "weight": 95},
    {"name": "Good Friday", "month": 4, "day": 18,
     "religions": ["christian"], "weight": 70},
    {"name": "Easter", "month": 4, "day": 20,
     "religions": ["christian"], "weight": 65},
    # Sikh
    {"name": "Baisakhi", "month": 4, "day": 13,
     "religions": ["sikh"], "weight": 90},
    {"name": "Guru Nanak Gurpurab", "month": 11, "day": 15,
     "religions": ["sikh"], "weight": 85},
    # Buddhist
    {"name": "Buddha Purnima", "month": 5, "day": 12,
     "religions": ["buddhist"], "weight": 90},
    # Jain
    {"name": "Mahavir Jayanti", "month": 4, "day": 10,
     "religions": ["jain"], "weight": 90},
    # Regional
    {"name": "Pongal", "month": 1, "day": 14,
     "religions": ["hindu"], "states": ["tamil_nadu"], "weight": 95},
    {"name": "Bihu", "month": 4, "day": 14,
     "religions": ["hindu"], "states": ["assam"], "weight": 95},
    {"name": "Onam", "month": 9, "day": 5,
     "religions": ["hindu"], "states": ["kerala"], "weight": 95},
    {"name": "Durga Puja", "month": 10, "day": 10,
     "religions": ["hindu"],
     "states": ["west_bengal", "assam", "odisha", "tripura"], "weight": 90},
    {"name": "Chhath Puja", "month": 11, "day": 7,
     "religions": ["hindu"],
     "states": ["bihar", "uttar_pradesh", "jharkhand"], "weight": 90},
    {"name": "Teej", "month": 8, "day": 7,
     "religions": ["hindu"],
     "states": ["rajasthan", "haryana", "uttar_pradesh"], "weight": 80},
    {"name": "Ganesh Chaturthi", "month": 9, "day": 7,
     "religions": ["hindu"],
     "states": ["maharashtra", "goa", "karnataka"], "weight": 85},
    {"name": "Baisakhi Harvest Fair", "month": 4, "day": 13,
     "religions": ["hindu"], "states": ["punjab", "haryana"], "weight": 80},
    {"name": "Hornbill Festival", "month": 12, "day": 1,
     "religions": ["christian"], "states": ["nagaland"], "weight": 85},
]

# Observance probability by religiosity
OBSERVE = {
    "very_religious": 0.95,
    "somewhat_religious": 0.8,
    "not_very_religious": 0.5,
    "not_at_all_religious": 0.25,
}


def _date(year, month, day):
    return f"{year}-{month:02d}-{day:02d}"


def generate_festivals(religion_id, religion_label, state_id, religiosity,
                       rng, current_year=None):
    """
    Generate the festival calendar for a profile (list of dicts).

    Runs on an isolated stream AFTER profile assembly (draws never touch
    the main stream), so pre-existing fields for a seed stay identical.
    """
    if current_year is None:
        current_year = datetime.now().year
    p = OBSERVE.get(religiosity, 0.8)

    out = []
    for f in FESTIVALS:
        if religion_id not in f["religions"]:
            continue
        if "states" in f and state_id not in f["states"]:
            continue
        # weight nudges, religiosity decides
        if rng.next() < p * (0.6 + (0.4 * f["weight"]) / 100):
            out.append({"name": f["name"],
                        "date": _date(current_year, f["month"], f["day"]),
                        "religion": religion_label,
                        "regional": "states" in f})

    # Everyone marks at least their biggest festival
    if not out:
        first = next((f for f in FESTIVALS
                      if religion_id in f["religions"] and
                      ("states" not in f or state_id in f["states"])), None)
        if first:
            out.append({"name": first["name"],
                        "date": _date(current_year, first["month"], first["day"]),
                        "religion": religion_label,
                        "regional": "states" in first})

    out.sort(key=lambda d: d["date"])
    return out
