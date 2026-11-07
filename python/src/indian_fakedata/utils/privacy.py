"""
PII Stripping Helper (v2.0.9)

Mirrors the TypeScript implementation (src/utils/privacy.ts).

``strip_pii`` returns a share-safe copy of a profile dict with direct
identifiers emptied: Aadhaar, PAN, voter ID, phone, email, bank account
number, UPI ID, PIN code, geo coordinates and both the Roman and native-script
street address lines. Names are kept by default (personas and narratives join
on them) unless ``mask_names`` is set.

Emptied fields stay present as "" so CSV/JSON shapes and column order are
unchanged downstream. A ``piiStripped: True`` marker records that the copy
was sanitised. The synthetic/generator provenance markers are retained.

Note: stripped copies intentionally fail strict ``validate_profile`` (the
identifiers it requires are gone) — validate BEFORE stripping.

Pure function: no RNG, no I/O, input is never mutated.
"""

import re

#: Direct-identifier fields emptied by strip_pii
PII_FIELDS = [
    "aadhaarNumber",
    "panNumber",
    "voterIdNumber",
    "phoneNumber",
    "email",
    "bankAccountNumber",
    "upiId",
    "addressLine",
    "pinCode",
]

_NAME_FIELDS = [
    "firstName",
    "lastName",
    "fatherName",
    "motherName",
    "spouseName",
]


_REDACTED = "[REDACTED]"

_PII_TEXT_PATTERNS = [
    re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
    re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
    re.compile(r"\b[A-Z]{3}\d{7}\b"),
    re.compile(r"(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}\b"),
    re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\b"),
]


def _to_initials(name):
    if name is None:
        return None
    return " ".join(w[0] + "." for w in str(name).split() if w)


def _replace_token(text, value, replacement):
    if not value:
        return text
    pattern = re.compile(r"(?<![\w])" + re.escape(value) + r"(?![\w])", re.UNICODE)
    return pattern.sub(replacement, text)


def _profile_text_pii(profile, mask_names):
    items = []
    for field in PII_FIELDS:
        value = profile.get(field)
        if isinstance(value, str) and value:
            items.append((value, _REDACTED))
    native = profile.get("nativeScript") or {}
    if native.get("addressLine"):
        items.append((native["addressLine"], _REDACTED))
    if mask_names:
        names = [profile.get(field) for field in _NAME_FIELDS]
        names.extend([native.get("firstName"), native.get("lastName")])
        for name in names:
            if isinstance(name, str) and name:
                items.append((name, _to_initials(name)))
    return sorted(items, key=lambda item: len(item[0]), reverse=True)


def redact_pii(text, profile=None, mask_names=False):
    """Redact direct identifiers from generated text.

    Pass the profile the text came from so exact values such as the address
    and bank account can be removed; common identifier patterns are always
    caught. Pure function: no RNG, no I/O.
    """
    out = text
    if profile:
        for value, replacement in _profile_text_pii(profile, mask_names):
            out = _replace_token(out, value, replacement)
    for pattern in _PII_TEXT_PATTERNS:
        out = pattern.sub(_REDACTED, out)
    return out


def strip_pii(profile, mask_names=False):
    """
    Return a sanitised copy of the profile dict safe for sharing/demos.
    The input dict is never modified.
    """
    copy = dict(profile)

    for f in PII_FIELDS:
        copy[f] = ""

    copy["geo"] = {"latitude": 0, "longitude": 0}
    native = dict(copy.get("nativeScript") or {})
    native["addressLine"] = ""

    if mask_names:
        for f in _NAME_FIELDS:
            if isinstance(copy.get(f), str):
                copy[f] = _to_initials(copy[f])
        native["firstName"] = _to_initials(native.get("firstName", ""))
        native["lastName"] = _to_initials(native.get("lastName", ""))

    copy["nativeScript"] = native
    copy["piiStripped"] = True
    return copy
