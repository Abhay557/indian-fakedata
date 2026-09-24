import { describe, expect, it } from 'vitest';

import { generate, stripPII, validateProfile, PII_FIELDS } from '../src/index.js';

describe('stripPII (v2.0.9)', () => {
  it('empties direct identifiers but keeps shape and provenance', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    const clean = stripPII(p);
    for (const f of PII_FIELDS) {
      expect(clean[f as keyof typeof clean]).toBe('');
    }
    expect(clean.piiStripped).toBe(true);
    // provenance retained
    expect(clean.synthetic).toBe(true);
    expect(clean.generator).toBe(p.generator);
    // everything else identical
    expect(clean.firstName).toBe(p.firstName);
    expect(clean.district).toBe(p.district);
    expect(clean.employmentTimeline).toEqual(p.employmentTimeline);
    // input never mutated
    expect(p.phoneNumber.length).toBeGreaterThan(0);
    expect(p.piiStripped).toBeUndefined();
  });

  it('maskNames replaces names with initials', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    const clean = stripPII(p, { maskNames: true });
    expect(clean.firstName).toBe(`${p.firstName[0]}.`);
    expect(clean.lastName).not.toContain(p.lastName);
    expect(clean.fatherName).toContain('.');
  });

  it('stripped copies intentionally fail strict validation', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    expect(validateProfile(p).valid).toBe(true);
    const clean = stripPII(p);
    const result = validateProfile(clean);
    expect(result.valid).toBe(false);
    expect(result.errors.join('|')).toContain('aadhaarNumber');
  });
});
