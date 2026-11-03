import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('interests block', () => {
  const profiles = generate({ count: 300, seed: 17 });

  it('primarySport is always one of the known sports', () => {
    const validSports = ['cricket', 'kabaddi', 'football', 'badminton', 'volleyball', 'hockey', 'athletics', 'wrestling', 'none', 'kho_kho', 'carrom', 'chess', 'boxing'];
    for (const p of profiles) {
      expect(validSports).toContain(p.interests.primarySport);
    }
  });

  it('petPreference is always one of the known pets', () => {
    const validPets = ['dogs', 'cats', 'birds', 'fish', 'none'];
    for (const p of profiles) {
      expect(validPets).toContain(p.interests.petPreference);
    }
  });

  it('entertainment is a non-empty list of strings', () => {
    for (const p of profiles) {
      expect(Array.isArray(p.interests.entertainment)).toBe(true);
      expect(p.interests.entertainment.length).toBeGreaterThan(0);
      for (const item of p.interests.entertainment) {
        expect(typeof item).toBe('string');
      }
    }
  });

  it('readingHabit is always one of the known habits', () => {
    const valid = ['avid_reader', 'occasional', 'rare', 'non_reader'];
    for (const p of profiles) {
      expect(valid).toContain(p.interests.readingHabit);
    }
  });

  it('musicPreference is always a non-empty string', () => {
    for (const p of profiles) {
      expect(p.interests.musicPreference.length).toBeGreaterThan(0);
    }
  });

  it('preferredSocialMedia exists only for smartphone users aged 13+', () => {
    for (const p of profiles) {
      if (p.hasSmartphone && p.age >= 13) {
        expect(p.interests.preferredSocialMedia).toBeDefined();
      } else {
        expect(p.interests.preferredSocialMedia).toBeUndefined();
      }
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generate({ count: 10, seed: 29 });
    const second = generate({ count: 10, seed: 29 });
    expect(first.map((p) => p.interests)).toEqual(second.map((p) => p.interests));
  });
});
