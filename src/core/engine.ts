/**
 * Core Engine Module
 * 
 * Implements the constraint masking engine that ensures consistent profiles. Handles:
 * - Forward constraint checks (parent → child)
 * - Backward constraint checks (child → parent)
 * - Probability normalization
 * - Joint probability computation
 */

import type {
  SeededRNG,
  GenerationConstraints,
  ResolvedPath,
  CompiledDatabase,
  StateCensusData,
  CasteEntry,
  Gender,
  AreaType,
  SocialCategory,
  EducationLevel,
  OccupationalSector,
  MaritalStatus,
  ProbabilityMetrics,
  HouseholdAssets
} from '../types.js';

import {
  weightedSample,
  weightedSampleFromRecord,
  uniformSample,
  bernoulliSample,
  ageSample,
  householdSizeSample,
  incomeSample,
  gaussianSample
} from './sampler.js';

// ─────────────────────────────────────────────────────────────
// Constraint Mask Engine
// ─────────────────────────────────────────────────────────────

/**
 * Resolves a complete demographic path through the hierarchical tree,
 * applying constraints.
 * 
 * The resolution order (forward pass):
 * 1. Religion → P(religion)
 * 2. State → P(state | religion) 
 * 3. Caste → P(caste | religion, state)
 * 4. Social Category → determined by caste
 * 5. Area Type → P(urban/rural | state)
 * 6. Gender → P(gender | state sex ratio)
 */
