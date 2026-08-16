/**
 * Education Timeline Generator (v2.0.3)
 *
 * Builds a chronological education history for a profile:
 * school stages (primary → middle → secondary → higher secondary)
 * followed by higher education (graduate / postgraduate / diploma / professional).
 *
 * Determinism: consumes RNG draws appended AFTER all existing generator
 * draws, so existing profile fields for a given seed stay unchanged.
 */

import type {
  EducationLevel,
  EducationStage,
  Gender,
  SeededRNG,
  SocialCategory,
  AreaType
} from '../types.js';
import {
  weightedSampleFromRecord,
  gaussianSample,
  bernoulliSample,
  uniformSample
} from '../core/sampler.js';

/** Approximate age at which each education level is completed */
const COMPLETION_AGE: Record<EducationLevel, number> = {
  illiterate: 0,
  literate_below_primary: 8,
  primary: 11,
  middle: 14,
  secondary: 16,
  higher_secondary: 18,
  graduate: 22,
  postgraduate: 24,
  technical_diploma: 21,
  professional_degree: 25
};

/** Higher secondary streams weighted by eventual field of study */
const STREAM_BY_FIELD: Record<string, 'PCM' | 'PCB' | 'Commerce' | 'Arts' | 'Vocational'> = {
  'Engineering/Technology': 'PCM',
  'Computer Science/IT': 'PCM',
  'Science': 'PCM',
  'Medicine/Health': 'PCB',
  'Agriculture': 'PCB',
  'Commerce/Business': 'Commerce',
  'Management/MBA': 'Commerce',
  'Arts/Humanities': 'Arts',
  'Law': 'Arts',
  'Education/B.Ed': 'Arts'
};

const STREAM_FALLBACK: Record<string, number> = {
  PCM: 30,
  PCB: 15,
  Commerce: 25,
  Arts: 25,
  Vocational: 5
};

/** IIT city names by state */
const IIT_MAP: Record<string, string> = {
  maharashtra: 'IIT Bombay',
  delhi: 'IIT Delhi',
  tamil_nadu: 'IIT Madras',
  karnataka: 'IIT Bengaluru',
  uttar_pradesh: 'IIT Kanpur',
  west_bengal: 'IIT Kharagpur',
  gujarat: 'IIT Gandhinagar',
  bihar: 'IIT Patna',
  madhya_pradesh: 'IIT Indore',
  odisha: 'IIT Bhubaneswar',
  assam: 'IIT Guwahati',
  punjab: 'IIT Ropar',
  rajasthan: 'IIT Jodhpur',
  telangana: 'IIT Hyderabad',
  himachal_pradesh: 'IIT Mandi',
  goa: 'IIT Goa',
  jharkhand: 'IIT (ISM) Dhanbad'
};

/** School board names by state (government schools use state boards) */
const STATE_BOARD_MAP: Record<string, string> = {
  uttar_pradesh: 'UP Board',
  bihar: 'Bihar School Examination Board',
  maharashtra: 'Maharashtra State Board',
  tamil_nadu: 'Tamil Nadu State Board',
  karnataka: 'Karnataka State Board',
  andhra_pradesh: 'AP State Board',
  telangana: 'Telangana State Board',
  west_bengal: 'West Bengal Board of Secondary Education',
  kerala: 'Kerala State Board',
  rajasthan: 'Rajasthan Board of Secondary Education',
  gujarat: 'GSEB Gujarat Board',
  madhya_pradesh: 'MP Board',
  odisha: 'BSE Odisha',
  punjab: 'PSEB Punjab Board',
  haryana: 'HBSE Haryana Board',
  assam: 'SEBA Assam',
  jharkhand: 'JAC Jharkhand Board',
  chhattisgarh: 'CGBSE Chhattisgarh Board'
};

const PRIVATE_SCHOOL_POOL = [
  'St. Xavier\'s', 'Delhi Public School', 'DAV Public School', 'Ryan International',
  'St. Joseph\'s', 'Carmel Convent', 'Sacred Heart', 'Little Flower', 'Mount Carmel',
  'Vidya Mandir', 'Saraswati Vidyalaya', 'Kendriya Vidyalaya', 'Army Public School'
];

