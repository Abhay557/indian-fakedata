# Contributing to indian-fakedata

Thanks for your interest in contributing. This project is a small library, so a
little coordination goes a long way. Please read this guide before opening an
issue or a pull request.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Layout](#project-layout)
- [Development Setup](#development-setup)
- [Determinism Is a Contract](#determinism-is-a-contract)
- [How to Contribute](#how-to-contribute)
- [Style and Quality Checks](#style-and-quality-checks)
- [Testing](#testing)
- [Documentation](#documentation)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Read it
before participating.

## Project Layout

The repository contains two independent implementations plus the website:

```
src/                  TypeScript implementation (source)
  database/           Census-2011-derived name/aggregate data
tests/                TypeScript tests (vitest)
scripts/              Tooling scripts (downloads, sample precompute)
dist/                 TypeScript build output (not committed)
python/               Python package (src/indian_fakedata/, pytest)
docs/                 Static documentation website (website branch)
```

Both implementations expose the same API surface and must stay in sync:

- `generateUser` / `generate` (bulk)
- `generateFamily`
- `generatePersona` (found in `relational-data` docs)
- CLI with `--seed`, `--count`, `--state`, `--gender`, `--religion`,
  `--family` flags

## Development Setup

### TypeScript

Requires Node.js >= 18.

```bash
npm install
npm run build   # tsc -> dist/
npm test        # vitest
npm run lint    # tsc --noEmit
```

### Python

Requires Python >= 3.8.

```bash
pip install -e "python[dev]"
pytest python/tests
```

## Determinism Is a Contract

The single most important property of this library:

> The same seed must always produce the same profile, within a given
> implementation and version.

This means:

- Changing any name list, weight, or RNG order **changes every downstream
  output**. Treat data edits as breaking changes: bump the version and note the
  impact in the PR.
- Do not add randomness sources (time, Math.random, os entropy) to the
  generation path. Seeds must fully determine output.
- The TypeScript and Python runtimes are independently deterministic; the same
  seed across runtimes may produce different people. This is intentional and
  documented.

## How to Contribute

### Reporting Bugs

Open an issue using the [Bug report](.github/ISSUE_TEMPLATE/bug_report.md)
template. Include the exact version, the seed used, expected vs. actual output,
and whether it reproduces in TypeScript, Python, or both.

### Suggesting Features

Open an issue using the
[Feature request](.github/ISSUE_TEMPLATE/feature_request.md) template. Note if
the feature affects the determinism contract (see above).

### Pull Requests

1. Fork the repository and create a branch from `main`.
2. Make your change with focused commits.
3. Run the full test suite and linter (see below).
4. Open a pull request against `main` using the
   [pull request template](.github/PULL_REQUEST_TEMPLATE.md).

Small, focused PRs are preferred over large diffs. If a change touches data or
RNG order, call it out explicitly — maintainers will verify determinism.

## Style and Quality Checks

- TypeScript: strict mode via `tsc --noEmit` (`npm run lint`).
- Python: PEP 8 conventions, no external runtime dependencies.
- Tests must pass: `npm test` and `pytest python/tests`.
- Do not commit build artifacts (`dist/`, `*.whl`, `*.tar.gz`).

Failing checks will block the merge.

## Testing

- TypeScript tests live in `tests/` and run with `npm test`.
- Python tests live in `python/tests/` and run with pytest.
- When you add a generator option or field, add tests covering: default
  behavior, seeded reproducibility, and boundary values.

## Documentation

- API and user documentation lives in `docs/` on the **`website`** branch and
  is deployed to Vercel. Refresh it when public behavior changes.
- README files (root and `python/`) document npm and PyPI usage respectively.
- `SKILL.md` in the repository root describes the library for AI agents. Keep
  its examples matching real output (same seeding rules).
- Documentation may not contain emojis.

## Release Process

Maintainers cut releases in lockstep:

1. Bump `version` in `package.json` and `python/pyproject.toml`
   (and `__init__.py`).
2. TypeScript: `npm publish` (runs `prepublishOnly` build).
3. Python: build `python/dist/` and upload to PyPI.
4. Bump the website's documented version if it shows one.

PRs do not need to bump versions; maintainers handle that at release time.