export function resolveTreePath(
  db: CompiledDatabase,
  constraints: GenerationConstraints,
  rng: SeededRNG
): ResolvedPath & {
  gender: Gender;
  areaType: AreaType;
  stateName: string;
  religionLabel: string;
  casteLabel: string;
  probMetrics: Partial<ProbabilityMetrics>;
} {
  const probMetrics: Partial<ProbabilityMetrics> = {};

  // ── Layer 1: Religion ─────────────────────────────────
  let religionId: string;
  let religionProb: number;

  if (constraints.religion) {
    const key = normalizeKey(constraints.religion);
    const match = findKeyMatch(Object.keys(db.religions), key);
    if (!match) throw new Error(`Constraint error: religion "${constraints.religion}" not found in database`);
    religionId = match;
    religionProb = db.religions[match].nationalProportion;
  } else {
    const religionWeights: Record<string, number> = {};
    for (const [id, data] of Object.entries(db.religions)) {
      religionWeights[id] = data.nationalProportion;
    }
    const result = weightedSampleFromRecord(religionWeights, rng);
    religionId = result.key;
    religionProb = result.probability;
  }
  probMetrics.nationalReligionFreq = religionProb;

  // ── Layer 2: State (conditioned on religion) ──────────
  let stateId: string;
  let stateProb: number;
  let stateData: StateCensusData;

  if (constraints.state) {
    const key = normalizeKey(constraints.state);
    const match = findKeyMatch(Object.keys(db.states), key);
    if (!match) throw new Error(`Constraint error: state "${constraints.state}" not found in database`);
    stateId = match;
    // Compute P(state | religion) via attention mask
    const stateConditionals = db.religions[religionId]?.stateConditionals ?? {};
    stateProb = stateConditionals[stateId] ?? (1 / Object.keys(db.states).length);
    stateData = db.states[stateId];
  } else {
    // Apply attention mask: only consider states where this religion exists
    const stateConditionals = db.religions[religionId]?.stateConditionals ?? {};
    
    if (Object.keys(stateConditionals).length > 0) {
      const result = weightedSampleFromRecord(stateConditionals, rng);
      stateId = result.key;
      stateProb = result.probability;
    } else {
      // Fallback: sample by population
      const popWeights: Record<string, number> = {};
      for (const [id, data] of Object.entries(db.states)) {
        popWeights[id] = data.totalPopulation;
      }
      const result = weightedSampleFromRecord(popWeights, rng);
      stateId = result.key;
      stateProb = result.probability;
    }
    stateData = db.states[stateId];
  }
  
  if (!stateData) {
    // If stateData not found, use a simple fallback
    stateData = createFallbackStateData(stateId);
  }
  probMetrics.stateGivenReligionProb = stateProb;

  // ── Layer 3: Caste/Community (conditioned on religion + state) ─
  let casteId: string;
  let casteLabel: string;
  let casteProb: number;
  let socialCategory: SocialCategory;

  if (constraints.caste) {
    const key = normalizeKey(constraints.caste);
    const castesForContext = getCastesForContext(db, religionId, stateId);
    const match = castesForContext.find(c => normalizeKey(c.id) === key || normalizeKey(c.label) === key);
    if (match) {
      casteId = match.id;
      casteLabel = match.label;
      casteProb = match.weight / castesForContext.reduce((s, c) => s + c.weight, 0);
      socialCategory = match.socialCategory;
    } else {
      // Use the constraint as-is
      casteId = key;
      casteLabel = constraints.caste;
      casteProb = 0.01;
      socialCategory = constraints.socialCategory ?? 'General';
    }
  } else {
    const castesForContext = getCastesForContext(db, religionId, stateId);
    
    if (castesForContext.length > 0) {
      // Apply social category constraint if set
      let filteredCastes = castesForContext;
      if (constraints.socialCategory) {
        filteredCastes = castesForContext.filter(c => c.socialCategory === constraints.socialCategory);
        if (filteredCastes.length === 0) filteredCastes = castesForContext;
      }
      
      const { item, probability } = weightedSample(filteredCastes, rng);
      casteId = item.id;
      casteLabel = item.label;
      casteProb = probability;
      socialCategory = item.socialCategory;
    } else {
      casteId = 'general';
      casteLabel = 'General';
      casteProb = 1.0;
      socialCategory = 'General';
    }
  }
  
  if (constraints.socialCategory) {
    socialCategory = constraints.socialCategory;
  }
  
  probMetrics.casteGivenContextProb = casteProb;

  // ── Layer 4: Area Type ────────────────────────────────
  let areaType: AreaType;
  if (constraints.areaType) {
    areaType = constraints.areaType;
  } else {
    const urbanFrac = stateData.urbanPopulation / Math.max(stateData.totalPopulation, 1);
    areaType = rng.next() < urbanFrac ? 'urban' : 'rural';
  }

  // ── Layer 5: Gender ───────────────────────────────────
  let gender: Gender;
  if (constraints.gender) {
    gender = constraints.gender;
  } else {
    // Use sex ratio (females per 1000 males)
    const femaleProp = stateData.sexRatio / (1000 + stateData.sexRatio);
    gender = rng.next() < femaleProp ? 'female' : 'male';
  }

  // ── Compute joint probability ─────────────────────────
  const jointProb = religionProb * stateProb * casteProb;

  return {
    religionId,
    stateId,
    casteId,
    socialCategory,
    jointProb,
    gender,
    areaType,
    stateName: stateData.stateName,
    religionLabel: db.religions[religionId]?.label ?? religionId,
    casteLabel,
    probMetrics
  };
}

// ─────────────────────────────────────────────────────────────
// Socioeconomic Layer Resolution
// ─────────────────────────────────────────────────────────────

/**
 * Resolves the socioeconomic layers conditioned on the demographic path.
 */
