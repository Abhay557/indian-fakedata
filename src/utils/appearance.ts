/**
 * Appearance Generator
 *
 * Generates physical appearance attributes (face, skin tone, eyes, hair,
 * build) for a profile. Values are chosen as probability distributions tuned
 * by broad region + gender, following the same pattern as cultural.ts.
 *
 * IMPORTANT: these are population-level statistical *tendencies*, not
 * individual facts. Regional/appearance correlations in India are real but
 * heavily overlapping — so the distributions here use wide variance and
 * deliberately avoid deterministic "everyone in region X looks Y" outcomes.
 * Skin tone uses neutral descriptive buckets (fair/wheatish/brown/deep
 * brown/dark) and is never ranked or valued.
 *
 * Draw-order note: this module is invoked at the END of profile generation
 * (after every existing field), so its RNG draws never disturb the output of
 * earlier fields for a given seed. The regional height offset, however, lives
 * inside generateHeight (a mean shift, not extra draws), and heightCm on the
 * appearance object simply mirrors the already-computed top-level height.
 */

import type { SeededRNG, Gender, Appearance } from '../types.js';
import { weightedSampleFromRecord } from '../core/sampler.js';

// ─────────────────────────────────────────────────────────────
// Regional classification
// ─────────────────────────────────────────────────────────────

/**
 * Broad geographic region for a state id. Used to tune height and
 * skin-tone distributions. Categories follow documented average
 * anthropometric/climatic survey trends and are intentionally coarse so the
 * variance within each bucket stays wide.
 */
export type Region = 'north_west' | 'south' | 'north_east' | 'central';

const REGION_MAP: Record<string, Region> = {
  // North & West — on average taller, wider range of skin tones
  punjab: 'north_west',
  haryana: 'north_west',
  delhi: 'north_west',
  chandigarh: 'north_west',
  rajasthan: 'north_west',
  jammu_kashmir: 'north_west',
  himachal_pradesh: 'north_west',
  uttarakhand: 'north_west',
  uttar_pradesh: 'north_west',
  gujarat: 'north_west',
  madhya_pradesh: 'north_west',
  // South — on average shorter
  kerala: 'south',
  tamil_nadu: 'south',
  karnataka: 'south',
  andhra_pradesh: 'south',
  telangana: 'south',
  puducherry: 'south',
  goa: 'south',
  // North-East — on average shortest
  arunachal_pradesh: 'north_east',
  assam: 'north_east',
  manipur: 'north_east',
  meghalaya: 'north_east',
  mizoram: 'north_east',
  nagaland: 'north_east',
  tripura: 'north_east',
  sikkim: 'north_east'
};

/** Everything not listed above is treated as central/intermediate. */
export function getRegion(stateId: string): Region {
  return REGION_MAP[stateId] ?? 'central';
}

/**
 * Height offset (cm) applied to the adult mean for a region.
 * Wide-stated averages from Indian anthropometric surveys; kept modest so
 * distributions still overlap comfortably between regions.
 */
export const REGION_HEIGHT_OFFSET_CM: Record<Region, number> = {
  north_west: 2.0,
  south: -2.5,
  north_east: -3.0,
  central: 0
};

// ─────────────────────────────────────────────────────────────
// Appearance distributions
// ─────────────────────────────────────────────────────────────

// Skin tone is tuned by region. Buckets are neutral descriptive labels.
const SKIN_TONE_BASE: Record<string, number> = {
  fair: 25,
  wheatish: 40,
  brown: 25,
  deep_brown: 8,
  dark: 2
};

// South + North-East skew darker on average, so the lighter "fair/wheatish"
// share drops and darker shares rise there.
const SKIN_TONE_DELTA: Record<Region, Partial<Record<string, number>>> = {
  north_west: { fair: 10, wheatish: 2, brown: -6, deep_brown: -4, dark: -2 },
  south: { fair: -10, wheatish: 0, brown: 4, deep_brown: 4, dark: 2 },
  north_east: { fair: -5, wheatish: -5, brown: 2, deep_brown: 6, dark: 2 },
  central: {}
};

// India is overwhelmingly dark-eyed; coloured eyes are rare.
const EYE_COLOR_DIST: Record<string, number> = {
  dark_brown: 50,
  black: 30,
  brown: 17,
  hazel: 2,
  green: 0.7,
  grey: 0.3
};

const EYE_SHAPE_DIST: Record<string, number> = {
  almond: 45,
  round: 25,
  hooded: 15,
  deep_set: 10,
  monolid: 5
};

// Hair is almost always black or dark brown across India.
const HAIR_COLOR_DIST: Record<string, number> = {
  black: 65,
  dark_brown: 28,
  brown: 5,
  grey: 1.5,
  white: 0.5
};

