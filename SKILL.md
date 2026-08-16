# SKILL: Indian Fake Data Generator (indian-fakedata)

Teaches AI agents how to correctly use the `indian-fakedata` library to generate
realistic, statistically consistent synthetic Indian demographic data.

Two native implementations, same features, same CLI flags:

| Runtime | Package | Registry |
|---|---|---|
| Node.js / TypeScript | `@abhay557/indian-fakedata` | npm |
| Python | `indian-fakedata` | PyPI |

Current version: **2.0.3** (both). Zero runtime dependencies.

---

## 1. Install

```bash
# TypeScript / Node (requires Node >= 18)
npm install @abhay557/indian-fakedata

# Python (requires Python 3.8+)
pip install indian-fakedata
```

## 2. CLI (identical in both runtimes)

```bash
# Node
npx @abhay557/indian-fakedata [options]

# Python (or globally installed Node package)
indian-fakedata [options]
```

### Core options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--count <n>` | `-c` | Number of profiles | `100` |
| `--output <path>` | `-o` | Output file | stdout |
| `--format <fmt>` | `-f` | `json`, `jsonl`, `csv` | `json` |
| `--seed <value>` | `-s` | Seed (number **or string**, e.g. `011`) | random |
| `--no-metrics` | | Exclude probability metrics | included |
| `--family` | | Full household from one seed (json/jsonl only) | off |

### Constraints (any combination)

`--religion` (Hindu, Muslim, Christian, Sikh, Buddhist, Jain), `--state`,
`--gender` (male/female/other), `--caste`, `--socialCategory` (SC/ST/OBC/General),
`--areaType` (urban/rural), `--minAge`/`--maxAge` (0–100), `--education`,
`--occupation`, `--maritalStatus`.

### Enrichment layers

`--enrich` (all), `--outcomes` (credit/health/employment), `--bias <0-1>`
(default `0.3`), `--narrative <type>` (loan_application, medical_consultation,
school_enrollment, ration_card_application, hinglish_conversation, all),
`--persona` (LLM agent persona).

### Most useful invocations

```bash
indian-fakedata -c 1000 -f csv -o profiles.csv
indian-fakedata --family --seed 011 -f jsonl
indian-fakedata -c 50000 -f jsonl -o tn.jsonl --state "Tamil Nadu" --religion Hindu
```

## 3. Programmatic API matrix

| TS | Python |
|---|---|
| `generate({ count, seed, constraints, includeProbabilityMetrics })` | `generate(count=..., seed=..., constraints=..., include_probability_metrics=...)` |
| `generateStream(...)` | `generate_stream(...)` |
| `generateEnriched(...)` | `generate_enriched(...)` |
| `generateEnrichedStream(...)` | `generate_enriched_stream(...)` |
| `generateUser({ seed, highlyEducated, gender, maritalStatus, constraints })` | `generate_user(seed=..., highly_educated=..., gender=..., marital_status=..., constraints=...)` |
| `generateUsers({ count, seed, ... })` | `generate_users(count=..., seed=..., ...)` |
| `generateFamily({ seed, constraints })` | `generate_family(seed=..., constraints=...)` |
| `generatePersona({ seed, ... })` | `generate_persona(seed=...)` → `{ "user": ..., "persona": ... }` |
| `simulateOutcomes(profile, options)` | `simulate_outcomes(profile, options)` |
| `generateNarrative(profile, type)` | `generate_narrative(profile, type)` |
| `generateAgentPersona(profile)` | `generate_agent_persona(profile)` |
| `saveProfilesToFile(dataset, path, format)` | `save_profiles(dataset, path, format)` |
| `loadDatabase(dataDir?)` | `load_database(data_dir?)` |

## 4. Seed semantics (important)

- Seeds may be numbers **or strings** (`7`, `"011"`). Strings are hashed with
  FNV-1a internally.
- **Reproducibility is per-runtime**: the same seed always reproduces the same
  person/family *within one implementation* (TS or Python). The two runtimes
  draw RNG streams differently, so a seed does NOT produce identical output
  across Python and Node. Do not claim cross-runtime equivalence.
- `generateUser({ seed: 7 })` reproduces the README "Output Sample" profile
  (Pushpa Sharma, Maharashtra, Solapur) in the Python implementation.

## 5. Data & truthfulness rules

