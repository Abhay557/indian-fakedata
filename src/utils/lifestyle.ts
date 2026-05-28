/**
 * Lifestyle & Socioeconomic Detail Generator
 * 
 * Generates correlated lifestyle attributes:
 * - Diet (religion + state correlated)
 * - Disability (Census 2011: 2.21%)
 * - Migration status
 * - Digital access (urban/rural + income + age)
 * - Employment sector
 * - Financial details (ration card, health insurance, land)
 * - Vehicle ownership
 * - Family details (children, spouse, parents)
 */

import type {
  SeededRNG, Gender, AreaType, SocialCategory,
  DietaryPreference, DisabilityType, EmploymentSector,
  RationCardType, HealthInsuranceType, EducationLevel, OccupationalSector,
  CompiledDatabase
} from '../types.js';

import {
  weightedSampleFromRecord, weightedSample, bernoulliSample,
  gaussianSample, logNormalSample, uniformSample
} from '../core/sampler.js';

// ─────────────────────────────────────────────────────────────
// Diet (Religion + State Correlated)
// ─────────────────────────────────────────────────────────────

/**
 * Dietary preference correlated with religion and state.
 * India-wide: ~30% vegetarian (NFHS-5), but varies hugely:
 * - Rajasthan/Gujarat: ~60-75% veg (Jain influence)
 * - Kerala/Bengal/NE: ~95%+ non-veg
 * - Muslim/Christian: ~95%+ non-veg
 * - Jain: ~99% vegetarian
 */
export function generateDiet(
  religionId: string,
  stateId: string,
  rng: SeededRNG
): DietaryPreference {
  // Religion-based baseline
  let vegProb: number;
  
  switch (religionId) {
    case 'jain':
      vegProb = 0.97;
      break;
    case 'hindu':
      vegProb = 0.36; // national Hindu average
      break;
    case 'buddhist':
      vegProb = 0.25;
      break;
    case 'sikh':
      vegProb = 0.33;
      break;
    case 'muslim':
      vegProb = 0.03;
      break;
    case 'christian':
      vegProb = 0.04;
      break;
    default:
      vegProb = 0.30;
  }
  
  // State-level adjustment (for Hindus especially)
  if (religionId === 'hindu' || religionId === 'sikh' || religionId === 'jain') {
    const stateVegModifiers: Record<string, number> = {
      rajasthan: 0.75, gujarat: 0.65, madhya_pradesh: 0.50,
      haryana: 0.55, uttar_pradesh: 0.47, delhi: 0.40,
      maharashtra: 0.35, punjab: 0.40, himachal_pradesh: 0.35,
      karnataka: 0.30, uttarakhand: 0.38,
      // Low-veg states
      kerala: 0.05, west_bengal: 0.08, tamil_nadu: 0.15,
      assam: 0.06, meghalaya: 0.03, manipur: 0.04,
      nagaland: 0.02, mizoram: 0.03, tripura: 0.08,
      arunachal_pradesh: 0.05, jharkhand: 0.12, odisha: 0.12,
      andhra_pradesh: 0.18, telangana: 0.20, bihar: 0.25,
      goa: 0.12, chhattisgarh: 0.22, sikkim: 0.05, jammu_kashmir: 0.10
    };
    
    if (stateVegModifiers[stateId] !== undefined) {
      vegProb = stateVegModifiers[stateId];
    }
  }
  
  const r = rng.next();
  if (r < vegProb) {
    // Vegetarian: small chance of vegan
    return rng.next() < 0.02 ? 'vegan' : 'vegetarian';
  } else {
    // Non-veg: small chance of eggetarian
    return rng.next() < 0.15 ? 'eggetarian' : 'non_vegetarian';
  }
}

// ─────────────────────────────────────────────────────────────
// Disability (Census 2011: 2.21% of population)
// ─────────────────────────────────────────────────────────────

/**
 * Census 2011 disability distribution:
 * Visual: 18.8%, Hearing: 18.9%, Speech: 7.5%, Locomotor: 20.3%,
 * Mental illness: 2.7%, Mental retardation: 5.6%, Multiple: 7.9%, Other: 18.4%
 */
