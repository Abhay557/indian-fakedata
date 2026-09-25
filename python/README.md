# Indian Fake Data Generator (Python Edition)

A fast, zero-dependency Python library that generates culturally accurate, statistically consistent mock Indian demographic profiles backed by **Census 2011** data using attention-like context masking.

Unlike traditional mock generators that produce impossible demographic combinations (such as a *Sikh* named *Mohammed Sharma* from *Mizoram*), this library correctly links variables together so that every generated person makes logical sense based on real-world statistical correlations.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/) 
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) 
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1VWYsjM0f6CxEi7pZ6uOa1i9Hfh7tsH8s?usp=sharing)

---

## Output Sample (one profile, `seed = 7`)

```json
{
  "id": "d6e2a61e-e297-4eb4-9866-5fb355fbc2ea",
  "synthetic": true,
  "generator": "indian-fakedata@2.1.0",
  "firstName": "Sarwan",
  "lastName": "Das",
  "fatherName": "Shetan Das",
  "motherName": "Girijarani Kumari",
  "spouseName": "Kishan Das",
  "gender": "female",
  "age": 40,
  "dateOfBirth": "1986-01-05",
  "bloodGroup": "B+",
  "heightCm": 144.0,
  "weightKg": 44.1,
  "bmi": 21.3,
  "appearance": {
    "heightCm": 144.0,
    "build": "average",
    "faceShape": "round",
    "skinTone": "deep_brown",
    "noseType": "button",
    "eyeColor": "dark_brown",
    "eyeShape": "almond",
    "hairColor": "black",
    "hairTexture": "wavy",
    "hairLength": "medium",
    "facialHair": null
  },
  "aadhaarNumber": "839128189565",
  "panNumber": "FMMPD7406C",
  "voterIdNumber": "YSR0818288",
  "phoneNumber": "9444448053",
  "email": "sarwan.das645@gmail.com",
  "nativeScript": {
    "script": "Telugu",
    "language": "Telugu",
    "firstName": "సర్వన",
    "lastName": "దస",
    "district": "గుంతుర",
    "addressLine": "492/గ, జయనగర, గుంతుర"
  },
  "state": "Andhra Pradesh",
  "stateCode": "AP",
  "district": "Guntur",
  "areaType": "urban",
  "addressLine": "492/G, Jayanagar, Guntur",
  "locality": "Jayanagar",
  "pinCode": "500766",
  "geo": {
    "latitude": 15.7495,
    "longitude": 80.2038
  },
  "religion": "Hindu",
  "caste": "Madiga",
  "socialCategory": "SC",
  "motherTongue": "Telugu",
  "secondLanguage": "Hindi",
  "education": "graduate",
  "occupation": "other_worker",
  "employmentTimeline": [
    {
      "jobTitle": "Receptionist",
      "sector": "private",
      "occupation": "other_worker",
      "employerType": "private",
      "startYear": 2007,
      "status": "completed",
      "monthlyWageINR": 48000,
      "location": "Guntur",
      "endYear": 2009
    },
    {
      "jobTitle": "Sales Executive",
      "sector": "private",
      "occupation": "other_worker",
      "employerType": "private",
      "startYear": 2009,
      "status": "completed",
      "monthlyWageINR": 74200,
      "location": "Guntur",
      "endYear": 2022
    },
    {
      "jobTitle": "IT Support Executive",
      "sector": "private",
      "occupation": "other_worker",
      "employerType": "private",
      "startYear": 2022,
      "status": "current",
      "monthlyWageINR": 102900,
      "location": "Guntur"
    }
  ],
  "employmentSector": "private",
  "maritalStatus": "married",
  "annualIncomeINR": 1235000,
  "monthlyExpenditureINR": 89100,
  "numberOfChildren": 1,
  "dietaryPreference": "non_vegetarian",
  "disability": "none",
  "isMigrant": true,
  "migrationOriginState": "Karnataka",
  "bankIFSC": "KKBK0682206",
  "bankName": "Kotak Mahindra Bank",
  "bankAccountNumber": "50991831492",
  "rationCardType": "APL",
  "healthInsurance": "none",
  "landOwnershipAcres": 0,
  "vehicleRegistration": "AP 28 SF 4832",
  "vehicleType": "two_wheeler",
  "hasInternetAccess": true,
  "hasSmartphone": true,
  "usesSocialMedia": false,
  "upiId": "9444448053@apl",
  "personality": {
    "openness": 59,
    "conscientiousness": 36,
    "extraversion": 64,
    "agreeableness": 49,
    "neuroticism": 57
  },
  "personalityTraits": {
    "summary": "An outgoing, people-oriented person who is open-minded, easy-going and assertive. They feel things deeply and care about those around them.",
    "strengths": [
      "creative and curious",
      "adapts to change quickly",
      "stands their ground"
    ],
    "weaknesses": [
      "worries about small things",
      "needs company to feel energised",
      "procrastinates under pressure"
    ],
    "traitLabels": [
      "open-minded",
      "easy-going",
      "outgoing",
      "assertive",
      "sensitive"
    ],
    "communicationStyle": "expressive",
    "decisionStyle": "intuitive",
    "socialBehavior": "outgoing"
  },
  "politicalLeaning": "regionalist",
  "religiosity": "somewhat_religious",
  "cognitiveProfile": {
    "aptitudeScore": 75,
    "numeracyScore": 58,
    "literacyScore": 88,
    "digitalLiteracyScore": 84,
    "financialLiteracyScore": 75
  },
  "interests": {
    "primarySport": "hockey",
    "petPreference": "cats",
    "entertainment": [
      "Bollywood",
      "TV Serials",
      "Cricket Matches",
      "Religious Programs"
    ],
    "readingHabit": "rare",
    "musicPreference": "Bollywood",
    "preferredSocialMedia": "Facebook"
  },
  "habits": {
    "tobaccoUse": "none",
    "alcoholUse": "none",
    "exerciseFrequency": "daily",
    "avgSleepHours": 6.7,
    "cooksAtHome": true,
    "chronotype": "moderate"
  },
  "educationDetails": {
    "fieldOfStudy": "Computer Science/IT",
    "institutionType": "government",
    "mediumOfInstruction": "English",
    "qualificationYear": 2008,
    "competitiveExamPercentile": null
  },
  "educationTimeline": [
    {
      "level": "primary",
      "stageName": "Primary School",
      "institutionName": "Government Primary School, Guntur",
      "institutionType": "government",
      "boardOrUniversity": "AP State Board",
      "startYear": 1991,
      "endYear": 1997,
      "status": "completed",
      "score": "52.8%"
    },
    {
      "level": "middle",
      "stageName": "Middle School",
      "institutionName": "Government Middle School, Guntur",
      "institutionType": "government",
      "boardOrUniversity": "AP State Board",
      "startYear": 1997,
      "endYear": 2000,
      "status": "completed",
      "score": "56.7%"
    },
    {
      "level": "secondary",
      "stageName": "Secondary School",
      "institutionName": "Government High School, Guntur",
      "institutionType": "government",
      "boardOrUniversity": "AP State Board",
      "startYear": 2000,
      "endYear": 2002,
      "status": "completed",
      "score": "61.0%"
    },
    {
      "level": "higher_secondary",
      "stageName": "Higher Secondary School",
      "institutionName": "Government Higher Secondary School, Guntur",
      "institutionType": "government",
      "boardOrUniversity": "AP State Board",
      "startYear": 2002,
      "endYear": 2004,
      "status": "completed",
      "stream": "PCM",
      "score": "52.8%"
    },
    {
      "level": "graduate",
      "stageName": "Bachelor's Degree",
      "institutionName": "Government Post Graduate College, Guntur",
      "institutionType": "government",
      "boardOrUniversity": "University of Andhra Pradesh",
      "startYear": 2004,
      "endYear": 2008,
      "status": "completed",
      "fieldOfStudy": "Computer Science/IT",
      "score": "56.5%"
    }
  ],
  "moviePreferences": {
    "genres": [
      "Drama",
      "Sports drama/Biopic",
      "Family drama"
    ],
    "favoriteLanguages": [
      "Telugu",
      "Hindi"
    ],
    "anime": false,
    "animePreferences": null,
    "favoriteAnimeTitles": null,
    "primaryPlatform": "television",
    "watchFrequency": "occasional"
  },
  "culturalProfile": {
    "entrepreneurialScore": 37,
    "academicOrientation": 32,
    "artisticInclination": 40,
    "militaryTradition": 8,
    "agriculturalRootedness": 15,
    "artisanTradition": 22,
    "bureaucraticOrientation": 5,
    "socialActivism": 86,
    "communityBonding": 63,
    "migrationTendency": 38,
    "careerPreference": "teaching",
    "familyStructure": "extended_family",
    "savingsOrientation": 21,
    "riskAppetite": 15
  },
  "householdSize": 1,
  "householdAssets": {
    "hasRadioTransistor": false,
    "hasTelevision": true,
    "hasComputer": true,
    "hasPhone": true,
    "hasBicycle": false,
    "hasScooter": true,
    "hasCar": false,
    "bankingService": true,
    "treatedWaterSource": true,
    "latrineFacility": true,
    "numberOfRooms": 5,
    "roofMaterial": "metal_sheet",
    "wallMaterial": "burnt_brick",
    "cookingFuel": "lpg",
    "lightingSource": "electricity",
    "drinkingWaterSource": "handpump"
  },
  "probabilityMetrics": {
    "nationalReligionFreq": 0.803301791826052,
    "stateGivenReligionProb": 0.04704225981630054,
    "casteGivenContextProb": 0.09917355371900827,
    "lastNameGivenCasteProb": 0.2857142857142857,
    "socialCategoryProb": 0.19834710743801653,
    "educationProb": 0.14598540145985403,
    "occupationProb": 0.4087193460490463,
    "jointProbability": 6.388948194089085e-05
  },
  "generatedAt": "2026-09-25T14:39:09.030914",
  "seed": 7,
  "skills": {
    "technical": [
      "Commercial Cooking"
    ],
    "soft": [
      "Teamwork",
      "Time Management"
    ],
    "certifications": [],
    "languages": [
      {
        "language": "Telugu",
        "speaking": "native",
        "reading": "fluent",
        "writing": "fluent"
      },
      {
        "language": "Hindi",
        "speaking": "intermediate",
        "reading": "intermediate",
        "writing": "intermediate"
      },
      {
        "language": "English",
        "speaking": "intermediate",
        "reading": "intermediate",
        "writing": "intermediate"
      }
    ]
  },
  "lifeEvents": [
    {
      "year": 1986,
      "event": "born",
      "detail": "Born in Guntur."
    },
    {
      "year": 2004,
      "event": "migrated",
      "detail": "Migrated from Karnataka to Andhra Pradesh."
    },
    {
      "year": 2007,
      "event": "job_started",
      "detail": "Started working as Receptionist."
    },
    {
      "year": 2009,
      "event": "job_changed",
      "detail": "Changed job to Sales Executive."
    },
    {
      "year": 2009,
      "event": "married",
      "detail": "Married Kishan Das."
    },
    {
      "year": 2010,
      "event": "child_born",
      "detail": "Birth of child 1."
    },
    {
      "year": 2022,
      "event": "job_changed",
      "detail": "Changed job to IT Support Executive."
    }
  ],
  "householdEconomy": {
    "monthlyBudget": {
      "food": 46324,
      "housing": 19007,
      "transport": 8691,
      "education": 6372,
      "health": 8706,
      "other": 0
    },
    "loans": [],
    "creditHistory": {
      "score": 782,
      "activeLoans": 0,
      "missedPayments12m": 0,
      "oldestAccountYears": 0
    }
  },
  "festivals": [
    {
      "name": "Maha Shivaratri",
      "date": "2026-02-26",
      "religion": "Hindu",
      "regional": false
    },
    {
      "name": "Holi",
      "date": "2026-03-08",
      "religion": "Hindu",
      "regional": false
    },
    {
      "name": "Navratri",
      "date": "2026-10-03",
      "religion": "Hindu",
      "regional": false
    },
    {
      "name": "Dussehra",
      "date": "2026-10-12",
      "religion": "Hindu",
      "regional": false
    },
    {
      "name": "Diwali",
      "date": "2026-10-20",
      "religion": "Hindu",
      "regional": false
    }
  ]
}
```
---