export function resolveSocioeconomicLayers(
  db: CompiledDatabase,
  path: ResolvedPath & { gender: Gender; areaType: AreaType; stateId: string },
  constraints: GenerationConstraints,
  rng: SeededRNG
): {
  education: EducationLevel;
  educationProb: number;
  occupation: OccupationalSector;
  occupationProb: number;
  maritalStatus: MaritalStatus;
  age: number;
  householdSize: number;
  income: number;
  householdAssets: HouseholdAssets;
} {
  const stateData = db.states[path.stateId];

  // ── Education ─────────────────────────────────────────
  let education: EducationLevel;
  let educationProb: number;
  
  if (constraints.education) {
    education = constraints.education;
    educationProb = 0.1; // fixed constraint
  } else if (stateData?.educationDistribution?.[path.areaType]) {
    const eduDist = stateData.educationDistribution[path.areaType];
    const result = weightedSampleFromRecord(eduDist as unknown as Record<string, number>, rng);
    education = result.key as EducationLevel;
    educationProb = result.probability;
  } else {
    // Fallback distribution
    const fallback = getDefaultEducationDist(path.areaType, path.socialCategory);
    const result = weightedSampleFromRecord(fallback, rng);
    education = result.key as EducationLevel;
    educationProb = result.probability;
  }

  // ── Occupation ────────────────────────────────────────
  let occupation: OccupationalSector;
  let occupationProb: number;
  
  if (constraints.occupation) {
    occupation = constraints.occupation;
    occupationProb = 0.1;
  } else if (stateData?.occupationDistribution?.[path.gender]) {
    const occDist = stateData.occupationDistribution[path.gender];
    const result = weightedSampleFromRecord(occDist as unknown as Record<string, number>, rng);
    occupation = result.key as OccupationalSector;
    occupationProb = result.probability;
  } else {
    const fallback = getDefaultOccupationDist(path.gender, path.areaType);
    const result = weightedSampleFromRecord(fallback, rng);
    occupation = result.key as OccupationalSector;
    occupationProb = result.probability;
  }

  // ── Age ───────────────────────────────────────────────
  let age: number;
  if (constraints.ageRange) {
    age = ageSample(rng, constraints.ageRange.min, constraints.ageRange.max);
  } else {
    age = ageSample(rng);
  }

  // ── Marital Status (conditioned on age) ───────────────
  let maritalStatus: MaritalStatus;
  if (constraints.maritalStatus) {
    maritalStatus = constraints.maritalStatus;
  } else {
    maritalStatus = sampleMaritalStatus(age, path.gender, rng);
  }

  // ── Household Size ────────────────────────────────────
  const householdSize = householdSizeSample(rng, path.areaType);

  // ── Income ────────────────────────────────────────────
  const income = incomeSample(rng, {
    areaType: path.areaType,
    education,
    occupation,
    state: path.stateId
  });

  // ── Household Assets ──────────────────────────────────
  const householdAssets = sampleHouseholdAssets(
    db, path.stateId, path.areaType, income, rng
  );

  return {
    education,
    educationProb,
    occupation,
    occupationProb,
    maritalStatus,
    age,
    householdSize,
    income,
    householdAssets
  };
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

/** Normalize a string key for matching */
function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[\s\-_]+/g, '_').trim();
}

/** Find a key match in an array, allowing flexible matching */
function findKeyMatch(keys: string[], target: string): string | null {
  // Exact match
  if (keys.includes(target)) return target;
  // Normalized match
  const normalized = normalizeKey(target);
  for (const key of keys) {
    if (normalizeKey(key) === normalized) return key;
  }
  // Try ignoring non-alphanumeric chars and handling "and"/"&"
  const alphaTarget = normalized.replace(/[^a-z0-9]/g, '');
  const cleanTarget = normalized.replace(/_and_/g, '_').replace(/_&_/g, '_').replace(/[^a-z0-9_]/g, '');
  
  for (const key of keys) {
    const keyNorm = normalizeKey(key);
    if (keyNorm.replace(/[^a-z0-9]/g, '') === alphaTarget) return key;
    if (keyNorm.replace(/_and_/g, '_').replace(/[^a-z0-9_]/g, '') === cleanTarget) return key;
  }
  
  // Partial match on cleaned strings
  for (const key of keys) {
    const keyClean = normalizeKey(key).replace(/_and_/g, '_').replace(/_&_/g, '_').replace(/[^a-z0-9_]/g, '');
    if (cleanTarget.includes(keyClean) || keyClean.includes(cleanTarget)) return key;
  }
  
  // Partial match (legacy fallback)
  for (const key of keys) {
    if (normalizeKey(key).includes(normalized) || normalized.includes(normalizeKey(key))) return key;
  }
  return null;
}

/** Get castes for a religion-state context */
function getCastesForContext(
  db: CompiledDatabase,
  religionId: string,
  stateId: string
): CasteEntry[] {
  const byReligion = db.casteMap[religionId];
  if (!byReligion) return [];
  
  // Try exact state match
  if (byReligion[stateId]) return byReligion[stateId];
  
  // Try normalized match
  for (const [key, castes] of Object.entries(byReligion)) {
    if (normalizeKey(key) === normalizeKey(stateId)) return castes;
  }
  
  // Fallback: use 'default' or first available
  if (byReligion['default']) return byReligion['default'];
  
  const firstKey = Object.keys(byReligion)[0];
  return firstKey ? byReligion[firstKey] : [];
}

