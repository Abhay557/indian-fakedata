"""
Roman-to-Indic Transliteration Engine (v2.1.0, item 1)

Mirrors the TypeScript implementation (src/utils/transliterate.ts):
simplified ITRANS-style scheme turning plain ASCII names ("Pushpa",
"Singh") into nine Indic scripts. Deterministic pure functions — no RNG —
so transliterated output never disturbs seeded generation.

Deliberate simplifications (documented, not bugs): dental t/d/n by
default (no retroflex detection), anusvara for most nasal+plosive
clusters, final -i defaults long, medial vowel length unpredictable
from plain ASCII.
"""

import re

DEVANAGARI = {
    "vowels": {"a": "अ", "aa": "आ", "i": "इ", "ee": "ई", "u": "उ", "oo": "ऊ", "e": "ए", "ai": "ऐ", "o": "ओ", "au": "औ"},
    "signs": {"aa": "ा", "i": "ि", "ee": "ी", "u": "ु", "oo": "ू", "e": "े", "ai": "ै", "o": "ो", "au": "ौ"},
    "consonants": {
        "k": "क", "kh": "ख", "g": "ग", "gh": "घ", "ng": "ङ",
        "c": "च", "ch": "च", "chh": "छ", "j": "ज", "jh": "झ", "ny": "ञ",
        "t": "त", "th": "थ", "d": "द", "dh": "ध", "n": "न",
        "p": "प", "ph": "फ", "b": "ब", "bh": "भ", "m": "म",
        "y": "य", "r": "र", "l": "ल", "v": "व",
        "sh": "श", "ssa": "ष", "s": "स", "h": "ह",
        "ksh": "क्ष", "gy": "ज्ञ", "x": "क्ष",
        "f": "फ", "z": "ज", "q": "क",
    },
    "virama": "्", "anusvara": "ं", "nukta": "़", "vocalicR": "ऋ", "vocalicRSign": "ृ",
}

BENGALI = {
    "vowels": {"a": "অ", "aa": "আ", "i": "ই", "ee": "ঈ", "u": "উ", "oo": "ঊ", "e": "এ", "ai": "ঐ", "o": "ও", "au": "ঔ"},
    "signs": {"aa": "া", "i": "ি", "ee": "ী", "u": "ু", "oo": "ূ", "e": "ে", "ai": "ৈ", "o": "ো", "au": "ৌ"},
    "consonants": {
        "k": "ক", "kh": "খ", "g": "গ", "gh": "ঘ", "ng": "ঙ",
        "c": "চ", "ch": "চ", "chh": "ছ", "j": "জ", "jh": "ঝ", "ny": "ঞ",
        "t": "ত", "th": "থ", "d": "দ", "dh": "ধ", "n": "ন",
        "p": "প", "ph": "ফ", "b": "ব", "bh": "ভ", "m": "ম",
        "y": "য", "r": "র", "l": "ল", "v": "ব",
        "sh": "শ", "ssa": "ষ", "s": "স", "h": "হ",
        "ksh": "ক্ষ", "gy": "জ্ঞ", "x": "ক্ষ",
        "f": "ফ", "z": "জ", "q": "ক",
    },
    "virama": "্", "anusvara": "ং", "nukta": None, "vocalicR": "ঋ", "vocalicRSign": "ৃ",
}

GUJARATI = {
    "vowels": {"a": "અ", "aa": "આ", "i": "ઇ", "ee": "ઈ", "u": "ઉ", "oo": "ઊ", "e": "એ", "ai": "ઐ", "o": "ઓ", "au": "ઔ"},
    "signs": {"aa": "ા", "i": "િ", "ee": "ી", "u": "ુ", "oo": "ૂ", "e": "ે", "ai": "ૈ", "o": "ો", "au": "ૌ"},
    "consonants": {
        "k": "ક", "kh": "ખ", "g": "ગ", "gh": "ઘ", "ng": "ઙ",
        "c": "ચ", "ch": "ચ", "chh": "છ", "j": "જ", "jh": "ઝ", "ny": "ઞ",
        "t": "ત", "th": "થ", "d": "દ", "dh": "ધ", "n": "ન",
        "p": "પ", "ph": "ફ", "b": "બ", "bh": "ભ", "m": "મ",
        "y": "ય", "r": "ર", "l": "લ", "v": "વ",
        "sh": "શ", "ssa": "ષ", "s": "સ", "h": "હ",
        "ksh": "ક્ષ", "gy": "જ્ઞ", "x": "ક્ષ",
        "f": "ફ", "z": "જ", "q": "ક",
    },
    "virama": "્", "anusvara": "ં", "nukta": None, "vocalicR": "ઋ", "vocalicRSign": "ૃ",
}

