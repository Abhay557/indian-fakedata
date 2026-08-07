---
layout: home

hero:
  name: Indian Fake Data Generator
  text: Realistic synthetic Indian people, generated correctly
  tagline: Culturally accurate, statistically consistent mock Indian demographic profiles backed by Census 2011 — for Python and Node.js. One command, zero nonsense.
  image:
    src: /favicon.svg
    alt: Indian Fake Data Generator
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Try the Playground
      link: /playground/

features:
  - icon: 🧬
    title: Statistically consistent
    details: Religion, caste, state, language, education and income are correlated — no Sikh named Mohammed Sharma from Mizoram.
  - icon: 🇮🇳
    title: Census 2011 backed
    details: Hand-calibrated approximations from Census 2011, NFHS-5 and survey data bundled in — no runtime downloads.
  - icon: 🏠
    title: Whole families
    details: Generate a full household from one seed — head, spouse, parents, children and siblings with consistent surnames.
  - icon: 🎲
    title: Seeded & reproducible
    details: Seeds can be numbers or strings ('011'). Same seed, same person — every time, in your chosen runtime.
  - icon: 🪶
    title: Zero dependencies
    details: Both packages are dependency-free. Node 18+ or Python 3.8+, works offline.
  - icon: 🎭
    title: AI-training ready
    details: Optional layers add credit scores, narratives (loan apps, Hinglish chats) and LLM agent personas.
---

## Sample profile — `seed = 7` (Python implementation)

> The TypeScript implementation is independently deterministic: the same seed is
> reproducible within one implementation, but the two runtimes draw RNG streams
> differently.

```json
{
  "id": "33553413-2014-4616-9361-511204427271",
  "firstName": "Pushpa",
  "lastName": "Sharma",
  "fatherName": "Santosh Sharma",
  "motherName": "Geeta Sharma",
  "spouseName": "Sanjay Sharma",
  "gender": "female",
  "age": 34,
  "state": "Maharashtra",
  "district": "Solapur",
  "areaType": "urban",
  "religion": "Hindu",
  "caste": "Deshastha Brahmin",
  "socialCategory": "General",
  "motherTongue": "Marathi",
  "education": "secondary",
  "occupation": "agricultural_labourer",
  "maritalStatus": "married",
  "annualIncomeINR": 194000,
  "aadhaarNumber": "500233102039",
  "panNumber": "EKIPS1361D",
  "phoneNumber": "7501311043",
  "email": "pushpasharma352@gmail.com"
}
```

Install in seconds, generate in milliseconds:

```bash
pip install indian-fakedata              # Python
npm install @abhay557/indian-fakedata    # Node.js
```