export function generateDisability(rng: SeededRNG): DisabilityType {
  // 2.21% of population has disability
  if (rng.next() > 0.0221) return 'none';
  
  const types: Array<{ type: DisabilityType; weight: number }> = [
    { type: 'locomotor', weight: 20.3 },
    { type: 'hearing', weight: 18.9 },
    { type: 'visual', weight: 18.8 },
    { type: 'speech', weight: 7.5 },
    { type: 'multiple', weight: 7.9 },
    { type: 'mental_retardation', weight: 5.6 },
    { type: 'mental_illness', weight: 2.7 }
  ];
  
  const { item } = weightedSample(types, rng);
  return item.type;
}

// ─────────────────────────────────────────────────────────────
// Migration Status
// ─────────────────────────────────────────────────────────────

/**
 * Census 2011: ~37% of Indians are internal migrants (mostly women due to marriage).
 * Urban areas have higher migration rates.
 */
export function generateMigration(
  stateId: string,
  areaType: AreaType,
  gender: Gender,
  db: CompiledDatabase,
  rng: SeededRNG
): { isMigrant: boolean; migrationOriginState?: string } {
  // Migration probability
  let migrationProb = areaType === 'urban' ? 0.45 : 0.30;
  
  // Women have higher migration rates (marriage migration)
  if (gender === 'female') migrationProb += 0.10;
  
  // Metro cities have highest migration
  const metroCities = ['delhi', 'maharashtra', 'karnataka', 'tamil_nadu', 'telangana', 'goa'];
  if (metroCities.includes(stateId)) migrationProb += 0.10;
  
  if (!bernoulliSample(migrationProb, rng)) {
    return { isMigrant: false };
  }
  
  // Pick origin state (weighted by population, excluding current state)
  const stateKeys = Object.keys(db.states).filter(s => s !== stateId);
  if (stateKeys.length === 0) return { isMigrant: false };
  
  // High-emigration states
  const emigrationWeights: Record<string, number> = {};
  for (const s of stateKeys) {
    emigrationWeights[s] = db.states[s]?.totalPopulation ?? 50000000;
    // Bihar, UP, Jharkhand, Odisha, Rajasthan are high-emigration states
    if (['bihar', 'uttar_pradesh', 'jharkhand', 'odisha', 'rajasthan', 'madhya_pradesh', 'west_bengal'].includes(s)) {
      emigrationWeights[s] *= 2;
    }
  }
  
  const { key } = weightedSampleFromRecord(emigrationWeights, rng);
  const originState = db.states[key]?.stateName ?? key;
  
  return { isMigrant: true, migrationOriginState: originState };
}

// ─────────────────────────────────────────────────────────────
// Employment Sector
// ─────────────────────────────────────────────────────────────

/**
 * Detailed employment sector based on occupation, education, age, and area.
 */
export function generateEmploymentSector(
  occupation: OccupationalSector,
  education: EducationLevel,
  age: number,
  areaType: AreaType,
  gender: Gender,
  rng: SeededRNG
): EmploymentSector {
  if (age < 18) return 'student';
  if (age >= 60 && rng.next() < 0.3) return 'retired';
  
  if (occupation === 'non_worker') {
    if (gender === 'female' && rng.next() < 0.7) return 'homemaker';
    if (age < 25 && rng.next() < 0.5) return 'student';
    return 'unemployed';
  }
  
  if (occupation === 'cultivator' || occupation === 'agricultural_labourer') {
    return 'self_employed';
  }
  
  if (occupation === 'household_industry') {
    return 'self_employed';
  }
  
  // "other_worker" — depends on education and area
  const highEdu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma'];
  
  if (highEdu.includes(education)) {
    const dist: Record<string, number> = {
      government: areaType === 'urban' ? 0.15 : 0.20,
      private: areaType === 'urban' ? 0.50 : 0.30,
      public_sector: 0.08,
      self_employed: 0.15,
      informal: 0.07
    };
    const { key } = weightedSampleFromRecord(dist, rng);
    return key as EmploymentSector;
  }
  
  const dist: Record<string, number> = {
    informal: areaType === 'rural' ? 0.45 : 0.30,
    private: areaType === 'urban' ? 0.30 : 0.15,
    self_employed: 0.20,
    government: 0.05,
    public_sector: 0.03
  };
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as EmploymentSector;
}

