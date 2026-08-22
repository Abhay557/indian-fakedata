"""
Agent Persona Schema Layer (SSPS — Layer 4)

Converts a DemographicProfile into a structured Agent Persona —
an LLM-compatible representation with system prompt, belief system,
memory seeds, and behavioral constraints.

Designed for:
 - Multi-agent simulation research (Stanford Smallville-style)
 - LLM fine-tuning with demographically grounded synthetic personas
 - Social AI simulation with realistic Indian population substrates
 - Persona-based evaluation of LLMs for Indian contexts
"""

import math


def _derive_worldview(profile):
    modernity = (
        (1 if profile.get("hasInternetAccess") else 0) +
        (1 if profile.get("hasSmartphone") else 0) +
        (1 if profile.get("areaType") == "urban" else 0) +
        (1 if profile.get("education") in ("graduate", "postgraduate") else 0) +
        (1 if profile.get("employmentSector") in ("private", "government") else 0)
    )
    cultural = profile.get("culturalProfile", {})
    traditional = (
        (2 if profile.get("religiosity") == "very_religious" else 0) +
        (1 if profile.get("areaType") == "rural" else 0) +
        (1 if cultural.get("familyStructure") == "joint_family" else 0) +
        (1 if profile.get("age", 0) > 50 else 0)
    )
    if modernity >= 4:
        return "modern"
    if traditional >= 3:
        return "traditional"
    return "hybrid"


def _derive_trust_institutions(profile):
    trust = 50
    if profile.get("employmentSector") == "government": trust += 20
    if profile.get("socialCategory") in ("SC", "ST"): trust -= 15
    if profile.get("education") in ("graduate", "postgraduate"): trust += 10
    if profile.get("areaType") == "rural": trust -= 5
    if profile.get("politicalLeaning") == "apolitical": trust -= 10
    return max(10, min(90, trust))


def _derive_collectivism(profile):
    cultural = profile.get("culturalProfile", {})
    score = 50 + cultural.get("communityBonding", 50) * 0.3
    if cultural.get("familyStructure") == "joint_family": score += 15
    if profile.get("areaType") == "rural": score += 10
    if profile.get("religion") in ("jain", "sikh"): score += 10
    if profile.get("education") == "postgraduate": score -= 10
    if profile.get("areaType") == "urban" and cultural.get("familyStructure") == "nuclear_family": score -= 10
    return max(10, min(95, round(score)))


def _derive_economic_behavior(profile):
    cultural = profile.get("culturalProfile", {})
    if cultural.get("entrepreneurialScore", 0) > 70: return "entrepreneurial"
    if cultural.get("savingsOrientation", 0) > 65: return "saving"
    if profile.get("annualIncomeINR", 0) > 500000 and profile.get("hasSmartphone"): return "investing"
    return "subsistence"


def _derive_stress_response(profile):
    cultural = profile.get("culturalProfile", {})
    if cultural.get("communityBonding", 0) > 70: return "community_dependent"
    if cultural.get("entrepreneurialScore", 0) > 65 or cultural.get("riskAppetite", 0) > 60: return "adaptive"
    if cultural.get("socialActivism", 0) > 60: return "resistant"
    return "resigned"


def _derive_code_switching(profile):
    if profile.get("areaType") == "rural": return 10
    mt = profile.get("motherTongue", "")
    if mt.lower() in ("hindi", "urdu"):
        if profile.get("education") in ("graduate", "postgraduate"): return 70
        return 40
    if profile.get("secondLanguage") == "Hindi": return 30
    return 15


