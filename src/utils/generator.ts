/**
 * High-Level Generator Module (40+ Fields)
 * 
 * The main profile generation pipeline that orchestrates:
 * 1. Database loading
 * 2. Tree path resolution (via constraint engine)
 * 3. Socioeconomic layer resolution
 * 4. Name generation (self, father, mother, spouse)
 * 5. Identity documents (Aadhaar, PAN, Voter ID, Phone, Email)
 * 6. Biometrics (height, weight, BMI, blood group)
 * 7. Address (street, locality, PIN code)
 * 8. Lifestyle (diet, disability, migration, digital, vehicle)
 * 9. Financial (bank, ration card, health insurance, land)
 * 10. Probability metrics computation
 * 11. Final profile assembly
 */

import type {
  DemographicProfile,
  GeneratorOptions,
  GenerationConstraints,
  ProbabilityMetrics,
  CompiledDatabase,
  Gender
} from '../types.js';

import { createRNG, normalizeSeed } from '../core/sampler.js';
import { resolveTreePath, resolveSocioeconomicLayers } from '../core/engine.js';
import { loadDatabase } from '../database/index.js';
import {
  selectFirstName,
  selectSurname,
  selectMotherTongue,
  selectSecondLanguage,
  selectDistrict
} from './names.js';
import {
  generateAadhaar,
  generatePAN,
  generateVoterID,
  generatePhoneNumber,
  generateEmail,
  generateDOB,
  generateBloodGroup,
  generateHeight,
  generateWeight,
  generateBankDetails,
  generateVehicleRegistration,
  generatePinCode,
  generateAddress,
  generateUPI
} from './identifiers.js';
import {
  generateDiet,
  generateDisability,
  generateMigration,
  generateEmploymentSector,
  generateNumberOfChildren,
  generateMonthlyExpenditure,
  generateRationCardType,
  generateHealthInsurance,
  generateLandOwnership,
  generateDigitalAccess,
  generateVehicleType
} from './lifestyle.js';
import {
  generatePoliticalLeaning,
  generateReligiosity,
  generatePersonality,
  generateCognitiveProfile,
  generateInterests,
  generateHabits,
  generateEducationDetails
} from './psychology.js';
import { generateCulturalProfile } from './cultural.js';

// UUID v4 generator (no external dependency)
function generateUUID(rng: ReturnType<typeof createRNG>): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // version 4
    } else if (i === 19) {
      uuid += hex[(Math.floor(rng.next() * 4) + 8)]; // variant
    } else {
      uuid += hex[Math.floor(rng.next() * 16)];
    }
  }
  return uuid;
}

/**
 * Generate one or more demographically consistent profiles.
 * Now produces 40+ fields per profile.
 * 
 * @param options - Generation options including count, seed, and constraints
 * @returns Array of DemographicProfile objects
 * 
 * @example
 * ```ts
 * // Generate 10 random profiles
 * const profiles = generate({ count: 10 });
 * 
 * // Generate a profile constrained to Hindu + Tamil Nadu
 * const tnProfile = generate({ 
 *   constraints: { religion: 'Hindu', state: 'Tamil Nadu' }
 * });
 * 
 * // Reproducible generation with a seed
 * const seeded = generate({ count: 5, seed: 42 });
 * ```
 */
export function generate(options: GeneratorOptions = {}): DemographicProfile[] {
  const {
    count = 1,
    seed,
    constraints = {},
    includeProbabilityMetrics = true,
    dataDir
  } = options;

  const rng = createRNG(seed);
  const db = loadDatabase(dataDir);

  const profiles: DemographicProfile[] = [];
  for (let i = 0; i < count; i++) {
    const profile = generateSingleProfile(db, constraints, rng, includeProbabilityMetrics);
    profiles.push(profile);
  }

  return profiles;
}

/**
 * Generate a single demographic profile with all 40+ fields.
 */