// ─────────────────────────────────────────────────────────────
// Number of Children
// ─────────────────────────────────────────────────────────────

/**
 * Number of children correlated with:
 * - Age, marital status, education, area type
 * - India TFR: ~2.0 (NFHS-5), varies by state/education
 */
export function generateNumberOfChildren(
  age: number,
  maritalStatus: string,
  gender: Gender,
  education: EducationLevel,
  areaType: AreaType,
  rng: SeededRNG
): number {
  if (maritalStatus === 'never_married' || age < 20) return 0;
  
  // Base expected number of children
  let expectedChildren: number;
  
  if (age < 25) expectedChildren = 0.5;
  else if (age < 30) expectedChildren = 1.2;
  else if (age < 35) expectedChildren = 1.8;
  else if (age < 40) expectedChildren = 2.2;
  else if (age < 50) expectedChildren = 2.5;
  else expectedChildren = 2.8;
  
  // Education effect: higher education → fewer children
  const eduEffect: Record<string, number> = {
    illiterate: 1.4, literate_below_primary: 1.3, primary: 1.2,
    middle: 1.1, secondary: 1.0, higher_secondary: 0.9,
    graduate: 0.7, postgraduate: 0.6, technical_diploma: 0.7,
    professional_degree: 0.5
  };
  expectedChildren *= eduEffect[education] ?? 1.0;
  
  // Urban effect
  if (areaType === 'urban') expectedChildren *= 0.8;
  
  // Sample from Poisson-like distribution
  const children = Math.max(0, Math.round(
    gaussianSample(expectedChildren, expectedChildren * 0.5, rng)
  ));
  
  return Math.min(children, 8); // cap at 8
}

// ─────────────────────────────────────────────────────────────
// Financial Details
// ─────────────────────────────────────────────────────────────

/**
 * Monthly expenditure (correlated with income, area, household size)
 * Average Indian household spends ~70-85% of income
 */
export function generateMonthlyExpenditure(
  annualIncome: number,
  areaType: AreaType,
  householdSize: number,
  rng: SeededRNG
): number {
  const monthlyIncome = annualIncome / 12;
  const savingsRate = areaType === 'urban' ? 0.20 : 0.12;
  const baseExpenditure = monthlyIncome * (1 - savingsRate);
  
  // Add noise
  const noise = gaussianSample(1.0, 0.15, rng);
  const expenditure = baseExpenditure * Math.max(0.5, noise);
  
  return Math.max(1000, Math.round(expenditure / 100) * 100);
}

/**
 * Ration card type (income-correlated)
 * BPL: Below Poverty Line (<₹32/day rural, <₹47/day urban)
 * AAY: Antyodaya (poorest of poor)
 * APL: Above Poverty Line
 */
export function generateRationCardType(
  annualIncome: number,
  areaType: AreaType,
  rng: SeededRNG
): RationCardType {
  const monthlyPerCapita = annualIncome / 12;
  
  if (monthlyPerCapita < 3000) {
    return rng.next() < 0.4 ? 'AAY' : 'BPL';
  } else if (monthlyPerCapita < 8000) {
    return rng.next() < 0.6 ? 'BPL' : 'APL';
  } else if (monthlyPerCapita < 20000) {
    return rng.next() < 0.8 ? 'APL' : 'none';
  }
  return rng.next() < 0.5 ? 'APL' : 'none';
}

/**
 * Health insurance type
 * PMJAY: Ayushman Bharat (BPL families)
 * ESIS: Employees' State Insurance (organized sector)
 * CGHS: Central Govt Health Scheme
 */
