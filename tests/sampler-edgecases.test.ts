import { describe, it, expect } from 'vitest';
import {
  normalizeSeed,
  createRNG,
  weightedSample,
  uniformSample,
  weightedSampleFromRecord,
  gaussianSample,
  logNormalSample,
  ageSample,
  householdSizeSample,
  incomeSample,
  bernoulliSample,
} from '../src/core/sampler.js';

describe('normalizeSeed', () => {
  it('hashes a string seed deterministically', () => {
    expect(normalizeSeed('011')).toBe(normalizeSeed('011'));
  });

  it('keeps numeric seeds as non-negative integers', () => {
    expect(normalizeSeed(7)).toBe(7);
    expect(normalizeSeed(-5)).toBeGreaterThanOrEqual(0);
  });

  it('always returns a number', () => {
    expect(typeof normalizeSeed(undefined)).toBe('number');
    expect(typeof normalizeSeed('hello')).toBe('number');
  });
});

describe('createRNG', () => {
  it('produces values in [0, 1)', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('reproduces the same sequence for the same seed', () => {
    const first = createRNG(1234);
    const second = createRNG(1234);
    for (let i = 0; i < 100; i++) {
      expect(first.next()).toBe(second.next());
    }
  });

  it('reset() restarts the sequence', () => {
    const rng = createRNG(10);
    const a = rng.next();
    rng.reset(10);
    const b = rng.next();
    expect(a).toBe(b);
  });
});

describe('weightedSample', () => {
  it('throws on an empty array', () => {
    expect(() => weightedSample([], createRNG(1))).toThrow();
  });

  it('returns the only item when there is just one', () => {
    const { item, probability } = weightedSample([{ name: 'only', weight: 5 }], createRNG(2));
    expect(item.name).toBe('only');
    expect(probability).toBe(1);
  });

  it('picks the heavier item more often', () => {
    const rng = createRNG(7);
    let heavyCount = 0;
    for (let i = 0; i < 500; i++) {
      const { item } = weightedSample(
        [{ name: 'light', weight: 1 }, { name: 'heavy', weight: 99 }],
        rng,
      );
      if (item.name === 'heavy') heavyCount++;
    }
    expect(heavyCount).toBeGreaterThan(400);
  });
});

describe('uniformSample', () => {
  it('throws on an empty array', () => {
    expect(() => uniformSample([], createRNG(1))).toThrow();
  });

  it('always returns one of the items', () => {
    const items = ['a', 'b', 'c'];
    const rng = createRNG(9);
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(uniformSample(items, rng));
    }
  });
});

describe('weightedSampleFromRecord', () => {
  it('returns keys from the record', () => {
    const rng = createRNG(3);
    const dist = { yes: 9, no: 1 };
    let yesCount = 0;
    for (let i = 0; i < 200; i++) {
      if (weightedSampleFromRecord(dist, rng).key === 'yes') yesCount++;
    }
    expect(yesCount).toBeGreaterThan(150);
  });
});

describe('gaussianSample', () => {
  it('stays close to the mean over many draws', () => {
    const rng = createRNG(5);
    let total = 0;
    const count = 5000;
    for (let i = 0; i < count; i++) {
      total += gaussianSample(100, 10, rng);
    }
    const avg = total / count;
    expect(avg).toBeGreaterThan(99);
    expect(avg).toBeLessThan(101);
  });
});

describe('logNormalSample', () => {
  it('always returns a positive number', () => {
    const rng = createRNG(8);
    for (let i = 0; i < 1000; i++) {
      expect(logNormalSample(11, 0.8, rng)).toBeGreaterThan(0);
    }
  });
});

describe('ageSample', () => {
  it('respects the min and max bounds', () => {
    const rng = createRNG(11);
    for (let i = 0; i < 2000; i++) {
      const age = ageSample(rng, 5, 80);
      expect(age).toBeGreaterThanOrEqual(5);
      expect(age).toBeLessThanOrEqual(80);
    }
  });

  it('uses default bounds of 0 and 100', () => {
    const rng = createRNG(12);
    for (let i = 0; i < 1000; i++) {
      const age = ageSample(rng);
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThanOrEqual(100);
    }
  });
});

describe('householdSizeSample', () => {
  it('stays inside 1 and 12', () => {
    const rng = createRNG(13);
    for (let i = 0; i < 1000; i++) {
      const size = householdSizeSample(rng, 'urban');
      expect(size).toBeGreaterThanOrEqual(1);
      expect(size).toBeLessThanOrEqual(12);
    }
  });
});

describe('incomeSample', () => {
  it('always returns at least 10000', () => {
    const rng = createRNG(14);
    const params = { areaType: 'urban' as const, education: 'graduate', occupation: 'other_worker', state: 'Maharashtra' };
    for (let i = 0; i < 500; i++) {
      expect(incomeSample(rng, params)).toBeGreaterThanOrEqual(10000);
    }
  });

  it('rounds to the nearest 1000', () => {
    const rng = createRNG(15);
    const params = { areaType: 'rural' as const, education: 'primary', occupation: 'cultivator', state: 'Bihar' };
    for (let i = 0; i < 200; i++) {
      expect(incomeSample(rng, params) % 1000).toBe(0);
    }
  });
});

describe('bernoulliSample', () => {
  it('always returns a boolean', () => {
    const rng = createRNG(16);
    for (let i = 0; i < 100; i++) {
      expect(typeof bernoulliSample(0.5, rng)).toBe('boolean');
    }
  });

  it('returns true more often with higher probability', () => {
    const rng = createRNG(17);
    let trueCount = 0;
    for (let i = 0; i < 500; i++) {
      if (bernoulliSample(0.9, rng)) trueCount++;
    }
    expect(trueCount).toBeGreaterThan(400);
  });
});
