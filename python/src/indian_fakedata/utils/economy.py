"""
Household Economy Kit Generator (v2.1.0, item 4)

Mirrors the TypeScript implementation (src/utils/economy.ts): a
``householdEconomy`` block with a monthly budget split that sums exactly
to the profile's expenditure, 0-2 affordable loans with real EMI math,
and a credit history whose score bands track missed payments by
construction (0 misses always scores 695+, 3+ misses never above 700).

Loans follow life: vehicle loans need a vehicle, agri loans need a farm
or village, home loans need a high income. Total EMI is capped at 60% of
monthly income, dropping or shrinking loans to fit.

Runs on an isolated per-profile stream: zero impact on seeded output.
"""

import math

from indian_fakedata.core.sampler import weighted_sample_from_record

LOAN_SPECS = {
    "home": {"type": "home", "rate": 9, "minTenure": 120, "maxTenure": 240,
             "minFactor": 2.0, "maxFactor": 4.0},
    "vehicle": {"type": "vehicle", "rate": 11, "minTenure": 36, "maxTenure": 60,
                "minFactor": 0.3, "maxFactor": 0.8},
    "personal": {"type": "personal", "rate": 14, "minTenure": 12, "maxTenure": 36,
                 "minFactor": 0.2, "maxFactor": 0.5},
    "agri": {"type": "agri", "rate": 7, "minTenure": 12, "maxTenure": 36,
             "minFactor": 0.3, "maxFactor": 0.8},
    "gold": {"type": "gold", "rate": 12, "minTenure": 12, "maxTenure": 24,
             "minFactor": 0.1, "maxFactor": 0.3},
    "business": {"type": "business", "rate": 13, "minTenure": 24, "maxTenure": 60,
                 "minFactor": 0.5, "maxFactor": 1.5},
}

TIER_ADJ = {
    "government": 40,
    "public_sector": 30,
    "private": 20,
    "self_employed": 10,
    "retired": 10,
    "student": 0,
    "homemaker": -10,
    "informal": -20,
    "unemployed": -40,
}


def emi_for(principal, annual_rate_pct, tenure_months):
    """Standard reducing-balance EMI."""
    r = annual_rate_pct / 12 / 100
    if r <= 0:
        return round(principal / tenure_months)
    factor = (1 + r) ** tenure_months
    return round((principal * r * factor) / (factor - 1))


def _round100(n):
    return max(100, round(n / 100) * 100)


def generate_household_economy(age, annual_income_inr, monthly_expenditure_inr,
                               household_size, employment_sector, area_type,
                               occupation, vehicle_type, number_of_children, rng):
    """
    Generate the household economy block for a profile (dict).

    Runs on an isolated stream AFTER profile assembly (draws never touch
    the main stream), so pre-existing fields for a seed stay identical.
    """
    monthly_income = max(1, round(annual_income_inr / 12))

    # Monthly budget: shares scaled to sum exactly to expenditure
    has_kids = number_of_children > 0
    food_share = 0.35 + rng.next() * 0.1 + min(0.05, household_size * 0.008)
    housing_share = (0.18 if area_type == "urban" else 0.12) + rng.next() * 0.07
    transport_share = 0.08 + rng.next() * 0.04
    education_share = (0.05 + rng.next() * 0.07) if has_kids else (0.01 + rng.next() * 0.02)
    health_share = 0.05 + rng.next() * 0.05
    raw_total = (food_share + housing_share + transport_share +
                 education_share + health_share)
    total = max(0, monthly_expenditure_inr)
    scale = total / raw_total if raw_total > 0 else 0
    budget = {
        "food": round(food_share * scale),
        "housing": round(housing_share * scale),
        "transport": round(transport_share * scale),
        "education": round(education_share * scale),
        "health": round(health_share * scale),
        "other": 0,
    }
    # largest remainder lands on food so the parts sum exactly
    parts = (budget["housing"] + budget["transport"] +
             budget["education"] + budget["health"])
    budget["other"] = max(0, total - budget["food"] - parts)
    budget["food"] = max(0, total - parts - budget["other"])

    # Loans follow life
    loans = []
    if age >= 18 and monthly_income > 0:
        eligible = ["personal", "gold"]
        if vehicle_type and vehicle_type != "none":
            eligible.append("vehicle")
        if occupation in ("cultivator", "agricultural_labourer") or area_type == "rural":
            eligible.append("agri")
        if employment_sector == "self_employed":
            eligible.append("business")
        if annual_income_inr >= 600000:
            eligible.append("home")

        key, _ = weighted_sample_from_record({"0": 30, "1": 45, "2": 25}, rng)
        want = min(int(key), len(eligible))
        bag = list(eligible)
        for _ in range(want):
            loan_type = bag.pop(int(rng.next() * len(bag)))
            spec = LOAN_SPECS[loan_type]
            principal = _round100(annual_income_inr * (
                spec["minFactor"] + rng.next() * (spec["maxFactor"] - spec["minFactor"])))
            tenure = spec["minTenure"] + int(
                rng.next() * (spec["maxTenure"] - spec["minTenure"] + 1))
            loans.append({
                "type": loan_type,
                "principalINR": principal,
                "annualRatePct": spec["rate"],
                "tenureMonths": tenure,
                "emiINR": emi_for(principal, spec["rate"], tenure),
                "remainingMonths": 1 + int(rng.next() * tenure),
            })

        # Affordability fit: total EMI capped at 60% of monthly income
        cap = monthly_income * 0.6
        if cap < 50:
            loans = []  # no income to service debt with
        else:
            emi_sum = sum(loan["emiINR"] for loan in loans)
            while len(loans) > 1 and emi_sum > cap:
                emi_sum -= loans.pop()["emiINR"]
            if len(loans) == 1 and emi_sum > cap:
                loan = loans[0]
                target = max(1, math.floor(cap))
                principal = loan["principalINR"]
                while (emi_for(principal, loan["annualRatePct"], loan["tenureMonths"]) > target
                       and principal > 1000):
                    principal = math.floor(principal * 0.9)
                loan["principalINR"] = max(100, math.floor(principal / 100) * 100)
                loan["emiINR"] = emi_for(loan["principalINR"], loan["annualRatePct"],
                                         loan["tenureMonths"])

    # Credit history banded to missed payments
    emi_sum = sum(loan["emiINR"] for loan in loans)
    burden = emi_sum / monthly_income if monthly_income > 0 else 0
    if not loans:
        missed = 0
    elif burden > 0.5:
        missed = 2 + int(rng.next() * 5)
    elif burden > 0.3:
        missed = int(rng.next() * 4)
    else:
        missed = 0 if rng.next() < 0.7 else 1
    tier = TIER_ADJ.get(employment_sector, 0)
    income_adj = 20 if annual_income_inr >= 1000000 else (-20 if annual_income_inr < 100000 else 0)
    jitter = int(rng.next() * 31) - 15
    # Bands are contractual: spotless payers never drop below 695,
    # chronic defaulters never rise above 700.
    floor = 695 if missed == 0 else 300
    ceiling = 700 if missed >= 3 else 900
    score = min(ceiling, max(floor, 750 - 35 * missed + tier + income_adj + jitter))

    return {
        "monthlyBudget": budget,
        "loans": loans,
        "creditHistory": {
            "score": score,
            "activeLoans": len(loans),
            "missedPayments12m": missed,
            "oldestAccountYears": 0 if not loans else 1 + int(
                rng.next() * (min(15, max(0, age - 18)) + 1)),
        },
    }
