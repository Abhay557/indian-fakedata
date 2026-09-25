"""
SFT Pair Builder (v2.1.0, item 7)

Mirrors the TypeScript implementation (src/utils/sft.ts): turns a
profile (and optionally its narrative documents) into instruction /
response pairs for supervised fine-tuning, in Alpaca style:
{"instruction", "input", "output", "source"}. Every response is
templated strictly from profile fields, so pairs are grounded by
construction — nothing is hallucinated.

Pure functions, no RNG: output is fully determined by the inputs.
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


def _persona_pairs(profile):
    name = "{} {}".format(profile.get("firstName", ""), profile.get("lastName", ""))
    first = profile.get("firstName", "")
    marital = profile.get("maritalStatus", "never_married")
    if marital == "married":
        n_kids = profile.get("numberOfChildren", 0)
        family = ("I am married to {} and have {} {}. ".format(
            profile.get("spouseName") or "my spouse", n_kids,
            "child" if n_kids == 1 else "children") +
            "We live in {} {}.".format(profile.get("areaType", ""),
                                       profile.get("district", "")))
    else:
        family = ("I am currently {} and live in {} {} with {} family members.".format(
            str(marital).replace("_", " "), profile.get("areaType", ""),
            profile.get("district", ""), profile.get("householdSize", 0)))
    second = profile.get("secondLanguage")
    cultural = profile.get("culturalProfile", {})
    return [
        {
            "instruction": "You are {}. Introduce yourself in the first person.".format(name),
            "input": "",
            "output": ("My name is {}. I am a {}-year-old {} from {}, {}. "
                       "I work as a {} and my mother tongue is {}.".format(
                           name, profile.get("age", 0), profile.get("gender", ""),
                           profile.get("district", ""), profile.get("state", ""),
                           profile.get("employmentSector", ""),
                           profile.get("motherTongue", ""))),
            "source": "persona",
        },
        {
            "instruction": "As {}, describe what you do for a living.".format(first),
            "input": "",
            "output": ("I work as a {} and earn about {} a month to support "
                       "my household of {}.".format(
                           profile.get("employmentSector", ""),
                           _inr(profile.get("annualIncomeINR", 0) / 12),
                           profile.get("householdSize", 0))),
            "source": "persona",
        },
        {
            "instruction": "As {}, describe your family.".format(first),
            "input": "",
            "output": family,
            "source": "persona",
        },
        {
            "instruction": "As {}, talk about your education and languages.".format(first),
            "input": "",
            "output": ("My highest education is {}. I speak {}{}.".format(
                str(profile.get("education", "")).replace("_", " "),
                profile.get("motherTongue", ""),
                " and {}".format(second) if second else "")),
            "source": "persona",
        },
        {
            "instruction": "As {}, how do you handle household money?".format(first),
            "input": "",
            "output": ("Our household spends about {} a month. I {}.".format(
                _inr(profile.get("monthlyExpenditureINR", 0)),
                "save money diligently" if cultural.get("savingsOrientation", 0) > 60
                else "spend within our means")),
            "source": "persona",
        },
    ]


def _narrative_qa(doc_type):
    makers = {
        "loan_application": (
            "Who is this loan application from, and which bank is it addressed to?",
            lambda p: ("It is a personal loan application from {} {} of {}, "
                       "addressed to {}.".format(
                           p.get("firstName", ""), p.get("lastName", ""),
                           p.get("district", ""), p.get("bankName", "")))),
        "medical_consultation": (
            "Who is the patient in this consultation record and where are they from?",
            lambda p: ("The patient is {} {}, a {}-year-old from {}, {}.".format(
                p.get("firstName", ""), p.get("lastName", ""), p.get("age", 0),
                p.get("district", ""), p.get("state", "")))),
        "hinglish_conversation": (
            "Who are the speakers in this chat and what language mix do they use?",
            lambda p: ("{} chats with a friend in Hinglish, mixing {} and English.".format(
                p.get("firstName", ""), p.get("motherTongue", "")))),
        "ration_card_application": (
            "Whose ration card application is this and what type is requested?",
            lambda p: ("It belongs to {} {} of {}, holding a {} card.".format(
                p.get("firstName", ""), p.get("lastName", ""),
                p.get("district", ""), p.get("rationCardType", "")))),
        "school_enrollment": (
            "Who is being enrolled and in which district?",
            lambda p: ("{} {} is being enrolled for school in {} district.".format(
                p.get("firstName", ""), p.get("lastName", ""),
                p.get("district", "")))),
        "resume": (
            "Whose resume is this and what work do they do?",
            lambda p: ("It is the resume of {} {}, working as a {}.".format(
                p.get("firstName", ""), p.get("lastName", ""),
                p.get("employmentSector", "")))),
        "customer_support_chat": (
            "Who is the customer in this support chat and which bank helps them?",
            lambda p: ("The customer is {} {}, helped by {} customer care.".format(
                p.get("firstName", ""), p.get("lastName", ""),
                p.get("bankName", "")))),
    }
    return makers.get(doc_type)


def build_sft_pairs(profile, narratives=None):
    """
    Build grounded SFT pairs for one profile, plus one
    reading-comprehension pair per narrative document when provided.
    """
    pairs = _persona_pairs(profile)
    for doc in narratives or []:
        maker = _narrative_qa(doc.get("type"))
        if not maker:
            continue
        question, answer_fn = maker
        pairs.append({"instruction": question,
                      "input": doc.get("content", ""),
                      "output": answer_fn(profile),
                      "source": doc.get("type")})
    return pairs


def sft_pairs_to_jsonl(pairs):
    """Serialize pairs as JSONL, one example per line."""
    import json
    if not pairs:
        return ""
    return "\n".join(json.dumps(p, ensure_ascii=False) for p in pairs) + "\n"
