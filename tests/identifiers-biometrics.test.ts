import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/index.js';
import {
  generateDOB,
  generateHeight,
  generateWeight,
  generateBloodGroup,
  generateAddress,
} from '../src/utils/identifiers.js';

// small helper: age from a dob string
function ageFromDOB(dob: string): number {
  const [year, month, day] = dob.split('-').map(Number);
  const now = new Date();
  let age = now.getFullYear() - year;
  const birthdayPassed = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day);
  if (!birthdayPassed) age--;
  return age;
}

describe('date of birth', () => {
  it('matches the requested age', () => {
    const rng = createRNG(7);
    for (let age = 0; age <= 100; age += 5) {
      const dob = generateDOB(age, rng);
      expect(dob).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(ageFromDOB(dob)).toBe(age);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generateDOB(30, createRNG(101));
    const second = generateDOB(30, createRNG(101));
    expect(first).toBe(second);
  });
});

describe('height', () => {
  it('adult male height is plausible (140-195 cm)', () => {
    const rng = createRNG(3);
    for (let i = 0; i < 500; i++) {
      const h = generateHeight('male', 30, 'maharashtra', rng);
      expect(h).toBeGreaterThanOrEqual(140);
      expect(h).toBeLessThanOrEqual(195);
    }
  });

  it('adult female height is plausible (130-185 cm)', () => {
    const rng = createRNG(4);
    for (let i = 0; i < 500; i++) {
      const h = generateHeight('female', 30, 'kerala', rng);
      expect(h).toBeGreaterThanOrEqual(130);
      expect(h).toBeLessThanOrEqual(185);
    }
  });

  it('toddler height is much smaller than adult height', () => {
    const rng = createRNG(5);
    const toddler = generateHeight('male', 3, 'delhi', rng);
    const adult = generateHeight('male', 30, 'delhi', rng);
    expect(toddler).toBeLessThan(adult - 40);
  });

  it('is deterministic for the same seed', () => {
    const first = generateHeight('female', 25, 'tamil_nadu', createRNG(9));
    const second = generateHeight('female', 25, 'tamil_nadu', createRNG(9));
    expect(first).toBe(second);
  });
});

describe('weight', () => {
  it('is always positive', () => {
    const rng = createRNG(6);
    for (let i = 0; i < 500; i++) {
      const weight = generateWeight('male', 30, 170, 'urban', rng);
      expect(weight).toBeGreaterThan(0);
    }
  });

  it('keeps BMI within the 14-40 band', () => {
    const rng = createRNG(8);
    for (let i = 0; i < 500; i++) {
      const heightCm = 170;
      const weight = generateWeight('female', 35, heightCm, 'rural', rng);
      const bmi = weight / (heightCm / 100) ** 2;
      expect(bmi).toBeGreaterThanOrEqual(14);
      expect(bmi).toBeLessThanOrEqual(40);
    }
  });
});

describe('blood group', () => {
  it('always returns a valid blood group', () => {
    const rng = createRNG(10);
    const valid = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
    for (let i = 0; i < 300; i++) {
      expect(valid).toContain(generateBloodGroup(rng));
    }
  });
});

describe('address', () => {
  it('urban address contains the district and a locality', () => {
    const rng = createRNG(11);
    const { addressLine, locality } = generateAddress('Pune', 'urban', rng);
    expect(addressLine).toContain('Pune');
    expect(locality.length).toBeGreaterThan(0);
  });

  it('rural address has a numeric house number', () => {
    const rng = createRNG(12);
    const { addressLine } = generateAddress('Nashik', 'rural', rng);
    const houseNumber = addressLine.split(',')[0];
    expect(Number(houseNumber)).not.toBeNaN();
  });
});
