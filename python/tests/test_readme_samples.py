import json
import os
import re
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from indian_fakedata import generate_user  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def readme_sample(path):
    text = open(path, encoding="utf-8").read()
    match = re.search(
        r"## Output Sample[^\n]*\n[\s\S]*?```json\r?\n([\s\S]*?)\r?\n```",
        text,
    )
    assert match, f"sample block not found in {path}"
    return json.loads(match.group(1))


@pytest.mark.parametrize("name", ["README.md", "python/README.md"])
def test_readme_sample_matches_python_output(name):
    path = os.path.join(ROOT, name)
    assert readme_sample(path) == generate_user(seed=7)


@pytest.mark.parametrize("seed", [7, 11, 13])
def test_docs_sample_matches_python_output(seed):
    path = os.path.join(ROOT, "docs", "samples", f"python-{seed}.json")
    with open(path, encoding="utf-8") as handle:
        sample = json.load(handle)
    assert sample == generate_user(seed=seed)
