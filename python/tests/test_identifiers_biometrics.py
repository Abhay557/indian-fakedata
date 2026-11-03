"""Checks for height, weight, date of birth, blood group and address."""
from datetime import date

from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.identifiers import (
    generate_address,
    generate_blood_group,
    generate_dob,
    generate_height,
    generate_weight,
)


def _age_from_dob(dob):
    year, month, day = (int(x) for x in dob.split("-"))
    today = date.today()
    age = today.year - year
    if (today.month, today.day) < (month, day):
        age -= 1
    return age


def test_dob_matches_requested_age():
    rng = create_rng(7)
    for age in range(0, 101, 5):
        dob = generate_dob(age, rng)
        assert len(dob.split("-")) == 3
        assert _age_from_dob(dob) == age


def test_adult_male_height_is_plausible():
    rng = create_rng(3)
    for _ in range(500):
        height = generate_height("male", 30, "maharashtra", rng)
        assert 140 <= height <= 195


def test_adult_female_height_is_plausible():
    rng = create_rng(4)
    for _ in range(500):
        height = generate_height("female", 30, "kerala", rng)
        assert 130 <= height <= 185


def test_toddler_height_smaller_than_adult():
    rng = create_rng(5)
    toddler = generate_height("male", 3, "delhi", rng)
    adult = generate_height("male", 30, "delhi", rng)
    assert toddler < adult - 40


def test_weight_is_positive_and_bmi_ok():
    rng = create_rng(8)
    for _ in range(500):
        height_cm = 170
        weight = generate_weight("female", 35, height_cm, "rural", rng)
        assert weight > 0
        bmi = weight / (height_cm / 100) ** 2
        assert 14 <= bmi <= 40


def test_blood_group_is_valid():
    rng = create_rng(10)
    valid = {"O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"}
    for _ in range(300):
        assert generate_blood_group(rng) in valid


def test_urban_address_contains_district():
    rng = create_rng(11)
    address = generate_address("Pune", "urban", rng)
    assert "Pune" in address["addressLine"]
    assert address["locality"]


def test_rural_address_has_wumeric_house_number():
    rng = create_rng(12)
    address = generate_address("Nashik", "rural", rng)
    house_number = address["addressLine"].split(",")[0]
    assert house_number.strip().isdigit()