/** Create fallback state data when census data is missing */
function createFallbackStateData(stateId: string): StateCensusData {
  return {
    stateCode: stateId.substring(0, 2).toUpperCase(),
    stateName: stateId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    totalPopulation: 50000000,
    urbanPopulation: 15000000,
    ruralPopulation: 35000000,
    sexRatio: 943,
    literacyRate: 74.04,
    religionDistribution: { hindu: 0.80, muslim: 0.14, christian: 0.02, sikh: 0.02, buddhist: 0.01, jain: 0.004, other: 0.006 },
    scProportion: 0.166,
    stProportion: 0.084,
    educationDistribution: {
      urban: { illiterate: 0.10, literate_below_primary: 0.05, primary: 0.10, middle: 0.15, secondary: 0.20, higher_secondary: 0.15, graduate: 0.15, postgraduate: 0.05, technical_diploma: 0.03, professional_degree: 0.02 },
      rural: { illiterate: 0.30, literate_below_primary: 0.10, primary: 0.15, middle: 0.15, secondary: 0.12, higher_secondary: 0.08, graduate: 0.06, postgraduate: 0.02, technical_diploma: 0.01, professional_degree: 0.01 }
    },
    occupationDistribution: {
      male: { cultivator: 0.25, agricultural_labourer: 0.15, household_industry: 0.04, other_worker: 0.35, non_worker: 0.21 },
      female: { cultivator: 0.15, agricultural_labourer: 0.20, household_industry: 0.05, other_worker: 0.10, non_worker: 0.50 },
      other: { cultivator: 0.20, agricultural_labourer: 0.18, household_industry: 0.04, other_worker: 0.25, non_worker: 0.33 }
    },
    languageDistribution: { hindi: 0.50, english: 0.10 },
    assetDistribution: {
      urban: {},
      rural: {}
    }
  };
}

/** Default education distribution based on area and social category */
function getDefaultEducationDist(
  areaType: AreaType,
  socialCategory: SocialCategory
): Record<string, number> {
  const scStPenalty = (socialCategory === 'SC' || socialCategory === 'ST') ? 1.5 : 1.0;
  
  if (areaType === 'urban') {
    return {
      illiterate: 0.08 * scStPenalty,
      literate_below_primary: 0.04,
      primary: 0.09,
      middle: 0.14,
      secondary: 0.20,
      higher_secondary: 0.17,
      graduate: 0.17 / scStPenalty,
      postgraduate: 0.06 / scStPenalty,
      technical_diploma: 0.03,
      professional_degree: 0.02 / scStPenalty
    };
  }
  return {
    illiterate: 0.28 * scStPenalty,
    literate_below_primary: 0.08,
    primary: 0.14,
    middle: 0.16,
    secondary: 0.13,
    higher_secondary: 0.09,
    graduate: 0.07 / scStPenalty,
    postgraduate: 0.02 / scStPenalty,
    technical_diploma: 0.02,
    professional_degree: 0.01 / scStPenalty
  };
}

/** Default occupation distribution */
function getDefaultOccupationDist(
  gender: Gender,
  areaType: AreaType
): Record<string, number> {
  if (gender === 'female') {
    return areaType === 'urban'
      ? { cultivator: 0.02, agricultural_labourer: 0.03, household_industry: 0.05, other_worker: 0.25, non_worker: 0.65 }
      : { cultivator: 0.20, agricultural_labourer: 0.25, household_industry: 0.06, other_worker: 0.09, non_worker: 0.40 };
  }
  return areaType === 'urban'
    ? { cultivator: 0.03, agricultural_labourer: 0.04, household_industry: 0.05, other_worker: 0.55, non_worker: 0.33 }
    : { cultivator: 0.30, agricultural_labourer: 0.20, household_industry: 0.04, other_worker: 0.20, non_worker: 0.26 };
}