GURMUKHI = {
    "vowels": {"a": "ਅ", "aa": "ਆ", "i": "ਇ", "ee": "ਈ", "u": "ਉ", "oo": "ਊ", "e": "ਏ", "ai": "ਐ", "o": "ਓ", "au": "ਔ"},
    "signs": {"aa": "ਾ", "i": "ਿ", "ee": "ੀ", "u": "ੁ", "oo": "ੂ", "e": "ੇ", "ai": "ੈ", "o": "ੋ", "au": "ੌ"},
    "consonants": {
        "k": "ਕ", "kh": "ਖ", "g": "ਗ", "gh": "ਘ", "ng": "ਙ",
        "c": "ਚ", "ch": "ਚ", "chh": "ਛ", "j": "ਜ", "jh": "ਝ", "ny": "ਞ",
        "t": "ਤ", "th": "ਥ", "d": "ਦ", "dh": "ਧ", "n": "ਨ",
        "p": "ਪ", "ph": "ਫ", "b": "ਬ", "bh": "ਭ", "m": "ਮ",
        "y": "ਯ", "r": "ਰ", "l": "ਲ", "v": "ਵ",
        "sh": "ਸ਼", "ssa": "ਸ਼", "s": "ਸ", "h": "ਹ",
        "ksh": "ਕਸ਼", "gy": "ਗਯ", "x": "ਕਸ",
        "f": "ਫ", "z": "ਜ਼", "q": "ਕ",
    },
    "virama": "੍", "anusvara": "ੰ", "nukta": "਼", "vocalicR": "ਰਿ", "vocalicRSign": None,
    "dropNghH": True, "binduGhForNgh": True,
}

KANNADA = {
    "vowels": {"a": "ಅ", "aa": "ಆ", "i": "ಇ", "ee": "ಈ", "u": "ಉ", "oo": "ಊ", "e": "ಎ", "ai": "ಐ", "o": "ಒ", "au": "ಔ"},
    "signs": {"aa": "ಾ", "i": "ಿ", "ee": "ೀ", "u": "ು", "oo": "ೂ", "e": "ೆ", "ai": "ೈ", "o": "ೋ", "au": "ೌ"},
    "consonants": {
        "k": "ಕ", "kh": "ಖ", "g": "ಗ", "gh": "ಘ", "ng": "ಙ",
        "c": "ಚ", "ch": "ಚ", "chh": "ಛ", "j": "ಜ", "jh": "ಝ", "ny": "ಞ",
        "t": "ತ", "th": "ಥ", "d": "ದ", "dh": "ಧ", "n": "ನ",
        "p": "ಪ", "ph": "ಫ", "b": "ಬ", "bh": "ಭ", "m": "ಮ",
        "y": "ಯ", "r": "ರ", "l": "ಲ", "v": "ವ",
        "sh": "ಶ", "ssa": "ಷ", "s": "ಸ", "h": "ಹ",
        "ksh": "ಕ್ಷ", "gy": "ಜ್ಞ", "x": "ಕ್ಷ",
        "f": "ಫ", "z": "ಜ", "q": "ಕ",
    },
    "virama": "್", "anusvara": "ಂ", "nukta": None, "vocalicR": "ಋ", "vocalicRSign": "ೃ",
}

MALAYALAM = {
    "vowels": {"a": "അ", "aa": "ആ", "i": "ഇ", "ee": "ഈ", "u": "ഉ", "oo": "ഊ", "e": "എ", "ai": "ഐ", "o": "ഒ", "au": "ഔ"},
    "signs": {"aa": "ാ", "i": "ി", "ee": "ീ", "u": "ു", "oo": "ൂ", "e": "െ", "ai": "ൈ", "o": "ോ", "au": "ൌ"},
    "consonants": {
        "k": "ക", "kh": "ഖ", "g": "ഗ", "gh": "ഘ", "ng": "ങ്ങ",
        "c": "ച", "ch": "ച", "chh": "ഛ", "j": "ജ", "jh": "ഝ", "ny": "ഞ്ഞ",
        "t": "ത", "th": "ഥ", "d": "ദ", "dh": "ധ", "n": "ന",
        "p": "പ", "ph": "ഫ", "b": "ബ", "bh": "ഭ", "m": "മ",
        "y": "യ", "r": "ര", "l": "ല", "v": "വ",
        "sh": "ശ", "ssa": "ഷ", "s": "സ", "h": "ഹ",
        "ksh": "ക്ഷ", "gy": "ജ്ഞ", "x": "ക്ഷ",
        "f": "ഫ", "z": "ജ", "q": "ക",
    },
    "virama": "്", "anusvara": "ം", "nukta": None, "vocalicR": "ഋ", "vocalicRSign": "ൃ",
    "finalForms": {"n": "ൻ", "r": "ർ", "l": "ൽ"},
}

