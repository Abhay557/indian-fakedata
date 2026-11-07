import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';

describe('mother tongue constraint', () => {
  it('pins the language for every profile', () => {
    const profiles = generate({
      count: 5,
      seed: 12,
      constraints: { motherTongue: 'tamil' },
    });
    for (const profile of profiles) {
      expect(profile.motherTongue).toBe('Tamil');
      expect(profile.nativeScript.script).toBe('Tamil');
    }
  });

  it('rejects an unknown language', () => {
    expect(() =>
      generate({ seed: 12, constraints: { motherTongue: 'klingon' } })
    ).toThrow(/Unknown mother tongue/);
  });

  it('keeps the normal sampling when no constraint is given', () => {
    const languages = new Set(
      generate({ count: 50, seed: 12 }).map(p => p.motherTongue)
    );
    expect(languages.size).toBeGreaterThan(1);
  });
});
