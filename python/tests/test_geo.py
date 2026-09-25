"""Parity tests for geospatial points (v2.1.0, item 2)."""

import math

from indian_fakedata import generate
from indian_fakedata.core.sampler import create_rng
from indian_fakedata.utils.geo import (
    generate_geo, state_geo_bounds, state_geo_anchor,
)

STATES = [
    "andhra_pradesh", "arunachal_pradesh", "assam", "bihar", "chhattisgarh",
    "goa", "gujarat", "haryana", "himachal_pradesh", "jammu_kashmir",
    "jharkhand", "karnataka", "kerala", "madhya_pradesh", "maharashtra",
    "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab",
    "rajasthan", "sikkim", "tamil_nadu", "telangana", "tripura",
    "uttar_pradesh", "uttarakhand", "west_bengal", "delhi", "andaman_nicobar",
]


def _dist_km(a, b):
    dlat = (a[0] - b[0]) * 111
    dlon = (a[1] - b[1]) * 111 * math.cos(math.radians(a[0]))
    return math.hypot(dlat, dlon)


def test_anchors_inside_own_boxes():
    for s in STATES:
        box = state_geo_bounds(s)
        assert box is not None, s
        alat, alon = state_geo_anchor(s)
        min_lat, max_lat, min_lon, max_lon = box
        assert min_lat <= alat <= max_lat, s
        assert min_lon <= alon <= max_lon, s


def test_points_land_inside_state_box():
    rng = create_rng(3)
    for s in STATES:
        box = state_geo_bounds(s)
        for i in range(40):
            p = generate_geo(s, "urban" if i % 2 == 0 else "rural", rng)
            assert box[0] <= p["latitude"] <= box[1], (s, p)
            assert box[2] <= p["longitude"] <= box[3], (s, p)


def test_tiny_uts_near_anchor_inside_india():
    rng = create_rng(4)
    for s in ["chandigarh", "puducherry", "dadra_nagar_haveli",
              "daman_diu", "lakshadweep"]:
        assert state_geo_bounds(s) is None
        anchor = state_geo_anchor(s)
        for _ in range(40):
            p = generate_geo(s, "rural", rng)
            assert 6 <= p["latitude"] <= 38
            assert 68 <= p["longitude"] <= 98
            assert _dist_km((p["latitude"], p["longitude"]), anchor) < 400


def test_unknown_state_falls_back_to_central_india():
    p = generate_geo("atlantis", "urban", create_rng(5))
    assert 6 <= p["latitude"] <= 38


def test_urban_clusters_tighter_than_rural():
    anchor = state_geo_anchor("uttar_pradesh")

    def mean(items):
        return sum(_dist_km((p["latitude"], p["longitude"]), anchor)
                   for p in items) / len(items)

    urban_rng = create_rng(6)
    rural_rng = create_rng(7)
    urban = [generate_geo("uttar_pradesh", "urban", urban_rng) for _ in range(300)]
    rural = [generate_geo("uttar_pradesh", "rural", rural_rng) for _ in range(300)]
    assert mean(urban) < mean(rural)


def test_deterministic():
    a = generate_geo("punjab", "urban", create_rng(8))
    assert generate_geo("punjab", "urban", create_rng(8)) == a


def test_every_profile_has_geo_inside_own_state():
    cases = [
        ("Punjab", "punjab"),
        ("Kerala", "kerala"),
        ("Maharashtra", "maharashtra"),
        ("Tamil Nadu", "tamil_nadu"),
        ("Uttar Pradesh", "uttar_pradesh"),
        ("West Bengal", "west_bengal"),
        ("Rajasthan", "rajasthan"),
        ("Gujarat", "gujarat"),
    ]
    for state_name, sid in cases:
        box = state_geo_bounds(sid)
        rows = generate(count=30, seed=91, constraints={"state": state_name})
        assert len(rows) > 0
        for r in rows:
            assert r.get("geo") is not None
            assert isinstance(r["geo"]["latitude"], (int, float))
            assert isinstance(r["geo"]["longitude"], (int, float))
            assert box[0] <= r["geo"]["latitude"] <= box[1]
            assert box[2] <= r["geo"]["longitude"] <= box[3]
