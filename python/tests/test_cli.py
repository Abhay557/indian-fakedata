"""Tests for the v2.0.9 CLI --fields / --stats options and helpers."""

import json
import os
import subprocess
import sys

from indian_fakedata.utils.exporter import (
    get_path_value,
    pick_record_fields,
    create_stats_counters,
    update_stats_counters,
    format_stats_counters,
)

PY_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = dict(os.environ, PYTHONPATH=os.path.join(PY_DIR, "src"))


def run_cli(*args):
    return subprocess.run(
        [sys.executable, "-m", "indian_fakedata", *args],
        cwd=PY_DIR, env=ENV, capture_output=True, text=True, timeout=120,
    )


def test_pick_fields_with_dot_paths():
    record = {"firstName": "Abhay", "state": "Punjab",
              "appearance": {"skinTone": "wheatish", "build": "average"}}
    assert pick_record_fields(record, ["firstName", "appearance.skinTone", "nope"]) == {
        "firstName": "Abhay", "appearance.skinTone": "wheatish"}
    assert get_path_value(record, "appearance.build") == "average"
    assert get_path_value(record, "appearance.missing") is None


def test_stats_counters_and_format():
    stats = create_stats_counters()
    update_stats_counters(stats, {"religion": "Hindu", "state": "Punjab", "gender": "male",
                                  "areaType": "rural", "education": "primary",
                                  "occupation": "cultivator"})
    update_stats_counters(stats, {"profile": {"religion": "Muslim", "state": "Punjab",
                                              "gender": "female", "areaType": "urban",
                                              "education": "graduate",
                                              "occupation": "other_worker"}})
    update_stats_counters(stats, None)
    lines = format_stats_counters(stats)
    assert lines[0] == "[Stats] 2 profiles"
    assert "religion: Hindu 1 (50.0%), Muslim 1 (50.0%)" in "\n".join(lines)
    assert "state: Punjab 2 (100.0%)" in "\n".join(lines)


def test_cli_fields_writes_only_requested_keys():
    res = run_cli("--count", "3", "--seed", "7", "--fields",
                  "firstName,state,appearance.skinTone", "--format", "jsonl")
    assert res.returncode == 0, res.stderr
    rows = [json.loads(line) for line in res.stdout.strip().split("\n")]
    assert len(rows) == 3
    for row in rows:
        assert sorted(row.keys()) == ["appearance.skinTone", "firstName", "state"]


def test_cli_stats_prints_summary_to_stderr():
    res = run_cli("--count", "5", "--seed", "7", "--stats", "--format", "jsonl")
    assert res.returncode == 0, res.stderr
    assert "[Stats] 5 profiles" in res.stderr
    assert "gender:" in res.stderr