/** Sample marital status conditioned on age and gender */
function sampleMaritalStatus(age: number, gender: Gender, rng: SeededRNG): MaritalStatus {
  if (age < 18) return 'never_married';
  
  // Marriage probability increases with age
  let marriedProb: number;
  let widowedProb: number;
  let divorcedProb: number;
  
  if (age < 25) {
    marriedProb = gender === 'female' ? 0.45 : 0.20;
    widowedProb = 0.001;
    divorcedProb = 0.005;
  } else if (age < 35) {
    marriedProb = 0.75;
    widowedProb = 0.01;
    divorcedProb = 0.02;
  } else if (age < 50) {
    marriedProb = 0.85;
    widowedProb = gender === 'female' ? 0.05 : 0.02;
    divorcedProb = 0.03;
  } else if (age < 65) {
    marriedProb = 0.80;
    widowedProb = gender === 'female' ? 0.15 : 0.05;
    divorcedProb = 0.02;
  } else {
    marriedProb = 0.60;
    widowedProb = gender === 'female' ? 0.35 : 0.15;
    divorcedProb = 0.01;
  }
  
  const neverMarriedProb = Math.max(0, 1 - marriedProb - widowedProb - divorcedProb);
  const dist: Record<string, number> = {
    married: marriedProb,
    never_married: neverMarriedProb,
    widowed: widowedProb,
    divorced_separated: divorcedProb
  };
  
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as MaritalStatus;
}

