# Changelog — indian-fakedata

Both runtimes (`@abhay557/indian-fakedata` on npm, `indian-fakedata` on
PyPI) are versioned and released in lockstep. Reproducibility is guaranteed
within one version; across versions it is not.

## 2.1.0

- **Occupation now follows education (breaking).** Occupation used to be
  sampled independently of schooling, so graduates routinely rolled farm
  jobs. The occupation weights are now conditioned on education:
  graduates skew strongly white-collar, the unschooled toward farm work.
  Same draw count, so the stream layout is intact, but occupation-driven
  fields (sector, income, timelines, personas) resolve differently than
  2.0.9 for the same seed. Explicit `occupation` constraints still win.
- **Employment timeline keyed by occupation.** Timeline stages used the
  employment sector for titles and occupation labels, which produced
  mismatches (cultivators titled "Kirana Shop Owner", informal
  `other_worker` profiles relabelled `agricultural_labourer`). Stages now
  derive titles and occupation from the profile's own occupation; only
  `non_worker` histories sample a past sector. `sector` still mirrors
  `employmentSector`, so the two always agree. The key moved from the end
  of the profile to right below `occupation`; values are unchanged.
- **Jobs match the degree.** The current timeline spell draws from the
  profile's field of study, and every sector title pool grew. Doctor-grade
  titles additionally require a professional degree.
- **Native script output.** Every profile carries `nativeScript` with names,
  district and address transliterated into the mother-tongue script
  (Devanagari, Bengali, Gujarati, Gurmukhi, Kannada, Malayalam, Tamil,
  Telugu, Odia; Latin passthrough otherwise). Pure string mapping, no RNG
  draws, so seeded output is untouched. `transliterate()` /
  `transliterate()` and `scriptForLanguage()` / `script_for_language()`
  are exported for prompts and free text.
- **Life events timeline.** Every profile carries `lifeEvents` with dated
  birth, marriage, children, migration, job-switch and retirement events,
  cross-checked against age, marital status, child count, migration flag
  and both existing timelines.
- **Household economy kit.** Every profile carries `householdEconomy` with
  a monthly budget split summing exactly to expenditure, 0-2 affordable
  loans with real EMI math (total EMI capped at 60% of income), and a
  credit history whose score bands track missed payments.
- **Festival calendar.** Every profile carries `festivals` with observances
  dated for the current year, driven by religion and state: pan-Indian
  festivals from the profile's religion plus regional ones that stay in
  their states (Pongal, Bihu, Onam, Durga Puja, Chhath, Teej, Baisakhi,
  Ganesh Chaturthi). Lunisolar dates are typical, not exact. Festival names
  flow into persona memory seeds and Hinglish chats.
- **SFT pair builder.** `buildSFTPairs()` / `build_sft_pairs()` turn a
  profile (plus optional narratives) into grounded instruction/response
  pairs with `sftPairsToJsonl()` / `sft_pairs_to_jsonl()` JSONL export.
- **Grounded QA pairs.** `buildQAPairs()` / `build_qa_pairs()` turn a
  profile into question/answer pairs for retrieval and comprehension
  evaluation. Every answer is templated from profile fields and carries
  `citations`, the exact field paths it was built from.
- **Eval harness.** `evaluateDataset()` / `evaluate_dataset()` score any
  batch with one quality number built from census drift, schema validity
  and internal consistency, plus a `--eval` command in both CLIs.
- **Geospatial points.** Every profile carries `geo` with an approximate
  latitude/longitude drawn around the state capital, tighter for urban
  profiles, clamped inside a generous state bounding box. District-level
  polygons are not bundled, so points are district-approximate, not
  rooftop-accurate.

## 2.0.9

- **Employment timeline.** New `employmentTimeline` on every profile:
  chronological job spells (`jobTitle`, `sector`, `occupation`,
  `employerType`, `startYear`, `endYear`, `status`, `monthlyWageINR`,
  `location`). Wages climb towards the current income. Empty for students,
  the unemployed and children; completed-only for retirees.
- **Skills block.** New `skills` on every profile: `technical` and `soft`
  lists, `certifications`, and per-language speaking/reading/writing levels
  (`basic` / `intermediate` / `fluent` / `native`).
- **New narratives.** Layer 3 gains `resume` (CV from education timeline,
  work history and skills) and `customer_support_chat` (Hinglish helpline
  dialogue, masked phone). Appended at the end of `generateAllNarratives`.
- **Persona languages.** Layer 4 accepts `english` / `hindi` / `hinglish`
  (`generateAgentPersona`, `generateEnriched`, `generatePersona`, CLI
  `--persona-lang`). Hindi renders Devanagari + Hindi headers; default
  english output is unchanged.
- **CLI output shaping.** `--fields` (comma-separated, repeatable, dot
  paths, all formats) and `--stats` (stderr distribution summary).
- **Schema + validation.** `getProfileSchema()` / `get_profile_schema()`
  export a versioned JSON Schema (canonical file:
  `schema/profile-2.0.9.json`); `validateProfile()` / `validate_profile()`
  check required fields, enums and provenance markers.
- **PII stripping.** `stripPII()` / `strip_pii()` return a share-safe copy
  with identifiers emptied, shape and provenance kept, `piiStripped: true`
  marker, optional name masking.
- Stability: F1/F2 run on isolated per-profile RNG streams, so `id` and
  every <= 2.0.8 field for a given seed are byte-identical (verified over
  200 seeded profiles in both runtimes).

## 2.0.8

- New nested `appearance` object (face, skin tone, eyes, hair, build).
- Adult `heightCm` shifted by broad geographic region; skin tone uses named
  buckets (`fair`, `wheatish`, `brown`, `deep_brown`, `dark`).
- Agent personas describe appearance in the system prompt.

## 2.0.7

- Correctness release: fixed the Python mulberry32 RNG bias (signed shifts
  skewed every weighted choice) and the DOB/age off-by-one drift.

## 2.0.6

- Provenance markers on every profile: `"synthetic": true` and
  `"generator": "indian-fakedata@<version>"`.

## 2.0.5

- Fixed `generate_enriched` crashing on string seeds such as `"011"`.

## 2.0.4

- Data-pool expansion: 760 districts, 471 surnames, Jain/Buddhist/Muslim/
  Christian first names, 130+ anime titles, more address localities.
  Seeds may resolve to different people than <= 2.0.3.

## 2.0.3

- Added `educationTimeline`, `personalityTraits` and `moviePreferences` to
  every profile.