- Data is **synthetic mock data** — no real individuals, IDs are fabricated.
- Backed by Census 2011 + NFHS-5 + survey distributions, **hand-calibrated
  approximations**, not raw census microdata.
- **No file I/O at runtime.** The Excel files in `data/` (build-time only) are
  not read by the package. The npm tarball ships only `dist/`, README, LICENSE.
- Custom data (optional): `loadDatabase(dataDir)` merges JSON files named
  `states.json`, `religions.json`, `casteMap.json`, `firstNames.json`,
  `surnames.json`, `districts.json` from a directory.
- All fields are correlated: religion ↔ names ↔ state ↔ caste ↔ language ↔
  education ↔ income. Impossible combos (Sikh named Mohammed Sharma from
  Mizoram) are avoided by design.

## 6. Output shape

Each profile (`DemographicProfile`) includes: identity (`id`, name, father/mother/
spouse name), demographics (gender, age, DOB), biometrics (blood group, height,
weight, BMI), identifiers (Aadhaar, PAN, voter ID, phone, email), geography
(state, district, area type, address, PIN), socioeconomics (religion, caste,
social category, mother tongue, education, occupation, income, expenditure),
household (children count, assets), lifestyle (diet, habits, interests), and
psychology (Big Five, cognitive profile, political leaning). `probabilityMetrics`
shows the chain of probabilities for each draw.

v2.0.3 adds three fields to every profile:
- `educationTimeline`: chronological school/college stages (`level`,
  `stageName`, `institutionName`, `boardOrUniversity`, `startYear`, `endYear`,
  `status`: completed / in_progress / dropped_out, `score`) — institutions are
  drawn from large realistic pools (118 private schools, 43 colleges) and boards
  match the state (CBSE/ICSE for private schools, state boards for government).
- `personalityTraits`: descriptive traits derived deterministically from the Big
  Five scores — `summary`, `traitLabels` (5), `strengths`, `weaknesses`,
  `communicationStyle`, `decisionStyle`, `socialBehavior`. No RNG draws.
- `moviePreferences`: `genres` (2-4 weighted), `favoriteLanguages` (state's
  regional cinema first), `anime` + `animePreferences` + `favoriteAnimeTitles`
  (only present when the person is an anime fan), `primaryPlatform`,
  `watchFrequency`.

The three new generators consume RNG draws appended AFTER all existing draws,
so every 2.0.2 field for a given seed is unchanged in 2.0.3.

`generateFamily` returns: `{ head, spouse?, parents: { father?, mother? },
children: [...], siblings: [...] }` — all members share the head's surname,
caste, religion, and state; ages are logically ordered.

`generatePersona` returns `{ "user": <profile>, "persona": <agent persona with
systemPrompt, fullPrompt, beliefs, memorySeeds, behaviorRules> }`. `fullPrompt`
is a complete self-contained roleplay prompt (identity, education timeline,
personality traits, movie/anime preferences, habits, beliefs, memory seeds,
behaviour rules) designed to make an LLM act as this person.

## 7. Verification (run before declaring success)

```python
from indian_fakedata import generate, generate_user, generate_family

# 1. Basic generation + constraint
profiles = generate(count=5, constraints={"state": "Punjab", "religion": "Sikh"})
assert all(p["state"] == "Punjab" for p in profiles)

# 2. Seed reproducibility
assert generate_user(seed=7)["firstName"] == "Pushpa Sharma".split()[0]

# 3. Family consistency
fam = generate_family(seed="011")
members = [fam["head"]] + [fam["spouse"]] if fam["spouse"] else []
assert len({m["lastName"] for m in members}) == 1  # same surname

# 4. v2.0.3 enrichment fields
p = generate_user(seed=7)
assert "personalityTraits" in p and "educationTimeline" in p and "moviePreferences" in p
out = generate_persona(seed="011")
assert "fullPrompt" in out["persona"]
```

TypeScript equivalents: `generate`, `generateUser`, `generateFamily` (assert on
`.state`, `.firstName`, `.lastName`).

## 8. Common mistakes

- ❌ Using `seed` as a float (`7.5`) — use ints or strings.
- ❌ Expecting identical output between TS and Python for the same seed.
- ❌ Assuming the package reads Excel/CSV at runtime — it does not.
- ❌ Passing `--family` with `-f csv` — rejected; use json/jsonl.
- ❌ Forgetting `include_probability_metrics=False` when compact output is wanted.
