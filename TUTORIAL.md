# Indian Fake Data Generator (TUTORIAL & CODE SNIPPETS)

This tutorial provides complete, drop-in code snippets demonstrating how to programmatically use the `indian-fakedata` library across **TypeScript (NPM)** and **Python (PyPI)**.

---

##  Table of Contents
1. [Core Generation (Standard Profiles)](#1-core-generation-standard-profiles)
2. [Advanced Demographics & Constraints](#2-advanced-demographics--constraints)
3. [Layered Enrichments (Outcomes, Narratives, Agent Personas)](#3-layered-enrichments-outcomes-narratives-agent-personas)
4. [Programmatic Dataset Exporting (JSON, JSONL, CSV)](#4-programmatic-dataset-exporting-json-jsonl-csv)
5. [Memory-Efficient Generation (Streaming)](#5-memory-efficient-generation-streaming)
6. [New in 2.0.9 (Work History, Skills, Personas, Trust)](#6-new-in-209-work-history-skills-personas-trust)
7. [New in 2.1.0 (Native Script Output)](#7-new-in-210-native-script-output)

---

## 1. Core Generation (Standard Profiles)
Generate realistic Indian demographic profiles where names, religion, state, caste, area types, and assets are naturally linked together.

###  TypeScript
```typescript
import { generate } from '@abhay557/indian-fakedata';

// Generate 5 random profiles
const profiles = generate({ count: 5 });

profiles.forEach(p => {
  console.log(`[${p.id}] ${p.firstName} ${p.lastName} (${p.gender}, ${p.age})`);
  console.log(`Location: ${p.district}, ${p.state} | Caste/Community: ${p.caste}`);
  console.log(`Religion: ${p.religion} | Education: ${p.education}`);
  console.log(`Traits: ${p.personalityTraits.traitLabels.join(', ')}`);
  console.log(`Timeline: ${p.educationTimeline.map(s => `${s.institutionName} (${s.startYear}-${s.endYear})`).join(' -> ')}`);
  console.log(`Movies: ${p.moviePreferences.genres.join(', ')} | Anime: ${p.moviePreferences.anime}\n`);
});
```

###  Python
```python
from indian_fakedata import generate

# Generate 5 random profiles
profiles = generate(count=5)

for p in profiles:
    print(f"[{p['id']}] {p['firstName']} {p['lastName']} ({p['gender']}, {p['age']})")
    print(f"Location: {p['district']}, {p['state']} | Caste/Community: {p['caste']}")
    print(f"Religion: {p['religion']} | Education: {p['education']}")
    print(f"Traits: {', '.join(p['personalityTraits']['traitLabels'])}")
    print(f"Timeline: {' -> '.join(f\"{s['institutionName']} ({s['startYear']}-{s['endYear']})\" for s in p['educationTimeline'])}")
    print(f"Movies: {', '.join(p['moviePreferences']['genres'])} | Anime: {p['moviePreferences']['anime']}\n")
```

---

## 2. Advanced Demographics & Constraints
Use constraints to generate specific demographic slices for simulation testing, bias audits, or localized datasets.

###  TypeScript
```typescript
import { generate } from '@abhay557/indian-fakedata';

// Generate 3 profiles representing rural women in Tamil Nadu
const filteredProfiles = generate({
  count: 3,
  constraints: {
    state: 'Tamil Nadu',
    gender: 'female',
    areaType: 'rural',
    minAge: 18,
    maxAge: 45
  }
});

console.log(JSON.stringify(filteredProfiles, null, 2));
```

###  Python
```python
from indian_fakedata import generate

# Generate 3 profiles representing rural women in Tamil Nadu
filtered_profiles = generate(
    count=3,
    constraints={
        "state": "Tamil Nadu",
        "gender": "female",
        "areaType": "rural",
        "minAge": 18,
        "maxAge": 45
    }
)

import json
print(json.dumps(filtered_profiles, indent=2))
```

---

## 3. Layered Enrichments (Outcomes, Narratives, Agent Personas)
Add Layer 2 (simulated financial & health outcomes), Layer 3 (written narratives), and Layer 4 (LLM agent persona system prompts) to your mock data.

###  TypeScript
```typescript
import { generateEnriched } from '@abhay557/indian-fakedata';

const enriched = generateEnriched({
  count: 1,
  includeOutcomes: true,      // Layer 2: credit Score, drops, wage metrics
  narrativeTypes: ['all'],    // Layer 3: loan apps, Hinglish WhatsApp chats, OPD records
  includeAgentPersona: true,  // Layer 4: LLM system prompt & worldview beliefs
  biasLevel: 0.3              // Gaps based on socio-economic realities (0.0 to 1.0)
})[0];

console.log("=== PROFILE ===");
console.log(`${enriched.profile.firstName} is a ${enriched.profile.occupation}.`);

console.log("\n=== SIMULATED CREDIT SCORE (LAYER 2) ===");
console.log(`Score: ${enriched.outcomes.credit.creditScore} (CIBIL)`);

console.log("\n=== HINGLISH WHATSAPP CHAT (LAYER 3) ===");
const chat = enriched.narratives.find(d => d.type === 'hinglish_conversation');
console.log(chat?.content);

console.log("\n=== LLM SYSTEM PROMPT (LAYER 4) ===");
console.log(enriched.agentPersona.systemPrompt);

console.log("\n=== FULL ROLEPLAY PROMPT (v2.0.4) ===");
console.log(enriched.agentPersona.fullPrompt);
```

###  Python
```python
from indian_fakedata import generate_enriched

enriched = generate_enriched(
    count=1,
    include_outcomes=True,       # Layer 2
    narrative_types=['all'],     # Layer 3
    include_agent_persona=True,  # Layer 4
    bias_level=0.3
)[0]

print("=== PROFILE ===")
print(f"{enriched['profile']['firstName']} is a {enriched['profile']['occupation']}.")

print("\n=== SIMULATED CREDIT SCORE (LAYER 2) ===")
print(f"Score: {enriched['outcomes']['credit']['creditScore']} (CIBIL)")

print("\n=== HINGLISH WHATSAPP CHAT (LAYER 3) ===")
chat = next(d for d in enriched['narratives'] if d['type'] == 'hinglish_conversation')
print(chat['content'])

print("\n=== LLM SYSTEM PROMPT (LAYER 4) ===")
print(enriched['agentPersona']['systemPrompt'])

print("\n=== FULL ROLEPLAY PROMPT (v2.0.4) ===")
print(enriched['agentPersona']['fullPrompt'])
```

### Persona-only (faker-style, v2.0.4)

Generate just the user + LLM-ready persona (short system prompt and a complete
self-contained roleplay prompt) without the other enrichment layers:

####  TypeScript
```typescript
import { generatePersona } from '@abhay557/indian-fakedata';

const { user, persona } = generatePersona({ seed: '011' });

console.log(user.personalityTraits.summary);
console.log(user.educationTimeline);   // chronological school/college history
console.log(user.moviePreferences);    // genres, languages, anime preferences
console.log(persona.systemPrompt);     // short, ready-to-use system prompt
console.log(persona.fullPrompt);       // full roleplay prompt for any LLM
```

####  Python
```python
from indian_fakedata import generate_persona

out = generate_persona(seed="011")
user, persona = out["user"], out["persona"]

print(user["personalityTraits"]["summary"])
print(user["educationTimeline"])   # chronological school/college history
print(user["moviePreferences"])    # genres, languages, anime preferences
print(persona["systemPrompt"])     # short, ready-to-use system prompt
print(persona["fullPrompt"])       # full roleplay prompt for any LLM
```

---

## 4. Programmatic Dataset Exporting (JSON, JSONL, CSV)
Save generated mock datasets directly to files using zero-dependency, high-fidelity exporters. 

###  TypeScript
```typescript
import { generateEnriched, saveProfilesToFile } from '@abhay557/indian-fakedata';

const dataset = generateEnriched({
  count: 50,
  includeOutcomes: true,
  includeAgentPersona: true
});

// Save to disk in JSON, JSONL, or CSV formats
saveProfilesToFile(dataset, './output_profiles.json', 'json');
saveProfilesToFile(dataset, './output_profiles.jsonl', 'jsonl');
saveProfilesToFile(dataset, './output_profiles.csv', 'csv'); // Flattened automatically
```

###  Python
```python
from indian_fakedata import generate_enriched, save_profiles

dataset = generate_enriched(
    count=50,
    include_outcomes=True,
    include_agent_persona=True
)

# Save to disk in JSON, JSONL, or CSV formats
save_profiles(dataset, "./output_profiles.json", "json")
save_profiles(dataset, "./output_profiles.jsonl", "jsonl")
save_profiles(dataset, "./output_profiles.csv", "csv") # Flattened automatically
```

---

## 5. Memory-Efficient Generation (Streaming)
Generate massive population databases (100,000+ entries) without memory exhaustion using stream generators.

###  TypeScript
```typescript
import { generateEnrichedStream } from '@abhay557/indian-fakedata';

const stream = generateEnrichedStream({
  count: 100000,
  includeOutcomes: true
});

let count = 0;
for (const enrichedProfile of stream) {
  count++;
  if (count % 10000 === 0) {
    console.log(`Generated ${count} profiles...`);
  }
}
```

###  Python
```python
from indian_fakedata import generate_enriched_stream

stream = generate_enriched_stream(
    count=100000,
    include_outcomes=True
)

count = 0
for enriched_profile in stream:
    count += 1
    if count % 10000 == 0:
        print(f"Generated {count} profiles...")
```

---

## 6. New in 2.0.9 (Work History, Skills, Personas, Trust)

> v2.1.0 note: timeline stages follow the profile's own `occupation` for
> titles and labels (a cultivator gets farm titles like "Paddy Farmer",
> never shop titles), and the current job follows the field of study, so
> education and employment timelines agree. The key sits right below
> `occupation` in the profile. `sector` mirrors `employmentSector` as before.

###  TypeScript
```typescript
import {
  generate, generateAgentPersona, validateProfile, stripPII,
} from '@abhay557/indian-fakedata';

const user = generate({ count: 1, seed: 7 })[0];
console.log(user.employmentTimeline);  // chronological job spells
console.log(user.skills);              // skills, certs, language levels
const hindi = generateAgentPersona(user, { language: 'hindi' });

const { valid, errors } = validateProfile(user);
const safe = stripPII(user);           // share-safe copy
```

###  Python
```python
from indian_fakedata import (
    generate, generate_agent_persona, validate_profile, strip_pii,
)

user = generate(count=1, seed=7)[0]
print(user["employmentTimeline"])  # chronological job spells
print(user["skills"])              # skills, certs, language levels

hindi = generate_agent_persona(user, "hindi")

result = validate_profile(user)    # {"valid": ..., "errors": [...]}
safe = strip_pii(user)             # share-safe copy
```

###  CLI
```bash
# Slim output plus distribution summary
indian-fakedata -c 100 --fields firstName,state,appearance.skinTone --stats -f jsonl

# Sanitised Hindi personas, validated
indian-fakedata -c 50 --persona --persona-lang hindi --strip-pii --validate -f jsonl -o agents.jsonl
```

## 7. New in 2.1.0 (Native Script Output)

###  TypeScript
```typescript
import { generate, transliterate, scriptForLanguage } from '@abhay557/indian-fakedata';

const user = generate({ count: 1, seed: 7 })[0];
console.log(user.nativeScript);
// { script: 'Devanagari', language: 'Hindi', firstName: '...', ... }

const script = scriptForLanguage(user.motherTongue); // 'Devanagari', 'Tamil', ... or 'Latin'
console.log(transliterate('Pushpa Sharma', script));
```

###  Python
```python
from indian_fakedata import generate, transliterate, script_for_language

user = generate(count=1, seed=7)[0]
print(user["nativeScript"])

script = script_for_language(user["motherTongue"])
print(transliterate("Pushpa Sharma", script))
```
