"""The package version must match both runtime manifests."""

import json
import re
from pathlib import Path

from indian_fakedata import __version__

ROOT = Path(__file__).resolve().parents[2]


def _match(text, pattern, label):
    found = re.search(pattern, text, re.MULTILINE)
    assert found, f"could not read {label}"
    return found.group(1)


def test_versions_stay_in_sync():
    pkg = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    ts_version = _match(
        (ROOT / "src" / "version.ts").read_text(encoding="utf-8"),
        r'LIB_VERSION\s*=\s*["\']([^"\']+)["\']',
        "src/version.ts",
    )
    pyproject_version = _match(
        (ROOT / "python" / "pyproject.toml").read_text(encoding="utf-8"),
        r'^version\s*=\s*["\']([^"\']+)["\']',
        "pyproject.toml",
    )

    assert __version__ == pkg["version"]
    assert ts_version == pkg["version"]
    assert pyproject_version == pkg["version"]
