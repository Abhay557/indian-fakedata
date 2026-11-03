import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/index.js';
import { generatePAN } from '../src/utils/identifiers.js';

describe('PAN generation', () => {
  it('always returns 10 characters', () => {
    const rng = createRNG(10);
    for (let i = 0; i < 300; i++) {
      const pan = generatePAN('Sharma', rng);
      expect(pan).toHaveLength(10);
    }
  });

  it('matches the AAAAA9999A layout', () => {
    const rng = createRNG(10);
    for (let i = 0; i < 300; i++) {
      const pan = generatePAN('Sharma', rng);
      expect(pan).toMatch(/^[A-Z]{3}P[A-Z]\d{4}[A-Z]$/);
    }
  });

  it('uses P as the entity type (person)', () => {
    const rng = createRNG(3);
    for (let i = 0; i < 50; i++) {
      const pan = generatePAN('Khan', rng);
      expect(pan[3]).toBe('P');
    }
  });

  it('uses the first letter of the surname as the 5th character', () => {
    const rng = createRNG(8);
    for (let i = 0; i < 50; i++) {
      const pan = generatePAN('Verma', rng);
      expect(pan[4]).toBe('V');
    }
  });

  it('keeps the surname letter even for a lowercase surname', () => {
    const rng = createRNG(15);
    const pan = generatePAN('mishra', rng);
    expect(pan[4]).toBe('M');
  });

  it('is deterministic for the same seed', () => {
    const first = generatePAN('Sharma', createRNG(77));
    const second = generatePAN('Sharma', createRNG(77));
    expect(first).toBe(second);
  });

  it('gives different numbers for different seeds', () => {
    const first = generatePAN('Sharma', createRNG(1));
    const second = generatePAN('Sharma', createRNG(2));
    expect(first).not.toBe(second);
  });
});
