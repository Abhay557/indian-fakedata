"""Tests for saving profiles to files in json/jsonl/csv formats."""
import csv
import io
import json
import os
import tempfile

from indian_fakedata import generate
from indian_fakedata.utils.exporter import format_profiles, save_profiles


def test_save_json_reads_back_the_same_profiles():
    profiles = generate(count=8, seed=12)
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "profiles.json")
        save_profiles(profiles, path, "json")
        with open(path, encoding="utf-8") as f:
            saved = json.load(f)
        assert saved == profiles


def test_save_jsonl_one_profile_per_line():
    profiles = generate(count=8, seed=12)
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "profiles.jsonl")
        save_profiles(profiles, path, "jsonl")
        with open(path, encoding="utf-8") as f:
            lines = f.read().strip().split("\n")
        assert len(lines) == len(profiles)
        parsed = [json.loads(line) for line in lines]
        assert parsed == profiles


def test_save_csv_header_plus_data_rows():
    profiles = generate(count=8, seed=12)
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "profiles.csv")
        save_profiles(profiles, path, "csv")
        with open(path, encoding="utf-8") as f:
            rows = f.read().strip().split("\n")
        assert len(rows) == len(profiles) + 1
        assert "firstName" in rows[0]


def test_save_creates_missing_parent_directories():
    profiles = generate(count=2, seed=12)
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "a", "b", "deep", "profiles.jsonl")
        save_profiles(profiles, path, "jsonl")
        assert os.path.exists(path)


def test_save_empty_list_writes_empty_json_array():
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "empty.json")
        save_profiles([], path, "json")
        with open(path, encoding="utf-8") as f:
            assert f.read() == "[]"


def test_csv_escapes_commas_quotes_and_newlines():
    tricky = [
        {"name": "simple", "note": "no special chars"},
        {"name": "with, comma", "note": 'has "double quote"'},
        {"name": "with\nnewline", "note": "line1\nline2"},
    ]
    text = format_profiles(tricky, "csv")

    rows = list(csv.reader(io.StringIO(text)))
    # rows[0] is the header, so the data rows start at index 1
    assert rows[2] == ["with, comma", 'has "double quote"']
    assert rows[3] == ["with\nnewline", "line1\nline2"]
