# Indian Fake Data Generator 

A fast, zero-dependency multi-language library that creates realistic mock Indian profile data based on Census 2011 statistics . Available for both **Python**  and **Node.js / TypeScript** .

Unlike standard tools that create impossible combinations (like a Sikh named *Mohammed Sharma* from *Mizoram*) , this library links religion, state, caste, gender, and occupation together so the generated people make logical sense .

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/) 
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/) 
[![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)](https://nodejs.org) 
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) 
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1VWYsjM0f6CxEi7pZ6uOa1i9Hfh7tsH8s?usp=sharing)
---
---
## Output Sample (one profile)
```json
[
  {
    "id": "37160375-7333-4751-8220-442333533521",
    "firstName": "Sonam",
    "lastName": "Trivedi",
    "fatherName": "Piyush Trivedi",
    "motherName": "Ruksar Sharma",
    "spouseName": null,
    "gender": "female",
    "age": 21,
    "dateOfBirth": "2005-02-13",
    "bloodGroup": "B+",
    "heightCm": 139.1,
    "weightKg": 48.6,
    "bmi": 25.1,
    "aadhaarNumber": "333431204238",
    "panNumber": "IBHPT2060D",
    "voterIdNumber": "MPH1031102",
    "phoneNumber": "7411314102",
    "email": "sonamtrivedi359@gmail.com",
    "state": "Madhya Pradesh",
    "stateCode": "MP",
    "district": "Dewas",
    "areaType": "urban",
    "addressLine": "168/A, MG Road, Dewas",
    "locality": "MG Road",
    "pinCode": "450673",
    "religion": "Hindu",
    "caste": "Brahmin",
    "socialCategory": "General",
    "motherTongue": "Hindi",
    "secondLanguage": null,
    "education": "illiterate",
    "occupation": "agricultural_labourer",
    "employmentSector": "self_employed",
    "maritalStatus": "never_married",
    "annualIncomeINR": 12000,
    "monthlyExpenditureINR": 1000,
    "numberOfChildren": 0,
    "dietaryPreference": "vegetarian",
    "disability": "none",
    "isMigrant": true,
    "migrationOriginState": "Bihar",
    "bankIFSC": "PUNB0442244",
    "bankName": "Punjab National Bank",
    "bankAccountNumber": "34140233013",
    "rationCardType": "AAY",
    "healthInsurance": "pmjay",
    "landOwnershipAcres": 0,
    "vehicleRegistration": null,
    "vehicleType": "none",
    "hasInternetAccess": true,
    "hasSmartphone": true,
    "usesSocialMedia": true,
    "upiId": "7411314102@okicici",
    "personality": {
      "openness": 41,
      "conscientiousness": 46,
      "extraversion": 65,
      "agreeableness": 37,
      "neuroticism": 75
    },
    "politicalLeaning": "nationalist_right",
    "religiosity": "very_religious",
    "cognitiveProfile": {
      "aptitudeScore": 1,
      "numeracyScore": 5,
      "literacyScore": 23,
      "digitalLiteracyScore": 2,
      "financialLiteracyScore": 5
    },
    "interests": {
      "primarySport": "cricket",
      "petPreference": "cats",
      "entertainment": [
        "Bollywood",
        "TV Serials",
        "YouTube",
        "OTT/Netflix",
        "Gaming",
        "Devotional Music"
      ],
      "readingHabit": "rare",
      "musicPreference": "Bollywood",
      "preferredSocialMedia": "WhatsApp"
    },
    "habits": {
      "tobaccoUse": "none",
      "alcoholUse": "none",
      "exerciseFrequency": "occasional",
      "avgSleepHours": 6.6,
      "cooksAtHome": true,
      "chronotype": "moderate"
    },
    "educationDetails": {
      "fieldOfStudy": null,
      "institutionType": "none",
      "mediumOfInstruction": "Hindi",
      "qualificationYear": null,
      "competitiveExamPercentile": null
    },
    "culturalProfile": {
      "entrepreneurialScore": 14,
      "academicOrientation": 78,
      "artisticInclination": 74,
      "militaryTradition": 23,
      "agriculturalRootedness": 11,
      "artisanTradition": 33,
      "bureaucraticOrientation": 51,
      "socialActivism": 21,
      "communityBonding": 72,
      "migrationTendency": 31,
      "careerPreference": "military_police",
      "familyStructure": "joint_family",
      "savingsOrientation": 66,
      "riskAppetite": 32
    },
    "householdSize": 1,
    "householdAssets": {
      "hasRadioTransistor": false,
      "hasTelevision": true,
      "hasComputer": false,
      "hasPhone": true,
      "hasBicycle": true,
      "hasScooter": false,
      "hasCar": false,
      "bankingService": true,
      "treatedWaterSource": true,
      "latrineFacility": true,
      "numberOfRooms": 4,
      "roofMaterial": "concrete",
      "wallMaterial": "burnt_brick",
      "cookingFuel": "lpg",
      "lightingSource": "electricity",
      "drinkingWaterSource": "tap_treated"
    },
    "probabilityMetrics": {
      "nationalReligionFreq": 0.803301791826052,
      "stateGivenReligionProb": 0.06905490870896373,
      "casteGivenContextProb": 0.09090909090909091,
      "lastNameGivenCasteProb": 0.05333333333333334,
      "socialCategoryProb": 0,
      "educationProb": 0.14667365112624411,
      "occupationProb": 0.25,
      "jointProbability": 9.862146408294112e-06
    },
    "generatedAt": "2026-05-31T16:47:28.399797",
    "seed": 4110291396
  }
]


```
---
## Core Features