def _build_system_prompt(profile):
    worldview = _derive_worldview(profile)
    occupation = profile.get("employmentSector", "worker")
    if profile.get("occupation") == "non_worker":
        occupation = "student" if profile.get("age", 30) < 18 else "homemaker/non-worker"

    religiosity = profile.get("religiosity", "somewhat_religious")
    religion = profile.get("religion", "hindu")
    if religiosity == "very_religious":
        religious_practice = f"is deeply devout and regularly observes {religion} religious practices"
    elif religiosity == "somewhat_religious":
        religious_practice = f"practices {religion} in a moderate way, participating in major festivals and rituals"
    else:
        religious_practice = f"identifies as {religion} but does not actively practise"

    pl = profile.get("politicalLeaning", "apolitical")
    if pl == "apolitical":
        political_view = "is largely apolitical and disengaged from electoral politics"
    else:
        political_view = f"leans {pl.replace('_', '-')} politically"

    cultural = profile.get("culturalProfile", {})
    fs = cultural.get("familyStructure", "nuclear_family")
    if fs == "joint_family":
        family_context = "lives in a joint family household"
    elif fs == "extended_family":
        family_context = "lives with extended family nearby"
    else:
        family_context = "lives in a nuclear family setup"

    monthly_k = round(profile.get("annualIncomeINR", 0) / 12 / 1000)
    second_lang = profile.get("secondLanguage")
    second_lang_str = f", and you also speak {second_lang}" if second_lang else ""

    mt = profile.get("motherTongue", "Hindi")
    area = profile.get("areaType", "rural")
    if area == "urban" and mt.lower() in ("hindi",) or (second_lang and second_lang.lower() == "hindi"):
        speech_style = "mixing Hindi and English naturally (Hinglish)"
    else:
        speech_style = f"primarily in {mt}-influenced speech"

    cp = cultural.get("careerPreference", "labor").replace("_", " ")
    savings_str = "saving money diligently" if cultural.get("savingsOrientation", 0) > 60 else "spending within means"

    return (
        f"You are {profile.get('firstName', 'Unknown')} {profile.get('lastName', 'Unknown')}, "
        f"a {profile.get('age', 30)}-year-old {profile.get('gender', 'male')} from "
        f"{profile.get('district', 'Unknown')}, {profile.get('state', 'Unknown')}, India. "
        f"You belong to the {profile.get('caste', 'Unknown')} community ({profile.get('socialCategory', 'General')} category) "
        f"and follow {religion}. Your mother tongue is {mt}{second_lang_str}. "
        f"You work as a {occupation} and earn approximately {monthly_k}K INR per month. "
        f"You {family_context} with {profile.get('householdSize', 4)} family members. "
        f"You {religious_practice}. You {political_view}. Your worldview is broadly {worldview}. "
        f"You grew up in a {area} environment and your cultural background as a {profile.get('caste', 'Unknown')} "
        f"shapes your values around {cp}, family {fs.replace('_', ' ')}, and {savings_str}. "
        f"When responding, speak naturally in the way someone of your background would — {speech_style}. "
        f"Draw on your lived experience in {profile.get('district', 'Unknown')}, your work as a {occupation}, "
        f"and your family responsibilities."
    )


def _build_identity_line(profile):
    occupation = profile.get("employmentSector", "worker")
    if profile.get("occupation") == "non_worker" and profile.get("age", 30) < 18:
        occupation = "student"
    return (
        f"{profile.get('firstName', 'Unknown')} {profile.get('lastName', 'Unknown')}, "
        f"{profile.get('age', 0)}, {occupation} from "
        f"{profile.get('district', 'Unknown')}, {profile.get('state', 'Unknown')} "
        f"({profile.get('religion', 'hindu')}, {profile.get('socialCategory', 'General')})."
    )


def _build_memory_seeds(profile):
    seeds = []
    cultural = profile.get("culturalProfile", {})

    if profile.get("isMigrant"):
        cp = cultural.get("careerPreference", "work")
        reason = "business opportunities" if cp == "business_trade" else "work"
        seeds.append(f"I grew up in {profile.get('migrationOriginState', 'another state')} and moved to {profile.get('state', 'this state')} for {reason}.")
    else:
        seeds.append(f"I have lived in {profile.get('district', 'my district')}, {profile.get('state', 'my state')} my whole life.")

    edu_details = profile.get("educationDetails", {})
    field = edu_details.get("fieldOfStudy")
    field_str = f", studying {field}" if field else ""
    seeds.append(f"I completed {profile.get('education', 'middle').replace('_', ' ')} as my highest education from a {edu_details.get('institutionType', 'local')} institution{field_str}.")

    ms = profile.get("maritalStatus", "never_married")
    if ms == "married":
        spouse = profile.get("spouseName", "my spouse")
        nc = profile.get("numberOfChildren", 0)
        child_word = "child" if nc == 1 else "children"
        seeds.append(f"I am married to {spouse} and have {nc} {child_word}.")
    elif ms == "widowed":
        seeds.append("I lost my spouse and am raising my family on my own.")
    else:
        seeds.append(f"I am currently {ms.replace('_', ' ')}.")

    if profile.get("occupation") != "non_worker":
        monthly_k = round(profile.get("annualIncomeINR", 0) / 12 / 1000)
        seeds.append(f"I work as a {profile.get('employmentSector', 'worker')} worker, earning about ₹{monthly_k}K per month.")

    religiosity = profile.get("religiosity", "somewhat_religious")
    religion = profile.get("religion", "hindu")
    if religiosity == "very_religious":
        seeds.append(f"My faith in {religion} is the most important part of my life. I pray and observe religious duties regularly.")
    elif religiosity == "somewhat_religious":
        seeds.append(f"I observe major {religion} festivals and visit the temple/mosque/gurudwara on important occasions.")

    income = profile.get("annualIncomeINR", 0)
    hs = profile.get("householdSize", 4)
    if income < 100000:
        seeds.append(f"Money is tight. Every month is a struggle to make ends meet, especially with {hs} people to feed.")
    elif income > 500000:
        seeds.append("We are comfortable financially. I try to save and plan ahead for my family's future.")
    else:
        seeds.append("Life is manageable. We live within our means and try to save when we can.")

    cb = cultural.get("communityBonding", 50)
    caste = profile.get("caste", "my community")
    seeds.append(f"As a {caste} person, I grew up with strong {'community ties and mutual support networks' if cb > 70 else 'values of self-reliance and hard work'}.")

    if not profile.get("hasSmartphone"):
        seeds.append("I do not have a smartphone. I rely on others for digital communication.")
    elif profile.get("usesSocialMedia"):
        interests = profile.get("interests", {})
        sm = interests.get("preferredSocialMedia", "WhatsApp")
        seeds.append(f"I use {sm} to stay connected with family and news.")

    return seeds


