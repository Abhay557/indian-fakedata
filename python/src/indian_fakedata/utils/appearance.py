"""
Appearance Generator

Generates physical appearance attributes (face, skin tone, eyes, hair, build)
for a profile. Values are chosen as probability distributions tuned by broad
region + gender, mirroring the TypeScript implementation (src/utils/appearance.ts).

IMPORTANT: these are population-level statistical *tendencies*, not individual
facts. Regional/appearance correlations in India are real but heavily
overlapping — so the distributions here use wide variance and deliberately avoid
deterministic "everyone in region X looks Y" outcomes. Skin tone uses neutral
descriptive buckets (fair/wheatish/brown/deep brown/dark) and is never ranked
or valued.

Draw-order note: this module is invoked at the END of profile generation (after
every existing field), so its RNG draws never disturb the output of earlier
fields for a given seed. The regional height offset, however, lives inside
generate_height() (a mean shift, not extra draws), and height_cm on the
appearance object simply mirrors the already-computed top-level height.
"""

from indian_fakedata.core.sampler import weighted_sample_from_record

# ──────────────────── Regional classification ────────────────────

# Broad geographic region for a state id. Used to tune height and skin-tone
# distributions. Categories follow documented average anthropometric/climatic
# survey trends and are intentionally coarse so variance stays wide.
REGION_MAP = {
    # North & West — on average taller, wider range of skin tones
    "punjab": "north_west",
    "haryana": "north_west",
    "delhi": "north_west",
    "chandigarh": "north_west",
    "rajasthan": "north_west",
    "jammu_kashmir": "north_west",
    "himachal_pradesh": "north_west",
    "uttarakhand": "north_west",
    "uttar_pradesh": "north_west",
    "gujarat": "north_west",
    "madhya_pradesh": "north_west",
    # South — on average shorter
    "kerala": "south",
    "tamil_nadu": "south",
    "karnataka": "south",
    "andhra_pradesh": "south",
    "telangana": "south",
    "puducherry": "south",
    "goa": "south",
    # North-East — on average shortest
    "arunachal_pradesh": "north_east",
    "assam": "north_east",
    "manipur": "north_east",
    "meghalaya": "north_east",
    "mizoram": "north_east",
    "nagaland": "north_east",
    "tripura": "north_east",
    "sikkim": "north_east",
}


def get_region(state_id):
    """Return the broad region for a state id ('central' if unknown)."""
    return REGION_MAP.get(state_id, "central")


# Height offset (cm) applied to the adult mean per region. Wide-stated
# averages from Indian anthropometric surveys; kept modest so distributions
# still overlap comfortably between regions.
REGION_HEIGHT_OFFSET_CM = {
    "north_west": 2.0,
    "south": -2.5,
    "north_east": -3.0,
    "central": 0,
}

# ──────────────────── Appearance distributions ────────────────────

# Skin tone is tuned by region. Buckets are neutral descriptive labels.
SKIN_TONE_BASE = {
    "fair": 25,
    "wheatish": 40,
    "brown": 25,
    "deep_brown": 8,
    "dark": 2,
}

# South + North-East skew darker on average, so the lighter "fair/wheatish"
# share drops and darker shares rise there.
SKIN_TONE_DELTA = {
    "north_west": {"fair": 10, "wheatish": 2, "brown": -6, "deep_brown": -4, "dark": -2},
    "south": {"fair": -10, "wheatish": 0, "brown": 4, "deep_brown": 4, "dark": 2},
    "north_east": {"fair": -5, "wheatish": -5, "brown": 2, "deep_brown": 6, "dark": 2},
    "central": {},
}

# India is overwhelmingly dark-eyed; coloured eyes are rare.
EYE_COLOR_DIST = {
    "dark_brown": 50,
    "black": 30,
    "brown": 17,
    "hazel": 2,
    "green": 0.7,
    "grey": 0.3,
}

EYE_SHAPE_DIST = {
    "almond": 45,
    "round": 25,
    "hooded": 15,
    "deep_set": 10,
    "monolid": 5,
}

HAIR_COLOR_DIST = {
    "black": 65,
    "dark_brown": 28,
    "brown": 5,
    "grey": 1.5,
    "white": 0.5,
}

HAIR_TEXTURE_DIST = {
    "straight": 55,
    "wavy": 30,
    "curly": 12,
    "coily": 3,
}


def _sample_build(age, rng):
    dist = {"slim": 35, "average": 40, "stocky": 15, "heavy": 10}
    if age > 45:
        dist["heavy"] += 8
        dist["slim"] -= 8
    elif age < 25:
        dist["slim"] += 8
        dist["heavy"] -= 4
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _sample_face_shape(rng):
    dist = {"oval": 30, "round": 25, "square": 20, "oblong": 12, "heart": 8, "diamond": 5}
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _sample_skin_tone(region, rng):
    dist = dict(SKIN_TONE_BASE)
    delta = SKIN_TONE_DELTA.get(region, {})
    for k, d in delta.items():
        if k in dist:
            dist[k] = max(0, dist[k] + d)
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _sample_nose_type(rng):
    dist = {"straight": 30, "aquiline": 15, "flat": 20, "broad": 15, "button": 12, "hooked": 8}
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _sample_hair_length(gender, age, rng):
    # Bald is age+gender specific (mostly older males). Many women keep long hair.
    is_bald_candidate = gender == "male" and age > 40
    long_bias = 55 if gender == "female" else 5
    short_bias = 60 if gender == "male" else 10
    dist = {"short": short_bias, "medium": 35, "long": long_bias}
    if is_bald_candidate:
        dist["bald"] = 25 if age > 60 else 12
        dist["short"] += 10
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _sample_facial_hair(gender, age, rng):
    if gender != "male":
        return None
    dist = {"none": 35, "stubble": 20, "moustache": 25, "full_beard": 15, "goatee": 5}
    if age < 18:
        dist["none"] += 30
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _sample_eye_color(rng):
    key, _ = weighted_sample_from_record(EYE_COLOR_DIST, rng)
    return key


def _sample_eye_shape(rng):
    key, _ = weighted_sample_from_record(EYE_SHAPE_DIST, rng)
    return key


def _sample_hair_color(age, rng):
    dist = dict(HAIR_COLOR_DIST)
    if age > 50:
        dist["grey"] += 12
        dist["white"] += 4
        dist["black"] -= 10
        dist["dark_brown"] -= 4
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _sample_hair_texture(rng):
    key, _ = weighted_sample_from_record(HAIR_TEXTURE_DIST, rng)
    return key


def generate_appearance(gender, age, state_id, height_cm, rng):
    """
    Generate the full appearance object for a profile.

    Runs AFTER every other field in the generator so draw order is preserved
    for existing seeded output. `height_cm` is passed in (already computed by
    the top-level generator) and simply mirrored — no extra RNG draw.
    """
    region = get_region(state_id)

    return {
        "heightCm": height_cm,
        "build": _sample_build(age, rng),
        "faceShape": _sample_face_shape(rng),
        "skinTone": _sample_skin_tone(region, rng),
        "noseType": _sample_nose_type(rng),
        "eyeColor": _sample_eye_color(rng),
        "eyeShape": _sample_eye_shape(rng),
        "hairColor": _sample_hair_color(age, rng),
        "hairTexture": _sample_hair_texture(rng),
        "hairLength": _sample_hair_length(gender, age, rng),
        "facialHair": _sample_facial_hair(gender, age, rng),
    }
