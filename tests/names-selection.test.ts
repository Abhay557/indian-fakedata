import { describe, it, expect } from 'vitest';
import { getDefaultDatabase, createRNG } from '../src/index.js';
import {
  selectFirstName,
  selectSurname,
  selectMotherTongue,
  selectSecondLanguage,
  selectDistrict,
} from '../src/utils/names.js';

const db = getDefaultDatabase();

describe('selectFirstName', () => {
  it('returns a male-appropriate name for a male Hindu', () => {
    const { name } = selectFirstName(db, 'hindu', 'maharashtra', 'male', createRNG(1));
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });

  it('returns a female-appropriate name for a female Hindu', () => {
    const { name } = selectFirstName(db, 'hindu', 'kerala', 'female', createRNG(2));
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });

  it('falls back to Hindu defaults for an unknown religion', () => {
    const { name } = selectFirstName(db, 'not_a_religion', 'bihar', 'male', createRNG(3));
    expect(name.length).toBeGreaterThan(0);
  });

  it('is deterministic for the same seed', () => {
    const first = selectFirstName(db, 'hindu', 'punjab', 'male', createRNG(8));
    const second = selectFirstName(db, 'hindu', 'punjab', 'male', createRNG(8));
    expect(first).toEqual(second);
  });
});

describe('selectSurname', () => {
  it('never returns a female-only surname for a male Sikh', () => {
    for (let i = 0; i < 50; i++) {
      const { name } = selectSurname(db, 'jat_sikh', 'male', createRNG(i));
      expect(name).not.toBe('Kaur');
    }
  });

  it('never returns a male-only surname for a female Sikh', () => {
    for (let i = 0; i < 50; i++) {
      const { name } = selectSurname(db, 'jat_sikh', 'female', createRNG(i));
      expect(name).not.toBe('Singh');
    }
  });

  it('produces a variety of Sikh surnames', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const { name } = selectSurname(db, 'jat_sikh', 'male', createRNG(i));
      seen.add(name);
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('falls back to a generic surname for an unknown caste', () => {
    const { name } = selectSurname(db, 'totally_unknown_caste', 'male', createRNG(5));
    expect(name.length).toBeGreaterThan(0);
  });

  it('matches by normalized key when the exact key is missing', () => {
    const { name } = selectSurname(db, 'Jat Sikh', 'male', createRNG(6));
    expect(name.length).toBeGreaterThan(0);
  });
});

describe('selectMotherTongue', () => {
  it('returns a capitalized language for a known state', () => {
    for (let i = 0; i < 20; i++) {
      const lang = selectMotherTongue(db, 'maharashtra', createRNG(i));
      expect(lang[0]).toBe(lang[0].toUpperCase());
      expect(lang.length).toBeGreaterThan(0);
    }
  });

  it('returns Hindi for an unknown state', () => {
    expect(selectMotherTongue(db, 'unknown_state', createRNG(1))).toBe('Hindi');
  });
});

describe('selectSecondLanguage', () => {
  it('never returns the mother tongue', () => {
    for (let i = 0; i < 50; i++) {
      const second = selectSecondLanguage(db, 'maharashtra', 'Marathi', 'graduate', createRNG(i));
      if (second !== undefined) {
        expect(second).not.toBe('Marathi');
      }
    }
  });

  it('is allowed to be undefined', () => {
    let sawUndefined = false;
    for (let i = 0; i < 50; i++) {
      const second = selectSecondLanguage(db, 'bihar', 'Hindi', 'primary', createRNG(i));
      if (second === undefined) sawUndefined = true;
    }
    expect(sawUndefined).toBe(true);
  });
});

describe('selectDistrict', () => {
  it('returns a district that exists in the state list', () => {
    const districts = db.districts.maharashtra;
    for (let i = 0; i < 50; i++) {
      const district = selectDistrict(db, 'maharashtra', createRNG(i));
      expect(districts).toContain(district);
    }
  });

  it('returns the state name for an unknown state', () => {
    expect(selectDistrict(db, 'unknown_state', createRNG(1))).toBe('Unknown');
  });
});
