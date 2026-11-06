import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from indian_fakedata import generate  # noqa: E402


def test_under_15s_have_no_income():
    rows = generate(count=2000, seed=2026)
    kids = [row for row in rows if row["age"] < 15]
    assert kids
    for kid in kids:
        assert kid["annualIncomeINR"] == 0


def test_under_18s_have_no_bank_account_or_upi():
    rows = generate(count=2000, seed=2026)
    minors = [row for row in rows if row["age"] < 18]
    assert minors
    for minor in minors:
        assert minor["bankAccountNumber"] == ""
        assert minor["bankName"] == ""
        assert minor["bankIFSC"] == ""
        assert minor["upiId"] is None


def test_adults_still_get_bank_details():
    rows = generate(count=200, seed=2026)
    adult = next(row for row in rows if row["age"] >= 18)
    assert re.fullmatch(r"\d{11}", adult["bankAccountNumber"])