TAMIL = {
    "vowels": {"a": "அ", "aa": "ஆ", "i": "இ", "ee": "ஈ", "u": "உ", "oo": "ஊ", "e": "எ", "ai": "ஐ", "o": "ஒ", "au": "ஔ"},
    "signs": {"aa": "ா", "i": "ி", "ee": "ீ", "u": "ு", "oo": "ூ", "e": "ெ", "ai": "ை", "o": "ோ", "au": "ௌ"},
    "consonants": {
        "k": "க", "kh": "க", "g": "க", "gh": "க", "ng": "ங",
        "c": "ச", "ch": "ச", "chh": "ச", "j": "ஜ", "jh": "ஜ", "ny": "ஞ",
        "t": "த", "th": "த", "d": "த", "dh": "த", "n": "ந",
        "p": "ப", "ph": "ப", "b": "ப", "bh": "ப", "m": "ம",
        "y": "ய", "r": "ர", "l": "ல", "v": "வ",
        "sh": "ஷ", "ssa": "ஷ", "s": "ஸ", "h": "ஹ",
        "ksh": "க்ஷ", "gy": "க்ய", "x": "க்ஸ",
        "f": "ஃப", "z": "ஜ", "q": "க",
    },
    "virama": "்", "anusvara": "ங்", "nukta": None, "vocalicR": "ரி", "vocalicRSign": None,
    "dropNghH": True,
}

TELUGU = {
    "vowels": {"a": "అ", "aa": "ఆ", "i": "ఇ", "ee": "ఈ", "u": "ఉ", "oo": "ఊ", "e": "ఎ", "ai": "ఐ", "o": "ఒ", "au": "ఔ"},
    "signs": {"aa": "ా", "i": "ి", "ee": "ీ", "u": "ు", "oo": "ూ", "e": "ె", "ai": "ై", "o": "ో", "au": "ౌ"},
    "consonants": {
        "k": "క", "kh": "ఖ", "g": "గ", "gh": "ఘ", "ng": "ఙ",
        "c": "చ", "ch": "చ", "chh": "ఛ", "j": "జ", "jh": "ఝ", "ny": "ఞ",
        "t": "త", "th": "థ", "d": "ద", "dh": "ధ", "n": "న",
        "p": "ప", "ph": "ఫ", "b": "బ", "bh": "భ", "m": "మ",
        "y": "య", "r": "ర", "l": "ల", "v": "వ",
        "sh": "శ", "ssa": "ష", "s": "స", "h": "హ",
        "ksh": "క్ష", "gy": "జ్ఞ", "x": "క్ష",
        "f": "ఫ", "z": "జ", "q": "క",
    },
    "virama": "్", "anusvara": "ం", "nukta": None, "vocalicR": "ఋ", "vocalicRSign": "ృ",
}

ODIA = {
    "vowels": {"a": "ଅ", "aa": "ଆ", "i": "ଇ", "ee": "ଈ", "u": "ଉ", "oo": "ଊ", "e": "ଏ", "ai": "ଐ", "o": "ଓ", "au": "ଔ"},
    "signs": {"aa": "ା", "i": "ି", "ee": "ୀ", "u": "ୁ", "oo": "ୂ", "e": "େ", "ai": "ୈ", "o": "ୋ", "au": "ୌ"},
    "consonants": {
        "k": "କ", "kh": "ଖ", "g": "ଗ", "gh": "ଘ", "ng": "ଙ",
        "c": "ଚ", "ch": "ଚ", "chh": "ଛ", "j": "ଜ", "jh": "ଝ", "ny": "ଞ",
        "t": "ତ", "th": "ଥ", "d": "ଦ", "dh": "ଧ", "n": "ନ",
        "p": "ପ", "ph": "ଫ", "b": "ବ", "bh": "ଭ", "m": "ମ",
        "y": "ଯ", "r": "ର", "l": "ଲ", "v": "ଵ",
        "sh": "ଶ", "ssa": "ଷ", "s": "ସ", "h": "ହ",
        "ksh": "କ୍ଷ", "gy": "ଜ୍ଞ", "x": "କ୍ସ",
        "f": "ଫ", "z": "ଜ", "q": "କ",
    },
    "virama": "୍", "anusvara": "ଂ", "nukta": None, "vocalicR": "ଋ", "vocalicRSign": "ୃ",
}

