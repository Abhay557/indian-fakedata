"""Format and checksum tests for generated identifiers."""
import re

from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.identifiers import (
    generate_aadhaar,
    generate_bank_details,
    generate_email,
    generate_pan,
    generate_phone_number,
    generate_pin_code,
    generate_upi,
    generate_voter_id,
)

VERHOEFF_D = [
    [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0],
]
VERHOEFF_P = [
    [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8],
]


def _verhoeff_valid(num):
    c = 0
    for i, d in enumerate(reversed([int(x) for x in num])):
        c = VERHOEFF_D[c][VERHOEFF_P[i % 8][d]]
    return c == 0


def test_aadhaar_is_12_digits_and_passes_checksum():
    rng = create_rng(42)
    for _ in range(500):
        aadhaar = generate_aadhaar(rng)
        assert len(aadhaar) == 12
        assert aadhaar.isdigit()
        assert _verhoeff_valid(aadhaar)


def test_aadhaar_never_starts_with_0_or_1():
    rng = create_rng(7)
    for _ in range(500):
        assert 2 <= int(generate_aadhaar(rng)[0]) <= 9


def test_pan_layout_and_surname_letter():
    rng = create_rng(10)
    for _ in range(300):
        pan = generate_pan("Sharma", rng)
        assert len(pan) == 10
        assert pan[:3].isalpha()
        assert pan[3] == "P"
        assert pan[4] == "S"
        assert pan[5:9].isdigit()
        assert pan[9].isalpha()


def test_phone_number_is_10_digits_and_starts_with_6_to_9():
    rng = create_rng(13)
    for _ in range(300):
        phone = generate_phone_number("karnataka", rng)
        assert re.fullmatch(r"\d{10}", phone)
        assert 6 <= int(phone[0]) <= 9


def test_voter_id_is_3_letters_plus_7_digits():
    rng = create_rng(21)
    for _ in range(300):
        voter_id = generate_voter_id("bihar", rng)
        assert re.fullmatch(r"[A-Z]{3}\d{7}", voter_id)


def test_pin_code_stays_inside_state_range():
    rng = create_rng(19)
    for _ in range(500):
        pin = int(generate_pin_code("rajasthan", rng))
        assert 301001 <= pin <= 345034


def test_email_has_known_domain():
    domains = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com",
               "rediffmail.com", "ymail.com", "protonmail.com", "icloud.com"}
    rng = create_rng(31)
    for _ in range(300):
        email = generate_email("Rahul", "Mehta", rng)
        local, _, domain = email.partition("@")
        assert domain in domains
        assert local.lower() == local


def test_bank_ifsc_is_5_char_prefix_plus_6_digits():
    prefixes = {"SBIN0", "BARB0", "PUNB0", "HDFC0", "ICIC0", "UTIB0",
                "KKBK0", "UBIN0", "CNRB0", "IDIB0", "BKID0", "CBIN0",
                "IOBA0", "UCBA0"}
    rng = create_rng(51)
    for _ in range(200):
        bank = generate_bank_details(rng)
        assert bank["bankIFSC"][:5] in prefixes
        assert bank["bankIFSC"][5:].isdigit()
        assert len(bank["bankIFSC"]) == 11
        assert re.fullmatch(r"\d{11}", bank["bankAccountNumber"])


def test_upi_ends_with_known_suffix():
    suffixes = {"@ybl", "@paytm", "@oksbi", "@okicici", "@okaxis",
                "@upi", "@apl", "@ibl"}
    rng = create_rng(17)
    for _ in range(200):
        upi = generate_upi("9876543210", "amit", rng)
        assert upi[upi.rindex("@"):] in suffixes
