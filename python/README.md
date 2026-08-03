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
  "id": "33553413-2014-4616-9361-511204427271",
  "firstName": "Pushpa",
  "lastName": "Sharma",
  "fatherName": "Santosh Sharma",
  "motherName": "Geeta Sharma",
  "spouseName": "Sanjay Sharma",
  "gender": "female",
  "age": 34,
  "dateOfBirth": "1992-06-11",
  "bloodGroup": "O+",
  "heightCm": 152.9,
  "weightKg": 65.9,
  "bmi": 28.2,
  "aadhaarNumber": "500233102039",
  "panNumber": "EKIPS1361D",
  "voterIdNumber": "MHR0314014",
  "phoneNumber": "7501311043",
  "email": "pushpasharma352@gmail.com",
  "state": "Maharashtra",
  "stateCode": "MH",
  "district": "Solapur",
  "areaType": "urban",
  "addressLine": "245/D, MG Road, Solapur",
  "locality": "MG Road",
  "pinCode": "412519",
  "religion": "Hindu",
  "caste": "Deshastha Brahmin",
  "socialCategory": "General",
  "motherTongue": "Marathi",
  "secondLanguage": "Hindi",
  "education": "secondary",
  "occupation": "agricultural_labourer",
  "employmentSector": "self_employed",
  "maritalStatus": "married",
  "annualIncomeINR": 194000,
  "monthlyExpenditureINR": 15600,
  "numberOfChildren": 1,
  "dietaryPreference": "vegetarian",
  "disability": "none",
  "isMigrant": true,
  "migrationOriginState": "Andhra Pradesh",
  "bankIFSC": "SBIN0331430",
  "bankName": "State Bank of India",
  "bankAccountNumber": "00313113041",
  "rationCardType": "APL",
  "healthInsurance": "none",
  "landOwnershipAcres": 0,
  "vehicleRegistration": "MH 02 BB 2481",
  "vehicleType": "four_wheeler",
  "hasInternetAccess": true,
  "hasSmartphone": true,
  "usesSocialMedia": true,
  "upiId": "pushpa@okicici",
  "personality": {
    "openness": 54,
    "conscientiousness": 62,
    "extraversion": 60,
    "agreeableness": 70,
    "neuroticism": 58
  },
  "politicalLeaning": "nationalist_right",
  "religiosity": "very_religious",
  "cognitiveProfile": {
    "aptitudeScore": 74,
    "numeracyScore": 68,
    "literacyScore": 75,
    "digitalLiteracyScore": 53,
    "financialLiteracyScore": 71
  },
  "interests": {
    "primarySport": "cricket",
    "petPreference": "birds",
    "entertainment": [
      "Bollywood",
      "TV Serials",
      "Cricket Matches",
      "News",
      "YouTube",
      "OTT/Netflix"
    ],
    "readingHabit": "occasional",
    "musicPreference": "Bollywood",
    "preferredSocialMedia": "WhatsApp"
  },
  "habits": {
    "tobaccoUse": "smoking",
    "alcoholUse": "none",
    "exerciseFrequency": "weekly",
    "avgSleepHours": 9.3,
    "cooksAtHome": true,
    "chronotype": "early_riser"
  },
  "educationDetails": {
    "fieldOfStudy": null,
    "institutionType": "private",
    "mediumOfInstruction": "English",
    "qualificationYear": 2008,
    "competitiveExamPercentile": null
  },
  "culturalProfile": {
    "entrepreneurialScore": 32,
    "academicOrientation": 64,
    "artisticInclination": 41,
    "militaryTradition": 37,
    "agriculturalRootedness": 21,
    "artisanTradition": 1,
    "bureaucraticOrientation": 50,
    "socialActivism": 13,
    "communityBonding": 67,
    "migrationTendency": 24,
    "careerPreference": "business_trade",
    "familyStructure": "nuclear_family",
    "savingsOrientation": 65,
    "riskAppetite": 12
  },
  "householdSize": 1,
  "householdAssets": {
    "hasRadioTransistor": false,
    "hasTelevision": true,
    "hasComputer": true,
    "hasPhone": true,
    "hasBicycle": true,
    "hasScooter": true,
    "hasCar": true,
    "bankingService": true,
    "treatedWaterSource": true,
    "latrineFacility": true,
    "numberOfRooms": 2,
    "roofMaterial": "concrete",
    "wallMaterial": "burnt_brick",
    "cookingFuel": "lpg",
    "lightingSource": "electricity",
    "drinkingWaterSource": "tap_treated"
  },
  "probabilityMetrics": {
    "nationalReligionFreq": 0.803301791826052,
    "stateGivenReligionProb": 0.10324714506000403,
    "casteGivenContextProb": 0.04225352112676056,
    "lastNameGivenCasteProb": 0.2,
    "socialCategoryProb": 0.35211267605633797,
    "educationProb": 0.21890547263681592,
    "occupationProb": 0.18000000000000002,
    "jointProbability": 2.7617147096522784e-05
  },
  "generatedAt": "2026-08-03T21:45:13.883314",
  "seed": 7
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
| `--persona` | **[Layer 4]** Generate LLM-ready agent persona (system prompt, beliefs, memory seeds) |

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
```

See **[TUTORIAL.md](../TUTORIAL.md)** for full code examples in TypeScript and Python.

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

---

## The 4 Data Layers

| Layer | Name | Description |
|-------|------|-------------|
| 1 | **Core Demographics** | State, gender, religion, caste, names, languages, biological markers, address |
| 2 | **Socio-Economic Outcomes** | CIBIL credit score, health risk, literacy, employment vulnerability (configurable bias) |
| 3 | **Narrative Documents** | Loan applications, OPD records, Hinglish WhatsApp chats, school admissions |
| 4 | **Agent Persona Prompts** | LLM-ready system prompts, worldview beliefs, stress responses, memory seeds |

---

## TypeScript / Node.js Edition

If you are looking for the Node.js / TypeScript version of this package, check out the root of this repository or install it via npm:

```bash
npm install @abhay557/indian-fakedata
```

---

## License

MIT &copy; Abhay Mourya