## Installation

```bash
pip install indian-fakedata
```

Requires **Python 3.8+**.

---

## CLI Usage

The package ships with the `indian-fakedata` CLI binary.

```bash
indian-fakedata [options]
```

Run with no arguments to display the full help menu.

### Core Options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--count <n>` | `-c` | Number of profiles to generate | `100` |
| `--output <path>` | `-o` | File path to save output | stdout |
| `--format <fmt>` | `-f` | Output format: `json`, `jsonl`, `csv` | `json` |
| `--seed <value>` | `-s` | Reproducibility seed (number or string, e.g. `011`) | random |
| `--no-metrics` | | Exclude probability metrics from output | included |
| `--family` | | Generate a full household (head + spouse + parents + children + siblings) from one seed; json/jsonl only | off |
| `--help` | `-h` | Show help screen | |

### Demographic Constraints

Filter generated profiles to specific demographic slices:

| Flag | Values |
|------|--------|
| `--religion <string>` | `Hindu`, `Muslim`, `Christian`, `Sikh`, `Buddhist`, `Jain` |
| `--state <string>` | e.g. `Maharashtra`, `Tamil Nadu`, `Punjab` |
| `--gender <gender>` | `male`, `female`, `other` |
| `--caste <string>` | e.g. `Brahmin`, `Maratha`, `Jat` |
| `--socialCategory <cat>` | `SC`, `ST`, `OBC`, `General` |
| `--areaType <type>` | `urban`, `rural` |
| `--minAge <n>` | Minimum age (0–100) |
| `--maxAge <n>` | Maximum age (0–100) |
| `--education <level>` | `illiterate`, `primary`, `secondary`, `graduate`, etc. |
| `--occupation <sector>` | `cultivator`, `other_worker`, `non_worker`, etc. |
| `--maritalStatus <status>` | `never_married`, `married`, `widowed`, etc. |

