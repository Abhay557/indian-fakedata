"""Regression tests for the v2.0.8 appearance attribute."""

BUILDS = {"slim", "average", "stocky", "heavy"}
FACE_SHAPES = {"oval", "round", "square", "oblong", "heart", "diamond"}
SKIN_TONES = {"fair", "wheatish", "brown", "deep_brown", "dark"}
NOSE_TYPES = {"straight", "aquiline", "flat", "broad", "button", "hooked"}
EYE_COLORS = {"brown", "dark_brown", "black", "hazel", "green", "grey"}
EYE_SHAPES = {"almond", "round", "hooded", "monolid", "deep_set"}
HAIR_COLORS = {"black", "dark_brown", "brown", "grey", "white"}
HAIR_TEXTURES = {"straight", "wavy", "curly", "coily"}
HAIR_LENGTHS = {"bald", "short", "medium", "long"}
FACIAL_HAIR = {"none", "stubble", "moustache", "full_beard", "goatee"}

from indian_fakedata import generate
from indian_fakedata.utils.appearance import get_region, REGION_HEIGHT_OFFSET_CM


def test_every_profile_has_valid_appearance():
    rows = generate(count=100)
    for r in rows:
        a = r["appearance"]
        assert a["heightCm"] == r["heightCm"]
        assert a["build"] in BUILDS
        assert a["faceShape"] in FACE_SHAPES
        assert a["skinTone"] in SKIN_TONES
        assert a["noseType"] in NOSE_TYPES
        assert a["eyeColor"] in EYE_COLORS
        assert a["eyeShape"] in EYE_SHAPES
        assert a["hairColor"] in HAIR_COLORS
        assert a["hairTexture"] in HAIR_TEXTURES
        assert a["hairLength"] in HAIR_LENGTHS
        if r["gender"] == "male":
            assert a["facialHair"] in FACIAL_HAIR
        else:
            assert a["facialHair"] is None


def test_same_seed_reproduces_same_appearance():
    assert generate(count=1, seed=42)[0]["appearance"] == generate(count=1, seed=42)[0]["appearance"]


def test_region_mapping_and_offset_ordering():
    assert get_region("punjab") == "north_west"
    assert get_region("kerala") == "south"
    assert get_region("nagaland") == "north_east"
    assert get_region("maharashtra") == "central"
    assert REGION_HEIGHT_OFFSET_CM["north_west"] > REGION_HEIGHT_OFFSET_CM["south"]
    assert REGION_HEIGHT_OFFSET_CM["south"] > REGION_HEIGHT_OFFSET_CM["north_east"]


def test_north_taller_than_south_on_average():
    north = [
        generate(count=1, seed=i, constraints={"state": "Punjab", "gender": "male", "ageRange": {"min": 25, "max": 35}})[0]["heightCm"]
        for i in range(400)
    ]
    south = [
        generate(count=1, seed=i, constraints={"state": "Kerala", "gender": "male", "ageRange": {"min": 25, "max": 35}})[0]["heightCm"]
        for i in range(400)
    ]
    assert sum(north) / len(north) > sum(south) / len(south)
