---
title: Live Playground
---

# Live Playground

Generate a real profile right in your browser — the TypeScript implementation
is bundled and runs locally, no server involved. Python outputs are shown as
pre-computed tabs.

<LivePlayground />

::: warning Runtime caveat
The TypeScript and Python implementations are each independently deterministic:
the same seed reproduces the same person **within one implementation**, but the
two runtimes draw RNG streams differently. So `seed = 7` here (TS) will not
match the Python README sample (Pushpa Sharma) exactly.
:::
