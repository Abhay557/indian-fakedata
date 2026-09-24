import { describe, expect, it } from 'vitest';

import { generate, validateProfile, getProfileSchema } from '../src/index.js';

describe('profile schema + validator (v2.0.9)', () => {
  it('generated profiles validate clean (adults and minors)', () => {
    const rows = generate({ count: 30, seed: 55 });
    for (const r of rows) {
      const { valid, errors } = validateProfile(r);
      expect(errors).toEqual([]);
      expect(valid).toBe(true);
    }
    // minors carry empty PAN/voter ID but must still validate
    const kids = generate({ count: 10, seed: 56, constraints: { ageRange: { min: 5, max: 10 } } });
    for (const k of kids) {
      expect(validateProfile(k).valid).toBe(true);
    }
  });

  it('flags missing fields, bad enums and broken provenance', () => {
    const p: any = generate({ count: 1, seed: 55 })[0];
    delete p.firstName;
    p.gender = 'unknown';
    p.synthetic = false;
    const { valid, errors } = validateProfile(p);
    expect(valid).toBe(false);
    expect(errors.join('|')).toContain('firstName');
    expect(errors.join('|')).toContain('gender');
    expect(errors.join('|')).toContain('synthetic');
  });

  it('rejects non-objects and reports nested problems', () => {
    expect(validateProfile(null).valid).toBe(false);
    expect(validateProfile([]).valid).toBe(false);
    const p: any = generate({ count: 1, seed: 55 })[0];
    delete (p.appearance as any).skinTone;
    p.employmentTimeline = [{ nope: 1 }];
    const { errors } = validateProfile(p);
    expect(errors.join('|')).toContain('appearance is missing: skinTone');
    expect(errors.join('|')).toContain('employmentTimeline[0]');
  });

  it('exposes a versioned machine-readable schema', () => {
    const schema = getProfileSchema() as any;
    expect(schema.title).toBe('DemographicProfile');
    expect(schema.$id).toContain('2.0.9');
    expect(schema.required).toContain('firstName');
    expect(schema.required).toContain('synthetic');
    expect(schema.properties.gender.enum).toContain('female');
  });
});
