import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';
import { buildQAPairs } from '../src/utils/qa.js';
import { getPathValue } from '../src/utils/cli-stream.js';

/** Every cited leaf must show up in the answer: raw, humanized, or INR-formatted. */
function renderings(value: unknown): string[] {
  if (typeof value === 'number') {
    return [
      String(value),
      `₹${Math.round(value).toLocaleString('en-IN')}`,
    ];
  }
  if (typeof value === 'string') {
    return [value, value.replace(/_/g, ' ')];
  }
  return [];
}

describe('grounded QA pairs (v2.1.0, item 8)', () => {
  it('every citation resolves and every cited leaf appears in the answer', () => {
    const rows = generate({ count: 60, seed: 81 });
    let checked = 0;
    for (const r of rows) {
      const pairs = buildQAPairs(r);
      expect(pairs.length).toBeGreaterThanOrEqual(6);
      for (const pair of pairs) {
        expect(pair.question.length).toBeGreaterThan(0);
        expect(pair.answer.length).toBeGreaterThan(0);
        expect(pair.source).toBe('profile');
        for (const cite of pair.citations) {
          const value = getPathValue(r, cite);
          expect(value, `${cite} resolves`).toBeDefined();
          if (
            value !== null && typeof value === 'object'
          ) continue; // containers: resolution is the check
          const options = renderings(value);
          expect(
            options.some(o => o.length > 0 && pair.answer.includes(o)),
            `"${cite}"=${JSON.stringify(value)} appears in: ${pair.answer}`
          ).toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('covers timelines, map, festivals and credit when present', () => {
    const rows = generate({ count: 60, seed: 82 });
    const kinds = new Set<string>();
    for (const r of rows) {
      for (const pair of buildQAPairs(r)) {
        if (pair.answer.includes('most recent job')) kinds.add('job');
        if (pair.answer.includes('credit score is')) kinds.add('credit');
        if (pair.answer.includes('near ')) kinds.add('map');
        if (pair.answer.includes('celebrates')) kinds.add('festival');
        if (pair.answer.includes('got married in')) kinds.add('wedding');
      }
    }
    for (const k of ['job', 'credit', 'map', 'festival', 'wedding']) {
      expect(kinds, `missing ${k}`).toContain(k);
    }
  });

  it('is deterministic', () => {
    const p = generate({ count: 1, seed: 83 })[0];
    expect(buildQAPairs(p)).toEqual(buildQAPairs(p));
  });
});