### Enrichment Layers (Progressive Depth)

| Flag | Description |
|------|-------------|
| `--enrich` | Enable ALL enrichment layers (outcomes + narrative:all + persona) |
| `--outcomes` | **[Layer 2]** Add credit score, health risk, employment outcome, education attainment |
| `--bias <0-1>` | Bias dial for outcome simulation. `0.0` = pure meritocracy, `1.0` = max historical discrimination. Default: `0.3` |
| `--narrative <type>` | **[Layer 3]** Generate realistic Indian text documents. Repeat for multiple types: `loan_application`, `medical_consultation`, `school_enrollment`, `ration_card_application`, `hinglish_conversation`, `all` |
| `--persona` | **[Layer 4]** Generate LLM-ready agent persona (system prompt + full roleplay prompt, beliefs, memory seeds) |

### Quick Examples

```bash
# 1000 profiles as CSV
indian-fakedata -c 1000 -f csv -o profiles.csv

# 50K Tamil Nadu Hindus as JSONL
indian-fakedata -c 50000 -f jsonl -o tn_data.jsonl --state "Tamil Nadu" --religion Hindu

# All enrichment layers with moderate bias
indian-fakedata -c 100 --enrich --bias 0.3 -f jsonl -o enriched.jsonl

# SC community fairness audit
indian-fakedata -c 5000 --outcomes --bias 0.5 --socialCategory SC -f jsonl -o sc_bias.jsonl

# LLM training corpus (Hinglish + loan apps)
indian-fakedata -c 10000 --narrative hinglish_conversation --narrative loan_application -f jsonl -o corpus.jsonl

# Agent personas for multi-agent simulation
indian-fakedata -c 500 --persona -f jsonl -o agents.jsonl

# Single detailed profile, pretty-printed
indian-fakedata -c 1 --enrich --bias 0.0 --seed 42

# Full family from one seed
indian-fakedata --family --seed 011 -f jsonl -o family.jsonl
```

