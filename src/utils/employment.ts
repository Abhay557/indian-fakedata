/**
 * Employment History Timeline Generator (v2.0.9)
 *
 * Mirrors the education timeline: a chronological list of jobs with titles,
 * sectors, tenure and wage progression. Runs AFTER profile assembly so every
 * pre-existing field (including id) for a given seed stays byte-identical.
 *
 * Titles are plausible Indian job labels per sector. Wages progress towards
 * the profile's current annual income. Students, the unemployed and young
 * homemakers get an empty timeline; retirees get completed-only history.
 */

import { uniformSample, weightedSampleFromRecord } from '../core/sampler.js';
import type {
  EducationLevel,
  EmploymentSector,
  EmploymentStage,
  Gender,
  OccupationalSector,
  SeededRNG,
} from '../types.js';

export interface EmploymentTimelineOptions {
  age: number;
  education: EducationLevel;
  occupation: OccupationalSector;
  employmentSector: EmploymentSector;
  annualIncomeINR: number;
  district: string;
  areaType: 'urban' | 'rural';
  gender: Gender;
  /** Defaults to the current calendar year */
  currentYear?: number;
}

/** Typical age when people with a given education start working */
const WORK_START_AGE: Record<EducationLevel, number> = {
  illiterate: 14,
  literate_below_primary: 14,
  primary: 15,
  middle: 15,
  secondary: 17,
  higher_secondary: 18,
  technical_diploma: 20,
  graduate: 21,
  postgraduate: 23,
  professional_degree: 23,
};

/** Plausible job titles per sector (gender-neutral wording) */
const TITLES: Record<string, string[]> = {
  government: [
    'Primary School Teacher', 'Clerk (LDC)', 'Police Constable', 'Postman',
    'Railway Ticket Collector', 'Anganwadi Worker', 'Staff Nurse (GNM)',
    'Junior Engineer', 'Patwari', 'Bus Conductor',
  ],
  public_sector: [
    'Bank Clerk', 'LIC Agent', 'Railway Guard', 'BSNL Technician',
    'Post Office Assistant', 'Bank Peon', 'Insurance Assistant',
  ],
  private: [
    'Sales Executive', 'Software Engineer', 'Accountant',
    'Customer Support Associate', 'Delivery Partner', 'Security Guard',
    'Data Entry Operator', 'Marketing Executive', 'Electrician',
    'Receptionist',
  ],
  self_employed: [
    'Kirana Shop Owner', 'Tailor', 'Tea Stall Owner', 'Auto Rickshaw Driver',
    'Barber', 'Carpenter', 'Mason', 'Vegetable Vendor',
    'Mobile Repair Shop Owner', 'Dairy Farmer',
  ],
  informal: [
    'Daily Wage Labourer', 'Construction Worker', 'Domestic Help',
    'Farm Labourer', 'Street Vendor', 'Loader/Unloader', 'Painter',
    'Plumber Helper',
  ],
  household_industry: [
    'Handloom Weaver', 'Potter', 'Bidi Roller', 'Papad Maker',
    'Embroidery Worker', 'Basket Weaver',
  ],
  cultivator: [
    'Paddy Farmer', 'Wheat Farmer', 'Sugarcane Farmer', 'Vegetable Grower',
    'Tenant Farmer', 'Orchard Keeper',
  ],
};

const EMPLOYER_TYPE: Record<string, EmploymentStage['employerType']> = {
  government: 'government',
  public_sector: 'government',
  private: 'private',
  self_employed: 'self',
  informal: 'informal',
  household_industry: 'household',
  cultivator: 'self',
};

/** Census occupation bucket implied by a past sector (non-worker histories only) */
function occupationForSampledSector(sector: string): OccupationalSector {
  if (sector === 'cultivator') return 'cultivator';
  if (sector === 'informal') return 'agricultural_labourer';
  if (sector === 'household_industry') return 'household_industry';
  return 'other_worker';
}

/**
 * Generate a chronological employment history.
 *
 * Runs AFTER profile assembly (draws appended at the very end), so it never
 * disturbs pre-existing fields for a seed.
 */
