## Summary

<!--
Explain what this PR does and why. Link any related issues:
Fixes #123
-->

## Determinism Impact

The library guarantees that the same seed produces the same profile within a
version. Check any that apply:

- [ ] **Data change** - modifies name lists, weights, or aggregates in
      `src/database/` or `python/src/indian_fakedata/database/`
- [ ] **RNG order change** - alters the order of RNG draws
- [ ] **New field or option** - adds a field to profiles or a new generator
      option
- [ ] **No determinism impact** - docs, tests, tooling only

If any box above is checked, describe the expected effect on existing outputs
and note whether the TypeScript and Python runtimes were both updated.

## Tests

- [ ] TypeScript: `npm test` passes
- [ ] TypeScript: `npm run lint` (tsc --noEmit) passes
- [ ] Python: `pytest python/tests` passes
- [ ] Added/updated tests for the changed behavior

## Docs

- [ ] README updated (npm and/or PyPI) if user-facing behavior changed
- [ ] `docs/` (website branch) updated if public API changed

## Checklist

- [ ] No build artifacts committed (`dist/`, `*.whl`, `*.tar.gz`)
- [ ] No secrets or tokens committed
- [ ] Description of changes is clear enough for a maintainer to review