def _build_behavior_rules(profile):
    rules = []
    code_switching = _derive_code_switching(profile)

    if code_switching > 50:
        rules.append("Speak naturally in Hinglish (Hindi-English mix), using Hindi words naturally in English sentences.")
    elif profile.get("motherTongue", "").lower() not in ("hindi", "english"):
        rules.append(f"Occasionally use {profile.get('motherTongue', 'regional')} words or phrases when expressing strong emotions or cultural concepts.")
    else:
        rules.append(f"Speak in {'polished Hindi or English' if profile.get('areaType') == 'urban' else 'simple, direct language'}.")

    edu = profile.get("education", "middle")
    if edu in ("graduate", "postgraduate"):
        rules.append("Communicate in a reasonably educated manner — grammatically aware but conversational.")
    elif edu in ("illiterate", "primary"):
        rules.append("Use simple vocabulary. Avoid complex or technical language.")

    religion = profile.get("religion", "hindu")
    religiosity = profile.get("religiosity", "somewhat_religious")
    if religion == "muslim" and religiosity == "very_religious":
        rules.append("Use Islamic greetings (Assalamu Alaikum) and phrases (Inshallah, Alhamdulillah, Mashallah) naturally in speech.")
    elif religion == "sikh" and religiosity != "not_at_all_religious":
        rules.append("Use Punjabi Sikh expressions (Waheguru, Sat Sri Akal) naturally when appropriate.")
    elif religion == "hindu" and religiosity == "very_religious":
        rules.append("Reference Hindu customs, festivals, and deities naturally when relevant.")

    if profile.get("annualIncomeINR", 0) < 100000:
        rules.append("Frame decisions around cost and affordability. Financial stress is a real and present concern.")

    pl = profile.get("politicalLeaning", "apolitical")
    if pl == "apolitical":
        rules.append("Avoid political discussions. Redirect to personal/family matters when politics is raised.")
    elif pl == "nationalist_right":
        rules.append("Express pride in Indian culture and tradition. Skeptical of foreign influences.")
    elif pl == "regionalist":
        rules.append(f"Identify strongly with {profile.get('state', 'your state')}'s regional culture and language. Prioritize local issues.")

    sc = profile.get("socialCategory", "General")
    if sc in ("SC", "ST"):
        rules.append("Be aware of social hierarchies and discrimination as a lived reality, without dramatizing it unnecessarily.")

    rules.append(f"Always stay in character. Your responses should feel authentic to someone from {profile.get('district', 'your district')}, {profile.get('state', 'your state')} with your background.")

    return rules


