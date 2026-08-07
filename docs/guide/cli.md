# CLI Reference

Both packages ship an identical `indian-fakedata` CLI binary.

```bash
# Node.js
npx @abhay557/indian-fakedata [options]

# Python (or globally installed Node package)
indian-fakedata [options]
```

Run with no arguments to display the full help screen.

## Core options

| Flag | Alias | Description | Default |
|------|-------|-------------|---------|
| `--count <n>` | `-c` | Number of profiles to generate | `100` |
| `--output <path>` | `-o` | File path to save output | stdout |
| `--format <fmt>` | `-f` | Output format: `json`, `jsonl`, `csv` | `json` |
| `--seed <value>` | `-s` | Reproducibility seed (number or string, e.g. `011`) | random |
| `--no-metrics` | | Exclude probability metrics from output | included |
| `--family` | | Full household (head + spouse + parents + children + siblings) from one seed; json/jsonl only | off |
| `--help` | `-h` | Show help screen | |

## Demographic constraints

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

## Enrichment layers (progressive depth)

| Flag | Description |
|------|-------------|
| `--enrich` | Enable ALL enrichment layers (outcomes + narrative:all + persona) |
| `--outcomes` | **[Layer 2]** Add credit score, health risk, employment outcome, education attainment |
| `--bias <0-1>` | Bias dial for outcome simulation. `0.0` = pure meritocracy, `1.0` = max historical discrimination. Default `0.3` (calibrated to CMIE/CIBIL observed gaps) |
| `--narrative <type>` | **[Layer 3]** Realistic Indian text documents: `loan_application`, `medical_consultation`, `school_enrollment`, `ration_card_application`, `hinglish_conversation`, `all`. Repeat for multiple types |
| `--persona` | **[Layer 4]** LLM-ready agent persona (system prompt, beliefs, memory seeds, behavior rules) |

## Quick examples

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

# Full family from one string seed
indian-fakedata --family --seed 011
```

## Notes

- `--family` rejects CSV output (nested structure doesn't flatten cleanly).
- String seeds are hashed (FNV-1a); numeric seeds are used directly.
- Output is UTF-8 everywhere; on Windows, stdout is wrapped to avoid cp1252 errors.
