"""Small checks for generator edge cases."""
import pytest

from indian_fakedata import generate, generate_stream


def test_defaults_to_one_profile():
    profiles = generate()
    assert len(profiles) == 1


def test_count_zero_returns_empty_list():
    assert generate(count=0) == []


def test_seed_zero_is_reproducible():
    first = generate(count=3, seed=0)
    second = generate(count=3, seed=0)
    assert [p["id"] for p in first] == [p["id"] for p in second]


def test_metrics_off_leaves_empty_dict():
    profile = generate(count=1, seed=5, include_probability_metrics=False)[0]
    assert profile["probabilityMetrics"] == {}


def test_metrics_on_by_default():
    profile = generate(count=1, seed=5)[0]
    assert profile["probabilityMetrics"] != {}


def test_ids_are_unique_in_batch():
    profiles = generate(count=50, seed=9)
    ids = [p["id"] for p in profiles]
    assert len(set(ids)) == 50


def test_other_gender_profiles_work():
    profiles = generate(count=10, seed=77, constraints={"gender": "other"})
    assert len(profiles) == 10
    for profile in profiles:
        assert profile["gender"] == "other"
        assert profile["firstName"]
        assert profile["lastName"]


@pytest.mark.parametrize("bad_count", [1.5, -1, "10", True])
def test_bad_count_raises(bad_count):
    with pytest.raises(ValueError, match="non-negative integer"):
        generate(count=bad_count, seed=1)
    with pytest.raises(ValueError, match="non-negative integer"):
        list(generate_stream(count=bad_count, seed=1))


@pytest.mark.parametrize("age_range", [
    {"min": 50, "max": 20},
    {"min": -1, "max": 20},
    {"min": 0, "max": 101},
    {"min": 0.5, "max": 20},
])
def test_bad_age_range_raises(age_range):
    with pytest.raises(ValueError, match="ageRange"):
        generate(count=1, seed=1, constraints={"ageRange": age_range})


def test_islam_alias_works():
    profile = generate(count=1, seed=1, constraints={"religion": "Islam"})[0]
    assert profile["religion"] == "Muslim"