function generateSingleProfile(
  db: CompiledDatabase,
  constraints: GenerationConstraints,
  rng: ReturnType<typeof createRNG>,
  includeProbabilityMetrics: boolean
): DemographicProfile {
  // ── Step 1: Resolve tree path ─────────────────────────
  const path = resolveTreePath(db, constraints, rng);

  // ── Step 2: Resolve socioeconomic layers ───────────────
  const socio = resolveSocioeconomicLayers(db, { ...path }, constraints, rng);

  // ── Step 3: Generate names (self + family) ────────────
  const { name: firstName } = selectFirstName(db, path.religionId, path.stateId, path.gender, rng);
  const { name: selectedLastName, probability: selectedSurnameProb } = selectSurname(db, path.casteId, path.gender, rng);
  // Allow family/relational generation to pin the surname explicitly
  const lastName = constraints.surname ?? selectedLastName;
  const surnameProb = constraints.surname ? 1.0 : selectedSurnameProb;

  // Father's name (male name from same religion+state)
  const { name: fatherFirstName } = selectFirstName(db, path.religionId, path.stateId, 'male', rng);
  const fatherName = `${fatherFirstName} ${lastName}`;

  // Mother's name (female name from same religion+state).
  // Avoids the same first name as the profile itself (common with random sampling).
  let motherFirstName = selectFirstName(db, path.religionId, path.stateId, 'female', rng).name;
  for (let i = 0; i < 5 && motherFirstName === firstName; i++) {
    motherFirstName = selectFirstName(db, path.religionId, path.stateId, 'female', rng).name;
  }
  // Mother's maiden surname (potentially different caste for realism)
  const { name: motherLastName } = selectSurname(db, path.casteId, 'female', rng);
  const motherName = `${motherFirstName} ${motherLastName}`;

  // Spouse name (if married)
  let spouseName: string | undefined;
  if (socio.maritalStatus === 'married' || socio.maritalStatus === 'widowed') {
    const spouseGender: Gender = path.gender === 'male' ? 'female' : 'male';
    let spouseFirst = selectFirstName(db, path.religionId, path.stateId, spouseGender, rng).name;
    for (let i = 0; i < 5 && spouseFirst === firstName; i++) {
      spouseFirst = selectFirstName(db, path.religionId, path.stateId, spouseGender, rng).name;
    }
    spouseName = `${spouseFirst} ${lastName}`;
  }

  // ── Step 4: Date of Birth & Biometrics ────────────────
  const dateOfBirth = generateDOB(socio.age, rng);
  const bloodGroup = generateBloodGroup(rng);
  const heightCm = generateHeight(path.gender, socio.age, rng);
  const weightKg = generateWeight(path.gender, socio.age, heightCm, path.areaType, rng);
  const bmi = Math.round((weightKg / ((heightCm / 100) ** 2)) * 10) / 10;

  // ── Step 5: Identity Documents ────────────────────────
  const aadhaarNumber = generateAadhaar(rng);
  const panNumber = socio.age >= 18 ? generatePAN(lastName, rng) : '';
  const voterIdNumber = socio.age >= 18 ? generateVoterID(path.stateId, rng) : '';
  const phoneNumber = generatePhoneNumber(path.stateId, rng);
  const email = generateEmail(firstName, lastName, rng);

  // ── Step 6: Location ──────────────────────────────────
  const district = selectDistrict(db, path.stateId, rng);
  const stateData = db.states[path.stateId];
  const stateCode = stateData?.stateCode ?? path.stateId.substring(0, 2).toUpperCase();
  const pinCode = generatePinCode(path.stateId, rng);
  const { addressLine, locality } = generateAddress(district, path.areaType, rng);

  // ── Step 7: Language ──────────────────────────────────
  const motherTongue = selectMotherTongue(db, path.stateId, rng);
  const secondLanguage = selectSecondLanguage(db, path.stateId, motherTongue, socio.education, rng);

  // ── Step 8: Employment ────────────────────────────────
  const employmentSector = generateEmploymentSector(
    socio.occupation, socio.education, socio.age, path.areaType, path.gender, rng
  );

  // ── Step 9: Children ──────────────────────────────────
  const numberOfChildren = generateNumberOfChildren(
    socio.age, socio.maritalStatus, path.gender, socio.education, path.areaType, rng
  );

  // ── Step 10: Lifestyle ────────────────────────────────
  const dietaryPreference = generateDiet(path.religionId, path.stateId, rng);
  const disability = generateDisability(rng);
  const { isMigrant, migrationOriginState } = generateMigration(
    path.stateId, path.areaType, path.gender, db, rng
  );

  // ── Step 11: Financial ────────────────────────────────
  const monthlyExpenditureINR = generateMonthlyExpenditure(
    socio.income, path.areaType, socio.householdSize, rng
  );
  const { bankName, bankIFSC, bankAccountNumber } = generateBankDetails(rng);
  const rationCardType = generateRationCardType(socio.income, path.areaType, rng);
  const healthInsurance = generateHealthInsurance(
    socio.income, employmentSector, path.socialCategory, rng
  );
  const landOwnershipAcres = generateLandOwnership(
    path.areaType, socio.occupation, path.socialCategory, rng
  );

  // ── Step 12: Vehicle ──────────────────────────────────
  const vehicleType = generateVehicleType(
    socio.income, path.areaType,
    socio.householdAssets.hasCar, socio.householdAssets.hasScooter, rng
  );
  const vehicleRegistration = vehicleType !== 'none'
    ? generateVehicleRegistration(path.stateId, rng)
    : undefined;

  // ── Step 13: Digital ──────────────────────────────────
  const { hasInternetAccess, hasSmartphone, usesSocialMedia } = generateDigitalAccess(
    socio.age, socio.education, socio.income, path.areaType, rng
  );
  const upiId = hasSmartphone ? generateUPI(phoneNumber, firstName, rng) : undefined;

  // ── Step 14: Psychology & Behavior ─────────────────────
  const religiosity = generateReligiosity(
    path.religionId, path.gender, socio.age, socio.education, path.areaType, rng
  );
  const politicalLeaning = generatePoliticalLeaning(
    path.religionId, path.stateId, path.socialCategory,
    socio.education, socio.age, path.areaType, rng
  );
  const personality = generatePersonality(
    path.gender, socio.age, socio.education, path.areaType,
    religiosity, socio.occupation, rng
  );
  const cognitiveProfile = generateCognitiveProfile(
    socio.education, socio.income, path.areaType, socio.age, hasSmartphone, rng
  );
  const interests = generateInterests(
    path.gender, socio.age, path.religionId, path.stateId,
    socio.education, path.areaType, hasSmartphone, rng
  );
  const habits = generateHabits(
    path.gender, socio.age, path.religionId, path.stateId,
    path.areaType, socio.education, socio.income, rng
  );
  const educationDetails = generateEducationDetails(
    socio.education, path.gender, path.stateId, path.socialCategory,
    path.areaType, socio.income, socio.age, rng
  );
  const culturalProfile = generateCulturalProfile(
    path.casteId, path.religionId, path.stateId, path.socialCategory,
    socio.education, path.areaType, path.gender, socio.age, socio.income, rng
  );

  // ── Step 15: Probability metrics ──────────────────────
  const probMetrics: ProbabilityMetrics = {
    nationalReligionFreq: path.probMetrics.nationalReligionFreq ?? 0,
    stateGivenReligionProb: path.probMetrics.stateGivenReligionProb ?? 0,
    casteGivenContextProb: path.probMetrics.casteGivenContextProb ?? 0,
    lastNameGivenCasteProb: surnameProb,
    socialCategoryProb: path.probMetrics.socialCategoryProb ?? 0,
    educationProb: socio.educationProb,
    occupationProb: socio.occupationProb,
    jointProbability: path.jointProb * surnameProb * socio.educationProb * socio.occupationProb
  };

  // ── Step 15: Assemble final profile ───────────────────
  const profile: DemographicProfile = {
    id: generateUUID(rng),

    // Identity
    firstName,
    lastName,
    fatherName,
    motherName,
    spouseName,
    gender: path.gender,
    age: socio.age,
    dateOfBirth,
    bloodGroup,

    // Biometrics
    heightCm,
    weightKg,
    bmi,

    // Identity Documents
    aadhaarNumber,
    panNumber,
    voterIdNumber,
    phoneNumber,
    email,

    // Location
    state: path.stateName,
    stateCode,
    district,
    areaType: path.areaType,
    addressLine,
    locality,
    pinCode,

    // Demographics
    religion: path.religionLabel,
    caste: path.casteLabel,
    socialCategory: path.socialCategory,
    motherTongue,
    secondLanguage,

    // Socioeconomic
    education: socio.education,
    occupation: socio.occupation,
    employmentSector,
    maritalStatus: socio.maritalStatus,
    annualIncomeINR: socio.income,
    monthlyExpenditureINR,
    numberOfChildren,

    // Lifestyle
    dietaryPreference,
    disability,
    isMigrant,
    migrationOriginState,

    // Financial
    bankIFSC,
    bankName,
    bankAccountNumber,
    rationCardType,
    healthInsurance,
    landOwnershipAcres,

    // Vehicle
    vehicleRegistration,
    vehicleType,

    // Digital
    hasInternetAccess,
    hasSmartphone,
    usesSocialMedia,
    upiId,

    // Psychological & Behavioral
    personality,
    politicalLeaning,
    religiosity,
    cognitiveProfile,
    interests,
    habits,
    educationDetails,
    culturalProfile,

    // Household
    householdSize: socio.householdSize,
    householdAssets: socio.householdAssets,

    // Probability Metrics
    probabilityMetrics: includeProbabilityMetrics ? probMetrics : {} as ProbabilityMetrics,

    // Metadata
    generatedAt: new Date().toISOString(),
    seed: rng.seed
  };

  return profile;
}

