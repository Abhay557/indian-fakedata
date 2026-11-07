"""Check that the Python API follows the shared TS/Python contract."""

import json
import re
import subprocess
import sys
from pathlib import Path

import indian_fakedata as lib
from indian_fakedata import generate

CONTRACT = json.loads(
    (Path(__file__).resolve().parents[2] / "contract" / "api.json").read_text(
        encoding="utf-8"
    )
)


def test_generates_the_agreed_profile_fields():
    assert list(generate(seed=7)[0].keys()) == CONTRACT["profileKeys"]


def test_exposes_the_agreed_core_functions():
    for entry in CONTRACT["coreApi"]:
        assert callable(getattr(lib, entry["python"]))


def test_documents_the_agreed_cli_flags():
    help_text = subprocess.check_output(
        [sys.executable, "-m", "indian_fakedata.utils.cli", "--help"],
        text=True,
    )
    flags = sorted(set(re.findall(r"--[A-Za-z][A-Za-z0-9-]*", help_text)))
    assert flags == CONTRACT["cliFlags"]
