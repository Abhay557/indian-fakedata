/**
 * Skills & Language Proficiency Generator (v2.0.9)
 *
 * Adds a `skills` block to every profile: technical skills, soft skills,
 * certifications and per-language speaking/reading/writing levels.
 * Runs on an isolated RNG stream AFTER profile assembly, so it never
 * disturbs pre-existing fields for a seed.
 *
 * Pools are education/occupation-aware (a graduate gets computer skills,
 * a cultivator gets farming skills). Language levels follow schooling:
 * illiterate profiles speak their mother tongue but read/write at basic.
 */

import { uniformSample, weightedSampleFromRecord } from '../core/sampler.js';
import type {
  EducationLevel,
  EmploymentSector,
  OccupationalSector,
  SeededRNG,
} from '../types.js';

/** Speaking/reading/writing level for one language */
export type LanguageLevel = 'basic' | 'intermediate' | 'fluent' | 'native';

export interface LanguageSkill {
  language: string;
  speaking: LanguageLevel;
  reading: LanguageLevel;
  writing: LanguageLevel;
}

/** Skills block attached to a profile */
export interface SkillsProfile {
  technical: string[];
  soft: string[];
  certifications: string[];
  languages: LanguageSkill[];
}

export interface SkillsOptions {
  age: number;
  education: EducationLevel;
  occupation: OccupationalSector;
  employmentSector: EmploymentSector;
  motherTongue: string;
  secondLanguage?: string;
  areaType: 'urban' | 'rural';
}

const HIGHER_EDU: EducationLevel[] = [
  'higher_secondary', 'technical_diploma', 'graduate',
  'postgraduate', 'professional_degree',
];

const GENERAL_TECHNICAL = [
  'Mobile Phone Repair Basics', 'Two-Wheeler Driving', 'Commercial Cooking',
  'Basic Electrical Work', 'Plumbing Basics', 'Painting & Whitewash',
  'Tailoring Basics', 'Beautician Basics',
];

const EDU_TECHNICAL: Record<string, string[]> = {
  graduate: [
    'Computer Basics', 'MS Excel', 'Data Entry', 'Tally Accounting',
    'Internet & Email', 'Typing (English/Hindi)',
  ],
  postgraduate: [
    'Computer Basics', 'MS Excel', 'Data Analysis Basics', 'Tally Accounting',
    'Report Writing', 'Presentation Skills',
  ],
  professional_degree: [
    'Programming Basics', 'Database Basics', 'Engineering Drawing',
    'Project Documentation', 'Lab Techniques',
  ],
  technical_diploma: [
    'ITI Fitter Trade', 'Electrician Trade', 'Welding Basics',
    'Motor Winding', 'Refrigeration Basics',
  ],
  higher_secondary: ['Computer Basics', 'Typing (English/Hindi)', 'Data Entry'],
};

const OCC_TECHNICAL: Record<string, string[]> = {
  cultivator: [
    'Crop Planning', 'Soil Testing Basics', 'Tractor Operation',
    'Drip Irrigation', 'Pesticide Handling', 'Seed Selection',
  ],
  agricultural_labourer: [
    'Harvesting', 'Transplantation', 'Threshing', 'Livestock Care',
  ],
  household_industry: [
    'Handloom Weaving', 'Embroidery', 'Pottery', 'Food Processing',
    'Basket Weaving', 'Bidi Rolling',
  ],
};

const SOFT_SKILLS = [
  'Communication', 'Teamwork', 'Time Management', 'Leadership',
  'Problem Solving', 'Customer Handling', 'Negotiation',
];

const CERTIFICATIONS = [
  'CCC Computer Course', 'ITI Certificate', 'Tally Certification',
  'B.Ed Degree', 'GNM Nursing', 'Diploma in Computer Applications',
  'Driving Licence (Commercial)', 'Food Safety Training',
];

/** Pick N distinct items from a pool using the rng stream */
function pickMany<T>(pool: T[], n: number, rng: SeededRNG): T[] {
  const bag = [...pool];
  const out: T[] = [];
  while (out.length < n && bag.length > 0) {
    const idx = Math.floor(rng.next() * bag.length);
    out.push(bag.splice(idx, 1)[0]);
  }
  return out;
}

/**
 * Generate the skills block for a profile.
 *
 * Runs on an isolated stream AFTER profile assembly (draws never touch
 * the main stream), so pre-existing fields for a seed stay identical.
 */
export function generateSkills(opts: SkillsOptions, rng: SeededRNG): SkillsProfile {
  const child = opts.age < 15;

  // ── Technical skills: education pool + occupation pool ──
  let technical: string[] = [];
  if (!child) {
    const pool = [
      ...(EDU_TECHNICAL[opts.education] ?? []),
      ...(OCC_TECHNICAL[opts.occupation] ?? []),
      ...GENERAL_TECHNICAL,
    ];
    const maxPick = HIGHER_EDU.includes(opts.education) ? 4 : 2;
    const { key } = weightedSampleFromRecord({ 1: 40, 2: 35, 3: 20, 4: 5 }, rng);
    technical = pickMany(pool, Math.min(parseInt(key, 10), maxPick, pool.length), rng);
    if (opts.education === 'illiterate') technical = pickMany(GENERAL_TECHNICAL, 1, rng);
  }

  // ── Soft skills: 1-3 for working-age profiles ──
  let soft: string[] = [];
  if (!child && opts.employmentSector !== 'student') {
    const { key } = weightedSampleFromRecord({ 1: 30, 2: 45, 3: 25 }, rng);
    soft = pickMany(SOFT_SKILLS, parseInt(key, 10), rng);
  }

  // ── Certifications: schooled profiles sometimes hold one ──
  let certifications: string[] = [];
  if (!child && HIGHER_EDU.includes(opts.education) && rng.next() < 0.35) {
    certifications = [uniformSample(CERTIFICATIONS, rng)];
  }

  // ── Languages: mother tongue + second language + English/Hindi ──
  const schooled = opts.education !== 'illiterate' && opts.education !== 'literate_below_primary';
  const languages: LanguageSkill[] = [
    {
      language: opts.motherTongue,
      speaking: 'native',
      reading: schooled ? 'fluent' : 'basic',
      writing: schooled ? 'fluent' : 'basic',
    },
  ];
  if (opts.secondLanguage && opts.secondLanguage !== opts.motherTongue) {
    const { key } = weightedSampleFromRecord(
      { intermediate: 40, fluent: 55, native: 5 }, rng
    );
    const lvl = key as LanguageLevel;
    languages.push({
      language: opts.secondLanguage,
      speaking: lvl,
      reading: schooled ? lvl : 'basic',
      writing: schooled ? lvl : 'basic',
    });
  }
  if (
    HIGHER_EDU.includes(opts.education) &&
    opts.motherTongue !== 'English' &&
    opts.secondLanguage !== 'English'
  ) {
    const { key } = weightedSampleFromRecord({ basic: 30, intermediate: 55, fluent: 15 }, rng);
    const lvl = key as LanguageLevel;
    languages.push({ language: 'English', speaking: lvl, reading: lvl, writing: lvl });
  }

  return { technical, soft, certifications, languages };
}
