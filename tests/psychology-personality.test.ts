import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('Big Five personality scores', () => {
  const profiles = generate({ count: 200, seed: 55 });

  it('every score is a whole number between 1 and 100', () => {
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    for (const p of profiles) {
      for (const t of traits) {
        const score = p.personality[t];
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generate({ count: 10, seed: 77 });
    const second = generate({ count: 10, seed: 77 });
    expect(first.map((p) => p.personality)).toEqual(second.map((p) => p.personality));
  });

  it('women score higher on agreeableness on average', () => {
    const women = generate({ count: 150, seed: 1, constraints: { gender: 'female' } });
    const men = generate({ count: 150, seed: 1, constraints: { gender: 'male' } });

    const avg = (ps: any[], key: string) =>
      ps.reduce((sum, p) => sum + p.personality[key], 0) / ps.length;

    const womenAgree = avg(women, 'agreeableness');
    const menAgree = avg(men, 'agreeableness');
    expect(womenAgree).toBeGreaterThan(menAgree);
  });

  it('every profile also carries the derived personalityTraits block', () => {
    for (const p of profiles) {
      expect(p.personalityTraits).toBeDefined();
      expect(p.personalityTraits.summary.length).toBeGreaterThan(0);
    }
  });
});
