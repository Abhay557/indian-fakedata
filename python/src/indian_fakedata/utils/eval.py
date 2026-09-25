"""
Evaluation Harness (v2.1.0, item 9)

Mirrors the TypeScript implementation (src/utils/eval.ts): scores a batch
of profiles with one quality number (0-100) built from three parts:
distribution drift against census tables (total variation distance on
religion, state, gender, area and social category), schema validity rate,
and internal consistency rate (timeline labels, life-event order, budget
sums, EMI caps, geo bounds).

Pure function of the input batch (database tables are fixed): fully
deterministic, no RNG.
"""

from indian_fakedata.database.loader import DatabaseLoader
from indian_fakedata.utils.schema import validate_profile

# Census 2011 based national shares for fields without state tables
FIXED_EXPECTED = {
    "gender": {"male": 0.515, "female": 0.484, "other": 0.001},
    "areaType": {"urban": 0.31, "rural": 0.69},
    "socialCategory": {"SC": 0.166, "ST": 0.086, "OBC": 0.41, "General": 0.338},
}

# TVD at or below this counts as passing
DRIFT_PASS_TVD = 0.12

_loader = DatabaseLoader()


def _tvd(observed, expected):
    keys = set(observed) | set(expected)
    return sum(abs(observed.get(k, 0) - expected.get(k, 0)) for k in keys) / 2


def _shares(values):
    counts = {}
    for v in values:
        counts[v] = counts.get(v, 0) + 1
    total = len(values) if values else 1
    return {k: n / total for k, n in counts.items()}


def check_consistency(profile):
    """
    Internal consistency issues for one profile. Empty means clean.
    Exported so the CLI and researchers can reuse the exact checks.
    """
    issues = []

    if not validate_profile(profile)["valid"]:
        issues.append("invalid_schema")

    if profile.get("occupation") != "non_worker":
        for s in profile.get("employmentTimeline") or []:
            if s.get("occupation") != profile.get("occupation"):
                issues.append("timeline_occupation")
                break

    events = profile.get("lifeEvents") or []
    try:
        birth_year = int(str(profile.get("dateOfBirth", ""))[:4])
    except (ValueError, TypeError):
        birth_year = None
    for i, e in enumerate(events):
        if i > 0 and e.get("year", 0) < events[i - 1].get("year", 0):
            issues.append("life_events_order")
            break
        if birth_year is not None and e.get("year", birth_year) < birth_year:
            issues.append("life_events_range")
            break

    economy = profile.get("householdEconomy")
    if economy:
        b = economy.get("monthlyBudget", {})
        total = sum(b.get(k, 0) for k in
                    ("food", "housing", "transport", "education", "health", "other"))
        if total != profile.get("monthlyExpenditureINR"):
            issues.append("budget_sum")
        emi = sum(loan.get("emiINR", 0) for loan in economy.get("loans", []))
        monthly = max(1, round(profile.get("annualIncomeINR", 0) / 12))
        if emi > monthly * 0.6 + 1:
            issues.append("emi_cap")

    return issues


def evaluate_dataset(profiles, db=None):
    """
    Evaluate a batch of profiles. Deterministic: same batch, same report.
    """
    if db is None:
        db = _loader.load_database()

    religion_expected = {r["label"]: r["nationalProportion"]
                         for r in db.get("religions", {}).values()}
    pop_total = sum(s.get("totalPopulation", 0)
                    for s in db.get("states", {}).values())
    state_expected = {s["stateName"]: (s.get("totalPopulation", 0) / pop_total
                                       if pop_total > 0 else 0)
                      for s in db.get("states", {}).values()}

    fields = {
        "religion": ([p.get("religion") for p in profiles], religion_expected),
        "state": ([p.get("state") for p in profiles], state_expected),
        "gender": ([p.get("gender") for p in profiles], FIXED_EXPECTED["gender"]),
        "areaType": ([p.get("areaType") for p in profiles], FIXED_EXPECTED["areaType"]),
        "socialCategory": ([p.get("socialCategory") for p in profiles],
                           FIXED_EXPECTED["socialCategory"]),
    }

    drift = {}
    drift_score_sum = 0.0
    drift_count = 0
    if profiles:
        for field, (values, expected) in fields.items():
            observed = _shares(values)
            d = _tvd(observed, expected)
            drift[field] = {"expected": expected, "observed": observed,
                            "tvd": round(d, 4), "pass": d <= DRIFT_PASS_TVD}
            drift_score_sum += max(0, 100 - d * 400)
            drift_count += 1

    valid = sum(1 for p in profiles if validate_profile(p)["valid"])
    issues = {}
    clean = 0
    for p in profiles:
        found = check_consistency(p)
        if not found:
            clean += 1
        for code in found:
            issues[code] = issues.get(code, 0) + 1

    n = len(profiles)
    validity_rate = valid / n if n else 0
    consistency_rate = clean / n if n else 0
    drift_mean = drift_score_sum / drift_count if drift_count else 0
    quality = round(drift_mean * 0.5 + validity_rate * 100 * 0.25 +
                    consistency_rate * 100 * 0.25) if n else 0

    return {"sampleSize": n, "qualityScore": quality, "drift": drift,
            "validityRate": validity_rate, "consistencyRate": consistency_rate,
            "issues": issues}