TABLES = {
    "Devanagari": DEVANAGARI,
    "Bengali": BENGALI,
    "Gujarati": GUJARATI,
    "Gurmukhi": GURMUKHI,
    "Kannada": KANNADA,
    "Malayalam": MALAYALAM,
    "Tamil": TAMIL,
    "Telugu": TELUGU,
    "Odia": ODIA,
}

LANGUAGE_SCRIPT = {
    "hindi": "Devanagari", "marathi": "Devanagari", "nepali": "Devanagari",
    "dogri": "Devanagari", "konkani": "Devanagari", "sindhi": "Devanagari",
    "maithili": "Devanagari", "bhojpuri": "Devanagari", "magahi": "Devanagari",
    "awadhi": "Devanagari", "chhattisgarhi": "Devanagari", "rajasthani": "Devanagari",
    "garhwali": "Devanagari", "kumaoni": "Devanagari", "pahari": "Devanagari",
    "bhili": "Devanagari", "gondi": "Devanagari", "kinnauri": "Devanagari",
    "bengali": "Bengali", "assamese": "Bengali",
    "gujarati": "Gujarati",
    "punjabi": "Gurmukhi",
    "kannada": "Kannada", "tulu": "Kannada",
    "malayalam": "Malayalam",
    "tamil": "Tamil",
    "telugu": "Telugu",
    "odia": "Odia",
}


def script_for_language(mother_tongue):
    """Script for a mother-tongue value ('Hindi', 'Bengali', ...)."""
    return LANGUAGE_SCRIPT.get(str(mother_tongue).strip().lower(), "Latin")


_VOWELS = set("aeiou")
_CONSONANTS = set("bcdfghjklmnpqrstvwxyz")

# Roman clusters that take anusvara before them (nasal + plosive/sibilant)
_ANUSVARA_BEFORE = {
    "k", "kh", "g", "gh", "c", "ch", "j", "jh",
    "t", "th", "d", "dh", "p", "ph", "b", "bh", "s", "sh", "h",
}


def _vowel_key(s, i):
    for length in (2, 1):
        chunk = s[i:i + length]
        if chunk in ("aa", "ai", "au", "ee", "oo") or chunk in _VOWELS:
            return chunk
    return None


def _consonant_key(s, i):
    for length in (3, 2, 1):
        chunk = s[i:i + length]
        if chunk in ("ksh", "ngh", "chh"):
            return chunk
        if length == 2 and chunk in ("kh", "gh", "ch", "jh", "th", "dh",
                                     "ph", "bh", "sh", "gy"):
            return chunk
        if length == 1 and chunk in _CONSONANTS:
            return chunk
    return None


def _needs_halant(c1, c2):
    if len(c1) == 1 and c2.startswith(c1):
        return True  # geminates: Chennai, Anna
    h1 = "s" if c1 == "sh" else c1
    if h1 == "s":
        return True  # s-clusters incl ssa clusters: Swa, Sna, Pushpa
    if h1 == "ksh":
        return True  # Lakshmi
    if h1 == "k" and c2[0] in ("l", "m"):
        return True  # Shukla, Rukmani
    if h1 == "g" and c2[0] == "n":
        return True  # Agni
    if h1 in ("t", "p") and c2[0] == "s":
        return True  # Utsav, Apsara
    if c1 in ("n", "m"):
        return False
    if c2[0] in ("n", "m", "y", "r", "l", "v", "h"):
        return False
    return False


