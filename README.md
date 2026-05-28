# Indian Fake Data Generator 

A fast, zero-dependency multi-language library that creates realistic mock Indian profile data based on Census 2011 statistics . Available for both **Python**  and **Node.js / TypeScript** .

Unlike standard tools that create impossible combinations (like a Sikh named *Mohammed Sharma* from *Mizoram*) , this library links religion, state, caste, gender, and occupation together so the generated people make logical sense .

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/) 
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/) 
[![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)](https://nodejs.org) 
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) 
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/drive/1VWYsjM0f6CxEi7pZ6uOa1i9Hfh7tsH8s?usp=sharing)
---

## Core Features

* **Linked Census Data**: Correctly links Religion -> State -> Caste -> Gender -> Education -> Job -> Assets .
* **Extra Features**: Creates credit and health scores, builds a short text bio, and structures custom LLM Agent Personas or AI chat prompts .
* **No Dependencies**: Built entirely using native standard libraries to keep things extremely fast and lightweight .
* **Deterministic**: Generates the exact same profiles for identical seed numbers .

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