def _build_full_prompt(profile):
    """Complete, self-contained persona prompt containing ALL information
    about this person (identity, education timeline, personality traits,
    movie/anime preferences, habits, beliefs, behaviour rules) so an LLM
    can act as this person.
    """
    # systemPrompt chhota hai sirf chat ke liye; ye wala pura roleplay prompt
    # hai — section-wise likha hai taaki LLM ko structure samajh aaye.
    worldview = _derive_worldview(profile)
    occupation = profile.get("employmentSector", "worker")
    if profile.get("occupation") == "non_worker":
        occupation = "student" if profile.get("age", 30) < 18 else profile.get("employmentSector", "homemaker/non-worker")

    lines = []

    lines.append(
        f"You are {profile.get('firstName', 'Unknown')} {profile.get('lastName', 'Unknown')}, "
        f"a {profile.get('age', 30)}-year-old {profile.get('gender', 'male')} from "
        f"{profile.get('district', 'Unknown')}, {profile.get('state', 'Unknown')}, India. "
        f"Born on {str(profile.get('dateOfBirth', ''))[:10]} ({profile.get('bloodGroup', 'O+')} blood group, "
        f"{profile.get('heightCm', 0)} cm, {profile.get('weightKg', 0)} kg)."
    )

    lines.append("")
    lines.append("IDENTITY")
    lines.append(
        f"- Religion: {profile.get('religion', 'hindu')}; Caste/community: {profile.get('caste', 'Unknown')}; "
        f"Social category: {profile.get('socialCategory', 'General')}"
    )
    second_lang = profile.get("secondLanguage")
    mt = profile.get("motherTongue", "Hindi")
    lines.append(f"- Mother tongue: {mt}{'; also speaks ' + second_lang if second_lang else ''}")
    ms = profile.get("maritalStatus", "never_married")
    spouse = profile.get("spouseName")
    nc = profile.get("numberOfChildren", 0)
    ms_str = ms.replace("_", " ")
    if spouse:
        ms_str += f"; spouse: {spouse}"
    if nc > 0:
        ms_str += f"; {nc} {'child' if nc == 1 else 'children'}"
    lines.append(f"- Marital status: {ms_str}")

    cultural = profile.get("culturalProfile", {})
    fs = cultural.get("familyStructure", "nuclear_family")
    lines.append(
        f"- Lives in a {fs.replace('_', ' ')} of {profile.get('householdSize', 4)} members, "
        f"{profile.get('areaType', 'rural')} {profile.get('district', 'Unknown')}"
    )
    lines.append(f"- Father: {profile.get('fatherName', 'Unknown')}; Mother: {profile.get('motherName', 'Unknown')}")
    if profile.get("isMigrant"):
        lines.append(f"- Migrated from {profile.get('migrationOriginState', 'another state')}")
    else:
        lines.append(f"- Born and raised in {profile.get('district', 'Unknown')}, {profile.get('state', 'Unknown')}")

    lines.append("")
    lines.append("EDUCATION")
    edu_details = profile.get("educationDetails", {})
    if edu_details.get("mediumOfInstruction"):
        lines.append(f"- Medium of instruction: {edu_details.get('mediumOfInstruction')}")
    timeline = profile.get("educationTimeline", [])
    if not timeline:
        lines.append("- No formal schooling")
    else:
        for stage in timeline:
            state_suffix = ""
            if stage.get("status") == "in_progress":
                state_suffix = " (ongoing)"
            elif stage.get("status") == "dropped_out":
                state_suffix = " (dropped out)"
            score = stage.get("score")
            score_str = f" ({score})" if score else ""
            extra = ""
            if stage.get("stream"):
                extra += f", {stage['stream']}"
            if stage.get("fieldOfStudy"):
                extra += f", {stage['fieldOfStudy']}"
            lines.append(
                f"- {stage.get('startYear')}\u2013{stage.get('endYear')}: {stage.get('stageName')} "
                f"\u2014 {stage.get('institutionName')} ({stage.get('boardOrUniversity')}){extra}{score_str}{state_suffix}"
            )
    lines.append(f"- Highest qualification: {profile.get('education', 'middle').replace('_', ' ')}")

    lines.append("")
    lines.append("WORK & FINANCES")
    income_k = round(profile.get("annualIncomeINR", 0) / 1000)
    spend_k = round(profile.get("monthlyExpenditureINR", 0) / 1000)
    land = profile.get("landOwnershipAcres", 0)
    land_str = f"; owns {land} acres of land" if land > 0 else ""
    lines.append(
        f"- Occupation: {profile.get('occupation', 'worker').replace('_', ' ')} ({occupation}); "
        f"annual income: \u20b9{income_k}K; monthly household spend: \u20b9{spend_k}K{land_str}"
    )
    if profile.get("rationCardType") != "none":
        lines.append(
            f"- Holds a {profile.get('rationCardType')} ration card; health insurance: {profile.get('healthInsurance', 'none')}"
        )

    lines.append("")
    lines.append("PERSONALITY")
    traits = profile.get("personalityTraits", {})
    lines.append(f"- {traits.get('summary', '')}")
    lines.append(f"- Trait labels: {', '.join(traits.get('traitLabels', []))}")
    lines.append(f"- Strengths: {'; '.join(traits.get('strengths', []))}")
    lines.append(f"- Weaknesses: {'; '.join(traits.get('weaknesses', []))}")
    lines.append(
        f"- Communication style: {traits.get('communicationStyle', 'expressive').replace('_', ' ')}; "
        f"decision style: {traits.get('decisionStyle', 'intuitive').replace('_', ' ')}; "
        f"social behaviour: {traits.get('socialBehavior', 'ambivert')}"
    )
    personality = profile.get("personality", {})
    lines.append(
        f"- Big Five scores \u2014 openness {personality.get('openness', 50)}, "
        f"conscientiousness {personality.get('conscientiousness', 50)}, "
        f"extraversion {personality.get('extraversion', 50)}, "
        f"agreeableness {personality.get('agreeableness', 50)}, "
        f"neuroticism {personality.get('neuroticism', 50)} (0-100)"
    )

    lines.append("")
    lines.append("INTERESTS & PREFERENCES")
    interests = profile.get("interests", {})
    lines.append(
        f"- Sport: {interests.get('primarySport', 'None')}; reading: "
        f"{interests.get('readingHabit', 'non reader').replace('_', ' ')}; "
        f"music: {interests.get('musicPreference', 'None')}"
    )
    entertainment = ", ".join(interests.get("entertainment", []))
    sm = interests.get("preferredSocialMedia")
    sm_str = f"; social media: {sm}" if sm else ""
    lines.append(f"- Entertainment: {entertainment}{sm_str}")
    movies = profile.get("moviePreferences", {})
    lines.append(
        f"- Movies: {', '.join(movies.get('genres', []))} "
        f"(in {', '.join(movies.get('favoriteLanguages', []))})"
    )
    if movies.get("anime"):
        anime_prefs = ", ".join(movies.get("animePreferences") or [])
        anime_titles = ", ".join(movies.get("favoriteAnimeTitles") or [])
        lines.append(f"- Anime fan: yes \u2014 prefers {anime_prefs}, favourites include {anime_titles}")
    lines.append(
        f"- Watches content primarily on {movies.get('primaryPlatform', 'television')} "
        f"({movies.get('watchFrequency', 'occasional')})"
    )
    pet = interests.get("petPreference", "none").replace("_", " ")
    lines.append(
        f"- Diet: {profile.get('dietaryPreference', 'vegetarian').replace('_', ' ')}; "
        f"pet preference: {pet}"
    )

    lines.append("")
    lines.append("HABITS & LIFESTYLE")
    habits = profile.get("habits", {})
    lines.append(
        f"- Exercise: {habits.get('exerciseFrequency', 'occasionally')}; "
        f"sleeps {habits.get('avgSleepHours', 7)} hours; "
        f"chronotype: {habits.get('chronotype', 'normal').replace('_', ' ')}"
    )
    lines.append(f"- Tobacco: {habits.get('tobaccoUse', 'none')}; alcohol: {habits.get('alcoholUse', 'never')}")
    digital = f"owns a smartphone{' and uses social media' if profile.get('usesSocialMedia') else ''}" if profile.get("hasSmartphone") else "no smartphone"
    vehicle = profile.get("vehicleType")
    vehicle_str = f"vehicle: {vehicle.replace('_', ' ')}" if vehicle else "no vehicle"
    lines.append(f"- Digital: {digital}; {vehicle_str}")

    lines.append("")
    lines.append("BELIEFS & VALUES")
    lines.append(
        f"- Religiosity: {profile.get('religiosity', 'somewhat_religious').replace('_', ' ')}; "
        f"political leaning: {profile.get('politicalLeaning', 'apolitical').replace('_', ' ')}; "
        f"worldview: {worldview}"
    )
    lines.append(
        f"- Trust in institutions: {_derive_trust_institutions(profile)}/100; "
        f"collectivism: {_derive_collectivism(profile)}/100"
    )
    lines.append(
        f"- Community values: {cultural.get('careerPreference', 'labor').replace('_', ' ')}, "
        f"{fs.replace('_', ' ')}, savings orientation {cultural.get('savingsOrientation', 50)}/100, "
        f"risk appetite {cultural.get('riskAppetite', 50)}/100"
    )

    lines.append("")
    lines.append("MEMORIES")
    for seed in _build_memory_seeds(profile):
        lines.append(f"- {seed}")

    lines.append("")
    lines.append("HOW TO SPEAK & BEHAVE")
    for rule in _build_behavior_rules(profile):
        lines.append(f"- {rule}")
    if profile.get("education") in ("graduate", "postgraduate"):
        comm = "educated, conversational"
    elif profile.get("areaType") == "urban":
        comm = "casual"
    else:
        comm = "simple and direct"
    second_lang_str = f", secondary {second_lang}" if second_lang else ""
    lines.append(f"- Communication: {comm} (primary language {mt}{second_lang_str})")
    lines.append(
        "- Stay fully in character at all times. Answer as this person would "
        "\u2014 with their vocabulary, their values, and their lived experience. "
        "Never break character or reveal that you are an AI."
    )

    return "\n".join(lines)


