import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('cultural profile', () => {
  const profiles = generate({ count: 200, seed: 41 });

  it('every score is a whole number between 1 and 100', () => {
    const scoreKeys = [
      'entrepreneurialScore',
      'academicOrientation',
      'artisticInclination',
      'militaryTradition',
      'agriculturalRootedness',
      'artisanTradition',
      'bureaucraticOrientation',
      'socialActivism',
      'communityBonding',
      'migrationTendency',
      'savingsOrientation',
      'riskAppetite',
    ];
    for (const p of profiles) {
      for (const key of scoreKeys) {
        const score = p.culturalProfile[key];
        expect(Number.isInteger(score)).toBe(true);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(100);
      }
    }
  });

  it('careerPreference is always one of the known values', () => {
    const valid = ['business_trade', 'government_service', 'professional', 'agriculture', 'military_police', 'artisan_craft', 'tech_it', 'medicine', 'teaching', 'labor'];
    for (const p of profiles) {
      expect(valid).toContain(p.culturalProfile.careerPreference);
    }
  });

  it('familyStructure is always one of the known values', () => {
    const valid = ['joint_family', 'nuclear_family', 'extended_family'];
    for (const p of profiles) {
      expect(valid).toContain(p.culturalProfile.familyStructure);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generate({ count: 10, seed: 63 });
    const second = generate({ count: 10, seed: 63 });
    expect(first.map((p) => p.culturalProfile)).toEqual(second.map((p) => p.culturalProfile));
  });
});
