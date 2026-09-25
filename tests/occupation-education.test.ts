import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';

const FARM = ['cultivator', 'agricultural_labourer', 'household_industry'];

describe('occupation follows education (v2.1.0, item 6)', () => {
  it('graduates rarely work farm jobs, mostly white-collar', () => {
    const rows = generate({
      count: 500, seed: 77,
      constraints: { education: 'graduate', ageRange: { min: 25, max: 60 } },
    });
    const farm = rows.filter(r => FARM.includes(r.occupation)).length;
    const white = rows.filter(r => r.occupation === 'other_worker').length;
    expect(farm).toBeLessThan(100);
    expect(white).toBeGreaterThan(200);
  });

  it('unschooled profiles skew toward farm work', () => {
    const rows = generate({
      count: 500, seed: 77,
      constraints: { education: 'illiterate', ageRange: { min: 25, max: 60 } },
    });
    const farm = rows.filter(r => FARM.includes(r.occupation)).length;
    expect(farm).toBeGreaterThan(125);
  });

  it('explicit occupation constraints still win', () => {
    const rows = generate({
      count: 20, seed: 78,
      constraints: { education: 'graduate', occupation: 'cultivator' },
    });
    for (const r of rows) expect(r.occupation).toBe('cultivator');
  });

  it('stays deterministic', () => {
    const strip = (rows: unknown[]) =>
      rows.map(r => {
        const { generatedAt, ...rest } = r as Record<string, unknown>;
        return rest;
      });
    const a = generate({ count: 5, seed: 79 });
    const b = generate({ count: 5, seed: 79 });
    expect(strip(a)).toEqual(strip(b));
  });
});