const HAIR_TEXTURE_DIST: Record<string, number> = {
  straight: 55,
  wavy: 30,
  curly: 12,
  coily: 3
};

function sampleBuild(age: number, rng: SeededRNG): Appearance['build'] {
  const dist: Record<string, number> = { slim: 35, average: 40, stocky: 15, heavy: 10 };
  if (age > 45) {
    dist.heavy += 8;
    dist.slim -= 8;
  } else if (age < 25) {
    dist.slim += 8;
    dist.heavy -= 4;
  }
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as Appearance['build'];
}

function sampleFaceShape(rng: SeededRNG): Appearance['faceShape'] {
  const dist: Record<string, number> = {
    oval: 30, round: 25, square: 20, oblong: 12, heart: 8, diamond: 5
  };
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as Appearance['faceShape'];
}

function sampleSkinTone(region: Region, rng: SeededRNG): Appearance['skinTone'] {
  const dist: Record<string, number> = { ...SKIN_TONE_BASE };
  const delta = SKIN_TONE_DELTA[region];
  for (const [k, d] of Object.entries(delta)) {
    if (dist[k] !== undefined) dist[k] = Math.max(0, dist[k] + (d ?? 0));
  }
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as Appearance['skinTone'];
}

function sampleNoseType(rng: SeededRNG): Appearance['noseType'] {
  const dist: Record<string, number> = {
    straight: 30, aquiline: 15, flat: 20, broad: 15, button: 12, hooked: 8
  };
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as Appearance['noseType'];
}

function sampleHairLength(gender: Gender, age: number, rng: SeededRNG): Appearance['hairLength'] {
  // Bald is age+gender specific (mostly older males). Many women keep long hair.
  const isBaldCandidate = gender === 'male' && age > 40;
  const longBias = gender === 'female' ? 55 : 5;
  const shortBias = gender === 'male' ? 60 : 10;
  let dist: Record<string, number> = { short: shortBias, medium: 35, long: longBias };
  if (isBaldCandidate) {
    dist.bald = age > 60 ? 25 : 12;
    dist.short += 10;
  }
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as Appearance['hairLength'];
}

function sampleFacialHair(
  gender: Gender,
  age: number,
  rng: SeededRNG
): Appearance['facialHair'] {
  if (gender !== 'male') return undefined;
  let dist: Record<string, number> = {
    none: 35, stubble: 20, moustache: 25, full_beard: 15, goatee: 5
  };
  if (age < 18) dist.none += 30;
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as Appearance['facialHair'];
}

function sampleEyeColor(rng: SeededRNG): Appearance['eyeColor'] {
  const { key } = weightedSampleFromRecord(EYE_COLOR_DIST, rng);
  return key as Appearance['eyeColor'];
}

function sampleEyeShape(rng: SeededRNG): Appearance['eyeShape'] {
  const { key } = weightedSampleFromRecord(EYE_SHAPE_DIST, rng);
  return key as Appearance['eyeShape'];
}

function sampleHairColor(age: number, rng: SeededRNG): Appearance['hairColor'] {
  const dist = { ...HAIR_COLOR_DIST };
  if (age > 50) {
    dist.grey += 12;
    dist.white += 4;
    dist.black -= 10;
    dist.dark_brown -= 4;
  }
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as Appearance['hairColor'];
}

function sampleHairTexture(rng: SeededRNG): Appearance['hairTexture'] {
  const { key } = weightedSampleFromRecord(HAIR_TEXTURE_DIST, rng);
  return key as Appearance['hairTexture'];
}

/**
 * Generate the full appearance object for a profile.
 *
 * Runs AFTER every other field in the generator so draw order is preserved
 * for existing seeded output. `heightCm` is passed in (already computed by
 * the top-level generator) and simply mirrored — no extra RNG draw.
 */
export function generateAppearance(
  gender: Gender,
  age: number,
  stateId: string,
  heightCm: number,
  rng: SeededRNG
): Appearance {
  const region = getRegion(stateId);

  return {
    heightCm,
    build: sampleBuild(age, rng),
    faceShape: sampleFaceShape(rng),
    skinTone: sampleSkinTone(region, rng),
    noseType: sampleNoseType(rng),
    eyeColor: sampleEyeColor(rng),
    eyeShape: sampleEyeShape(rng),
    hairColor: sampleHairColor(age, rng),
    hairTexture: sampleHairTexture(rng),
    hairLength: sampleHairLength(gender, age, rng),
    facialHair: sampleFacialHair(gender, age, rng)
  };
}
