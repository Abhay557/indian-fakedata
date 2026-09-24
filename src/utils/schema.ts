/**
 * Profile JSON Schema + Validator (v2.0.9)
 *
 * Zero-dependency, hand-written validator for DemographicProfile objects.
 * Use it to check library output (or foreign data claiming the same shape)
 * before feeding it into training pipelines, exports or agent frameworks:
 *
 * ```ts
 * import { generate, validateProfile } from '@abhay557/indian-fakedata';
 * const [p] = generate({ count: 1, seed: 7 });
 * const { valid, errors } = validateProfile(p);
 * ```
 *
 * `getProfileSchema()` returns the machine-readable schema (JSON Schema
 * draft-07 style) so other tools can validate without this library.
 */

export interface ProfileValidation {
  valid: boolean;
  errors: string[];
}

const GENERATOR_RE = /^indian-fakedata@\d+\.\d+\.\d+$/;

const ENUMS: Record<string, string[]> = {
  gender: ['male', 'female', 'other'],
  socialCategory: ['SC', 'ST', 'OBC', 'General'],
  areaType: ['urban', 'rural'],
  education: [
    'illiterate', 'literate_below_primary', 'primary', 'middle', 'secondary',
    'higher_secondary', 'graduate', 'postgraduate', 'technical_diploma',
    'professional_degree',
  ],
  occupation: [
    'cultivator', 'agricultural_labourer', 'household_industry',
    'other_worker', 'non_worker',
  ],
  maritalStatus: ['never_married', 'married', 'widowed', 'divorced_separated'],
  dietaryPreference: ['vegetarian', 'non_vegetarian', 'eggetarian', 'vegan'],
  disability: [
    'none', 'visual', 'hearing', 'speech', 'locomotor', 'mental_illness',
    'mental_retardation', 'multiple',
  ],
  rationCardType: ['APL', 'BPL', 'AAY', 'AY', 'none'],
  healthInsurance: ['pmjay', 'esis', 'cghs', 'private', 'none'],
  politicalLeaning: [
    'nationalist_right', 'centre_right', 'centrist', 'centre_left',
    'leftist', 'regionalist', 'apolitical',
  ],
  religiosity: [
    'very_religious', 'somewhat_religious', 'not_very_religious',
    'not_at_all_religious',
  ],
  bloodGroup: ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'],
};

const REQUIRED_STRINGS = [
  'id', 'firstName', 'lastName', 'fatherName', 'motherName', 'dateOfBirth',
  'aadhaarNumber', 'phoneNumber', 'email',
  'state', 'stateCode', 'district', 'addressLine', 'locality', 'pinCode',
  'religion', 'caste', 'motherTongue', 'bankIFSC', 'bankName',
  'bankAccountNumber', 'generatedAt',
];

/** Required keys that may be empty strings (minors have no PAN/voter ID) */
const REQUIRED_STRINGS_EMPTY_OK = ['panNumber', 'voterIdNumber'];

const REQUIRED_NUMBERS = [
  'age', 'heightCm', 'weightKg', 'bmi', 'annualIncomeINR',
  'monthlyExpenditureINR', 'numberOfChildren', 'landOwnershipAcres',
  'householdSize', 'seed',
];

const REQUIRED_BOOLEANS = [
  'synthetic', 'isMigrant', 'hasInternetAccess', 'hasSmartphone',
  'usesSocialMedia',
];

const REQUIRED_OBJECTS = [
  'appearance', 'personality', 'cognitiveProfile', 'interests', 'habits',
  'educationDetails', 'personalityTraits', 'moviePreferences',
  'culturalProfile', 'householdAssets', 'probabilityMetrics',
];

const REQUIRED_ARRAYS = ['educationTimeline'];

const APPEARANCE_KEYS = [
  'heightCm', 'build', 'faceShape', 'skinTone', 'noseType', 'eyeColor',
  'eyeShape', 'hairColor', 'hairTexture', 'hairLength',
];

/**
 * Machine-readable JSON Schema (draft-07 style) for a DemographicProfile.
 * Versioned with a $id so consumers can pin the shape they validate against.
 */
