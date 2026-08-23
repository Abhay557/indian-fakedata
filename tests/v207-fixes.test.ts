import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';

describe('v2.0.7 correctness fixes', () => {
  it('age matches dateOfBirth exactly (DOB drift fix)', () => {
    const rows = generate({ count: 300 });
    const today = new Date();
    for (const r of rows) {
      const [y, m, d] = r.dateOfBirth.split('-').map(Number);
      let exact = today.getFullYear() - y;
      if (today.getMonth() + 1 < m ||
          (today.getMonth() + 1 === m && today.getDate() < d)) exact--;
      expect(exact).toBe(r.age);
    }
  });

  it('RNG no longer head-biased: many states reachable', () => {
    const rows = generate({ count: 1500 });
    const states = new Set(rows.map(r => r.state));
    expect(states.size).toBeGreaterThanOrEqual(25);
    const religions = new Set(rows.map(r => r.religion));
    for (const must of ['Hindu', 'Muslim', 'Christian', 'Sikh']) {
      expect(religions.has(must)).toBe(true);
    }
  });
});
