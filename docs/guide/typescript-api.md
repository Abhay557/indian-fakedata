# TypeScript / Node.js API

```bash
npm install @abhay557/indian-fakedata
```

Requires **Node.js ≥ 18**. Zero runtime dependencies. ES module, type
definitions included.

## Core generation

```typescript
import { generate, generateStream, getDistributionSummary } from '@abhay557/indian-fakedata';

// Generate 5 profiles
const profiles = generate({ count: 5 });

// Seeded + constrained
const tn = generate({
  count: 3,
  seed: '011',                    // numbers or strings
  constraints: {
    state: 'Tamil Nadu',
    gender: 'female',
    areaType: 'rural',
    minAge: 18,
    maxAge: 45,
  },
});

// Memory-efficient stream for large datasets
for (const p of generateStream({ count: 100000 })) {
  // process one by one
}

// Distribution summary (national religion frequencies, etc.)
const summary = getDistributionSummary();
```

### `GeneratorOptions`

| Field | Type | Description |
|---|---|---|
| `count` | `number` | Number of profiles (default `1`) |
| `seed` | `number \| string` | Reproducibility seed (default random) |
| `constraints` | `GenerationConstraints` | Demographic filters (below) |
| `includeProbabilityMetrics` | `boolean` | Include probability chain (default `true`) |

### `GenerationConstraints`

| Field | Values |
|---|---|
| `state` | e.g. `'Maharashtra'`, `'Tamil Nadu'` |
| `gender` | `'male' \| 'female' \| 'other'` |
| `religion` | `'Hindu' \| 'Muslim' \| 'Christian' \| 'Sikh' \| 'Buddhist' \| 'Jain'` |
| `caste` | e.g. `'Brahmin'`, `'Maratha'`, `'Jat'` |
| `socialCategory` | `'SC' \| 'ST' \| 'OBC' \| 'General'` |
| `areaType` | `'urban' \| 'rural'` |
| `minAge` / `maxAge` | `number` (0–100) |
| `education` | `EducationLevel` string |
| `occupation` | `OccupationalSector` string |
| `maritalStatus` | `MaritalStatus` string |
| `surname` | Pin an exact surname (used by family generation) |

## Enrichment API

```typescript
import {
  generateEnriched,
  generateEnrichedStream,
  simulateOutcomes,
  generateNarrative,
  generateAllNarratives,
  generateAgentPersona,
} from '@abhay557/indian-fakedata';

const enriched = generateEnriched({
  count: 1,
  includeOutcomes: true,      // Layer 2: credit score, health risk, wages
  narrativeTypes: ['all'],    // Layer 3: loan apps, Hinglish chats, OPD records
  includeAgentPersona: true,  // Layer 4: LLM system prompt & worldview
  biasLevel: 0.3,             // 0.0 meritocracy → 1.0 max historical bias
})[0];

console.log(enriched.profile.firstName, enriched.outcomes.credit.creditScore);
console.log(enriched.agentPersona.systemPrompt);
```

## User / Family / Persona (faker-style)

```typescript
import {
  generateUser,
  generateUsers,
  generateFamily,
  generatePersona,
} from '@abhay557/indian-fakedata';

// One profile (README sample shape)
const user = generateUser({ seed: 7 });

// Many users from one seed
const users = generateUsers({ count: 5, seed: '011' });

// A highly educated female developer from Karnataka
const dev = generateUser({
  highlyEducated: true,
  gender: 'female',
  constraints: { state: 'Karnataka' },
});

// Whole household: spouse, parents, children, siblings
const family = generateFamily({ seed: '011' });
// family: { head, spouse?, parents: { father?, mother? }, children: [], siblings: [] }

// User + LLM-ready persona
const { user: u, persona } = generatePersona({ seed: '011' });
// persona.systemPrompt, persona.beliefs, persona.memorySeeds, persona.behaviorRules
```

## Exporters

```typescript
import { generateEnriched, saveProfilesToFile, formatProfiles } from '@abhay557/indian-fakedata';

const dataset = generateEnriched({ count: 50, includeOutcomes: true });

saveProfilesToFile(dataset, './output.json', 'json');
saveProfilesToFile(dataset, './output.jsonl', 'jsonl');
saveProfilesToFile(dataset, './output.csv', 'csv');  // flattened automatically
const csvString = formatProfiles(dataset, 'csv');
```

## Custom data

```typescript
import { loadDatabase, getDefaultDatabase } from '@abhay557/indian-fakedata';

// Merge custom JSON files (states.json, religions.json, casteMap.json,
// firstNames.json, surnames.json, districts.json) from a directory
const db = loadDatabase('./my-data-dir');
```

## Core types

`DemographicProfile`, `GeneratorOptions`, `GenerationConstraints`,
`ProbabilityMetrics`, `EnrichmentOptions`, `EnrichedProfile`, `Gender`,
`EducationLevel`, `OccupationalSector`, `MaritalStatus`, `AreaType`,
`SocialCategory`, `BloodGroup`, `DietaryPreference`, `EmploymentSector`,
`RationCardType`, `HealthInsuranceType`, `DisabilityType`, `PoliticalLeaning`,
`ReligiosityLevel`, `BigFivePersonality`, `CognitiveProfile`, `Interests`,
`Habits`, `EducationDetails`, `CulturalProfile`, `HouseholdAssets`,
`CompiledDatabase`, `SeededRNG`, `UserOptions`, `UsersOptions`,
`FamilyOptions`, `FamilyUnit`, `SimulatedOutcomes`, `NarrativeDocument`,
`AgentPersona`.

## Low-level utilities (advanced)

`createRNG`, `weightedSample`, `weightedSampleFromRecord` — for building custom
generation logic on the same seeded RNG core.
