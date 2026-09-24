"""
PII Stripping Helper (v2.0.9)

Mirrors the TypeScript implementation (src/utils/privacy.ts).

``strip_pii`` returns a share-safe copy of a profile dict with direct
identifiers emptied: Aadhaar, PAN, voter ID, phone, email, bank account
number, UPI ID and the street-level address line. Names are kept by default
(personas and narratives join on them) unless ``mask_names`` is set.

Emptied fields stay present as "" so CSV/JSON shapes and column order are
unchanged downstream. A ``piiStripped: True`` marker records that the copy
was sanitised. The synthetic/generator provenance markers are retained.

Note: stripped copies intentionally fail strict ``validate_profile`` (the
identifiers it requires are gone) — validate BEFORE stripping.

Pure function: no RNG, no I/O, input is never mutated.
"""

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
]

_NAME_FIELDS = [
    "firstName",
    "lastName",
    "fatherName",
    "motherName",
    "spouseName",
]


def _to_initials(name):
    if name is None:
        return None
    return " ".join(w[0] + "." for w in str(name).split() if w)


def strip_pii(profile, mask_names=False):
    """
    Return a sanitised copy of the profile dict safe for sharing/demos.
    The input dict is never modified.
    """
    copy = dict(profile)

    for f in PII_FIELDS:
        copy[f] = ""

    if mask_names:
        for f in _NAME_FIELDS:
            if isinstance(copy.get(f), str):
                copy[f] = _to_initials(copy[f])

    copy["piiStripped"] = True
    return copy