/** Sample household assets based on state, area type, and income */
function sampleHouseholdAssets(
  db: CompiledDatabase,
  stateId: string,
  areaType: AreaType,
  income: number,
  rng: SeededRNG
): HouseholdAssets {
  // Income-based probability adjustments
  const incomeLevel = income < 100000 ? 'low' : income < 300000 ? 'mid' : income < 600000 ? 'high' : 'very_high';
  
  const baseProbs: Record<string, Record<string, number>> = {
    low:       { radio: 0.15, tv: 0.35, computer: 0.03, phone: 0.60, bicycle: 0.45, scooter: 0.08, car: 0.01, banking: 0.30, water: 0.40, latrine: 0.30 },
    mid:       { radio: 0.20, tv: 0.65, computer: 0.12, phone: 0.85, bicycle: 0.50, scooter: 0.25, car: 0.05, banking: 0.60, water: 0.55, latrine: 0.60 },
    high:      { radio: 0.22, tv: 0.85, computer: 0.35, phone: 0.95, bicycle: 0.45, scooter: 0.45, car: 0.20, banking: 0.80, water: 0.70, latrine: 0.85 },
    very_high: { radio: 0.20, tv: 0.95, computer: 0.65, phone: 0.99, bicycle: 0.35, scooter: 0.55, car: 0.45, banking: 0.95, water: 0.85, latrine: 0.95 }
  };
  
  const probs = baseProbs[incomeLevel];
  const urbanBoost = areaType === 'urban' ? 1.2 : 0.85;

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  // Roof material
  const roofOptions: Array<{ value: HouseholdAssets['roofMaterial']; weight: number }> = 
    areaType === 'urban'
      ? [{ value: 'concrete', weight: 0.55 }, { value: 'metal_sheet', weight: 0.25 }, { value: 'tiles', weight: 0.15 }, { value: 'thatch', weight: 0.03 }, { value: 'other', weight: 0.02 }]
      : [{ value: 'tiles', weight: 0.25 }, { value: 'thatch', weight: 0.25 }, { value: 'metal_sheet', weight: 0.25 }, { value: 'concrete', weight: 0.20 }, { value: 'other', weight: 0.05 }];
  
  // Wall material
  const wallOptions: Array<{ value: HouseholdAssets['wallMaterial']; weight: number }> =
    areaType === 'urban'
      ? [{ value: 'burnt_brick', weight: 0.65 }, { value: 'stone', weight: 0.15 }, { value: 'mud', weight: 0.10 }, { value: 'wood', weight: 0.05 }, { value: 'other', weight: 0.05 }]
      : [{ value: 'mud', weight: 0.35 }, { value: 'burnt_brick', weight: 0.30 }, { value: 'stone', weight: 0.15 }, { value: 'wood', weight: 0.10 }, { value: 'other', weight: 0.10 }];

  // Cooking fuel
  const fuelOptions: Array<{ value: HouseholdAssets['cookingFuel']; weight: number }> =
    areaType === 'urban'
      ? [{ value: 'lpg', weight: 0.65 }, { value: 'firewood', weight: 0.10 }, { value: 'kerosene', weight: 0.10 }, { value: 'electricity', weight: 0.05 }, { value: 'biogas', weight: 0.03 }, { value: 'coal', weight: 0.03 }, { value: 'crop_residue', weight: 0.02 }, { value: 'cowdung', weight: 0.01 }, { value: 'other', weight: 0.01 }]
      : [{ value: 'firewood', weight: 0.40 }, { value: 'lpg', weight: 0.20 }, { value: 'crop_residue', weight: 0.12 }, { value: 'cowdung', weight: 0.12 }, { value: 'kerosene', weight: 0.06 }, { value: 'coal', weight: 0.04 }, { value: 'biogas', weight: 0.03 }, { value: 'electricity', weight: 0.02 }, { value: 'other', weight: 0.01 }];

  // Lighting source
  const lightOptions: Array<{ value: HouseholdAssets['lightingSource']; weight: number }> =
    areaType === 'urban'
      ? [{ value: 'electricity', weight: 0.93 }, { value: 'kerosene', weight: 0.04 }, { value: 'solar', weight: 0.02 }, { value: 'other', weight: 0.01 }]
      : [{ value: 'electricity', weight: 0.67 }, { value: 'kerosene', weight: 0.25 }, { value: 'solar', weight: 0.05 }, { value: 'other', weight: 0.03 }];

  // Drinking water
  const waterOptions: Array<{ value: HouseholdAssets['drinkingWaterSource']; weight: number }> =
    areaType === 'urban'
      ? [{ value: 'tap_treated', weight: 0.50 }, { value: 'tap_untreated', weight: 0.15 }, { value: 'handpump', weight: 0.10 }, { value: 'tubewell', weight: 0.10 }, { value: 'well_covered', weight: 0.05 }, { value: 'well_uncovered', weight: 0.03 }, { value: 'river', weight: 0.02 }, { value: 'other', weight: 0.05 }]
      : [{ value: 'handpump', weight: 0.30 }, { value: 'tap_untreated', weight: 0.15 }, { value: 'tubewell', weight: 0.15 }, { value: 'well_uncovered', weight: 0.12 }, { value: 'tap_treated', weight: 0.10 }, { value: 'well_covered', weight: 0.08 }, { value: 'river', weight: 0.05 }, { value: 'other', weight: 0.05 }];

  const rooms = Math.max(1, Math.min(6, Math.round(
    areaType === 'urban' 
      ? gaussianSample(2.5, 1.0, rng)
      : gaussianSample(2.0, 0.8, rng)
  )));

  return {
    hasRadioTransistor: bernoulliSample(clamp(probs.radio * urbanBoost), rng),
    hasTelevision: bernoulliSample(clamp(probs.tv * urbanBoost), rng),
    hasComputer: bernoulliSample(clamp(probs.computer * urbanBoost), rng),
    hasPhone: bernoulliSample(clamp(probs.phone * urbanBoost), rng),
    hasBicycle: bernoulliSample(clamp(probs.bicycle), rng),
    hasScooter: bernoulliSample(clamp(probs.scooter * urbanBoost), rng),
    hasCar: bernoulliSample(clamp(probs.car * urbanBoost), rng),
    bankingService: bernoulliSample(clamp(probs.banking * urbanBoost), rng),
    treatedWaterSource: bernoulliSample(clamp(probs.water * urbanBoost), rng),
    latrineFacility: bernoulliSample(clamp(probs.latrine * urbanBoost), rng),
    numberOfRooms: rooms,
    roofMaterial: weightedSample(roofOptions, rng).item.value,
    wallMaterial: weightedSample(wallOptions, rng).item.value,
    cookingFuel: weightedSample(fuelOptions, rng).item.value,
    lightingSource: weightedSample(lightOptions, rng).item.value,
    drinkingWaterSource: weightedSample(waterOptions, rng).item.value
  };
}
