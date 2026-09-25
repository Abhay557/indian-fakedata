"""Tests for the eval harness (v2.1.0, item 9)."""

from indian_fakedata import generate, evaluate_dataset, check_consistency


def test_diverse_batch_scores_high():
    report = evaluate_dataset(generate(count=500, seed=92))
    assert report["sampleSize"] == 500
    assert report["qualityScore"] >= 80
    for field, d in report["drift"].items():
        assert d["pass"], field
    assert report["validityRate"] == 1
    assert report["consistencyRate"] == 1
    assert report["issues"] == {}


def test_skewed_batch_fails_drift_and_scores_lower():
    diverse = evaluate_dataset(generate(count=500, seed=92))
    skewed = evaluate_dataset(
        generate(count=500, seed=92, constraints={"religion": "Hindu"}))
    assert skewed["drift"]["religion"]["pass"] is False
    assert skewed["qualityScore"] < diverse["qualityScore"]


def test_consistency_per_profile():
    p = generate(count=1, seed=93)[0]
    assert check_consistency(p) == []
    broken = dict(p, gender="unknown")
    assert "invalid_schema" in check_consistency(broken)


def test_empty_batch_and_determinism():
    empty = evaluate_dataset([])
    assert empty["sampleSize"] == 0
    assert empty["qualityScore"] == 0
    batch = generate(count=20, seed=94)
    assert evaluate_dataset(batch) == evaluate_dataset(batch)
