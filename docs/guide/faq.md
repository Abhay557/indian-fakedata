# FAQ

## Which package do I use?

| Need | Install |
|---|---|
| Node.js / TypeScript | `npm install @abhay557/indian-fakedata` |
| Python | `pip install indian-fakedata` |

Both ship the same CLI (`indian-fakedata`), the same features, and the same
v2.0.2 version number.

## Do I need a database or internet connection?

No. Both packages are zero-dependency and fully offline. The demographic
database is bundled inside the package (TypeScript constants / JSON files).

## Are these real people?

No. Every record is synthetically generated. Names, IDs, phone numbers and
addresses are fabricated and do not correspond to any real individual. Aadhaar
numbers use a valid Verhoeff checksum format but are not real.

## Will the same seed always give the same person?

Yes — **within the same runtime**. `seed=7` reproduces the README sample
(Pushpa Sharma, Maharashtra, Solapur) in Python. The TypeScript and Python
implementations draw RNG streams differently, so the same seed gives different
(but each reproducible) results across runtimes.

## Can seeds be strings?

Yes. `--seed 7` and `--seed "011"` both work. String seeds are hashed with
FNV-1a internally.

## What does `--family` do?

Generates a complete household from one seed: head, spouse (if married),
parents, children and siblings — all sharing surname, state, religion and
caste, with logically ordered ages. CSV output is not supported for families.

## Why does the sample output show `probabilityMetrics`?

It exposes the conditional probability chain behind each profile
(`nationalReligionFreq → stateGivenReligion → ... → jointProbability`). Pass
`--no-metrics` (CLI) or `includeProbabilityMetrics: false` (TS) /
`include_probability_metrics=False` (Python) to hide it.

## What is the `--bias` dial?

It controls how strongly historical socio-economic discrimination shapes
Layer-2 outcomes (credit score, health, employment). `0.0` = pure meritocracy,
`1.0` = max historical discrimination, default `0.3` (calibrated to CMIE/CIBIL
observed gaps).

## Where do the statistics come from?

Census 2011, NFHS-5, MSME census, UIDAI/RTO formats and CSDS election studies.
The bundled distributions are **hand-calibrated approximations** of published
aggregates — see [Data Accuracy & Sources](/guide/data-accuracy).

## Can I use custom names or data?

Yes. `loadDatabase(dataDir)` (TS) / `load_database(data_dir)` (Python) merges
JSON files named `states.json`, `religions.json`, `casteMap.json`,
`firstNames.json`, `surnames.json`, `districts.json` from a directory, taking
priority over built-ins.

## Does it work in the browser?

The TypeScript package can be bundled for the browser (as the
[Playground](/playground/) demonstrates) — the only Node built-in it touches is
`fs`, used solely by the optional custom-data loader.

## I found a distribution that looks wrong.

Open an issue on GitHub. Calibration fixes are welcome — the project prefers
documented approximations over silent fabrication.

## License?

MIT. Use it in production, research, or AI training pipelines — attribution
appreciated, not required.
