import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';
import { generateEmploymentTimeline } from '../src/utils/employment.js';
import { createRNG } from '../src/core/sampler.js';

describe('employment timeline (v2.0.9)', () => {
  it('every profile carries an employmentTimeline array', () => {
    const rows = generate({ count: 100 });
    for (const r of rows) {
      expect(Array.isArray(r.employmentTimeline)).toBe(true);
    }
  });

  it('same seed reproduces the same timeline (determinism)', () => {
    const a = generate({ count: 1, seed: 42 })[0].employmentTimeline;
    const b = generate({ count: 1, seed: 42 })[0].employmentTimeline;
    expect(a).toEqual(b);
  });

  it('timelines are chronological with sane wages', () => {
    const rows = generate({ count: 60 });
    for (const r of rows) {
      const tl = r.employmentTimeline ?? [];
      for (let i = 0; i < tl.length; i++) {
        const s = tl[i];
        expect(s.jobTitle.length).toBeGreaterThan(0);
        expect(s.monthlyWageINR).toBeGreaterThan(0);
        expect(s.location).toBe(r.district);
        if (i > 0) expect(s.startYear).toBeGreaterThanOrEqual(tl[i - 1].startYear);
        if (s.status === 'completed') {
          expect(s.endYear).toBeDefined();
          expect(s.endYear as number).toBeGreaterThan(s.startYear);
        } else {
          expect(s.endYear).toBeUndefined();
        }
      }
      if (tl.length > 0) {
        const last = tl[tl.length - 1];
        // current spell wage matches current income (rounded to 100)
        const expected = Math.max(1000, Math.round(r.annualIncomeINR / 12 / 100) * 100);
        if (last.status === 'current') expect(last.monthlyWageINR).toBe(expected);
      }
    }
  });

  it('children have an empty timeline', () => {
    const rows = generate({
      count: 20,
      constraints: { ageRange: { min: 5, max: 10 } },
    });
    for (const r of rows) {
      expect(r.employmentTimeline).toEqual([]);
    }
  });

  it('students/unemployed/retired behave correctly (unit)', () => {
    const rng = createRNG(7);
    const base = {
      age: 30,
      education: 'graduate' as const,
      occupation: 'other_worker' as const,
      annualIncomeINR: 360000,
      district: 'Lucknow',
      areaType: 'urban' as const,
      gender: 'male' as const,
    };
    expect(
      generateEmploymentTimeline({ ...base, employmentSector: 'student' }, rng)
    ).toEqual([]);
    expect(
      generateEmploymentTimeline({ ...base, employmentSector: 'unemployed' }, rng)
    ).toEqual([]);
    const retired = generateEmploymentTimeline(
      { ...base, age: 65, employmentSector: 'retired' },
      rng
    );
    expect(retired.length).toBeGreaterThan(0);
    for (const s of retired) expect(s.status).toBe('completed');
  });
});