export function generateHealthInsurance(
  annualIncome: number,
  employmentSector: EmploymentSector,
  socialCategory: SocialCategory,
  rng: SeededRNG
): HealthInsuranceType {
  // Government employees → CGHS
  if (employmentSector === 'government') {
    return rng.next() < 0.7 ? 'cghs' : 'private';
  }
  
  // Public sector → ESIS
  if (employmentSector === 'public_sector') {
    return rng.next() < 0.5 ? 'esis' : 'private';
  }
  
  // Low income → PMJAY
  if (annualIncome < 150000 || socialCategory === 'SC' || socialCategory === 'ST') {
    return rng.next() < 0.35 ? 'pmjay' : 'none';
  }
  
  // Middle-high income → private or none
  if (annualIncome > 500000) {
    return rng.next() < 0.35 ? 'private' : 'none';
  }
  
  return rng.next() < 0.15 ? 'private' : 'none';
}

/**
 * Land ownership (rural only, in acres)
 * Census 2011: Average holding ~1.08 hectares (~2.67 acres)
 */
export function generateLandOwnership(
  areaType: AreaType,
  occupation: OccupationalSector,
  socialCategory: SocialCategory,
  rng: SeededRNG
): number {
  if (areaType === 'urban') return 0;
  
  if (occupation === 'cultivator') {
    let mean = 2.5;
    if (socialCategory === 'SC' || socialCategory === 'ST') mean = 1.2;
    const acres = logNormalSample(Math.log(mean), 0.6, rng);
    return Math.round(Math.max(0.1, Math.min(50, acres)) * 10) / 10;
  }
  
  if (occupation === 'agricultural_labourer') {
    return rng.next() < 0.3 ? Math.round(rng.next() * 1.5 * 10) / 10 : 0;
  }
  
  return rng.next() < 0.15 ? Math.round(rng.next() * 2 * 10) / 10 : 0;
}

// ─────────────────────────────────────────────────────────────
// Digital Access
// ─────────────────────────────────────────────────────────────

/**
 * Digital access correlated with age, education, income, area type.
 * TRAI 2023: ~850M internet subscribers in India
 */
export function generateDigitalAccess(
  age: number,
  education: EducationLevel,
  income: number,
  areaType: AreaType,
  rng: SeededRNG
): {
  hasInternetAccess: boolean;
  hasSmartphone: boolean;
  usesSocialMedia: boolean;
} {
  // Base internet probability
  let internetProb = areaType === 'urban' ? 0.70 : 0.40;
  
  // Age effect
  if (age < 15) internetProb *= 0.3;
  else if (age < 30) internetProb *= 1.2;
  else if (age < 50) internetProb *= 1.0;
  else if (age < 65) internetProb *= 0.6;
  else internetProb *= 0.3;
  
  // Education effect
  const highEdu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma'];
  if (highEdu.includes(education)) internetProb *= 1.3;
  if (education === 'illiterate') internetProb *= 0.3;
  
  // Income effect
  if (income > 500000) internetProb *= 1.2;
  if (income < 100000) internetProb *= 0.7;
  
  internetProb = Math.min(0.98, Math.max(0.05, internetProb));
  
  const hasInternet = bernoulliSample(internetProb, rng);
  const hasSmartphone = hasInternet ? bernoulliSample(0.85, rng) : bernoulliSample(0.15, rng);
  const usesSocialMedia = hasSmartphone && age >= 13 ? bernoulliSample(0.70, rng) : false;
  
  return { hasInternetAccess: hasInternet, hasSmartphone, usesSocialMedia };
}

// ─────────────────────────────────────────────────────────────
// Vehicle Type
// ─────────────────────────────────────────────────────────────

/**
 * Vehicle type based on income, area, and household assets.
 */
export function generateVehicleType(
  income: number,
  areaType: AreaType,
  hasCar: boolean,
  hasScooter: boolean,
  rng: SeededRNG
): 'two_wheeler' | 'four_wheeler' | 'commercial' | 'none' {
  if (hasCar) {
    return rng.next() < 0.9 ? 'four_wheeler' : 'two_wheeler';
  }
  if (hasScooter) {
    return 'two_wheeler';
  }
  
  if (income > 600000 && areaType === 'urban') {
    return rng.next() < 0.3 ? 'four_wheeler' : rng.next() < 0.5 ? 'two_wheeler' : 'none';
  }
  if (income > 200000) {
    return rng.next() < 0.4 ? 'two_wheeler' : 'none';
  }
  
  return rng.next() < 0.15 ? 'two_wheeler' : 'none';
}
