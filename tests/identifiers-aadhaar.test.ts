import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/index.js';
import { generateAadhaar, formatAadhaar } from '../src/utils/identifiers.js';

// The Verhoeff tables (same ones used by the library)
const verhoeffD = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0]
];
const verhoeffP = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
];

// Standard Verhoeff check: a valid number returns 0 at the end
function isVerhoeffValid(num: string): boolean {
  const digits = num.split('').reverse().map(Number);
  let c = 0;
  for (let i = 0; i < digits.length; i++) {
    c = verhoeffD[c][verhoeffP[i % 8][digits[i]]];
  }
  return c === 0;
}

describe('Aadhaar generation', () => {
  it('always returns exactly 12 digits', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 200; i++) {
      const aadhaar = generateAadhaar(rng);
      expect(aadhaar).toMatch(/^\d{12}$/);
    }
  });

  it('never starts with 0 or 1', () => {
    const rng = createRNG(7);
    for (let i = 0; i < 500; i++) {
      const firstDigit = Number(generateAadhaar(rng)[0]);
      expect(firstDigit).toBeGreaterThanOrEqual(2);
      expect(firstDigit).toBeLessThanOrEqual(9);
    }
  });

  it('produces numbers that pass the Verhoeff checksum', () => {
    const rng = createRNG(99);
    for (let i = 0; i < 500; i++) {
      const aadhaar = generateAadhaar(rng);
      expect(isVerhoeffValid(aadhaar)).toBe(true);
    }
  });

  it('catches a changed checksum digit', () => {
    const rng = createRNG(5);
    const aadhaar = generateAadhaar(rng);
    const lastDigit = Number(aadhaar[11]);
    const newDigit = (lastDigit + 1) % 10;
    const tampered = aadhaar.slice(0, 11) + String(newDigit);
    expect(isVerhoeffValid(tampered)).toBe(false);
  });

  it('gives the same number for the same seed', () => {
    const first = generateAadhaar(createRNG(2024));
    const second = generateAadhaar(createRNG(2024));
    expect(first).toBe(second);
  });

  it('gives different numbers for different seeds', () => {
    const first = generateAadhaar(createRNG(1));
    const second = generateAadhaar(createRNG(2));
    expect(first).not.toBe(second);
  });

  it('formats as XXXX XXXX XXXX', () => {
    const rng = createRNG(11);
    const aadhaar = generateAadhaar(rng);
    const expected = `${aadhaar.slice(0, 4)} ${aadhaar.slice(4, 8)} ${aadhaar.slice(8, 12)}`;
    expect(formatAadhaar(aadhaar)).toBe(expected);
  });
});