/**
 * Generate profiles as a stream (generator function).
 * Useful for generating very large datasets without holding
 * everything in memory.
 */
export function* generateStream(options: GeneratorOptions = {}): Generator<DemographicProfile> {
  const {
    count = 1,
    seed,
    constraints = {},
    includeProbabilityMetrics = true,
    dataDir
  } = options;

  const rng = createRNG(seed);
  const db = loadDatabase(dataDir);

  for (let i = 0; i < count; i++) {
    yield generateSingleProfile(db, constraints, rng, includeProbabilityMetrics);
  }
}

/**
 * Get statistical summary of generated profiles.
 * Useful for validating demographic distributions.
 */
export function getDistributionSummary(profiles: DemographicProfile[]): Record<string, Record<string, number>> {
  const summary: Record<string, Record<string, number>> = {
    religion: {},
    state: {},
    gender: {},
    socialCategory: {},
    areaType: {},
    education: {},
    occupation: {},
    maritalStatus: {},
    dietaryPreference: {},
    employmentSector: {},
    bloodGroup: {},
    disability: {},
    rationCardType: {},
    healthInsurance: {},
    vehicleType: {},
    politicalLeaning: {},
    religiosity: {},
    tobaccoUse: {},
    alcoholUse: {},
    primarySport: {},
    petPreference: {},
    readingHabit: {}
  };

  for (const p of profiles) {
    summary.religion[p.religion] = (summary.religion[p.religion] ?? 0) + 1;
    summary.state[p.state] = (summary.state[p.state] ?? 0) + 1;
    summary.gender[p.gender] = (summary.gender[p.gender] ?? 0) + 1;
    summary.socialCategory[p.socialCategory] = (summary.socialCategory[p.socialCategory] ?? 0) + 1;
    summary.areaType[p.areaType] = (summary.areaType[p.areaType] ?? 0) + 1;
    summary.education[p.education] = (summary.education[p.education] ?? 0) + 1;
    summary.occupation[p.occupation] = (summary.occupation[p.occupation] ?? 0) + 1;
    summary.maritalStatus[p.maritalStatus] = (summary.maritalStatus[p.maritalStatus] ?? 0) + 1;
    summary.dietaryPreference[p.dietaryPreference] = (summary.dietaryPreference[p.dietaryPreference] ?? 0) + 1;
    summary.employmentSector[p.employmentSector] = (summary.employmentSector[p.employmentSector] ?? 0) + 1;
    summary.bloodGroup[p.bloodGroup] = (summary.bloodGroup[p.bloodGroup] ?? 0) + 1;
    summary.disability[p.disability] = (summary.disability[p.disability] ?? 0) + 1;
    summary.rationCardType[p.rationCardType] = (summary.rationCardType[p.rationCardType] ?? 0) + 1;
    summary.healthInsurance[p.healthInsurance] = (summary.healthInsurance[p.healthInsurance] ?? 0) + 1;
    if (p.vehicleType) {
      summary.vehicleType[p.vehicleType] = (summary.vehicleType[p.vehicleType] ?? 0) + 1;
    }
    summary.politicalLeaning[p.politicalLeaning] = (summary.politicalLeaning[p.politicalLeaning] ?? 0) + 1;
    summary.religiosity[p.religiosity] = (summary.religiosity[p.religiosity] ?? 0) + 1;
    summary.tobaccoUse[p.habits.tobaccoUse] = (summary.tobaccoUse[p.habits.tobaccoUse] ?? 0) + 1;
    summary.alcoholUse[p.habits.alcoholUse] = (summary.alcoholUse[p.habits.alcoholUse] ?? 0) + 1;
    summary.primarySport[p.interests.primarySport] = (summary.primarySport[p.interests.primarySport] ?? 0) + 1;
    summary.petPreference[p.interests.petPreference] = (summary.petPreference[p.interests.petPreference] ?? 0) + 1;
    summary.readingHabit[p.interests.readingHabit] = (summary.readingHabit[p.interests.readingHabit] ?? 0) + 1;
  }

  // Convert to percentages
  const total = profiles.length;
  for (const category of Object.keys(summary)) {
    for (const key of Object.keys(summary[category])) {
      summary[category][key] = Math.round((summary[category][key] / total) * 10000) / 100;
    }
  }

  return summary;
}

