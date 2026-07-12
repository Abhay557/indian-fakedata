# Indian Fake Data Generator (Python Edition)

A fast, zero-dependency Python library that generates culturally accurate, statistically consistent mock Indian demographic profiles backed by **Census 2011** data using attention-like context masking.

Unlike traditional mock generators that produce impossible demographic combinations (such as a *Sikh* named *Mohammed Sharma* from *Mizoram*), this library correctly links variables together so that every generated person makes logical sense based on real-world statistical correlations.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/) 
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) 
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1VWYsjM0f6CxEi7pZ6uOa1i9Hfh7tsH8s?usp=sharing)

---

## Output Sample (one profile)

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
  "panNumber": "EKIPS1361G",
  "voterIdNumber": "MHR3140140",
  "phoneNumber": "7513110431",
  "email": "pushpasharma328@gmail.com",
  "state": "Maharashtra",
  "stateCode": "MH",
  "district": "Aurangabad",
  "areaType": "urban",
  "addressLine": "469/A, Adarsh Colony, Aurangabad",
  "locality": "Adarsh Colony",
  "pinCode": "418683",
  "religion": "Hindu",
  "caste": "Deshastha Brahmin",
  "socialCategory": "General",
  "motherTongue": "Marathi",
  "secondLanguage": "English",
  "education": "secondary",
  "occupation": "agricultural_labourer",
  "employmentSector": "self_employed",
  "maritalStatus": "married",
  "annualIncomeINR": 194000,
  "monthlyExpenditureINR": 15300,
  "numberOfChildren": 1,
  "dietaryPreference": "non_vegetarian",
  "disability": "none",
  "isMigrant": true,
  "migrationOriginState": "Kerala",
  "bankIFSC": "PUNB0314300",
  "bankName": "Punjab National Bank",
  "bankAccountNumber": "03131130413",
  "rationCardType": "APL",
  "healthInsurance": "none",
  "landOwnershipAcres": 0,
  "vehicleRegistration": "MH 01 BG 3908",
  "vehicleType": "four_wheeler",
  "hasInternetAccess": true,
  "hasSmartphone": true,
  "usesSocialMedia": true,
  "upiId": "pushpa@okicici",
  "personality": {
    "openness": 53,
    "conscientiousness": 47,
    "extraversion": 53,
    "agreeableness": 46,
    "neuroticism": 74
  },
  "politicalLeaning": "nationalist_right",
  "religiosity": "very_religious",
  "cognitiveProfile": {
    "aptitudeScore": 40,
    "numeracyScore": 37,
    "literacyScore": 75,
    "digitalLiteracyScore": 45,
    "financialLiteracyScore": 93
  },
  "interests": {
    "primarySport": "cricket",
    "petPreference": "fish",
    "entertainment": [
      "Bollywood", "TV Serials", "Cricket Matches", "News",
      "YouTube", "OTT/Netflix", "Devotional Music"
    ],
    "readingHabit": "rare",
    "musicPreference": "Bollywood",
    "preferredSocialMedia": "WhatsApp"
  },
  "habits": {
    "tobaccoUse": "none",
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
    "nationalReligionFreq": 0.8033,
    "stateGivenReligionProb": 0.1032,
    "casteGivenContextProb": 0.0423,
    "lastNameGivenCasteProb": 0.2000,
    "socialCategoryProb": 0,
    "educationProb": 0.2189,
    "occupationProb": 0.1800,
    "jointProbability": 2.76e-05
  },
  "generatedAt": "2026-07-12T21:56:35.146855",
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
| `--seed <number>` | `-s` | Reproducibility seed for RNG | random |
| `--no-metrics` | | Exclude probability metrics from output | included |
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
```

See **[TUTORIAL.md](../TUTORIAL.md)** for full code examples in TypeScript and Python.

---

## Data Sources & Real-World Accuracy

Every demographic profile, name distribution, and asset weighting is calibrated against public survey data:

1. **Census of India 2011 (D-Series & C-Series Tables):** Core distributions for religion, state-by-state population metrics, and mother tongue frequencies.
2. **National Family Health Survey (NFHS-5):** State-wise dietary preferences, BMI, blood groups, height/weight by age.
3. **MSME Census:** Community-level occupational sectors, vocational rates, industry divisions.
4. **UIDAI & RTO Records:** Structural syntax for Aadhaar, Voter ID, PAN, IFSC, and RTO registrations.
5. **CSDS/Lokniti Election Studies:** Political leanings and religiosity index biases.

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
