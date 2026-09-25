"""Tests for the grounded QA builder (v2.1.0, item 8)."""

from indian_fakedata import generate
from indian_fakedata.utils.qa import build_qa_pairs
from indian_fakedata.utils.exporter import get_path_value


def _renderings(value):
    if isinstance(value, bool):
        return [str(value)]
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if isinstance(value, float):
        return [str(value)]
    if isinstance(value, int):
        import math
        n = int(round(value))
        s = str(abs(n))
        if len(s) <= 3:
            grouped = s
        else:
            head, tail = s[:-3], s[-3:]
            groups = []
            while len(head) > 2:
                groups.insert(0, head[-2:])
                head = head[:-2]
            if head:
                groups.insert(0, head)
            grouped = ",".join(groups) + "," + tail
        grouped = ("-" if n < 0 else "") + "\u20b9" + grouped
        return [str(value), grouped]
    if isinstance(value, str):
        return [value, value.replace("_", " ")]
    return []


def test_citations_resolve_and_leaves_appear():
    rows = generate(count=60, seed=81)
    checked = 0
    for r in rows:
        pairs = build_qa_pairs(r)
        assert len(pairs) >= 6
        for pair in pairs:
            assert len(pair["question"]) > 0
            assert len(pair["answer"]) > 0
            assert pair["source"] == "profile"
            for cite in pair["citations"]:
                value = get_path_value(r, cite)
                assert value is not None, "{} resolves".format(cite)
                if isinstance(value, (dict, list)):
                    continue
                options = _renderings(value)
                assert any(o and o in pair["answer"] for o in options), \
                    '"{}"={} appears in: {}'.format(cite, value, pair["answer"])
                checked += 1
    assert checked > 0


def test_coverage_across_features():
    rows = generate(count=60, seed=82)
    kinds = set()
    for r in rows:
        for pair in build_qa_pairs(r):
            if "most recent job" in pair["answer"]:
                kinds.add("job")
            if "credit score is" in pair["answer"]:
                kinds.add("credit")
            if "lives near " in pair["answer"]:
                kinds.add("map")
            if "celebrates" in pair["answer"]:
                kinds.add("festival")
            if "got married in" in pair["answer"]:
                kinds.add("wedding")
    for k in ("job", "credit", "map", "festival", "wedding"):
        assert k in kinds, "missing {}".format(k)


def test_deterministic():
    p = generate(count=1, seed=83)[0]
    assert build_qa_pairs(p) == build_qa_pairs(p)
