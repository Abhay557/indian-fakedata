---
name: Feature request
about: Suggest an idea for this project
title: "[Feature] "
labels: enhancement
assignees: ''
---

**Is your feature request related to a problem?**
A clear and concise description of the problem, e.g. "I can't generate X".

**Proposed solution**
A clear and concise description of what you want to happen.

**API sketch**
How you imagine the API (option names, return shape):

```text
PASTE API SKETCH HERE
```

**Determinism impact**
Check any that apply:

- [ ] Adds a new data field to the generated profile
- [ ] Changes or reorders name lists / weights
- [ ] Changes RNG draw order
- [ ] No impact on existing seeded output

This matters because the library guarantees the same seed always produces
the same profile within a version. If your feature changes existing output,
maintainers may require a major version bump.

**Alternatives considered**
Any alternative solutions or workarounds you considered.

**Additional context**
Anything else worth knowing.