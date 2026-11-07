"""The motherTongue constraint should pin the language."""

import pytest

from indian_fakedata import generate


def test_mother_tongue_constraint_pins_language():
    profiles = generate(count=5, seed=12, constraints={"motherTongue": "tamil"})
    for profile in profiles:
        assert profile["motherTongue"] == "Tamil"
        assert profile["nativeScript"]["script"] == "Tamil"


def test_unknown_mother_tongue_is_rejected():
    with pytest.raises(ValueError, match="Unknown mother tongue"):
        generate(seed=12, constraints={"motherTongue": "klingon"})


def test_mother_tongue_still_varies_without_constraint():
    languages = {p["motherTongue"] for p in generate(count=50, seed=12)}
    assert len(languages) > 1