const PRIVATE_COLLEGE_POOL = [
  'SRM Institute', 'Manipal Institute of Technology', 'Amity University',
  'Christ University', 'Loyola College', 'St. Stephen\'s College', 'Hansraj College',
  'BITS Pilani', 'VIT Vellore'
];

const GOVERNMENT_COLLEGE_PREFIXES = [
  'Government College', 'Government Degree College', 'Regional Engineering College'
];

function stageSequence(level: EducationLevel): EducationLevel[] {
  const ordered: EducationLevel[] = [
    'primary', 'middle', 'secondary', 'higher_secondary',
    'graduate', 'postgraduate', 'technical_diploma', 'professional_degree'
  ];
  const idx = ordered.indexOf(level);
  if (idx === -1) return [];
  return ordered.slice(0, idx + 1);
}

function stageLabel(level: EducationLevel): string {
  switch (level) {
    case 'primary': return 'Primary School';
    case 'middle': return 'Middle School';
    case 'secondary': return 'Secondary School';
    case 'higher_secondary': return 'Higher Secondary School';
    case 'graduate': return 'Bachelor\'s Degree';
    case 'postgraduate': return 'Master\'s Degree';
    case 'technical_diploma': return 'Technical Diploma';
    case 'professional_degree': return 'Professional Degree';
    default: return level.replace(/_/g, ' ');
  }
}

/**
 * Build a plausible institution name for a stage.
 */
function institutionName(
  level: EducationLevel,
  institutionType: string,
  district: string,
  stateId: string,
  rng: SeededRNG
): string {
  const isSchool = ['primary', 'middle', 'secondary', 'higher_secondary'].includes(level);

  if (institutionType === 'iit_nit') {
    return IIT_MAP[stateId] ?? `NIT ${district}`;
  }
  if (institutionType === 'central_university') {
    return `University of ${district}`;
  }
  if (isSchool) {
    if (institutionType === 'private') {
      return `${uniformSample(PRIVATE_SCHOOL_POOL, rng)}, ${district}`;
    }
    if (institutionType === 'aided') {
      return `${district} Aided Higher Secondary School`;
    }
    // government school
    const prefix = level === 'primary' ? 'Government Primary School'
      : level === 'middle' ? 'Government Middle School'
      : level === 'secondary' ? 'Government High School'
      : 'Government Higher Secondary School';
    return `${prefix}, ${district}`;
  }
  // college level
  if (institutionType === 'private') {
    return `${uniformSample(PRIVATE_COLLEGE_POOL, rng)}, ${district}`;
  }
  if (institutionType === 'aided') {
    return `${district} Aided College`;
  }
  return `${uniformSample(GOVERNMENT_COLLEGE_PREFIXES, rng)}, ${district}`;
}

function boardOrUniversity(
  level: EducationLevel,
  institutionType: string,
  stateId: string,
  rng: SeededRNG
): string {
  const isSchool = ['primary', 'middle', 'secondary', 'higher_secondary'].includes(level);
  if (!isSchool) {
    if (institutionType === 'iit_nit' || institutionType === 'central_university') return 'University Grants Commission';
    if (institutionType === 'private') return 'Autonomous University';
    const stateName = stateId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return `University of ${stateName}`;
  }
  if (institutionType === 'private') {
    // elite private schools: CBSE / ICSE
    return rng.next() < 0.75 ? 'CBSE' : 'ICSE';
  }
  if (institutionType === 'aided') {
    return STATE_BOARD_MAP[stateId] ?? 'State Board';
  }
  if (institutionType === 'government') {
    return STATE_BOARD_MAP[stateId] ?? 'State Board';
  }
  return 'CBSE';
}

function pickScore(institutionType: string, rng: SeededRNG): string {
  let mean = 62;
  if (institutionType === 'iit_nit') mean = 85;
  else if (institutionType === 'central_university') mean = 75;
  else if (institutionType === 'private') mean = 68;
  else if (institutionType === 'government') mean = 58;
  const score = Math.round(gaussianSample(mean, 10, rng) * 10) / 10;
  return `${Math.max(30, Math.min(99.5, score))}%`;
}

