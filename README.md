# Indian Fake Data Generator

A fast tool with no extra packages that creates realistic mock Indian profile data based on Census 2011 statistics.

Unlike other tools that make impossible combinations (like a Sikh named *Mohammed Sharma* from *Mizoram*), this tool links religion, state, caste, gender, and job together so the generated people make logical sense.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)](https://nodejs.org)

---

## What It Can Do

- **Linked Census Data**: Correctly links Religion ➔ State ➔ Caste ➔ Gender ➔ Education ➔ Job ➔ Assets.
- **Extra Features**: Creates credit and health scores (with adjustable bias), builds a short text bio, and generates custom prompts for AI chat.
- **Fast**: Generates over 60,000 items per second.
- **No Dependencies**: Runs on standard Node.js without needing any other npm packages.

---

## Installation

```bash
npm install @abhay557/indian-fakedata
```

---

## Quick Start

### 1. Basic Generation
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

### 2. Exporting to a File
Generate extra credit/health stats and write them directly to a file:
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

---

## API Reference

### `generate(options?)`
Creates a list of mock people.
```typescript
interface GeneratorOptions {
  count?: number;                      // Default: 1
  seed?: number;                       // Number to get the exact same data every time
  constraints?: GenerationConstraints; // Filter by religion, state, caste, age, etc.
}
```

### `generateStream(options?)`
For large amounts of data:
```typescript
import { generateStream } from '@abhay557/indian-fakedata';

for (const profile of generateStream({ count: 1000000 })) {
  saveToDatabase(profile);
}
```

---

## CLI Usage

You can also run the generator from your terminal using `npx`:

```bash
# Save 1000 people to a CSV file
npx Indian-FakeData -c 1000 -f csv -o output.csv

# Save 50000 people with extra features to a JSONL file
npx Indian-FakeData -c 50000 -f jsonl -o data.jsonl --enrich --bias 0.3
```

### CLI Options
- `-c, --count <n>`: How many records to create (default: 100)
- `-f, --format <fmt>`: File format: `json`, `jsonl`, or `csv`
- `-o, --output <path>`: File path to save output
- `-s, --seed <n>`: Seed number for same results
- `--enrich`: Add credit, health, narrative, and AI prompt fields
- `--bias <0-1>`: Systemic bias level (default: 0.3)

---

## License

MIT © Abhay Mourya