// ─────────────────────────────────────────────────────────────
// SSPS: Enriched Generation (Layers 2 + 3 + 4)
// ─────────────────────────────────────────────────────────────


import type { EnrichmentOptions, EnrichedProfile } from '../types.js';
import { simulateOutcomes } from './outcomes.js';
import { generateNarrative, generateAllNarratives } from './narrative.js';
import type { NarrativeDocumentType } from './narrative.js';
import { generateAgentPersona } from './agent.js';

/**
 * Generate enriched profiles with optional Outcome Simulation (Layer 2),
 * Narrative Documents (Layer 3), and Agent Persona Schema (Layer 4).
 *
 * Backwards compatible: if no EnrichmentOptions are provided, this is
 * equivalent to calling generate() and wrapping each profile in { profile }.
 *
 * @param options - Base GeneratorOptions + EnrichmentOptions
 * @returns Array of EnrichedProfile objects
 *
 * @example
 * // Generate 10 profiles with all enrichment layers, moderate bias
 * const enriched = generateEnriched({
 *   count: 10,
 *   includeOutcomes: true,
 *   biasLevel: 0.3,
 *   narrativeTypes: ['loan_application', 'hinglish_conversation'],
 *   includeAgentPersona: true,
 * });
 * console.log(enriched[0].agentPersona?.systemPrompt);
 * console.log(enriched[0].outcomes?.credit.creditScore);
 */