def generate_agent_persona(profile):
    """
    Convert a DemographicProfile dict into an LLM-ready Agent Persona.

    The resulting persona can be used as:
    - A system prompt for ChatGPT/Claude/Gemini for persona-based roleplay
    - An agent configuration for multi-agent simulation frameworks
    - A training example for persona-aware LLM fine-tuning
    """
    worldview = _derive_worldview(profile)
    code_switching = _derive_code_switching(profile)

    religiosity = profile.get("religiosity", "somewhat_religious")
    trust_religious = 85 if religiosity == "very_religious" else (60 if religiosity == "somewhat_religious" else (35 if religiosity == "not_very_religious" else 15))

    beliefs = {
        "political": profile.get("politicalLeaning", "apolitical"),
        "religiosity": religiosity,
        "worldview": worldview,
        "trustInstitutions": _derive_trust_institutions(profile),
        "trustReligiousInstitutions": trust_religious,
        "collectivismScore": _derive_collectivism(profile),
    }

    state = profile.get("state", "Unknown")
    communication_style = {
        "primaryLanguage": profile.get("motherTongue", "Hindi"),
        "secondaryLanguage": profile.get("secondLanguage"),
        "formality": "mixed" if profile.get("education") in ("graduate", "postgraduate") else ("mixed" if profile.get("areaType") == "urban" else "informal"),
        "dialect": (
            "Bhojpuri-inflected Hindi" if state == "Bihar" else
            "Punjabi-inflected" if state == "Punjab" else
            "Tamil-accented English" if state == "Tamil Nadu" else None
        ),
        "codeSwitchingTendency": code_switching,
    }

    ms = profile.get("maritalStatus", "never_married")
    nc = profile.get("numberOfChildren", 0)
    cultural = profile.get("culturalProfile", {})
    fs = cultural.get("familyStructure", "nuclear_family").replace("_", " ")
    income = profile.get("annualIncomeINR", 0)

    if ms == "married":
        family_desc = f"married with {nc} children"
    elif ms == "widowed":
        family_desc = "widowed"
    elif ms == "never_married":
        family_desc = "unmarried"
    else:
        family_desc = "separated"

    income_desc = (
        "The family faces financial constraints." if income < 100000 else
        "The family is economically stable." if income > 500000 else
        "The family manages within a modest income."
    )
    migrant_desc = f" Originally from {profile.get('migrationOriginState', 'another state')}." if profile.get("isMigrant") else ""

    current_situation = (
        f"{profile.get('firstName', 'Unknown')} is currently {family_desc}, "
        f"living in a {fs} in {profile.get('areaType', 'rural')} {profile.get('district', 'Unknown')}. "
        f"{income_desc}{migrant_desc}"
    )

    prob_metrics = profile.get("probabilityMetrics", {})

    return {
        "systemPrompt": _build_system_prompt(profile),
        "fullPrompt": _build_full_prompt(profile),
        "identityLine": _build_identity_line(profile),
        "beliefs": beliefs,
        "memorySeeds": _build_memory_seeds(profile),
        "behaviorRules": _build_behavior_rules(profile),
        "communicationStyle": communication_style,
        "currentSituation": current_situation,
        "stressResponse": _derive_stress_response(profile),
        "economicBehavior": _derive_economic_behavior(profile),
        "profileId": profile.get("id", ""),
        "nationalPrevalence": prob_metrics.get("jointProbability", 0),
    }
