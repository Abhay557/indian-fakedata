"""The Python samples served by the docs should match current output."""

import json
from pathlib import Path

import pytest

from indian_fakedata import generate


@pytest.mark.parametrize("seed", [7, 11, 13])
def test_docs_sample_matches_generator(seed):
    path = Path(__file__).resolve().parents[2] / "docs" / "samples" / f"python-{seed}.json"
    sample = json.loads(path.read_text(encoding="utf-8"))

    assert sample == generate(seed=seed)[0]
