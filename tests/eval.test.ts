import { describe, expect, it } from 'vitest';

import { generate, evaluateDataset, checkConsistency } from '../src/index.js';

describe('eval harness (v2.1.0, item 9)', () => {
  it('scores a diverse batch high with passing drift', () => {
    const report = evaluateDataset(generate({ count: 500, seed: 92 }));
    expect(report.sampleSize).toBe(500);
    expect(report.qualityScore).toBeGreaterThanOrEqual(80);
    for (const [field, d] of Object.entries(report.drift)) {
      expect(d.pass, field).toBe(true);
    }
    expect(report.validityRate).toBe(1);
    expect(report.consistencyRate).toBe(1);
    expect(report.issues).toEqual({});
  });

  it('flags a skewed batch on drift and scores it lower', () => {
    const diverse = evaluateDataset(generate({ count: 500, seed: 92 }));
    const skewed = evaluateDataset(
      generate({ count: 500, seed: 92, constraints: { religion: 'Hindu' } }));
    expect(skewed.drift.religion.pass).toBe(false);
    expect(skewed.qualityScore).toBeLessThan(diverse.qualityScore);
  });

  it('checks consistency per profile', () => {
    const p = generate({ count: 1, seed: 93 })[0];
    expect(checkConsistency(p)).toEqual([]);
    const broken = { ...p, gender: 'unknown' };
    expect(checkConsistency(broken as never)).toContain('invalid_schema');
  });

  it('handles empty batches and stays deterministic', () => {
    const empty = evaluateDataset([]);
    expect(empty.sampleSize).toBe(0);
    expect(empty.qualityScore).toBe(0);
    const batch = generate({ count: 20, seed: 94 });
    expect(evaluateDataset(batch)).toEqual(evaluateDataset(batch));
  });
});