export function getProfileSchema(): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const k of REQUIRED_STRINGS) props[k] = { type: 'string' };
  for (const k of REQUIRED_STRINGS_EMPTY_OK) props[k] = { type: 'string' };
  for (const k of REQUIRED_NUMBERS) props[k] = { type: 'number' };
  for (const k of REQUIRED_BOOLEANS) props[k] = { type: 'boolean' };
  for (const k of REQUIRED_OBJECTS) props[k] = { type: 'object' };
  for (const k of REQUIRED_ARRAYS) props[k] = { type: 'array' };
  for (const [k, values] of Object.entries(ENUMS)) props[k] = { type: 'string', enum: values };
  props['synthetic'] = { const: true };
  props['generator'] = { type: 'string', pattern: GENERATOR_RE.source };

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://github.com/abhay557/indian-fakedata/schema/profile-2.0.9.json',
    title: 'DemographicProfile',
    type: 'object',
    required: [
      ...REQUIRED_STRINGS,
      ...REQUIRED_STRINGS_EMPTY_OK,
      ...REQUIRED_NUMBERS,
      ...REQUIRED_BOOLEANS,
      ...REQUIRED_OBJECTS,
      ...REQUIRED_ARRAYS,
      ...Object.keys(ENUMS),
      'generator',
    ],
    properties: props,
  };
}

/**
 * Validate a profile object. Returns every problem found (empty = valid).
 * Pure function — no RNG, no I/O, works on plain JSON too.
 */
export function validateProfile(profile: unknown): ProfileValidation {
  const errors: string[] = [];
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    return { valid: false, errors: ['profile must be a plain object'] };
  }
  const p = profile as Record<string, unknown>;

  for (const k of REQUIRED_STRINGS) {
    if (typeof p[k] !== 'string' || (p[k] as string).length === 0) {
      errors.push(`missing or empty string field: ${k}`);
    }
  }
  for (const k of REQUIRED_STRINGS_EMPTY_OK) {
    if (typeof p[k] !== 'string') errors.push(`missing string field: ${k}`);
  }
  for (const k of REQUIRED_NUMBERS) {
    if (typeof p[k] !== 'number' || Number.isNaN(p[k] as number)) {
      errors.push(`missing or invalid number field: ${k}`);
    }
  }
  for (const k of REQUIRED_BOOLEANS) {
    if (typeof p[k] !== 'boolean') errors.push(`missing or invalid boolean field: ${k}`);
  }
  for (const k of REQUIRED_OBJECTS) {
    if (!p[k] || typeof p[k] !== 'object' || Array.isArray(p[k])) {
      errors.push(`missing or invalid object field: ${k}`);
    }
  }
  for (const k of REQUIRED_ARRAYS) {
    if (!Array.isArray(p[k])) errors.push(`missing or invalid array field: ${k}`);
  }
  for (const [k, values] of Object.entries(ENUMS)) {
    if (typeof p[k] !== 'string' || !values.includes(p[k] as string)) {
      errors.push(`field ${k} must be one of: ${values.join(', ')}`);
    }
  }

  // Provenance markers must be present and well-formed
  if (p['synthetic'] !== true) errors.push('provenance marker "synthetic" must be true');
  if (typeof p['generator'] !== 'string' || !GENERATOR_RE.test(p['generator'] as string)) {
    errors.push('provenance marker "generator" must look like "indian-fakedata@x.y.z"');
  }

  // Appearance block (required since v2.0.8)
  const a = p['appearance'] as Record<string, unknown> | undefined;
  if (a && typeof a === 'object') {
    for (const k of APPEARANCE_KEYS) {
      if (a[k] === undefined || a[k] === null || a[k] === '') {
        errors.push(`appearance is missing: ${k}`);
      }
    }
  }

  // Optional v2.0.9 blocks: validated lightly when present
  if (p['employmentTimeline'] !== undefined) {
    if (!Array.isArray(p['employmentTimeline'])) {
      errors.push('employmentTimeline must be an array when present');
    } else {
      (p['employmentTimeline'] as unknown[]).forEach((s, i) => {
        const st = s as Record<string, unknown>;
        if (!st || typeof st.jobTitle !== 'string' || typeof st.startYear !== 'number') {
          errors.push(`employmentTimeline[${i}] needs jobTitle (string) and startYear (number)`);
        }
      });
    }
  }
  if (p['skills'] !== undefined) {
    const s = p['skills'] as Record<string, unknown>;
    if (!s || typeof s !== 'object' ||
      !Array.isArray(s['technical']) || !Array.isArray(s['languages'])) {
      errors.push('skills must have technical[] and languages[] when present');
    }
  }

  return { valid: errors.length === 0, errors };
}
