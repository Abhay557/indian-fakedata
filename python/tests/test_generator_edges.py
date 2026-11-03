"""Small checks for generator edge cases."""
from indian_fakedata import generate


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
