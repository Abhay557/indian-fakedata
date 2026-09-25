"""
Grounded QA Pair Builder (v2.1.0, item 8)

Mirrors the TypeScript implementation (src/utils/qa.ts): turns a profile
into question/answer pairs for retrieval and reading-comprehension
evaluation. Every answer is templated strictly from profile fields, and
each pair carries ``citations``: the exact field paths the answer was
built from.

Pure functions, no RNG: output is fully determined by the input.
"""


def _inr(n):
    # Indian digit grouping to match toLocaleString('en-IN'): 1,02,900
    digits = str(round(n))
    if len(digits) <= 3:
        return "\u20b9" + digits
    head, tail = digits[:-3], digits[-3:]
    groups = []
    while len(head) > 2:
        groups.insert(0, head[-2:])
        head = head[:-2]
    if head:
        groups.insert(0, head)
    return "\u20b9" + ",".join(groups) + "," + tail


def build_qa_pairs(profile):
    """
    Build grounded QA pairs for one profile. Skips questions whose fields
    are absent, so old or stripped profiles simply yield fewer pairs.
    """
    p = profile
    name = "{} {}".format(p.get("firstName", ""), p.get("lastName", ""))
    first = p.get("firstName", "")
    marital = p.get("maritalStatus", "never_married")
    n_kids = p.get("numberOfChildren", 0)
    second = p.get("secondLanguage")

    pairs = [
        {
            "question": "What is the full name of the person from {}?".format(
                p.get("district", "")),
            "answer": "The person from {} is {}.".format(
                p.get("district", ""), name),
            "citations": ["firstName", "lastName", "district"],
            "source": "profile",
        },
        {
            "question": "How old is {} and where do they live?".format(first),
            "answer": "{} is {} years old and lives in {}, {}.".format(
                first, p.get("age", 0), p.get("district", ""), p.get("state", "")),
            "citations": ["firstName", "age", "district", "state"],
            "source": "profile",
        },
        {
            "question": "What does {} do for a living and what do they earn?".format(first),
            "answer": ("{} works as a {} and earns about {} a month ({} a year).".format(
                first, p.get("employmentSector", ""),
                _inr(p.get("annualIncomeINR", 0) / 12),
                _inr(p.get("annualIncomeINR", 0)))),
            "citations": ["firstName", "employmentSector", "annualIncomeINR"],
            "source": "profile",
        },
        {
            "question": "What is {}'s education and which languages do they speak?".format(first),
            "answer": ("{}'s highest education is {} and they speak {}{}.".format(
                first, str(p.get("education", "")).replace("_", " "),
                p.get("motherTongue", ""),
                " and {}".format(second) if second else "")),
            "citations": (["firstName", "education", "motherTongue", "secondLanguage"]
                          if second else ["firstName", "education", "motherTongue"]),
            "source": "profile",
        },
        {
            "question": "Describe {}'s family situation.".format(first),
            "answer": ("{} is married with {} {} in a household of {}.".format(
                first, n_kids, "child" if n_kids == 1 else "children",
                p.get("householdSize", 0)) if marital == "married" else
                "{} is {} with {} {}, living in a household of {}.".format(
                first, str(marital).replace("_", " "), n_kids,
                "child" if n_kids == 1 else "children",
                p.get("householdSize", 0))),
            "citations": ["firstName", "maritalStatus", "numberOfChildren", "householdSize"],
            "source": "profile",
        },
    ]

    appearance = p.get("appearance") or {}
    pairs.append({
        "question": "What does {} look like?".format(first),
        "answer": ("{} has {} skin, {} {} hair and an {} build, "
                   "and is {} cm tall.".format(
                       first, appearance.get("skinTone", ""),
                       appearance.get("hairColor", ""), appearance.get("hairTexture", ""),
                       appearance.get("build", ""), p.get("heightCm", ""))),
        "citations": ["firstName", "appearance.skinTone", "appearance.hairColor",
                      "appearance.hairTexture", "appearance.build", "heightCm"],
        "source": "profile",
    })

    timeline = p.get("employmentTimeline") or []
    if timeline:
        current = timeline[-1]
        pairs.append({
            "question": "What is {}'s most recent job?".format(first),
            "answer": "{}'s most recent job is {}, started in {}.".format(
                first, current.get("jobTitle", ""), current.get("startYear", "")),
            "citations": ["firstName", "employmentTimeline"],
            "source": "profile",
        })

    skills = p.get("skills") or {}
    languages = skills.get("languages") or []
    if languages:
        pairs.append({
            "question": "Which languages does {} speak and how well?".format(first),
            "answer": "{} speaks {}.".format(
                first, ", ".join("{} ({})".format(l.get("language", ""),
                                                  l.get("speaking", ""))
                                     for l in languages)),
            "citations": ["firstName", "skills"],
            "source": "profile",
        })

    geo = p.get("geo")
    if geo:
        pairs.append({
            "question": "Where on the map does {} live?".format(first),
            "answer": "{} lives near {}, {} in {}, {}.".format(
                first, geo.get("latitude", ""), geo.get("longitude", ""),
                p.get("district", ""), p.get("state", "")),
            "citations": ["firstName", "geo", "district", "state"],
            "source": "profile",
        })

    festivals = p.get("festivals") or []
    if festivals:
        pairs.append({
            "question": "Which festival does {} celebrate first this year?".format(first),
            "answer": "{} celebrates {} on {}.".format(
                first, festivals[0].get("name", ""), festivals[0].get("date", "")),
            "citations": ["firstName", "festivals"],
            "source": "profile",
        })

    economy = p.get("householdEconomy")
    if economy:
        history = economy.get("creditHistory", {})
        pairs.append({
            "question": "What is {}'s credit score band?".format(first),
            "answer": "{}'s credit score is {}, with {} missed payments "
                     "in the last 12 months.".format(
                         first, history.get("score", ""),
                         history.get("missedPayments12m", "")),
            "citations": ["firstName", "householdEconomy"],
            "source": "profile",
        })

    married = next((e for e in p.get("lifeEvents") or []
                    if e.get("event") == "married"), None)
    if married:
        pairs.append({
            "question": "When did {} get married?".format(first),
            "answer": "{} got married in {}.".format(first, married.get("year", "")),
            "citations": ["firstName", "lifeEvents"],
            "source": "profile",
        })

    return pairs