* **Linked Census Data**: Correctly links Religion -> State -> Caste -> Gender -> Education -> Job -> Assets .
* **Extra Features**: Creates credit and health scores, builds a short text bio, and structures custom LLM Agent Personas or AI chat prompts .
* **No Dependencies**: Built entirely using native standard libraries to keep things extremely fast and lightweight .
* **Deterministic**: Generates the exact same profiles for identical seed numbers .

##  Data Sources & Real-World Data Accuracy

Every demographic profile, name distribution, and asset weighting in this library is calibrated against public survey data:

1. **Census of India 2011 (D-Series & C-Series Tables):** Core distributions for religion, state-by-state population metrics, and mother tongue/linguistic frequencies.
2. **National Family Health Survey (NFHS-5):** Calibrated parameters for state-wise dietary preferences, body mass index (BMI), blood groups, and height/weight correlations by age.
3. **Ministry of Micro, Small and Medium Enterprises (MSME Census):** Community-level occupational sectors, vocational rates, and industry divisions.
4. **UIDAI & RTO Registration Records:** Structural syntax formatting for Aadhaar, Voter ID, PAN card, bank IFSC records, and RTO vehicle registrations by state.
5. **CSDS/Lokniti National Election Studies:** Statistical biases for political leanings and religiosity index.

---

##  The Data Layers

`indian-fakedata` generates data across four progressive layers of demographic depth:

* **Layer 1: Core Demographics:** Links state, gender, and religion to caste/community, realistic first/last names, languages, biological markers, and street address.
* **Layer 2: Socio-Economic Outcomes:** Simulates credit scores (CIBIL-observant), health risk scores, functional literacy levels, and employment vulnerabilities using a configurable historic bias dial (`bias_level` from `0.0` to `1.0`).
* **Layer 3: Narrative Documents:** Generates realistic text corpuses—such as personal loan applications, hospital OPD record files, Hinglish WhatsApp chats, and school admissions forms.
* **Layer 4: Agent Persona Prompts:** Builds LLM-ready structured prompts, worldview beliefs, stress responses, and memory seeds—ideal for multi-agent simulation frameworks.

---

## Python Edition 

### Installation 

```bash
pip install indian-fakedata
``` 

### Quick Start 

```python
from indian_fakedata import generate, generate_enriched

# 1. Basic Generation
profiles = generate(count=10)

# 2. Enriched Generation (with outcomes, bios, and LLM agent personas)
enriched_profiles = generate_enriched(count=5)

for p in enriched_profiles:
    print(f"Name: {p['fields']['full_name']}")
    print(f"Bio: {p['narrative']}")
``` 

### Saving Datasets (JSON, JSONL, CSV) 

Easily format or write your generated data to standard formats :

```python
from indian_fakedata import generate_enriched, save_profiles

# 1. Generate a list of profiles
profiles = generate_enriched(count=100)

# 2. Save directly to a file (JSON, JSONL, or CSV)
save_profiles(profiles, "./output/data.json", "json")
save_profiles(profiles, "./output/data.jsonl", "jsonl")
save_profiles(profiles, "./output/data.csv", "csv") # Automatically flattens outcomes/personas
``` 

---

## TypeScript / Node.js Edition 

### Installation 

```bash
npm install @abhay557/indian-fakedata
``` 

### Quick Start 

#### 1. Basic Generation 
```typescript
import { generate } from '@abhay557/indian-fakedata';

// Generate 10 standard profiles
const profiles = generate({ count: 10 });

// Generate with constraints
const filtered = generate({
  count: 1,
  constraints: { religion: 'Hindu', state: 'Tamil Nadu', gender: 'female' }
});
``` 

#### 2. Exporting to a File 
Generate extra credit/health stats and write them directly to a file :
```typescript
import { generateEnriched, saveProfilesToFile } from '@abhay557/indian-fakedata';

const data = generateEnriched({
  count: 100,
  includeOutcomes: true,
  includeAgentPersona: true
});

// Save to disk (supports 'json', 'jsonl', or flat 'csv')
saveProfilesToFile(data, './output/data.csv', 'csv');
``` 

### API Reference 

#### `generate(options?)` 
Creates a list of mock people .
```typescript
interface GeneratorOptions {
  count?: number;                      // Default: 1
  seed?: number;                       // Number to get the exact same data every time
  constraints?: GenerationConstraints; // Filter by religion, state, caste, age, etc.
}
``` 

#### `generateStream(options?)` 
For large amounts of data :
```typescript
import { generateStream } from '@abhay557/indian-fakedata';

for (const profile of generateStream({ count: 1000000 })) {
  saveToDatabase(profile);
}
``` 

---

## CLI Usage 

You can also run the generator from your terminal using `npx` :

```bash
# Save 1000 people to a CSV file
npx Indian-FakeData -c 1000 -f csv -o output.csv

# Save 50000 people with extra features to a JSONL file
npx Indian-FakeData -c 50000 -f jsonl -o data.jsonl --enrich --bias 0.3
``` 

### CLI Options 
* `-c, --count <n>`: How many records to create (default: 100) 
* `-f, --format <fmt>`: File format: `json`, `jsonl`, or `csv` 
* `-o, --output <path>`: File path to save output 
* `-s, --seed <n>`: Seed number for same results 
* `--enrich`: Add credit, health, narrative, and AI prompt fields 
* `--bias <0-1>`: Systemic bias level (default: 0.3) 

---

## License 
MIT © Abhay Mourya 