def _transliterate_run(run, t):
    out = []
    i, n = 0, len(run)
    after_vocalic_r = False

    def at_start():
        return len(out) == 0

    while i < n:
        just_had_vocalic_r = after_vocalic_r
        after_vocalic_r = False
        # initial s + r + i -> Sanskritic Sru (Srishti)
        if at_start() and run.startswith("sri", i) and i + 3 <= n:
            if t.get("vocalicRSign"):
                out.append(t["consonants"]["s"] + t["vocalicRSign"])
            else:
                out.append(t["consonants"]["s"] + t["virama"] +
                           t["consonants"]["r"] + t["signs"]["i"])
            i += 3
            continue
        # word-initial ri + consonant -> vocalic R (Rishi, Ritu)
        if (at_start() and run.startswith("ri", i) and i + 2 < n
                and run[i + 2] in _CONSONANTS):
            out.append(t["vocalicR"])
            after_vocalic_r = True
            i += 2
            continue
        # ngh -> anusvara + ha (Singh); Tamil drops ha, Gurmukhi uses bindi + gha
        if run.startswith("ngh", i):
            if t.get("binduGhForNgh"):
                out.append(t["anusvara"] + t["consonants"]["gh"])
            else:
                out.append(t["anusvara"])
                if not t.get("dropNghH"):
                    out.append(t["consonants"]["h"])
            i += 3
            continue
        # repha: r + consonant -> ra + halant (Sharma)
        if (run[i] == "r" and i + 1 < n and run[i + 1] in _CONSONANTS
                and run[i + 1] not in ("r", "h")):
            out.append(t["consonants"]["r"] + t["virama"])
            i += 1
            continue
        # nasal + plosive/sibilant -> anusvara (Pant, Mumbai)
        if run[i] in ("n", "m") and i + 1 < n:
            ck = _consonant_key(run, i + 1)
            if (ck and ck in _ANUSVARA_BEFORE
                    and not (run[i] == "n" and ck in ("y", "r", "l", "v"))):
                out.append(t["anusvara"])
                i += 1
                continue
        vk = _vowel_key(run, i)
        if vk:
            # Final -a/-ai/-i in Hindi names are conventionally long
            # (Pushpa, Mumbai, Rani). Medial stays short.
            is_final = i + len(vk) == n
            if at_start():
                out.append(t["vowels"].get(vk, vk))
            elif vk == "a":
                if is_final:
                    out.append(t["signs"].get("aa", ""))
            elif vk == "ai" and is_final:
                out.append(t["signs"].get("ee", ""))
            elif vk == "i" and is_final:
                out.append(t["signs"].get("ee", ""))
            else:
                out.append(t["signs"].get(vk, ""))
            i += len(vk)
            continue
        ck0 = _consonant_key(run, i)
        if ck0:
            # w is just v in Indic scripts (Sawant)
            ck = "v" if ck0 == "w" else ck0
            # sh before p/t/k/n is really ssa (Pushpa, Krishna);
            # sh right after vocalic R too (Rishi)
            use_ssa = ck == "sh" and (just_had_vocalic_r or (
                _consonant_key(run, i + 2) in ("p", "t", "k", "n")))
            letter = t["consonants"].get("ssa" if use_ssa else ck, ck)
            # nukta consonants where supported (Faiz, Qasim)
            if ck in ("f", "z", "q") and t.get("nukta"):
                letter += t["nukta"]
            # Tamil s before a vowel is ச (Singh, Suresh), else ஸ்
            if t is TAMIL and ck == "s":
                letter = "ச" if _vowel_key(run, i + 1) else "ஸ"
            # C + y + vowel -> ligature; ya + 'a' always takes explicit aa
            if i + len(ck) + 1 < n and run[i + len(ck)] == "y":
                yv = _vowel_key(run, i + len(ck) + 1)
                if yv:
                    out.append(letter + t["virama"] + t["consonants"]["y"])
                    out.append(t["signs"]["aa"] if yv == "a"
                               else t["signs"].get(yv, ""))
                    i += len(ck) + 1 + len(yv)
                    continue
            # C + r + vowel -> tra-ligature (Prakash)
            if i + len(ck) + 1 < n and run[i + len(ck)] == "r":
                rv = _vowel_key(run, i + len(ck) + 1)
                if rv:
                    out.append(letter + t["virama"] + t["consonants"]["r"])
                    if rv != "a":
                        out.append(t["signs"].get(rv, ""))
                    i += len(ck) + 1 + len(rv)
                    continue
            is_final = i + len(ck) == n
            if is_final and t.get("finalForms", {}).get(ck):
                out.append(t["finalForms"][ck])
            else:
                out.append(letter)
                if not is_final:
                    nk = _consonant_key(run, i + len(ck))
                    if nk and _needs_halant(ck, nk):
                        out.append(t["virama"])
            i += len(ck)
            continue
        i += 1
    return "".join(out)


def transliterate(text, script):
    """
    Transliterate Roman text into an Indic script.
    Letter runs are converted; digits, spaces and punctuation pass through.
    'Latin' returns the input unchanged.
    """
    if script == "Latin" or not text:
        return text
    t = TABLES.get(script)
    if not t:
        return text

    def _conv(m):
        return _transliterate_run(m.group(0).lower(), t)

    return re.sub(r"[A-Za-z]+", _conv, text)


def contains_indic(text):
    """Does this text contain Indic-script characters from supported blocks?"""
    return bool(re.search("[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF"
                          "\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF"
                          "\u0D00-\u0D7F]", text))
