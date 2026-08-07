# Relational Data (Families)

New in the 2.0 releases: generate an entire household from a **single seed**.

```bash
indian-fakedata --family --seed 011 -f jsonl
```

```python
from indian_fakedata import generate_family

family = generate_family(seed="011")
```

```typescript
import { generateFamily } from '@abhay557/indian-fakedata';

const family = generateFamily({ seed: '011' });
```

## Output shape

```json
{
  "head":     { "...profile..." },
  "spouse":   { "...profile..." },
  "parents":  { "father": { "...profile..." }, "mother": { "...profile..." } },
  "children": [ { "...profile..." } ],
  "siblings": [ { "...profile..." } ]
}
```

- `spouse` is present only when the head is married.
- `parents.father` / `parents.mother` are present when the head's age allows.
- `children` and `siblings` are arrays (possibly empty).

## Consistency guarantees

Every member of the family is consistent with the head:

- **Same surname** (children also inherit the father's surname)
- **Same state, district, religion, caste, social category**
- **Logically ordered ages** — parents are older than the head; children are
  younger; siblings are close in age to the head
- **Spouse has opposite gender** to the head
- **Same surname constraint applies** when you pin `surname` in constraints

## Options

`FamilyOptions` (TS) / `generate_family(...)` params (Python):

| Option | Description |
|---|---|
| `seed` | Number or string seed; default random |
| `constraints` | Same as `generate` — inherited by the head, then propagated |
| `includeProbabilityMetrics` | Include per-profile probability chains |

## Seeds

Seeds can be numbers or strings. `"011"` is a string seed — supported by both
runtimes. Same seed → same family, within a runtime.

## Programmatic example

```python
from indian_fakedata import generate_family

family = generate_family(seed="011", constraints={"state": "Punjab"})

head = family["head"]
print(head["firstName"], head["lastName"], "|", head["state"])

for child in family["children"]:
    assert child["lastName"] == head["lastName"]
    assert child["age"] < head["age"]

if family["spouse"]:
    assert family["spouse"]["gender"] != head["gender"]
```
