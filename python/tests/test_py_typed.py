"""The package should advertise its inline type hints."""

from pathlib import Path

import indian_fakedata

PACKAGE = Path(indian_fakedata.__file__).resolve().parent


def test_py_typed_marker_is_installed():
    assert (PACKAGE / "py.typed").is_file()
