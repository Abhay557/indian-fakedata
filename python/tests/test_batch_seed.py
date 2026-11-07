"""Batch profiles should carry their own reproducible seed."""

from indian_fakedata import generate, generate_stream


def test_every_profile_gets_its_own_seed():
    profiles = generate(count=4, seed="011")
    assert len({p["seed"] for p in profiles}) == 4
    for index in range(1, len(profiles)):
        assert profiles[index]["seed"] == (profiles[0]["seed"] + index) & 0xFFFFFFFF


def test_any_batch_profile_reproduces_from_its_seed():
    profiles = generate(count=3, seed=42)
    for profile in profiles:
        single = generate(count=1, seed=profile["seed"])[0]
        assert single == profile


def test_batch_and_stream_seeds_match():
    batch = generate(count=5, seed=7)
    stream = list(generate_stream(count=5, seed=7))
    assert [p["seed"] for p in stream] == [p["seed"] for p in batch]
