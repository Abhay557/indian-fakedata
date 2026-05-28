# Indian Fake Data Generator (Python Edition)

A fast, zero-dependency python library that creates realistic mock Indian profile data based on Census 2011 statistics.

Unlike other tools that make impossible combinations (like a Sikh named *Mohammed Sharma* from *Mizoram*), this tool links religion, state, caste, gender, and occupation together so the generated people make logical sense.

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What It Can Do

- **Linked Census Data**: Correctly links Religion ➔ State ➔ Caste ➔ Gender ➔ Education ➔ Job ➔ Assets.
- **Extra Features**: Creates credit and health scores, builds a short text bio, and structures custom LLM Agent Personas.
- **No Dependencies**: Built entirely using Python's standard library to keep things extremely fast and lightweight.
- **Deterministic**: Generates the exact same profiles for identical seed numbers.

---

## Installation

```bash
pip install indian-fakedata
```

---

## Quick Start

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

---

## Saving Datasets (JSON, JSONL, CSV)

Easily format or write your generated data to standard formats:

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

## License

MIT © Abhay Mourya
