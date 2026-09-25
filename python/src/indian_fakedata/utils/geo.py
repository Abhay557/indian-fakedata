"""
Geospatial Point Generator (v2.1.0, item 2)

Mirrors the TypeScript implementation (src/utils/geo.ts): every profile
gets a ``geo`` block with an approximate latitude/longitude. Points are
drawn around the state capital anchor with an urban/rural spread, clamped
inside a generous state bounding box, so a point always lands in its own
state (district-level polygons are not bundled, and the docs say so
plainly).

Runs on an isolated per-profile stream: zero impact on seeded output.
"""

import math

from indian_fakedata.core.sampler import gaussian_sample

# Anchors are state/UT capitals; bboxes are deliberately generous.
STATE_GEO = {
    "andhra_pradesh": {"anchor": (16.51, 80.52), "bbox": (12.6, 19.3, 76.7, 84.8)},
    "arunachal_pradesh": {"anchor": (27.08, 93.61), "bbox": (26.6, 29.5, 91.5, 97.4)},
    "assam": {"anchor": (26.14, 91.74), "bbox": (24.0, 28.1, 89.7, 96.1)},
    "bihar": {"anchor": (25.59, 85.14), "bbox": (24.3, 27.6, 83.3, 88.3)},
    "chhattisgarh": {"anchor": (21.25, 81.63), "bbox": (17.8, 24.1, 80.2, 84.4)},
    "goa": {"anchor": (15.49, 73.83), "bbox": (14.8, 15.9, 73.7, 74.4)},
    "gujarat": {"anchor": (23.22, 72.65), "bbox": (20.1, 24.8, 68.1, 74.6)},
    "haryana": {"anchor": (30.73, 76.78), "bbox": (27.3, 31.0, 74.4, 77.4)},
    "himachal_pradesh": {"anchor": (31.10, 77.17), "bbox": (30.2, 33.3, 75.4, 79.1)},
    "jammu_kashmir": {"anchor": (34.08, 74.80), "bbox": (32.2, 37.1, 73.8, 80.4)},
    "jharkhand": {"anchor": (23.34, 85.31), "bbox": (21.9, 25.4, 83.3, 87.9)},
    "karnataka": {"anchor": (12.97, 77.59), "bbox": (11.6, 18.5, 74.0, 78.7)},
    "kerala": {"anchor": (8.52, 76.94), "bbox": (8.1, 12.9, 74.5, 77.5)},
    "madhya_pradesh": {"anchor": (23.26, 77.41), "bbox": (21.0, 27.0, 74.0, 83.0)},
    "maharashtra": {"anchor": (19.08, 72.88), "bbox": (15.6, 22.2, 72.6, 81.0)},
    "manipur": {"anchor": (24.81, 93.94), "bbox": (23.8, 25.7, 92.9, 94.8)},
    "meghalaya": {"anchor": (25.58, 91.89), "bbox": (25.0, 26.2, 89.8, 92.8)},
    "mizoram": {"anchor": (23.73, 92.72), "bbox": (21.9, 24.6, 92.2, 93.7)},
    "nagaland": {"anchor": (25.67, 94.11), "bbox": (25.1, 27.0, 93.3, 95.2)},
    "odisha": {"anchor": (20.30, 85.83), "bbox": (17.8, 22.6, 81.3, 87.6)},
    "punjab": {"anchor": (30.73, 76.78), "bbox": (29.5, 32.6, 73.8, 77.0)},
    "rajasthan": {"anchor": (26.91, 75.79), "bbox": (23.0, 30.3, 69.4, 78.3)},
    "sikkim": {"anchor": (27.34, 88.61), "bbox": (27.0, 28.2, 88.0, 88.9)},
    "tamil_nadu": {"anchor": (13.08, 80.27), "bbox": (8.0, 13.6, 76.1, 80.4)},
    "telangana": {"anchor": (17.39, 78.49), "bbox": (15.8, 20.0, 77.1, 81.4)},
    "tripura": {"anchor": (23.83, 91.29), "bbox": (22.9, 24.6, 90.8, 92.0)},
    "uttar_pradesh": {"anchor": (26.85, 80.95), "bbox": (23.8, 31.0, 77.0, 84.8)},
    "uttarakhand": {"anchor": (30.32, 78.03), "bbox": (28.7, 31.5, 77.5, 81.1)},
    "west_bengal": {"anchor": (22.57, 88.36), "bbox": (21.5, 27.2, 85.8, 90.0)},
    "delhi": {"anchor": (28.61, 77.21), "bbox": (28.4, 28.9, 76.8, 77.4)},
    "chandigarh": {"anchor": (30.73, 76.78), "spreadKm": {"urban": 2, "rural": 4}},
    "puducherry": {"anchor": (11.94, 79.83), "spreadKm": {"urban": 6, "rural": 12}},
    "andaman_nicobar": {"anchor": (11.62, 92.73), "bbox": (6.7, 13.7, 92.2, 94.0)},
    "dadra_nagar_haveli": {"anchor": (20.27, 73.02), "spreadKm": {"urban": 4, "rural": 8}},
    "daman_diu": {"anchor": (20.42, 72.83), "spreadKm": {"urban": 5, "rural": 10}},
    "lakshadweep": {"anchor": (10.57, 72.64), "spreadKm": {"urban": 20, "rural": 60}},
}

# India-wide fallback when the state id is unknown
_FALLBACK = {"anchor": (21.0, 78.0), "bbox": (6.5, 37.5, 68.0, 97.5)}


def state_geo_bounds(state_id):
    """Bounding box for a state id (None for tiny scattered UTs)."""
    g = STATE_GEO.get(state_id)
    return g.get("bbox") if g else None


def state_geo_anchor(state_id):
    """Anchor point for a state id (capital)."""
    return STATE_GEO.get(state_id, _FALLBACK)["anchor"]


def _round4(v):
    return round(v * 10000) / 10000


def generate_geo(state_id, area_type, rng):
    """
    Approximate point for a profile: capital anchor plus gaussian jitter,
    tighter for urban profiles, clamped inside the state bounding box.
    """
    g = STATE_GEO.get(state_id, _FALLBACK)
    lat0, lon0 = g["anchor"]

    if "spreadKm" in g:
        sigma_km = g["spreadKm"]["urban"] if area_type == "urban" else g["spreadKm"]["rural"]
    elif "bbox" in g:
        min_lat, max_lat, min_lon, max_lon = g["bbox"]
        diag_km = math.hypot((max_lat - min_lat) * 111,
                             (max_lon - min_lon) * 111 * math.cos(math.radians(lat0)))
        divisor = 20 if area_type == "urban" else 6
        sigma_km = max(2, diag_km / divisor)
    else:
        sigma_km = 4 if area_type == "urban" else 15

    lat = lat0 + gaussian_sample(0, sigma_km / 111, rng)
    lon = lon0 + gaussian_sample(0, sigma_km / (111 * math.cos(math.radians(lat0))), rng)

    if "bbox" in g:
        min_lat, max_lat, min_lon, max_lon = g["bbox"]
        return {"latitude": _round4(min(max_lat, max(min_lat, lat))),
                "longitude": _round4(min(max_lon, max(min_lon, lon)))}
    return {"latitude": _round4(lat), "longitude": _round4(lon)}
