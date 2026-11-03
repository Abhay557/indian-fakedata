import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('habits block', () => {
  const profiles = generate({ count: 300, seed: 31 });

  it('tobaccoUse is always one of the four valid values', () => {
    const valid = ['none', 'smoking', 'chewing', 'both'];
    for (const p of profiles) {
      expect(valid).toContain(p.habits.tobaccoUse);
    }
  });

  it('alcoholUse is always one of the four valid values', () => {
    const valid = ['none', 'occasional', 'regular', 'heavy'];
    for (const p of profiles) {
      expect(valid).toContain(p.habits.alcoholUse);
    }
  });

  it('exerciseFrequency is always one of the four valid values', () => {
    const valid = ['daily', 'weekly', 'occasional', 'never'];
    for (const p of profiles) {
      expect(valid).toContain(p.habits.exerciseFrequency);
    }
  });

  it('chronotype is always one of the three valid values', () => {
    const valid = ['early_riser', 'moderate', 'night_owl'];
    for (const p of profiles) {
      expect(valid).toContain(p.habits.chronotype);
    }
  });

  it('average sleep hours stay between 4 and 12', () => {
    for (const p of profiles) {
      expect(p.habits.avgSleepHours).toBeGreaterThanOrEqual(4);
      expect(p.habits.avgSleepHours).toBeLessThanOrEqual(12);
    }
  });

  it('men use tobacco more often than women', () => {
    const men = generate({ count: 200, seed: 2, constraints: { gender: 'male' } });
    const women = generate({ count: 200, seed: 2, constraints: { gender: 'female' } });

    const useRate = (ps: any[]) =>
      ps.filter((p) => p.habits.tobaccoUse !== 'none').length / ps.length;

    expect(useRate(men)).toBeGreaterThan(useRate(women));
  });

  it('minors almost never use tobacco or alcohol', () => {
    const minors = generate({ count: 300, seed: 4, constraints: { ageRange: { min: 0, max: 17 } } });

    const tobaccoUsers = minors.filter((p) => p.habits.tobaccoUse !== 'none').length;
    const alcoholUsers = minors.filter((p) => p.habits.alcoholUse !== 'none').length;

    expect(tobaccoUsers / minors.length).toBeLessThan(0.1);
    expect(alcoholUsers / minors.length).toBeLessThan(0.1);
  });

  it('is deterministic for the same seed', () => {
    const first = generate({ count: 10, seed: 8 });
    const second = generate({ count: 10, seed: 8 });
    expect(first.map((p) => p.habits)).toEqual(second.map((p) => p.habits));
  });
});
