"""Check whether a newer release exists for the running CLI."""

import json
import urllib.request

from indian_fakedata._version import __version__

PYPI_URL = "https://pypi.org/pypi/indian-fakedata/json"


def _version_parts(version):
    parts = []
    for part in version.lstrip("v").split("."):
        try:
            parts.append(int(part))
        except ValueError:
            parts.append(0)
    return parts


def compare_versions(left, right):
    """Compare dotted versions. Returns 1, 0 or -1."""
    a = _version_parts(left)
    b = _version_parts(right)
    for index in range(max(len(a), len(b))):
        diff = (a[index] if index < len(a) else 0) - (b[index] if index < len(b) else 0)
        if diff:
            return 1 if diff > 0 else -1
    return 0


def check_latest_version(url=PYPI_URL, opener=None):
    """Ask PyPI whether a newer release exists. Never raises."""
    opener = opener or urllib.request.urlopen
    try:
        with opener(url, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        latest = data["info"]["version"]
        return {
            "current": __version__,
            "latest": latest,
            "updateAvailable": compare_versions(latest, __version__) > 0,
        }
    except Exception as exc:
        return {
            "current": __version__,
            "latest": None,
            "updateAvailable": False,
            "error": str(exc),
        }
