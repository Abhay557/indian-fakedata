import { describe, it, expect } from 'vitest';
import { generate, validateProfile } from '../src/index.js';

describe('gender "other" profiles', () => {
  it('generates valid profiles without crashing', () => {
    const profiles = generate({ count: 50, seed: 77, constraints: { gender: 'other' } });
    expect(profiles).toHaveLength(50);
    for (const p of profiles) {
      expect(p.gender).toBe('other');
    }
  });

  it('every profile passes schema validation', () => {
    const profiles = generate({ count: 50, seed: 77, constraints: { gender: 'other' } });
    for (const p of profiles) {
      const result = validateProfile(p);
      expect(result.valid).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generate({ count: 10, seed: 99, constraints: { gender: 'other' } });
    const second = generate({ count: 10, seed: 99, constraints: { gender: 'other' } });
    expect(first.map((p) => ({ ...p, generatedAt: 'same' }))).toEqual(
      second.map((p) => ({ ...p, generatedAt: 'same' })),
    );
  });

  it('keeps first names non-empty', () => {
    const profiles = generate({ count: 50, seed: 55, constraints: { gender: 'other' } });
    for (const p of profiles) {
      expect(p.firstName.length).toBeGreaterThan(0);
      expect(p.lastName.length).toBeGreaterThan(0);
    }
  });
});