/**
 * Generate the chronological education timeline for a profile.
 *
 * @param education - Final education level
 * @param age - Current age of the person
 * @param gender - Gender (affects dropout odds for older cohorts)
 * @param stateId - State id (institution/board naming)
 * @param district - District (institution naming)
 * @param areaType - Urban/rural (affects institution type mix)
 * @param socialCategory - SC/ST have higher dropout rates
 * @param institutionType - Preferred institution type from educationDetails
 * @param fieldOfStudy - Field of study (higher education)
 * @param rng - Seeded PRNG
 */
export function generateEducationTimeline(
  education: EducationLevel,
  age: number,
  gender: Gender,
  stateId: string,
  district: string,
  areaType: AreaType,
  socialCategory: SocialCategory,
  institutionType: EducationStage['institutionType'],
  fieldOfStudy: string | undefined,
  rng: SeededRNG
): EducationStage[] {
  const stages: EducationLevel[] = stageSequence(education);
  if (stages.length === 0) return [];

  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const timeline: EducationStage[] = [];

  let previousEnd = birthYear + 5; // schooling starts around age 6

  for (let i = 0; i < stages.length; i++) {
    const level = stages[i];
    const completionAge = COMPLETION_AGE[level];
    const endYear = birthYear + completionAge;

    // Final stage: if the person is still younger than completion age, it's in progress
    const isLast = i === stages.length - 1;
    let status: EducationStage['status'] = 'completed';

    if (isLast && age < completionAge) {
      status = 'in_progress';
    }

    // Dropout probability for non-final stages (school dropouts are common in low-SES cohorts)
    if (!isLast && status === 'completed') {
      let dropoutProb = 0.0;
      if (areaType === 'rural') dropoutProb += 0.04;
      if (socialCategory === 'SC' || socialCategory === 'ST') dropoutProb += 0.06;
      if (gender === 'female' && (level === 'middle' || level === 'secondary')) dropoutProb += 0.03;
      if (level === 'primary') dropoutProb *= 0.3; // early dropouts rarer
      if (bernoulliSample(Math.min(dropoutProb, 0.15), rng)) {
        // Drop out — remaining stages never happen; the person's final
        // education is effectively this stage. Keep only what precedes it.
        timeline.push({
          level,
          stageName: stageLabel(level),
          institutionName: institutionName(level, institutionType, district, stateId, rng),
          institutionType,
          boardOrUniversity: boardOrUniversity(level, institutionType, stateId, rng),
          startYear: previousEnd,
          endYear: Math.min(endYear, currentYear),
          score: pickScore(institutionType, rng),
          status: 'dropped_out'
        });
        return timeline;
      }
    }

    const startYear = previousEnd;

    // Higher secondary stream
    let stream: EducationStage['stream'];
    if (level === 'higher_secondary') {
      if (fieldOfStudy && STREAM_BY_FIELD[fieldOfStudy]) {
        stream = STREAM_BY_FIELD[fieldOfStudy];
      } else {
        const { key } = weightedSampleFromRecord(STREAM_FALLBACK, rng);
        stream = key as EducationStage['stream'];
      }
    }

    timeline.push({
      level,
      stageName: stageLabel(level),
      institutionName: institutionName(level, institutionType, district, stateId, rng),
      institutionType,
      boardOrUniversity: boardOrUniversity(level, institutionType, stateId, rng),
      ...(level === 'higher_secondary' ? { stream } : {}),
      ...(level === 'graduate' || level === 'postgraduate' || level === 'technical_diploma' || level === 'professional_degree'
        ? { fieldOfStudy } : {}),
      startYear,
      endYear: status === 'in_progress' ? currentYear : endYear,
      score: status === 'in_progress' ? undefined : pickScore(institutionType, rng),
      status
    });

    previousEnd = endYear;
  }

  return timeline;
}