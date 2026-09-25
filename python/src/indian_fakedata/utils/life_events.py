"""
Life Events Timeline Generator (v2.1.0, item 3)

Mirrors the TypeScript implementation (src/utils/lifeEvents.ts): a
chronological list of dated life events — birth, marriage, children,
migration, job switches and retirement — cross-checked against the
profile's age, marital status, child count, migration flag and both
existing timelines (job years mirror the employment timeline exactly).

Runs on an isolated per-profile stream: zero impact on seeded output.
"""


def generate_life_events(age, date_of_birth, marital_status,
                         number_of_children, spouse_name, is_migrant,
                         migration_origin_state, state, district,
                         employment_sector, employment_timeline, rng,
                         current_year=None):
    """
    Generate the life events timeline for a profile (list of dicts).

    Runs on an isolated stream AFTER profile assembly (draws never touch
    the main stream), so pre-existing fields for a seed stay identical.
    """
    from datetime import datetime
    if current_year is None:
        current_year = datetime.now().year
    try:
        birth_year = int(str(date_of_birth)[:4])
    except (ValueError, TypeError):
        birth_year = current_year - age

    events = []
    events.append({"year": birth_year, "event": "born",
                   "detail": f"Born in {district}."})

    # Job switches mirror the employment timeline exactly (no new facts)
    for i, s in enumerate(employment_timeline or []):
        start = min(max(s.get("startYear", birth_year), birth_year), current_year)
        if i == 0:
            events.append({"year": start, "event": "job_started",
                           "detail": f"Started working as {s.get('jobTitle', 'work')}."})
        else:
            events.append({"year": start, "event": "job_changed",
                           "detail": f"Changed job to {s.get('jobTitle', 'work')}."})

    # Marriage (only placeable from age 18)
    marriage_year = None
    if marital_status != "never_married" and age >= 18:
        span = max(1, min(age - 18, 12))
        marriage_year = birth_year + 18 + int(rng.next() * span)
        if marriage_year <= current_year:
            events.append({"year": marriage_year, "event": "married",
                           "detail": f"Married {spouse_name}." if spouse_name
                           else "Got married."})
        else:
            marriage_year = None

    # Widowhood / separation strictly after the wedding year
    if marital_status == "widowed" and marriage_year is not None:
        span = max(1, current_year - marriage_year - 1)
        events.append({"year": min(marriage_year + 1 + int(rng.next() * span), current_year),
                       "event": "widowed", "detail": "Spouse passed away."})
    if marital_status == "divorced_separated" and marriage_year is not None:
        span = max(1, current_year - marriage_year - 1)
        events.append({"year": min(marriage_year + 1 + int(rng.next() * span), current_year),
                       "event": "divorced", "detail": "Separated from spouse."})

    # Children, evenly spaced from the wedding (or age 20) to this year
    if number_of_children and number_of_children > 0:
        start_from = marriage_year + 1 if marriage_year is not None else birth_year + 20
        start_from = min(start_from, current_year)
        n = number_of_children
        for i in range(n):
            year = start_from if n == 1 else start_from + round(
                i * (current_year - start_from) / (n - 1))
            events.append({"year": year, "event": "child_born",
                           "detail": f"Birth of child {i + 1}."})

    # Migration (moved with family at any age, so even children record it)
    if is_migrant and migration_origin_state:
        span = max(1, current_year - birth_year)
        events.append({"year": min(birth_year + int(rng.next() * span), current_year),
                       "event": "migrated",
                       "detail": f"Migrated from {migration_origin_state} to {state}."})

    # Retirement at 60 (or this year, whichever is earlier)
    if employment_sector == "retired":
        events.append({"year": min(birth_year + 60, current_year),
                       "event": "retired", "detail": "Retired from work."})

    # Chronological (stable: ties keep life order)
    events.sort(key=lambda e: e["year"])
    return events
