import { describe, expect, it } from 'vitest';
import { generate } from '../src/index.js';

describe('children do not look like earners', () => {
  const profiles = generate({ count: 2000, seed: 2026 });

  it('under-15s have no income', () => {
    const kids = profiles.filter((p) => p.age < 15);
    expect(kids.length).toBeGreaterThan(0);
    for (const kid of kids) {
      expect(kid.annualIncomeINR).toBe(0);
    }
  });

  it('under-18s have no bank account or UPI id', () => {
    const minors = profiles.filter((p) => p.age < 18);
    expect(minors.length).toBeGreaterThan(0);
    for (const minor of minors) {
      expect(minor.bankAccountNumber).toBe('');
      expect(minor.bankName).toBe('');
      expect(minor.bankIFSC).toBe('');
      expect(minor.upiId).toBeUndefined();
    }
  });

  it('adults still get bank details', () => {
    const adult = profiles.find((p) => p.age >= 18);
    expect(adult?.bankAccountNumber).toMatch(/^\d{11}$/);
  });
});
