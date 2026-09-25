"""Parity tests for the transliteration engine (v2.1.0, item 1)."""

from indian_fakedata import generate, generate_agent_persona
from indian_fakedata.utils.transliterate import (
    transliterate, script_for_language, contains_indic,
)


def _codepoints(s):
    return ",".join(format(ord(c), "x") for c in s)


def test_common_names_in_devanagari():
    assert transliterate("Pushpa", "Devanagari") == "पुष्पा"
    assert transliterate("Sharma", "Devanagari") == "शर्मा"
    assert transliterate("Singh", "Devanagari") == "सिंह"
    assert transliterate("Amit", "Devanagari") == "अमित"
    assert transliterate("Geeta", "Devanagari") == "गीता"
    assert transliterate("Lakshmi", "Devanagari") == "लक्ष्मी"
    assert transliterate("Mitra", "Devanagari") == "मित्र"
    assert transliterate("Satya", "Devanagari") == "सत्या"
    assert transliterate("Kanya", "Devanagari") == "कन्या"
    assert transliterate("Pant", "Devanagari") == "पंत"
    assert transliterate("Neha", "Devanagari") == "नेहा"
    assert _codepoints(transliterate("Chennai", "Devanagari")) == "91a,947,928,94d,928,940"
    assert transliterate("Sneha", "Devanagari") == "स्नेहा"
    assert transliterate("Ritu", "Devanagari") == "ऋतु"
    assert transliterate("Faiz", "Devanagari") == "फ़ैज़"
    assert transliterate("Sawant", "Devanagari") == "सवंत"
    assert transliterate("Divya", "Devanagari") == "दिव्या"
    assert transliterate("Anna", "Devanagari") == "अन्ना"
    assert transliterate("Utsav", "Devanagari") == "उत्सव"
    assert transliterate("Swati", "Devanagari") == "स्वती"


def test_documented_approximations():
    assert transliterate("Prakash", "Devanagari") == "प्रकश"
    assert transliterate("Kumar", "Devanagari") == "कुमर"
    assert transliterate("Ravi", "Devanagari") == "रवी"
    assert transliterate("Rishi", "Devanagari") == "ऋषी"
    assert _codepoints(transliterate("Rukmani", "Devanagari")) == "930,941,915,94d,92e,928,940"


def test_other_script_conventions():
    assert transliterate("Pushpa Sharma", "Tamil") == "புஷ்பா ஷர்மா"
    assert transliterate("Singh", "Tamil") == "சிங்"
    assert transliterate("Pushpa", "Bengali") == "পুষ্পা"
    assert _codepoints(transliterate("Ravi Menon", "Malayalam")) == "d30,d35,d40,20,d2e,d46,d28,d4b,d7b"
    assert transliterate("Amit", "Gujarati") == "અમિત"
    assert transliterate("Singh", "Gurmukhi") == "ਸਿੰਘ"
    assert transliterate("Pushpa", "Kannada") == "ಪುಷ್ಪಾ"
    assert transliterate("Pushpa", "Telugu") == "పుష్పా"
    assert transliterate("Pushpa", "Odia") == "ପୁଷ୍ପା"


def test_language_mapping_and_passthrough():
    assert script_for_language("Hindi") == "Devanagari"
    assert script_for_language("Bengali") == "Bengali"
    assert script_for_language("Tamil") == "Tamil"
    assert script_for_language("Punjabi") == "Gurmukhi"
    assert script_for_language("Urdu") == "Latin"
    assert script_for_language("English") == "Latin"
    assert transliterate("Pushpa", "Latin") == "Pushpa"
    assert contains_indic(transliterate("Pushpa", "Devanagari")) is True
    assert contains_indic("Pushpa") is False


def test_deterministic():
    a = transliterate("Pushpa Sharma", "Devanagari")
    assert transliterate("Pushpa Sharma", "Devanagari") == a


def test_every_profile_has_matching_native_script():
    rows = generate(count=120, seed=77)
    indic = latin = 0
    for r in rows:
        ns = r.get("nativeScript")
        assert ns is not None
        assert ns["language"] == r["motherTongue"]
        assert ns["script"] == script_for_language(r["motherTongue"])
        if ns["script"] == "Latin":
            assert ns["firstName"] == r["firstName"]
            latin += 1
        else:
            assert contains_indic(ns["firstName"]) is True
            assert contains_indic(ns["lastName"]) is True
            indic += 1
    assert indic > 0


def test_persona_prompts_transliterate():
    p = generate(count=1, seed=77)[0]
    persona = generate_agent_persona(p)
    script = script_for_language(p["motherTongue"])
    out = transliterate(persona["systemPrompt"], script)
    assert transliterate(p["firstName"], script) in out
    if script == "Latin":
        assert out == persona["systemPrompt"]
    else:
        assert contains_indic(out) is True
