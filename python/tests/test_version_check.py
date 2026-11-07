"""Tests for the CLI update check."""

import json

from indian_fakedata._version import __version__
from indian_fakedata.utils.version_check import (
    check_latest_version,
    compare_versions,
)


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def read(self):
        return json.dumps(self.payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


def test_compare_versions():
    assert compare_versions("2.1.1", "2.1.1") == 0
    assert compare_versions("2.2.0", "2.1.1") == 1
    assert compare_versions("2.1.0", "2.1.1") == -1
    assert compare_versions("2.1", "2.1.0") == 0


def test_reports_available_update():
    def opener(url, timeout):
        return FakeResponse({"info": {"version": "999.0.0"}})

    result = check_latest_version(opener=opener)
    assert result["current"] == __version__
    assert result["latest"] == "999.0.0"
    assert result["updateAvailable"] is True
    assert "error" not in result


def test_reports_current_version_as_latest():
    def opener(url, timeout):
        return FakeResponse({"info": {"version": __version__}})

    result = check_latest_version(opener=opener)
    assert result["updateAvailable"] is False


def test_returns_error_instead_of_raising():
    def opener(url, timeout):
        raise OSError("offline")

    result = check_latest_version(opener=opener)
    assert "offline" in result["error"]
    assert result["latest"] is None
    assert result["updateAvailable"] is False
