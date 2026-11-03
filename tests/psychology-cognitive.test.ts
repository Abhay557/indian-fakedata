import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('cognitive profile', () => {
  const profiles = generate({ count: 200, seed: 13 });

  it('every score is a whole number between 1 and 100', () => {
    const keys = ['aptitudeScore', 'numeracyScore', 'literacyScore', 'digitalLiteracyScore', 'financialLiteracyScore'];
    for (const p of profiles) {
      for (const key of keys) {
        const score = p.cognitiveProfile[key];
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('graduates score higher on aptitude than illiterate profiles', () => {
    const graduates = generate({ count: 150, seed: 3, constraints: { education: 'graduate' } });
    const illiterate = generate({ count: 150, seed: 3, constraints: { education: 'illiterate' } });

    const avg = (ps: any[]) => ps.reduce((sum, p) => sum + p.cognitiveProfile.aptitudeScore, 0) / ps.length;
    const gradAvg = avg(graduates);
    const illitAvg = avg(illiterate);

    expect(gradAvg).toBeGreaterThan(illitAvg + 20);
  });

  it('smartphone users score higher on digital literacy', () => {
    const withPhone = profiles.filter((p) => p.hasSmartphone);
    const withoutPhone = profiles.filter((p) => !p.hasSmartphone);

    expect(withPhone.length).toBeGreaterThan(20);
    expect(withoutPhone.length).toBeGreaterThan(20);

    const avg = (ps: any[]) => ps.reduce((sum, p) => sum + p.cognitiveProfile.digitalLiteracyScore, 0) / ps.length;
    expect(avg(withPhone)).toBeGreaterThan(avg(withoutPhone));
  });

  it('is deterministic for the same seed', () => {
    const first = generate({ count: 10, seed: 21 });
    const second = generate({ count: 10, seed: 21 });
    expect(first.map((p) => p.cognitiveProfile)).toEqual(second.map((p) => p.cognitiveProfile));
  });
});
