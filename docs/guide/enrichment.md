# Enrichment Layers

Beyond core demographics, the library offers four progressive depth layers —
designed for simulation, fairness audits and AI training data.

## The 4 layers

| Layer | Name | Description |
|-------|------|-------------|
| 1 | **Core Demographics** | State, gender, religion, caste, names, languages, biological markers, address |
| 2 | **Socio-Economic Outcomes** | CIBIL credit score, health risk, literacy, employment vulnerability (configurable bias) |
| 3 | **Narrative Documents** | Loan applications, OPD records, Hinglish WhatsApp chats, school admissions |
| 4 | **Agent Persona Prompts** | LLM-ready system prompts, worldview beliefs, stress responses, memory seeds |

## Layer 2 — Outcomes

Simulated socio-economic outcomes calibrated to CMIE/CIBIL observed gaps.

```bash
indian-fakedata -c 100 --outcomes
```

```python
from indian_fakedata import generate_enriched

enriched = generate_enriched(count=10, include_outcomes=True, bias_level=0.3)[0]
credit = enriched["outcomes"]["credit"]["creditScore"]
health = enriched["outcomes"]["health"]["healthRisk"]
```

### The bias dial

`bias_level` (CLI: `--bias <0-1>`) controls how strongly historical
discrimination shapes outcomes:

| Value | Meaning |
|---|---|
| `0.0` | Pure meritocracy |
| `0.3` | Default; calibrated to observed CMIE/CIBIL gaps |
| `1.0` | Max historical discrimination |

## Layer 3 — Narratives

Realistic Indian text documents generated from a profile:

| Type | Document |
|---|---|
| `loan_application` | Bank loan application text |
| `medical_consultation` | Doctor's OPD consultation record |
| `school_enrollment` | School admission form narrative |
| `ration_card_application` | PDS ration card application |
| `hinglish_conversation` | WhatsApp-style Hinglish chat |

```bash
indian-fakedata -c 1000 --narrative loan_application --narrative hinglish_conversation
```

```python
from indian_fakedata import generate, generate_narrative

profile = generate(count=1)[0]
doc = generate_narrative(profile, "loan_application")
print(doc["content"])
```

## Layer 4 — Agent personas

LLM-ready agent personas: system prompt, identity line, worldview beliefs,
economic behavior, stress responses, memory seeds and behavior rules.

```bash
indian-fakedata -c 500 --persona -f jsonl -o agents.jsonl
```

```python
from indian_fakedata import generate_persona

out = generate_persona(seed="011")
persona = out["persona"]

print(persona["systemPrompt"])     # ready to use as a chat system prompt
print(persona["beliefs"]["worldview"])
print(persona["memorySeeds"])      # conversation-starting memories
print(persona["behaviorRules"])    # what the agent will/won't do
```

## Everything at once

```bash
indian-fakedata -c 100 --enrich
```

`--enrich` = outcomes + all narrative types + persona.
