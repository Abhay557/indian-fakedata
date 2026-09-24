import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';

const LEVELS = ['basic', 'intermediate', 'fluent', 'native'];

describe('skills block (v2.0.9)', () => {
  it('every profile carries a valid skills object', () => {
    const rows = generate({ count: 100 });
    for (const r of rows) {
      const s = r.skills;
      expect(s).toBeDefined();
      expect(Array.isArray(s!.technical)).toBe(true);
      expect(Array.isArray(s!.soft)).toBe(true);
      expect(Array.isArray(s!.certifications)).toBe(true);
      expect(s!.languages.length).toBeGreaterThanOrEqual(1);
      // mother tongue first, always native speaking
      expect(s!.languages[0].language).toBe(r.motherTongue);
      expect(s!.languages[0].speaking).toBe('native');
      for (const l of s!.languages) {
        expect(LEVELS).toContain(l.speaking);
        expect(LEVELS).toContain(l.reading);
        expect(LEVELS).toContain(l.writing);
      }
    }
  });

  it('same seed reproduces the same skills (determinism)', () => {
    const a = generate({ count: 1, seed: 42 })[0].skills;
    const b = generate({ count: 1, seed: 42 })[0].skills;
    expect(a).toEqual(b);
  });

  it('children get languages but no technical skills', () => {
    const rows = generate({
      count: 20,
      constraints: { ageRange: { min: 5, max: 10 } },
    });
    for (const r of rows) {
      expect(r.skills!.technical).toEqual([]);
      expect(r.skills!.languages.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('graduates tend to hold computer-flavoured skills', () => {
    const rows = generate({
      count: 60,
      seed: 11,
      constraints: { education: 'graduate', ageRange: { min: 25, max: 40 } },
    });
    const withComputer = rows.filter(r =>
      r.skills!.technical.some(t => /computer|excel|tally|data|typing|internet/i.test(t))
    );
    expect(withComputer.length).toBeGreaterThan(rows.length / 2);
  });
});