---

## Programmatic API

```python
from indian_fakedata import (
    generate,
    generate_enriched,
    generate_stream,
    generate_enriched_stream,
    simulate_outcomes,
    generate_narrative,
    generate_all_narratives,
    generate_agent_persona,
    generate_user,
    generate_users,
    generate_family,
    generate_persona,
    save_profiles_to_file,
    format_profiles
)

# 1. Basic Generation
profiles = generate(count=10)

# 2. Enriched Generation (with outcomes, bios, and LLM agent personas)
enriched = generate_enriched(count=5, include_outcomes=True, include_agent_persona=True)

# 3. Stream Generation (for large datasets)
for profile in generate_stream(count=10000):
    pass # Process one by one without memory issues

# 4. User / Family / Persona (faker-style)
user = generate_user(seed=7)                      # one profile, string seeds OK
users = generate_users(count=5, seed="011")       # many users from one seed
dev = generate_user(highly_educated=True, gender="female",
                    constraints={"state": "Karnataka"})
family = generate_family(seed="011")              # spouse, parents, children, siblings
out = generate_persona(seed="011")                # {"user": ..., "persona": ...}
out["persona"]["fullPrompt"]                      # complete roleplay prompt:
                                                  # identity, education timeline,
                                                  # personality traits, movie/anime
                                                  # preferences, habits, beliefs
```

