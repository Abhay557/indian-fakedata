"""Simple checks for the random number helpers."""
import math

import pytest

from indian_fakedata.core.sampler import (
    age_sample,
    bernoulli_sample,
    create_rng,
    gaussian_sample,
    household_size_sample,
    income_sample,
    log_normal_sample,
    normalize_seed,
    uniform_sample,
    weighted_sample,
    weighted_sample_from_record,
)


def test_normalize_seed_is_deterministic():
    assert normalize_seed("011") == normalize_seed("011")
    assert normalize_seed(7) == 7
    assert isinstance(normalize_seed(None), int)


def test_create_rng_values_are_between_0_and_1():
    rng = create_rng(42)
    for _ in range(1000):
        value = rng.next()
        assert 0 <= value < 1


def test_create_rng_same_seed_same_sequence():
    first = create_rng(1234)
    second = create_rng(1234)
    for _ in range(100):
        assert first.next() == second.next()


def test_create_rng_reset_restarts():
    rng = create_rng(10)
    first = rng.next()
    rng.reset(10)
    assert rng.next() == first


def test_weighted_sample_throws_on_empty():
    with pytest.raises(Exception):
        weighted_sample([], create_rng(1))


def test_weighted_sample_single_item():
    item, probability = weighted_sample([{"name": "only", "weight": 5}], create_rng(2))
    assert item["name"] == "only"
    assert probability == 1


def test_weighted_sample_prefers_heavy_item():
    rng = create_rng(7)
    heavy = 0
    for _ in range(500):
        item, _ = weighted_sample(
            [{"name": "light", "weight": 1}, {"name": "heavy", "weight": 99}],
            rng,
        )
        if item["name"] == "heavy":
            heavy += 1
    assert heavy > 400


def test_uniform_sample_throws_on_empty():
    with pytest.raises(Exception):
        uniform_sample([], create_rng(1))


def test_gaussian_sample_average_close_to_mean():
    rng = create_rng(5)
    total = 0
    count = 5000
    for _ in range(count):
        total += gaussian_sample(100, 10, rng)
    avg = total / count
    assert 99 < avg < 101


def test_log_normal_sample_always_positive():
    rng = create_rng(8)
    for _ in range(1000):
        assert log_normal_sample(11, 0.8, rng) > 0


def test_age_sample_respects_default_bounds():
    rng = create_rng(11)
    for _ in range(1000):
        assert 0 <= age_sample(rng) <= 100


def test_household_size_sample_bounds():
    rng = create_rng(13)
    for _ in range(1000):
        size = household_size_sample(rng, "urban")
        assert 1 <= size <= 12


def test_income_sample_minimum_and_rounding():
    rng = create_rng(14)
    params = {"areaType": "urban", "education": "graduate", "occupation": "other_worker", "state": "Maharashtra"}
    for _ in range(500):
        income = income_sample(rng, params)
        assert income >= 10000
        assert income % 1000 == 0


def test_bernoulli_sample_returns_bool():
    rng = create_rng(16)
    for _ in range(500):
        assert isinstance(bernoulli_sample(0.5, rng), bool)
