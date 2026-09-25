import { describe, expect, it } from 'vitest';

import { generate, simulateOutcomes, generateAllNarratives } from '../src/index.js';
import { buildSFTPairs, sftPairsToJsonl } from '../src/utils/sft.js';
import { createRNG } from '../src/core/sampler.js';

describe('SFT pair builder (v2.1.0, item 7)', () => {
  it('builds five grounded persona pairs without narratives', () => {
    const p = generate({ count: 1, seed: 71 })[0];
    const pairs = buildSFTPairs(p);
    expect(pairs).toHaveLength(5);
    for (const pair of pairs) {
      expect(pair.instruction.length).toBeGreaterThan(0);
      expect(pair.output.length).toBeGreaterThan(0);
      expect(pair.source).toBe('persona');
    }
    const blob = pairs.map(x => x.output).join(' ');
    expect(blob).toContain(p.firstName);
    expect(blob).toContain(p.district);
  });

  it('adds one comprehension pair per narrative document', () => {
    const p = generate({ count: 1, seed: 72 })[0];
    const outcomes = simulateOutcomes(p, 0.3, createRNG(72));
    const docs = generateAllNarratives(p, outcomes);
    const pairs = buildSFTPairs(p, docs);
    expect(pairs).toHaveLength(5 + docs.length);
    const reading = pairs.slice(5);
    for (const pair of reading) {
      expect(pair.input.length).toBeGreaterThan(50);
      expect(pair.output).toContain(p.firstName);
    }
    expect(new Set(reading.map(r => r.source)).size).toBe(docs.length);
  });

  it('serializes to valid JSONL', () => {
    const p = generate({ count: 1, seed: 73 })[0];
    const text = sftPairsToJsonl(buildSFTPairs(p));
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(5);
    for (const line of lines) {
      const row = JSON.parse(line);
      expect(row.instruction).toBeDefined();
      expect(row.output).toBeDefined();
      expect(row.source).toBeDefined();
    }
    expect(sftPairsToJsonl([])).toBe('');
  });

  it('is deterministic', () => {
    const p = generate({ count: 1, seed: 74 })[0];
    expect(buildSFTPairs(p)).toEqual(buildSFTPairs(p));
  });
});
