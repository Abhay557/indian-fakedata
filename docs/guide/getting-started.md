# Getting Started

A library that generates culturally accurate, statistically consistent mock
Indian demographic profiles backed by **Census 2011** data.

Two native implementations, identical features and CLI:

| Runtime | Package | Registry | Requires |
|---|---|---|---|
| Node.js / TypeScript | `@abhay557/indian-fakedata` | npm | Node ≥ 18 |
| Python | `indian-fakedata` | PyPI | Python ≥ 3.8 |

Zero runtime dependencies in both.

## Why this library?

Traditional mock generators produce impossible demographic combinations — a
*Sikh* named *Mohammed Sharma* from *Mizoram*, or a 60-year-old with an IIT
startup bio. This library links every variable through real-world statistical
correlations, so every generated person makes logical sense.

## Install

```bash
# TypeScript / Node.js
npm install @abhay557/indian-fakedata

# Python
pip install indian-fakedata
```

## First run (CLI)

```bash
# Python (or globally installed Node package)
indian-fakedata -c 1

# Node.js on the fly
npx @abhay557/indian-fakedata -c 1
```

You get one complete profile: identity, biometrics, Aadhaar/PAN/voter IDs,
address, religion, caste, language, education, occupation, income, household
assets, psychology and more.

```bash
# 1,000 profiles as CSV
indian-fakedata -c 1000 -f csv -o profiles.csv

# 50K Tamil Nadu Hindus, JSONL
indian-fakedata -c 50000 -f jsonl -o tn.jsonl --state "Tamil Nadu" --religion Hindu

# A full family from one seed
indian-fakedata --family --seed 011
```

Seeds accept **numbers or strings** — `-s 7` and `-s "011"` both work, and the
same seed always reproduces the same output **within a runtime**.

## First run (API)

### TypeScript

```typescript
import { generate } from '@abhay557/indian-fakedata';

const profiles = generate({ count: 5 });
profiles.forEach(p => {
  console.log(`[${p.id}] ${p.firstName} ${p.lastName} (${p.gender}, ${p.age})`);
  console.log(`Location: ${p.district}, ${p.state} | Caste: ${p.caste}`);
  console.log(`Religion: ${p.religion} | Education: ${p.education}\n`);
});
```

### Python

```python
from indian_fakedata import generate

profiles = generate(count=5)

for p in profiles:
    print(f"[{p['id']}] {p['firstName']} {p['lastName']} ({p['gender']}, {p['age']})")
    print(f"Location: {p['district']}, {p['state']} | Caste: {p['caste']}")
    print(f"Religion: {p['religion']} | Education: {p['education']}\n")
```

## What next?

- [CLI Reference](/guide/cli) — every flag
- [TypeScript API](/guide/typescript-api) / [Python API](/guide/python-api)
- [Relational data: families](/guide/relational-data)
- [Enrichment layers](/guide/enrichment)
- [Data accuracy & sources](/guide/data-accuracy)
