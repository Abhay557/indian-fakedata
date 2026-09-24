"""CHANGELOG mentions the current version."""

import os

from indian_fakedata._version import __version__


def test_changelog_mentions_current_version():
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [os.path.join(here, "..", "..", "CHANGELOG.md"),
                  os.path.join(os.getcwd(), "..", "CHANGELOG.md")]
    path = next(p for p in candidates if os.path.exists(p))
    with open(path, encoding="utf-8") as f:
        assert f"## {__version__}" in f.read()
