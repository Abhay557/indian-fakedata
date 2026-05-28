# Indian Fake Data Generator (TUTORIAL & CODE SNIPPETS)

This tutorial provides complete, drop-in code snippets demonstrating how to programmatically use the `indian-fakedata` library across **TypeScript (NPM)** and **Python (PyPI)**.

---

##  Table of Contents
1. [Core Generation (Standard Profiles)](#1-core-generation-standard-profiles)
2. [Advanced Demographics & Constraints](#2-advanced-demographics--constraints)
3. [Layered Enrichments (Outcomes, Narratives, Agent Personas)](#3-layered-enrichments-outcomes-narratives-agent-personas)
4. [Programmatic Dataset Exporting (JSON, JSONL, CSV)](#4-programmatic-dataset-exporting-json-jsonl-csv)
5. [Memory-Efficient Generation (Streaming)](#5-memory-efficient-generation-streaming)

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
  console.log(`Religion: ${p.religion} | Education: ${p.education}\n`);
});
```

### 
 Python
```python
from indian_fakedata import generate

# Generate 5 random profiles
profiles = generate(count=5)

for p in profiles:
    print(f"[{p['id']}] {p['firstName']} {p['lastName']} ({p['gender']}, {p['age']})")
    print(f"Location: {p['district']}, {p['state']} | Caste/Community: {p['caste']}")
    print(f"Religion: {p['religion']} | Education: {p['education']}\n")
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
