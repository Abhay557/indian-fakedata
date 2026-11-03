import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('generator edge cases', () => {
  it('defaults to one profile when no options are given', () => {
    const profiles = generate();
    expect(profiles).toHaveLength(1);
  });

  it('returns an empty array for count 0', () => {
    const profiles = generate({ count: 0, seed: 1 });
    expect(profiles).toEqual([]);
  });

  it('supports seed 0 as a valid numeric seed', () => {
    const first = generate({ count: 3, seed: 0 });
    const second = generate({ count: 3, seed: 0 });
    expect(first.map((p) => ({ ...p, generatedAt: 'same' }))).toEqual(
      second.map((p) => ({ ...p, generatedAt: 'same' })),
    );
  });

  it('generates different profiles without a seed', () => {
    const first = generate({ count: 5 });
    const second = generate({ count: 5 });
    expect(first[0].id).not.toBe(second[0].id);
  });

  it('includeProbabilityMetrics false leaves an empty probabilityMetrics object', () => {
    const profiles = generate({ count: 3, seed: 5, includeProbabilityMetrics: false });
    for (const p of profiles) {
      // The key stays so the profile stays schema-valid, but it is empty
      expect(p.probabilityMetrics).toEqual({});
    }
  });

  it('probability metrics are present by default', () => {
    const profiles = generate({ count: 3, seed: 5 });
    for (const p of profiles) {
      expect(p.probabilityMetrics).toBeDefined();
    }
  });

  it('generates unique ids within a batch', () => {
    const profiles = generate({ count: 100, seed: 9 });
    const ids = new Set(profiles.map((p) => p.id));
    expect(ids.size).toBe(100);
  });
});
