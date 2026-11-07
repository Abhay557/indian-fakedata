import { describe, expect, it } from 'vitest';

import { generate, generateStream } from '../src/index.js';

describe('batch seeds', () => {
  it('gives every profile its own seed', () => {
    const profiles = generate({ count: 4, seed: '011' });
    expect(new Set(profiles.map(p => p.seed)).size).toBe(4);
    for (let i = 1; i < profiles.length; i++) {
      expect(profiles[i].seed).toBe((profiles[0].seed + i) >>> 0);
    }
  });

  it('reproduces any batch profile from its own seed', () => {
    const profiles = generate({ count: 3, seed: 42 });
    for (const profile of profiles) {
      const single = generate({ count: 1, seed: profile.seed })[0];
      expect(single).toEqual(profile);
    }
  });

  it('keeps batch and stream seeds aligned', () => {
    const batch = generate({ count: 5, seed: 7 });
    const stream = [...generateStream({ count: 5, seed: 7 })];
    expect(stream.map(p => p.seed)).toEqual(batch.map(p => p.seed));
  });
});
