import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';
import { generateLifeEvents } from '../src/utils/lifeEvents.js';
import { createRNG } from '../src/core/sampler.js';

const BASE = {
  age: 40,
  dateOfBirth: '1986-01-04',
  maritalStatus: 'married' as const,
  numberOfChildren: 2,
  spouseName: 'Kishan Das',
  isMigrant: true,
  migrationOriginState: 'Karnataka',
  state: 'Andhra Pradesh',
  district: 'Guntur',
  employmentSector: 'private' as const,
  employmentTimeline: [
    { jobTitle: 'Data Entry Operator', sector: 'private', occupation: 'other_worker', employerType: 'private', startYear: 2007, endYear: 2009, status: 'completed', monthlyWageINR: 48000, location: 'Guntur' },
    { jobTitle: 'Sales Executive', sector: 'private', occupation: 'other_worker', employerType: 'private', startYear: 2009, status: 'current', monthlyWageINR: 102900, location: 'Guntur' },
  ] as never,
  currentYear: 2026,
};

describe('life events timeline (v2.1.0, item 3)', () => {
  it('builds a consistent, chronological timeline', () => {
    const ev = generateLifeEvents(BASE, createRNG(11));
    const years = ev.map(e => e.year);
    expect(ev[0]).toMatchObject({ year: 1986, event: 'born' });
    expect([...years].sort((a, b) => a - b)).toEqual(years);
    for (const e of ev) {
      expect(e.year).toBeGreaterThanOrEqual(1986);
      expect(e.year).toBeLessThanOrEqual(2026);
    }
    const married = ev.find(e => e.event === 'married')!;
    expect(married.detail).toContain('Kishan Das');
    const kids = ev.filter(e => e.event === 'child_born');
    expect(kids).toHaveLength(2);
    expect(kids[0].year).toBeGreaterThan(married.year);
    const mig = ev.find(e => e.event === 'migrated')!;
    expect(mig.detail).toContain('Karnataka');
    expect(mig.detail).toContain('Andhra Pradesh');
    const jobs = ev.filter(e => e.event === 'job_started' || e.event === 'job_changed');
    expect(jobs.map(j => j.year)).toEqual([2007, 2009]);
  });

  it('young single non-migrant gets (almost) only a birth event', () => {
    const ev = generateLifeEvents(
      {
        ...BASE,
        age: 10,
        dateOfBirth: '2016-05-01',
        maritalStatus: 'never_married',
        numberOfChildren: 0,
        isMigrant: false,
        migrationOriginState: undefined,
        employmentSector: 'student',
        employmentTimeline: [],
      },
      createRNG(12)
    );
    expect(ev).toEqual([{ year: 2016, event: 'born', detail: 'Born in Guntur.' }]);
  });

  it('is deterministic', () => {
    const a = generateLifeEvents(BASE, createRNG(13));
    expect(generateLifeEvents(BASE, createRNG(13))).toEqual(a);
  });

  it('stays consistent across generated profiles', () => {
    const rows = generate({ count: 300, seed: 41 });
    for (const r of rows) {
      const tl = r.lifeEvents ?? [];
      expect(tl.length).toBeGreaterThan(0);
      const birthYear = parseInt(r.dateOfBirth.slice(0, 4), 10);
      const years = tl.map(e => e.year);
      expect([...years].sort((a, b) => a - b)).toEqual(years);
      for (const y of years) {
        expect(y).toBeGreaterThanOrEqual(birthYear);
      }
      // job events mirror the employment timeline exactly
      const jobYears = tl
        .filter(e => e.event === 'job_started' || e.event === 'job_changed')
        .map(e => e.year);
      expect(jobYears).toEqual((r.employmentTimeline ?? []).map(s => s.startYear));
      // every child is recorded, all born after the wedding
      const kids = tl.filter(e => e.event === 'child_born');
      expect(kids).toHaveLength(r.numberOfChildren);
      const wedding = tl.find(e => e.event === 'married');
      if (wedding && kids.length > 0) {
        expect(kids[0].year).toBeGreaterThan(wedding.year);
      }
      // migrants record the move from the right origin
      if (r.isMigrant && r.migrationOriginState) {
        const mig = tl.find(e => e.event === 'migrated');
        expect(mig).toBeDefined();
        expect(mig!.detail).toContain(r.migrationOriginState);
      }
    }
  });
});
