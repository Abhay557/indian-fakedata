# Python API

```bash
pip install indian-fakedata
```

Requires **Python 3.8+**. Zero runtime dependencies. The whole database is
bundled (JSON) — no downloads, works offline.

## Core generation

```python
from indian_fakedata import (
    generate,
    generate_stream,
    get_distribution_summary,
)

# Generate 5 profiles
profiles = generate(count=5)

# Seeded + constrained
tn = generate(
    count=3,
    seed="011",                     # numbers or strings
    constraints={
        "state": "Tamil Nadu",
        "gender": "female",
        "areaType": "rural",
        "minAge": 18,
        "maxAge": 45,
    },
)

# Memory-efficient stream
for p in generate_stream(count=100000):
    pass  # process one by one

# Distribution summary
summary = get_distribution_summary()
```

### `generate()` parameters

| Parameter | Type | Description |
|---|---|---|
| `count` | `int` | Number of profiles (default `1`) |
| `seed` | `int \| str` | Reproducibility seed (default random) |
| `constraints` | `dict` | Demographic filters (below) |
| `include_probability_metrics` | `bool` | Include probability chain (default `True`) |

Constraint keys are camelCase: `state`, `gender`, `religion`, `caste`,
`socialCategory`, `areaType`, `minAge`, `maxAge`, `education`, `occupation`,
`maritalStatus`, `surname`.

## Enrichment API

```python
from indian_fakedata import (
    generate_enriched,
    generate_enriched_stream,
    simulate_outcomes,
    generate_narrative,
    generate_all_narratives,
    generate_agent_persona,
)

enriched = generate_enriched(
    count=1,
    include_outcomes=True,       # Layer 2
    narrative_types=["all"],     # Layer 3
    include_agent_persona=True,  # Layer 4
    bias_level=0.3,
)[0]

print(enriched["profile"]["firstName"], enriched["outcomes"]["credit"]["creditScore"])
print(enriched["agentPersona"]["systemPrompt"])
```

## User / Family / Persona (faker-style)

```python
from indian_fakedata import generate_user, generate_users, generate_family, generate_persona

# One profile (README sample shape)
user = generate_user(seed=7)

# Many users from one seed
users = generate_users(count=5, seed="011")

# Shortcut flags
dev = generate_user(
    highly_educated=True,
    gender="female",
    marital_status="married",
    constraints={"state": "Karnataka"},
)

# Whole household: spouse, parents, children, siblings
family = generate_family(seed="011")

# User + LLM-ready persona
out = generate_persona(seed="011")
user, persona = out["user"], out["persona"]
```

## Exporters

```python
from indian_fakedata import generate_enriched, save_profiles, format_profiles

dataset = generate_enriched(count=50, include_outcomes=True)

save_profiles(dataset, "./output.json", "json")
save_profiles(dataset, "./output.jsonl", "jsonl")
save_profiles(dataset, "./output.csv", "csv")  # flattened automatically
csv_string = format_profiles(dataset, "csv")
```

## Custom data

```python
from indian_fakedata import load_database

# Merge custom JSON files (states.json, religions.json, casteMap.json,
# firstNames.json, surnames.json, districts.json) from a directory
db = load_database("./my-data-dir")
```

## Module contents

`generate`, `generate_stream`, `get_distribution_summary`,
`generate_enriched`, `generate_enriched_stream`, `simulate_outcomes`,
`generate_narrative`, `generate_all_narratives`, `generate_agent_persona`,
`generate_user`, `generate_users`, `generate_persona`, `generate_family`,
`create_rng`, `weighted_sample`, `weighted_sample_from_record`,
`load_database`, `format_profiles`, `save_profiles`.