export function generateEmploymentTimeline(
  opts: EmploymentTimelineOptions,
  rng: SeededRNG
): EmploymentStage[] {
  const currentYear = opts.currentYear ?? new Date().getFullYear();
  const startAge = WORK_START_AGE[opts.education] ?? 18;

  // no work history yet: students, unemployed, young homemakers, children
  if (
    opts.employmentSector === 'student' ||
    opts.employmentSector === 'unemployed' ||
    opts.age < startAge + 1
  ) {
    return [];
  }
  if (opts.employmentSector === 'homemaker' && opts.age < 30) return [];

  const retired = opts.employmentSector === 'retired';
  // career window: school-leaving age -> now (or age 60 for retirees/elders)
  const careerEnd = retired || opts.age > 60 ? 60 : opts.age;
  const tenure = Math.max(0, careerEnd - startAge);
  if (tenure <= 0) return [];

  // past sector for retirees/homemakers with history (their current
  // employmentSector label carries no sector info)
  let sector: string = opts.employmentSector;
  if (retired || opts.employmentSector === 'homemaker') {
    const { key } = weightedSampleFromRecord(
      { private: 30, self_employed: 25, government: 15, informal: 20, public_sector: 10 },
      rng
    );
    sector = key;
  }

  // v2.1.0 fix: the timeline is an object of OCCUPATION, not sector.
  // Farm/craft occupations always get their own titles and keep their own
  // occupation label — a cultivator is never a "Kirana Shop Owner", and an
  // urban informal other_worker is never relabelled agricultural_labourer.
  // Only non_worker histories (retired / older homemakers) derive titles
  // and occupation from the sampled past sector.
  let titles: string[];
  let stageOccupation: OccupationalSector;
  if (opts.occupation === 'cultivator') {
    titles = TITLES.cultivator;
    stageOccupation = 'cultivator';
  } else if (opts.occupation === 'agricultural_labourer') {
    titles = TITLES.informal;
    stageOccupation = 'agricultural_labourer';
  } else if (opts.occupation === 'household_industry') {
    titles = TITLES.household_industry;
    stageOccupation = 'household_industry';
  } else if (opts.occupation === 'other_worker') {
    titles = TITLES[sector] ?? TITLES.private;
    stageOccupation = 'other_worker';
  } else {
    titles = TITLES[sector] ?? TITLES.private;
    stageOccupation = occupationForSampledSector(sector);
  }

  // number of job spells grows with tenure: mostly 1-2, up to 4
  let spells = 1;
  if (tenure >= 5) {
    const { key } = weightedSampleFromRecord({ 1: 45, 2: 35, 3: 15, 4: 5 }, rng);
    spells = parseInt(key, 10);
  }

  // split tenure into spell durations (each at least 1 year)
  const durations: number[] = [];
  let remaining = tenure;
  for (let i = 0; i < spells; i++) {
    if (i === spells - 1) {
      durations.push(Math.max(1, remaining));
    } else {
      const maxShare = Math.max(1, remaining - (spells - i - 1));
      const dur = 1 + Math.floor(rng.next() * maxShare);
      durations.push(dur);
      remaining -= dur;
    }
  }

  // wage ladder: earlier spells earn less, current spell matches income
  const currentMonthly = Math.max(1000, Math.round(opts.annualIncomeINR / 12 / 100) * 100);
  const birthYear = currentYear - opts.age;
  const timeline: EmploymentStage[] = [];
  let year = birthYear + startAge;

  for (let i = 0; i < spells; i++) {
    const last = i === spells - 1;
    const progress = spells === 1 ? 1 : 0.5 + (0.5 * i) / (spells - 1);
    const jitter = 0.9 + rng.next() * 0.2;
    const monthly = Math.max(800, Math.round((currentMonthly * progress * jitter) / 100) * 100);
    const done = last && !retired;

    timeline.push({
      jobTitle: uniformSample(titles, rng),
      sector: sector as EmploymentSector,
      occupation: stageOccupation,
      employerType: EMPLOYER_TYPE[sector] ?? 'private',
      startYear: year,
      ...(done ? {} : { endYear: year + durations[i] }),
      status: done ? 'current' : 'completed',
      monthlyWageINR: done ? currentMonthly : monthly,
      location: opts.district,
    });
    year += durations[i];
  }

  return timeline;
}
