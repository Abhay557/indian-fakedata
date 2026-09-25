import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';
import { generateEmploymentTimeline, FIELD_TITLES, DOCTOR_TITLES } from '../src/utils/employment.js';
import { createRNG } from '../src/core/sampler.js';

describe('employment timeline (v2.0.9)', () => {
  it('every profile carries an employmentTimeline array', () => {
    const rows = generate({ count: 100 });
    for (const r of rows) {
      expect(Array.isArray(r.employmentTimeline)).toBe(true);
    }
  });

  it('same seed reproduces the same timeline (determinism)', () => {
    const a = generate({ count: 1, seed: 42 })[0].employmentTimeline;
    const b = generate({ count: 1, seed: 42 })[0].employmentTimeline;
    expect(a).toEqual(b);
  });

  it('timelines are chronological with sane wages', () => {
    const rows = generate({ count: 60 });
    for (const r of rows) {
      const tl = r.employmentTimeline ?? [];
      for (let i = 0; i < tl.length; i++) {
        const s = tl[i];
        expect(s.jobTitle.length).toBeGreaterThan(0);
        expect(s.monthlyWageINR).toBeGreaterThan(0);
        expect(s.location).toBe(r.district);
        if (i > 0) expect(s.startYear).toBeGreaterThanOrEqual(tl[i - 1].startYear);
        if (s.status === 'completed') {
          expect(s.endYear).toBeDefined();
          expect(s.endYear as number).toBeGreaterThan(s.startYear);
        } else {
          expect(s.endYear).toBeUndefined();
        }
      }
      if (tl.length > 0) {
        const last = tl[tl.length - 1];
        // current spell wage matches current income (rounded to 100)
        const expected = Math.max(1000, Math.round(r.annualIncomeINR / 12 / 100) * 100);
        if (last.status === 'current') expect(last.monthlyWageINR).toBe(expected);
      }
    }
  });

  it('children have an empty timeline', () => {
    const rows = generate({
      count: 20,
      constraints: { ageRange: { min: 5, max: 10 } },
    });
    for (const r of rows) {
      expect(r.employmentTimeline).toEqual([]);
    }
  });

  it('students/unemployed/retired behave correctly (unit)', () => {    const rng = createRNG(7);
    const base = {
      age: 30,
      education: 'graduate' as const,
      occupation: 'other_worker' as const,
      annualIncomeINR: 360000,
      district: 'Lucknow',
      areaType: 'urban' as const,
      gender: 'male' as const,
    };
    expect(
      generateEmploymentTimeline({ ...base, employmentSector: 'student' }, rng)
    ).toEqual([]);
    expect(
      generateEmploymentTimeline({ ...base, employmentSector: 'unemployed' }, rng)
    ).toEqual([]);
    const retired = generateEmploymentTimeline(
      { ...base, age: 65, employmentSector: 'retired' },
      rng
    );
    expect(retired.length).toBeGreaterThan(0);
    for (const s of retired) expect(s.status).toBe('completed');
  });

  it('timeline stages carry the profile occupation (v2.1.0)', () => {
    const rows = generate({ count: 200, seed: 5 });
    let checked = 0;
    for (const r of rows) {
      const tl = r.employmentTimeline ?? [];
      if (r.occupation === 'non_worker') continue;
      for (const s of tl) {
        expect(s.occupation).toBe(r.occupation);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('cultivators get farm titles, never shop titles (v2.1.0)', () => {
    const rows = generate({
      count: 40,
      seed: 9,
      constraints: { occupation: 'cultivator', ageRange: { min: 25, max: 50 } },
    });
    let stages = 0;
    for (const r of rows) {
      const tl = r.employmentTimeline ?? [];
      for (const s of tl) {
        expect(s.occupation).toBe('cultivator');
        expect(s.jobTitle).toMatch(/Farm|Grow|Keeper|Cutter/);
        stages++;
      }
    }
    expect(stages).toBeGreaterThan(0);
  });

  it('informal other_workers keep their occupation label (v2.1.0)', () => {
    const rows = generate({
      count: 80,
      seed: 11,
      constraints: { occupation: 'other_worker', ageRange: { min: 25, max: 50 } },
    });
    let checked = 0;
    for (const r of rows) {
      if (r.employmentSector !== 'informal') continue;
      for (const s of r.employmentTimeline ?? []) {
        expect(s.occupation).toBe('other_worker');
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('employmentTimeline sits right below occupation, not at the end', () => {
    const p = generate({ count: 1, seed: 42 })[0] as unknown as Record<string, unknown>;
    const keys = Object.keys(p);
    expect(keys.indexOf('employmentTimeline')).toBe(keys.indexOf('occupation') + 1);
    expect(keys.indexOf('employmentTimeline')).toBeLessThan(keys.indexOf('seed'));
  });

  it('current job matches the field of study (v2.1.0)', () => {
    const base = {
      age: 30,
      education: 'graduate' as const,
      occupation: 'other_worker' as const,
      employmentSector: 'private' as const,
      annualIncomeINR: 360000,
      district: 'Lucknow',
      areaType: 'urban' as const,
      gender: 'male' as const,
    };
    // BTech-style graduate works as an engineer, never a teacher/nurse
    const eng = generateEmploymentTimeline(
      { ...base, fieldOfStudy: 'Engineering/Technology' }, createRNG(21));
    expect(eng.length).toBeGreaterThan(0);
    expect(eng[eng.length - 1].jobTitle).toMatch(/Engineer|Technician|Draughtsman|Supervisor|Trainee/);
    // medicine without a professional degree: no doctor titles
    const med = generateEmploymentTimeline(
      { ...base, fieldOfStudy: 'Medicine/Health' }, createRNG(22));
    expect(med[med.length - 1].jobTitle).not.toMatch(/Doctor|Medical Officer/);
    // B.Ed graduate teaches
    const bed = generateEmploymentTimeline(
      { ...base, fieldOfStudy: 'Education/B.Ed' }, createRNG(23));
    expect(bed[bed.length - 1].jobTitle).toMatch(/Teacher|Tutor|Anganwadi|Librarian/);
    // professional degree unlocks the doctor pool
    const doc = generateEmploymentTimeline(
      { ...base, education: 'professional_degree' as const, fieldOfStudy: 'Medicine/Health' },
      createRNG(24));
    expect([...FIELD_TITLES['Medicine/Health'], ...DOCTOR_TITLES])
      .toContain(doc[doc.length - 1].jobTitle);
  });

  it('current job always comes from the field pool in the wild (v2.1.0)', () => {
    const rows = generate({ count: 500, seed: 21 });
    let checked = 0;
    for (const r of rows) {
      const field = r.educationDetails.fieldOfStudy;
      const tl = r.employmentTimeline ?? [];
      if (!field || !FIELD_TITLES[field] || tl.length === 0) continue;
      if (r.occupation !== 'other_worker' && r.occupation !== 'non_worker') continue;
      const pool = [...FIELD_TITLES[field]];
      if (field === 'Medicine/Health' && r.education === 'professional_degree') {
        pool.push(...DOCTOR_TITLES);
      }
      expect(pool).toContain(tl[tl.length - 1].jobTitle);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
});
