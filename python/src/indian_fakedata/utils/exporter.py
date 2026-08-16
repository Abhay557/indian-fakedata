"""
File Exporter Module

Provides zero-dependency JSON, JSONL, and CSV export for
generated demographic profiles and enriched profiles.
Uses only Python standard library modules.
"""

import json
import csv
import io


def _flatten_object(obj, prefix=""):
    """Recursively flatten a nested dict into a single-level key-value map."""
    result = {}
    if not obj or not isinstance(obj, dict):
        return result

    for key, value in obj.items():
        full_key = f"{prefix}_{key}" if prefix else key
        if isinstance(value, dict):
            result.update(_flatten_object(value, full_key))
        elif isinstance(value, list):
            if any(isinstance(v, dict) for v in value):
                result[full_key] = "; ".join(json.dumps(v) for v in value)
            else:
                result[full_key] = "; ".join(str(v) for v in value)
        else:
            result[full_key] = value

    return result


def _escape_csv_value(val):
    """Escape special characters for a CSV cell per RFC 4180."""
    if val is None:
        return ""
    if isinstance(val, dict) or isinstance(val, list):
        s = json.dumps(val)
    elif isinstance(val, bool):
        s = str(val)
    else:
        s = str(val)

    if ',' in s or '"' in s or '\n' in s or '\r' in s:
        return '"' + s.replace('"', '""') + '"'
    return s


def _flatten_enriched(enriched):
    """Flatten an EnrichedProfile for CSV output."""
    base = _flatten_object(enriched.get("profile", enriched))

    outcomes = enriched.get("outcomes")
    if outcomes:
        o = outcomes
        credit = o.get("credit", {})
        base["outcomes.credit.creditScore"] = credit.get("creditScore")
        base["outcomes.credit.loanApprovalProbability"] = credit.get("loanApprovalProbability")
        base["outcomes.credit.approvedLoanAmountINR"] = credit.get("approvedLoanAmountINR", "")
        base["outcomes.credit.reasonCodes"] = "|".join(credit.get("reasonCodes", []))

        health = o.get("health", {})
        base["outcomes.health.healthRiskScore"] = health.get("healthRiskScore")
        base["outcomes.health.bmiCategory"] = health.get("bmiCategory")
        base["outcomes.health.healthcareAccessProbability"] = health.get("healthcareAccessProbability")
        base["outcomes.health.likelyConditions"] = "|".join(health.get("likelyConditions", []))

        edu = o.get("education", {})
        base["outcomes.education.functionalLiteracy"] = edu.get("functionalLiteracy")
        base["outcomes.education.dropoutRisk"] = edu.get("dropoutRisk")
        base["outcomes.education.educationalMobility"] = edu.get("educationalMobility")

        emp = o.get("employment", {})
        base["outcomes.employment.employmentQuality"] = emp.get("employmentQuality")
        base["outcomes.employment.expectedMonthlyWageINR"] = emp.get("expectedMonthlyWageINR")
        base["outcomes.employment.wageGapRatio"] = emp.get("wageGapRatio")
        base["outcomes.employment.vulnerabilityIndex"] = emp.get("vulnerabilityIndex")

    persona = enriched.get("agentPersona")
    if persona:
        base["persona.identityLine"] = persona.get("identityLine")
        beliefs = persona.get("beliefs", {})
        base["persona.worldview"] = beliefs.get("worldview")
        base["persona.economicBehavior"] = persona.get("economicBehavior")
        base["persona.stressResponse"] = persona.get("stressResponse")
        base["persona.nationalPrevalence"] = persona.get("nationalPrevalence")

    narratives = enriched.get("narratives")
    if narratives:
        for doc in narratives:
            doc_type = doc.get("type", "unknown")
            metadata = doc.get("metadata", {})
            base[f"narrative.{doc_type}.wordCount"] = metadata.get("wordCount")
            base[f"narrative.{doc_type}.language"] = doc.get("language")

    return base


def format_profiles(profiles, fmt="json"):
    """
    Format a list of demographic profiles into a string.

    :param profiles: List of profile dicts (standard or enriched).
    :param fmt: Output format — 'json', 'jsonl', or 'csv'.
    :returns: Formatted string dataset.
    """
    fmt = fmt.lower()

    if fmt == "json":
        return json.dumps(profiles, indent=2, ensure_ascii=False)

    if fmt == "jsonl":
        if len(profiles) == 0:
            return ""
        return "\n".join(json.dumps(p, ensure_ascii=False) for p in profiles) + "\n"

    if fmt == "csv":
        if len(profiles) == 0:
            return ""

        is_enriched = "profile" in profiles[0] or "outcomes" in profiles[0]
        flat_profiles = [_flatten_enriched(p) if is_enriched else _flatten_object(p) for p in profiles]

        headers = list(flat_profiles[0].keys())
        header_row = ",".join(_escape_csv_value(h) for h in headers)
        data_rows = [
            ",".join(_escape_csv_value(flat.get(h)) for h in headers)
            for flat in flat_profiles
        ]
        return "\n".join([header_row] + data_rows) + "\n"

    raise ValueError(f"Unsupported format: {fmt}. Supported formats are: json, jsonl, csv.")


def save_profiles(profiles, filepath, fmt="json"):
    """
    Save generated profiles to a file.

    :param profiles: List of profile dicts (standard or enriched).
    :param filepath: Path to the output file.
    :param fmt: Output format — 'json', 'jsonl', or 'csv'.
    """
    content = format_profiles(profiles, fmt)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
