"""Tests for the household economy kit (v2.1.0, item 4)."""

from indian_fakedata import generate
from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.economy import generate_household_economy, emi_for

BASE = dict(
    age=40,
    annual_income_inr=1235000,
    monthly_expenditure_inr=89100,
    household_size=1,
    employment_sector="private",
    area_type="urban",
    occupation="other_worker",
    vehicle_type="two_wheeler",
    number_of_children=1,
)


def test_standard_emi_math():
    # Rs 1,00,000 at 12% for 12 months is about Rs 8,885
    emi = emi_for(100000, 12, 12)
    assert 8800 < emi < 8950


def test_budget_sums_exactly():
    rng = create_rng(31)
    for i in range(20):
        e = generate_household_economy(
            **{**BASE, "monthly_expenditure_inr": 20000 + i * 3500}, rng=rng)
        b = e["monthlyBudget"]
        total = (b["food"] + b["housing"] + b["transport"] +
                 b["education"] + b["health"] + b["other"])
        assert total == 20000 + i * 3500
        assert all(v >= 0 for v in b.values())


def test_emi_capped_at_sixty_percent_of_income():
    rows = generate(count=200, seed=51)
    for r in rows:
        econ = r["householdEconomy"]
        emi_sum = sum(loan["emiINR"] for loan in econ["loans"])
        assert emi_sum <= round(r["annualIncomeINR"] / 12) * 0.6 + 1
        for loan in econ["loans"]:
            assert 1 <= loan["remainingMonths"] <= loan["tenureMonths"]
            assert loan["emiINR"] == emi_for(
                loan["principalINR"], loan["annualRatePct"], loan["tenureMonths"])


def test_loans_follow_life():
    rng = create_rng(32)
    kid = generate_household_economy(**{**BASE, "age": 10}, rng=rng)
    assert kid["loans"] == []
    assert kid["creditHistory"]["activeLoans"] == 0
    assert kid["creditHistory"]["missedPayments12m"] == 0
    no_wheels = generate_household_economy(
        **{**BASE, "vehicle_type": "none"}, rng=create_rng(33))
    assert "vehicle" not in [loan["type"] for loan in no_wheels["loans"]]


def test_score_bands_track_missed_payments():
    rows = generate(count=300, seed=52)
    clean = 0
    for r in rows:
        h = r["householdEconomy"]["creditHistory"]
        assert 300 <= h["score"] <= 900
        if h["missedPayments12m"] == 0:
            assert h["score"] >= 695
            clean += 1
        if h["missedPayments12m"] >= 3:
            assert h["score"] <= 700
    assert clean > 0


def test_deterministic():
    a = generate_household_economy(rng=create_rng(34), **BASE)
    assert generate_household_economy(rng=create_rng(34), **BASE) == a