See **[TUTORIAL.md](../TUTORIAL.md)** for full code examples in TypeScript and Python. Section 6 covers everything new in 2.0.9 with copy-paste examples.

---

## Data Sources & Real-World Accuracy

The generator is calibrated against publicly available survey data. The
bundled distributions are **approximations derived from published reports**,
not raw census tables — actual census microdata (`../team/data/*.xlsx`) is
provided for reference but is not compiled into the package at build time.

1. **Census of India 2011 (D-Series & C-Series Tables):** Reference material for religion shares, state populations, and mother tongue frequencies; distributions are hand-calibrated approximations.
2. **National Family Health Survey (NFHS-5):** Dietary preferences, BMI, blood groups, height/weight-by-age published statistics.
3. **MSME Census:** Community-level occupational sectors, vocational rates, industry divisions.
4. **UIDAI & RTO Records:** Structural syntax for Aadhaar, Voter ID, PAN, IFSC, and RTO registrations (Aadhaar uses a true Verhoeff checksum; PAN's 10th character is self-consistent but **not** the official check digit).
5. **CSDS/Lokniti Election Studies:** Political leanings and religiosity index biases.

> **Note:** All data is synthetic mock data. Names, IDs, and numbers are randomly
> generated and do not correspond to any real individuals.

### v2.0.4 data expansion

- **760 districts** across all 36 states/UTs (UP has all 75, Tamil Nadu all 38) — was 369
- **471 surnames** keyed to 48 communities (Jain, Buddhist/navayana fully covered) — was 211
- **+566 first names** for Jain (previously empty), Buddhist, Muslim and Christian pools
- **130+ anime titles**, 21 anime genres, 25 movie genres, 34 state cinema languages
- **120 urban / 60 rural locality patterns** for addresses

Because pool sizes changed, a given seed may resolve to a different person than in <= 2.0.3.
Reproducibility within one version is guaranteed.

### v2.0.5 fixes

- `generate_enriched` / `generate_enriched_stream` crashed with a `TypeError`
  when given string seeds such as `"011"` — string seeds now work everywhere,
  as documented.

### v2.0.6 — provenance markers

Every generated profile now carries self-labeling fields:

```json
{
  "id": "...",
  "synthetic": true,
  "generator": "indian-fakedata@2.0.6",
  ...
}
```

Wherever the data travels — JSON, JSONL, CSV, databases, training files — it
carries proof that it is synthetic. This is intentional and aligned with the
Acceptable Use policy above; please do not strip these markers downstream.

### v2.0.7 — correctness release

- **RNG bias fixed.** The JS→Python port of the mulberry32 PRNG used signed
  shifts; `rng.next()` never returned values >= 0.5, so every weighted choice
  was skewed toward options listed early in the tables. All distributions are
  now statistically correct, and all seeds produce different output than
  <= 2.0.6.
- **DOB/age drift fixed.** ~1/3 of profiles previously had a `dateOfBirth`
  whose real calendar age was off by one from `age`.

### v2.0.8 — appearance attribute

Every profile now carries a nested `appearance` object describing physical
traits: `faceShape`, `skinTone`, `noseType`, `eyeColor`, `eyeShape`,
`hairColor`, `hairTexture`, `hairLength`, `facialHair` and `build`.

- **Regional variation.** Adult height is shifted by broad geographic region
  (North-West tallest, South and North-East shorter), so a seeded profile's
  `heightCm` now reflects where they live. Existing seeds resolve to slightly
  different heights than <= 2.0.7.
- **Skin tone buckets** use named, descriptive values: `fair`, `wheatish`,
  `brown`, `deep_brown` and `dark`.
- **Agent personas** automatically describe each person's appearance in the
  generated system prompt.
- The `appearance` block is appended at the end of generation, so every other
  field for a given seed stays stable.

### v2.0.9 — work history, skills and more

See [CHANGELOG.md](../CHANGELOG.md) for the full 2.0.9 list.

- **Employment timeline.** Every profile now carries `employmentTimeline`: a
  chronological list of job spells (`jobTitle`, `sector`, `occupation`,
  `employerType`, `startYear`, `endYear`, `status`, `monthlyWageINR`,
  `location`). Wages progress towards the current income; students, the
  unemployed and children get an empty timeline, retirees get completed-only
  history. Attached after profile assembly, so `id` and every <= 2.0.8 field
  for a given seed stay byte-identical.
- **Skills and languages.** Every profile now carries `skills`: `technical`
  and `soft` skill lists, `certifications`, and per-language
  speaking/reading/writing levels (`basic` / `intermediate` / `fluent` /
  `native`). Pools follow education and occupation; children get languages
  only. Same isolated-stream guarantee as the employment timeline.
- **New narrative documents.** Layer 3 gains `resume` (CV grounded in the
  education timeline, work history and skills) and `customer_support_chat`
  (Hinglish bank helpline dialogue, phone masked). Both work via
  `generate_narrative`, `--narrative` and `generate_all_narratives`, which
  appends them at the end so existing document order is unchanged.
- **Hindi/Hinglish personas.** Layer 4 personas accept a `language` option
  (`english` / `hindi` / `hinglish`): `generate_agent_persona(profile,
  'hindi')`, `generate_enriched(..., agent_persona_language='hinglish')`,
  or CLI `--persona --persona-lang hindi`. Hindi renders the system prompt
  in Devanagari with Hindi section headers; Hinglish uses roman script.
  Default `english` output is unchanged.
- **CLI field selection and stats.** `--fields firstName,state,
  appearance.skinTone` outputs only those fields (dot paths allowed,
  repeatable, works for json/jsonl/csv). `--stats` prints a distribution
  summary (religion/state/gender/area/education/occupation) to stderr.
- **Schema and validation.** `get_profile_schema()` exports a versioned JSON
  Schema for the profile shape; `validate_profile(profile)` returns
  `{"valid", "errors"}` checking required fields, enums and the `synthetic`
  / `generator` provenance markers. Zero dependencies, works on plain dicts.
  The canonical schema is also committed as `schema/profile-2.0.9.json`.
- **PII stripping.** `strip_pii(profile)` returns a share-safe copy with
  Aadhaar, PAN, voter ID, phone, email, bank account, UPI ID and the street
  address emptied (same shape, `piiStripped: true` marker, provenance kept).
  `mask_names=True` reduces names to initials. Validate before stripping.
- **CLI privacy.** `--strip-pii` empties identifiers in CLI output (profile
  fields only, not narrative/persona text); `--mask-names` reduces names
  to initials.
- **CLI validation.** `--validate` checks every full profile and exits 1
  with errors on stderr for the first invalid record. Runs before any
  shaping, so it composes with `--strip-pii` and `--fields`.

### v2.1.0 — timeline follows occupation

- **Occupation now follows education (breaking).** Occupation used to be
  sampled independently of schooling, so graduates routinely rolled farm
  jobs. Weights are now conditioned on education: graduates skew strongly
  white-collar, the unschooled toward farm work. Same draw count, so the
  stream layout is intact, but occupation-driven fields resolve differently
  than 2.0.9 for the same seed. Explicit `occupation` constraints still win.
- **Employment timeline fix.** Stages used to pick titles from the
  employment sector, so a cultivator could show up as "Kirana Shop Owner".
  Titles and occupation labels now follow the profile's own `occupation`;
  only `non_worker` histories fall back to a sampled past sector. `sector`
  still mirrors `employmentSector`, so the two always agree. The
  `employmentTimeline` key now sits right below `occupation` instead of at
  the end of the profile.
- **Jobs match the degree.** The current job title now follows the profile's
  field of study (a BTech graduate works as an engineer, a B.Ed graduate
  teaches; doctor titles need a professional degree), and every sector pool
  grew with more titles. Education and employment timelines finally agree.
- **Native script output.** Every profile carries `nativeScript` with names,
  district and address transliterated into the mother-tongue script
  (Devanagari, Bengali, Gujarati, Gurmukhi, Kannada, Malayalam, Tamil,
  Telugu, Odia; Latin passthrough otherwise). `transliterate()` and
  `script_for_language()` are exported for prompts and free text.
- **Life events timeline.** Every profile carries `lifeEvents` with dated
  birth, marriage, children, migration, job-switch and retirement events,
  cross-checked against age, marital status, child count, migration flag
  and both existing timelines.
- **Household economy kit.** Every profile carries `householdEconomy` with
  a monthly budget split summing exactly to expenditure, 0-2 affordable
  loans with real EMI math (total EMI capped at 60% of income), and a
  credit history whose score bands track missed payments.
- **Festival calendar.** Every profile carries `festivals` with observances
  dated for the current year, driven by religion and state: pan-Indian
  festivals from the profile's religion plus regional ones that stay in
  their states (Pongal, Bihu, Onam, Durga Puja, Chhath, Teej, Baisakhi,
  Ganesh Chaturthi). Lunisolar dates are typical, not exact.
- **SFT pair builder.** `build_sft_pairs()` turns a profile (plus optional
  narratives) into grounded instruction/response pairs, exported as JSONL
  with `sft_pairs_to_jsonl()`.
- **Geospatial points.** Every profile carries `geo` with an approximate
  latitude/longitude around the state capital, tighter for urban profiles
  and clamped inside the state bounding box. District-approximate, not
  rooftop-accurate.

---

## The 4 Data Layers

| Layer | Name | Description |
|-------|------|-------------|
| 1 | **Core Demographics** | State, gender, religion, caste, names, languages, biological markers, address |
| 2 | **Socio-Economic Outcomes** | CIBIL credit score, health risk, literacy, employment vulnerability (configurable bias) |
| 3 | **Narrative Documents** | Loan applications, OPD records, Hinglish WhatsApp chats, school admissions |
| 4 | **Agent Persona Prompts** | LLM-ready system prompts + full roleplay prompts (education timeline, personality traits, movie/anime preferences), worldview beliefs, stress responses, memory seeds |

---

## TypeScript / Node.js Edition

If you are looking for the Node.js / TypeScript version of this package, check out the root of this repository or install it via npm:

```bash
npm install @abhay557/indian-fakedata
```

---

## Acceptable Use

This library generates **synthetic** mock data intended for software testing,
development, ML/AI research, education, and simulation. By using it you agree
**not** to use it, or data derived from it, for:

- Creating fake identity documents, or bypassing KYC / identity / age verification systems
- Operating fake accounts, bots, or personas that interact with real people —
  including social-media manipulation, astroturfing, and fake reviews
- Disinformation, impersonation, harassment, spam, or scam content of any kind
- Presenting generated profiles or statistics as real data about real individuals,
  or publishing datasets derived from this library without clearly labeling them synthetic
- Any purpose that is illegal under applicable law

All identifiers (Aadhaar, PAN, voter ID, phone, email) are fabricated and exist in no
government or commercial database. Every profile is fictional; any resemblance to a
real person is coincidental. **You are responsible for how you deploy the output of
this library.** If you are unsure whether your use case is acceptable, it probably isn't.

---

## License

MIT &copy; Abhay Mourya