export function generateEnriched(
  options: Parameters<typeof generate>[0] & EnrichmentOptions = {}
): EnrichedProfile[] {
  const {
    includeOutcomes = false,
    biasLevel = 0.3,
    narrativeTypes,
    includeAgentPersona = false,
    ...baseOptions
  } = options;

  const profiles = generate(baseOptions);
  const seed = normalizeSeed(baseOptions.seed ?? Date.now());
  const rng = createRNG(seed + 999999); // Separate RNG stream for enrichment

  return profiles.map(profile => {
    const enriched: EnrichedProfile = { profile };

    // Layer 2: Outcomes
    if (includeOutcomes) {
      enriched.outcomes = simulateOutcomes(profile, biasLevel, rng);
    }

    // Layer 3: Narratives
    if (narrativeTypes && narrativeTypes.length > 0) {
      const outcomes = enriched.outcomes ?? simulateOutcomes(profile, biasLevel, rng);
      if (narrativeTypes.includes('all')) {
        enriched.narratives = generateAllNarratives(profile, outcomes);
      } else {
        enriched.narratives = narrativeTypes.map(t =>
          generateNarrative(profile, outcomes, t as NarrativeDocumentType)
        );
      }
    }

    // Layer 4: Agent Persona
    if (includeAgentPersona) {
      enriched.agentPersona = generateAgentPersona(profile);
    }

    return enriched;
  });
}

/**
 * Generator stream variant of generateEnriched() for large-scale use.
 * Yields EnrichedProfile objects one at a time to avoid heap pressure.
 *
 * @param options - Base GeneratorOptions + EnrichmentOptions
 * @yields EnrichedProfile objects
 */
export function* generateEnrichedStream(
  options: Parameters<typeof generate>[0] & EnrichmentOptions = {}
): Generator<EnrichedProfile> {
  const {
    count = 1,
    includeOutcomes = false,
    biasLevel = 0.3,
    narrativeTypes,
    includeAgentPersona = false,
    ...baseOptions
  } = options;

  const seed = normalizeSeed(baseOptions.seed ?? Date.now());
  const rng = createRNG(seed + 999999);

  for (const profile of generateStream({ ...baseOptions, count })) {
    const enriched: EnrichedProfile = { profile };

    if (includeOutcomes) {
      enriched.outcomes = simulateOutcomes(profile, biasLevel, rng);
    }

    if (narrativeTypes && narrativeTypes.length > 0) {
      const outcomes = enriched.outcomes ?? simulateOutcomes(profile, biasLevel, rng);
      if (narrativeTypes.includes('all')) {
        enriched.narratives = generateAllNarratives(profile, outcomes);
      } else {
        enriched.narratives = narrativeTypes.map(t =>
          generateNarrative(profile, outcomes, t as NarrativeDocumentType)
        );
      }
    }

    if (includeAgentPersona) {
      enriched.agentPersona = generateAgentPersona(profile);
    }

    yield enriched;
  }
}

