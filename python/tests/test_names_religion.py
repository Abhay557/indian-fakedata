import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from indian_fakedata import generate_user  # noqa: E402

MUSLIM_ONLY_NAMES = {
    "danish", "sajid", "umar", "nadim", "nasir", "abid", "gulfam",
    "tanveer", "nazim", "parvez", "naushad", "suhail", "zaheer", "faiz",
    "anjum", "jamshed", "yasin", "ashfaq", "abrar", "shagufta", "khurshid",
    "yusuf", "shabana", "sitara", "mariyam", "tabassum", "huma", "farah",
    "mumtaz", "farheen", "zeba", "uzma", "nikhat", "ishrat", "zeenat",
    "misbah", "iqra", "mehwish", "aftab", "nargis", "kaif", "jakir",
    "shahnawaj", "sabir", "mansoor",
}

DB_DIR = os.path.join(
    os.path.dirname(__file__), "..", "src", "indian_fakedata", "database",
)
DEFAULT_DATA_PATH = os.path.join(DB_DIR, "default_data.json")
NAMES_DATA_PATH = os.path.join(DB_DIR, "names_data.json")


def names_in(religion, path=DEFAULT_DATA_PATH):
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    if path.endswith("names_data.json"):
        by_religion = data[religion]
    else:
        by_religion = data["firstNames"][religion]
    names = []
    for states in by_religion.values():
        for entries in states.values():
            names.extend(entry["name"] for entry in entries)
    return names


def test_default_data_hindu_list_has_no_muslim_only_names():
    bad = [n for n in names_in("hindu") if n.lower() in MUSLIM_ONLY_NAMES]
    assert bad == []


def test_default_data_sikh_list_has_no_muslim_only_names():
    bad = [n for n in names_in("sikh") if n.lower() in MUSLIM_ONLY_NAMES]
    assert bad == []


def test_names_data_hindu_list_has_no_muslim_only_names():
    bad = [
        n for n in names_in("hindu", NAMES_DATA_PATH)
        if n.lower() in MUSLIM_ONLY_NAMES
    ]
    assert bad == []


def test_names_data_sikh_list_has_no_muslim_only_names():
    bad = [
        n for n in names_in("sikh", NAMES_DATA_PATH)
        if n.lower() in MUSLIM_ONLY_NAMES
    ]
    assert bad == []


def test_muslim_list_keeps_those_names():
    names = {n.lower() for n in names_in("muslim", NAMES_DATA_PATH)}
    assert "sajid" in names
    assert "sabir" in names


def test_generated_hindus_do_not_get_muslim_only_names():
    for seed in range(500):
        user = generate_user(seed=seed)
        if user["religion"] == "Hindu":
            assert user["firstName"].lower() not in MUSLIM_ONLY_NAMES


def test_generated_sikhs_do_not_get_muslim_only_names():
    for seed in range(500):
        user = generate_user(seed=seed)
        if user["religion"] == "Sikh":
            assert user["firstName"].lower() not in MUSLIM_ONLY_NAMES
