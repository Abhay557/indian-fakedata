/**
 * Outcome Simulation Layer (SSPS — Layer 2)
 *
 * Simulates realistic life outcomes for a generated demographic profile.
 * Includes a controllable bias parameter (0.0 = meritocracy, 1.0 = max
 * historical discrimination) enabling fairness auditing research.
 *
 * Data sources:
 *  - CIBIL credit score distribution: TransUnion CIBIL Market Report 2023
 *  - Health risk factors: NFHS-5, WHO India Country Report 2022
 *  - Employment gap data: CMIE PLFS 2022-23
 *  - Education gap data: ASER 2022, NSSO 75th Round
 *  - Caste discrimination literature: Deshpande (2011), Thorat & Newman (2010)
 */

import type { DemographicProfile, SeededRNG, SocialCategory } from '../types.js';

// ─────────────────────────────────────────────────────────────
// Output Types
// ─────────────────────────────────────────────────────────────

export interface CreditOutcome {
  /** CIBIL credit score (300–900) */
  creditScore: number;
  /** Probability of loan approval given this profile (0–1) */
  loanApprovalProbability: number;
  /** Approved loan amount in INR (if applicable) */
  approvedLoanAmountINR?: number;
  /** Reason codes (for auditing) */
  reasonCodes: string[];
}

export interface HealthOutcome {
  /** Composite health risk score (0–100, higher = more risk) */
  healthRiskScore: number;
  /** Likely chronic conditions given demographics + lifestyle */
  likelyConditions: string[];
  /** Probability of accessing formal healthcare (0–1) */
  healthcareAccessProbability: number;
  /** BMI category based on WHO Asia-Pacific thresholds */
  bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese';
}

export interface EducationOutcome {
  /** Actual literacy effectiveness (0–100, may diverge from formal attainment) */
  functionalLiteracy: number;
  /** Risk of school dropout before secondary (for minors, 0–1) */
  dropoutRisk: number;
  /** Probability of upward educational mobility vs. parent (0–1) */
  educationalMobility: number;
}

export interface EmploymentOutcome {
  /** Actual employment quality */
  employmentQuality: 'formal_high' | 'formal_mid' | 'formal_low' | 'informal' | 'underemployed' | 'unemployed';
  /** Expected monthly wage in INR */
  expectedMonthlyWageINR: number;
  /** Wage gap relative to equivalent General-category profile (1.0 = no gap) */
  wageGapRatio: number;
  /** Probability of job loss in economic downturn (0–1) */
  vulnerabilityIndex: number;
}

export interface SimulatedOutcomes {
  credit: CreditOutcome;
  health: HealthOutcome;
  education: EducationOutcome;
  employment: EmploymentOutcome;

  /**
   * Internal audit trail — how much bias was applied per domain.
   * Exposed for fairness researchers to understand what the model did.
   * Keys: 'credit_caste_penalty', 'employment_gender_gap', etc.
   */
  _biasAuditTrail: Record<string, number>;
}

// ─────────────────────────────────────────────────────────────
// Bias Penalty Tables (Tier D — from discrimination literature)
// ─────────────────────────────────────────────────────────────

/**
 * Maximum caste-based credit score penalty at bias=1.0.
 * Based on Thorat & Newman (2010) audit studies showing ~25-30%
 * callback rate disadvantage for SC applicants vs General.
 */
const CASTE_CREDIT_PENALTY: Record<SocialCategory, number> = {
  General: 0,
  OBC:    -25,
  SC:     -65,
  ST:     -80,
};

/**
 * Maximum religion-based credit penalty at bias=1.0.
 * Based on field experiment data from Siddique (2011) and
 * Thorat et al. rental market studies.
 */
const RELIGION_CREDIT_PENALTY: Record<string, number> = {
  hindu:    0,
  jain:     0,
  sikh:     0,
  christian:-5,
  buddhist: -15,
  muslim:   -30,
};

/** Employment wage gap multiplier at bias=1.0 (SC vs General). */
const CASTE_WAGE_GAP: Record<SocialCategory, number> = {
  General: 1.00,
  OBC:    0.88,
  SC:     0.73,
  ST:     0.68,
};

/** Gender wage gap multiplier at bias=1.0 (female vs male). */
const GENDER_WAGE_GAP: Record<string, number> = {
  male:  1.00,
  female: 0.78,  // CMIE PLFS 2022 gender pay gap India ~22%
  other:  0.75,
};

// ─────────────────────────────────────────────────────────────
// Helper: Gaussian noise with seeded RNG (Box-Muller)
// ─────────────────────────────────────────────────────────────
function gaussianNoise(rng: SeededRNG, sigma: number): number {
  const u1 = Math.max(1e-10, rng.next());
  const u2 = rng.next();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ─────────────────────────────────────────────────────────────
// Layer 2A: Credit Outcome
// ─────────────────────────────────────────────────────────────

function simulateCreditOutcome(
  profile: DemographicProfile,
  biasLevel: number,
  rng: SeededRNG
): { outcome: CreditOutcome; auditTrail: Record<string, number> } {
  const auditTrail: Record<string, number> = {};

  // ── Meritocratic baseline (education + income + banking access) ──
  let baseScore = 500;

  // Income contribution (CIBIL data: higher income → higher score)
  const incomeL = Math.log10(Math.max(profile.annualIncomeINR, 10000));
  baseScore += clamp((incomeL - 4) * 60, -100, 150);

  // Education contribution
  const eduBonus: Record<string, number> = {
    illiterate: -80, literate_below_primary: -60, primary: -40, middle: -20,
    secondary: 0, higher_secondary: 20, graduate: 60, postgraduate: 80,
    technical_diploma: 40, professional_degree: 90,
  };
  baseScore += (eduBonus[profile.education] ?? 0);

  // Banking access
  if (profile.householdAssets.bankingService) baseScore += 30;
  if (profile.hasSmartphone) baseScore += 10;
  if (profile.upiId) baseScore += 15;

  // Age — young adults and elderly have less credit history
  if (profile.age < 25) baseScore -= 40;
  else if (profile.age > 65) baseScore -= 20;
  else if (profile.age >= 30 && profile.age <= 55) baseScore += 20;

  // Urban premium
  if (profile.areaType === 'urban') baseScore += 25;

  // ── Bias layer (interpolated by biasLevel) ──
  const castePenalty = CASTE_CREDIT_PENALTY[profile.socialCategory] * biasLevel;
  const religionPenalty = (RELIGION_CREDIT_PENALTY[profile.religion] ?? 0) * biasLevel;

  auditTrail['credit_caste_penalty'] = castePenalty;
  auditTrail['credit_religion_penalty'] = religionPenalty;

  const finalScore = clamp(
    Math.round(baseScore + castePenalty + religionPenalty + gaussianNoise(rng, 20)),
    300,
    900
  );

  // ── Loan approval probability ──
  let approvalProb = 0;
  if (finalScore >= 750) approvalProb = 0.92;
  else if (finalScore >= 700) approvalProb = 0.78;
  else if (finalScore >= 650) approvalProb = 0.60;
  else if (finalScore >= 600) approvalProb = 0.40;
  else if (finalScore >= 550) approvalProb = 0.22;
  else approvalProb = 0.08;

  // Additional bias on approval decision (lender discrimination, Tier D)
  const approvalBiasPenalty = (
    (profile.socialCategory === 'SC' || profile.socialCategory === 'ST' ? 0.15 : 0) +
    (profile.religion === 'muslim' ? 0.10 : 0)
  ) * biasLevel;
  approvalProb = clamp(approvalProb - approvalBiasPenalty, 0.02, 0.97);
  auditTrail['credit_approval_bias_penalty'] = approvalBiasPenalty;

  // ── Approved loan amount ──
  const loanApproved = rng.next() < approvalProb;
  const approvedAmount = loanApproved
    ? clamp(
        Math.round(profile.annualIncomeINR * (2 + rng.next() * 3)),
        50000,
        10000000
      )
    : undefined;

  const reasonCodes: string[] = [];
  if (finalScore < 600) reasonCodes.push('LOW_CREDIT_SCORE');
  if (profile.annualIncomeINR < 120000) reasonCodes.push('INCOME_INSUFFICIENT');
  if (!profile.householdAssets.bankingService) reasonCodes.push('NO_BANK_ACCOUNT');
  if (castePenalty < -40) reasonCodes.push('CASTE_BIAS_APPLIED');

  return {
    outcome: {
      creditScore: finalScore,
      loanApprovalProbability: approvalProb,
      approvedLoanAmountINR: approvedAmount,
      reasonCodes,
    },
    auditTrail,
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 2B: Health Outcome
// ─────────────────────────────────────────────────────────────

function simulateHealthOutcome(
  profile: DemographicProfile,
  rng: SeededRNG
): HealthOutcome {
  let riskScore = 30; // baseline

  // Dietary risk
  if (profile.habits.tobaccoUse !== 'none') riskScore += 15;
  if (profile.habits.alcoholUse === 'heavy') riskScore += 12;
  if (profile.habits.exerciseFrequency === 'never') riskScore += 8;

  // BMI
  const bmi = profile.bmi;
  let bmiCategory: HealthOutcome['bmiCategory'];
  if (bmi < 18.5) { bmiCategory = 'underweight'; riskScore += 10; }
  else if (bmi < 23) { bmiCategory = 'normal'; }
  else if (bmi < 27.5) { bmiCategory = 'overweight'; riskScore += 8; }
  else { bmiCategory = 'obese'; riskScore += 18; }

  // Age
  if (profile.age > 50) riskScore += 15;
  if (profile.age > 65) riskScore += 10;

  // SES — poverty and poor nutrition
  if (profile.annualIncomeINR < 60000) riskScore += 12;
  if (profile.rationCardType === 'BPL' || profile.rationCardType === 'AAY') riskScore += 8;

  // Disability
  if (profile.disability !== 'none') riskScore += 10;

  // Rural: less access to healthcare
  if (profile.areaType === 'rural') riskScore += 5;

  riskScore = clamp(riskScore + gaussianNoise(rng, 5), 0, 100);

  // Likely conditions
  const conditions: string[] = [];
  if (bmi > 27.5 && profile.age > 35) conditions.push('type_2_diabetes_risk');
  if (bmi > 27.5 || profile.age > 45) conditions.push('hypertension_risk');
  if (profile.bmi < 18.5 && profile.areaType === 'rural') conditions.push('malnutrition');
  if (profile.habits.tobaccoUse !== 'none') conditions.push('respiratory_risk');
  if (profile.age > 60) conditions.push('musculoskeletal_risk');

  // Healthcare access probability
  let accessProb = 0.6;
  if (profile.areaType === 'urban') accessProb += 0.2;
  if (profile.healthInsurance !== 'none') accessProb += 0.15;
  if (profile.annualIncomeINR > 300000) accessProb += 0.1;
  accessProb = clamp(accessProb, 0.1, 0.98);

  return {
    healthRiskScore: Math.round(riskScore),
    likelyConditions: conditions,
    healthcareAccessProbability: Math.round(accessProb * 100) / 100,
    bmiCategory,
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 2C: Education Outcome
// ─────────────────────────────────────────────────────────────

function simulateEducationOutcome(
  profile: DemographicProfile,
  biasLevel: number,
  rng: SeededRNG
): { outcome: EducationOutcome; auditTrail: Record<string, number> } {
  const auditTrail: Record<string, number> = {};

  // Functional literacy (what they can actually do vs credential)
  const credentialMap: Record<string, number> = {
    illiterate: 5, literate_below_primary: 20, primary: 35, middle: 50,
    secondary: 62, higher_secondary: 72, graduate: 82, postgraduate: 90,
    technical_diploma: 75, professional_degree: 88,
  };
  let funcLit = credentialMap[profile.education] ?? 50;

  // Rural deficit (ASER 2022: rural functional literacy ~30% below credential)
  if (profile.areaType === 'rural') funcLit -= 15;

  // Income: poor school quality
  if (profile.annualIncomeINR < 80000) funcLit -= 10;

  // Government vs private school
  if (profile.educationDetails.institutionType === 'government') funcLit -= 5;

  // Bias layer (SC/ST schools historically underfunded)
  const educationBias = (
    (profile.socialCategory === 'SC' ? 8 : 0) +
    (profile.socialCategory === 'ST' ? 12 : 0)
  ) * biasLevel;
  funcLit -= educationBias;
  auditTrail['education_quality_bias'] = educationBias;

  funcLit = clamp(Math.round(funcLit + gaussianNoise(rng, 8)), 0, 100);

  // Dropout risk (for ages < 18)
  let dropoutRisk = 0.05;
  if (profile.age < 18 && profile.areaType === 'rural') dropoutRisk += 0.15;
  if (profile.gender === 'female' && profile.areaType === 'rural') dropoutRisk += 0.12;
  if (profile.annualIncomeINR < 60000) dropoutRisk += 0.10;
  const dropoutBias = ((profile.socialCategory === 'ST' ? 0.15 : 0) +
    (profile.socialCategory === 'SC' ? 0.08 : 0)) * biasLevel;
  dropoutRisk += dropoutBias;
  auditTrail['dropout_bias'] = dropoutBias;
  dropoutRisk = clamp(dropoutRisk, 0, 0.95);

  // Educational mobility
  let mobility = 0.4;
  if (profile.annualIncomeINR > 300000) mobility += 0.2;
  if (profile.hasInternetAccess) mobility += 0.1;
  if (profile.areaType === 'urban') mobility += 0.1;
  mobility = clamp(mobility, 0.05, 0.95);

  return {
    outcome: { functionalLiteracy: funcLit, dropoutRisk, educationalMobility: mobility },
    auditTrail,
  };
}

// ─────────────────────────────────────────────────────────────
// Layer 2D: Employment Outcome
// ─────────────────────────────────────────────────────────────

function simulateEmploymentOutcome(
  profile: DemographicProfile,
  biasLevel: number,
  rng: SeededRNG
): { outcome: EmploymentOutcome; auditTrail: Record<string, number> } {
  const auditTrail: Record<string, number> = {};

  // Base wage from income field (already generated)
  let expectedWage = profile.annualIncomeINR / 12;

  // Wage gap — meritocratic portion
  if (profile.education === 'graduate' || profile.education === 'postgraduate') {
    expectedWage *= 1.4;
  }
  if (profile.areaType === 'urban') expectedWage *= 1.2;

  // Bias layer
  const casteGapMultiplier = 1 - (1 - CASTE_WAGE_GAP[profile.socialCategory]) * biasLevel;
  const genderGapMultiplier = 1 - (1 - (GENDER_WAGE_GAP[profile.gender] ?? 1.0)) * biasLevel;

  auditTrail['employment_caste_wage_penalty'] = 1 - casteGapMultiplier;
  auditTrail['employment_gender_wage_penalty'] = 1 - genderGapMultiplier;

  expectedWage = Math.round(expectedWage * casteGapMultiplier * genderGapMultiplier);
  expectedWage = clamp(expectedWage + gaussianNoise(rng, expectedWage * 0.1), 3000, 500000);

  // Employment quality
  let quality: EmploymentOutcome['employmentQuality'];
  if (profile.employmentSector === 'government') quality = 'formal_high';
  else if (profile.employmentSector === 'private' && profile.annualIncomeINR > 400000) quality = 'formal_mid';
  else if (profile.employmentSector === 'self_employed' && profile.annualIncomeINR > 200000) quality = 'formal_low';
  else if (profile.employmentSector === 'informal') quality = 'informal';
  else if (profile.occupation === 'non_worker' && profile.age > 18 && profile.age < 60) quality = 'unemployed';
  else quality = 'underemployed';

  // Vulnerability index
  let vuln = 0.2;
  if (quality === 'informal') vuln += 0.3;
  if (quality === 'underemployed') vuln += 0.2;
  if (profile.annualIncomeINR < 80000) vuln += 0.15;
  const vulnBias = ((profile.socialCategory === 'SC' || profile.socialCategory === 'ST') ? 0.15 : 0) * biasLevel;
  vuln += vulnBias;
  auditTrail['vulnerability_bias'] = vulnBias;
  vuln = clamp(vuln, 0, 0.95);

  return {
    outcome: {
      employmentQuality: quality,
      expectedMonthlyWageINR: Math.round(expectedWage),
      wageGapRatio: casteGapMultiplier * genderGapMultiplier,
      vulnerabilityIndex: Math.round(vuln * 100) / 100,
    },
    auditTrail,
  };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Simulate realistic life outcomes for a demographic profile.
 *
 * @param profile   - A fully generated DemographicProfile from SSPS
 * @param biasLevel - Bias dial: 0.0 = pure meritocracy, 1.0 = maximum
 *                   historically documented discrimination. Default: 0.3
 *                   (calibrated to match observed Indian outcome gaps from
 *                   CMIE PLFS 2022, Thorat & Newman 2010, CIBIL 2023)
 * @param rng       - Seeded RNG for reproducibility
 */
export function simulateOutcomes(
  profile: DemographicProfile,
  biasLevel: number = 0.3,
  rng: SeededRNG
): SimulatedOutcomes {
  const bias = clamp(biasLevel, 0, 1);

  const { outcome: credit, auditTrail: creditAudit } = simulateCreditOutcome(profile, bias, rng);
  const health = simulateHealthOutcome(profile, rng);
  const { outcome: education, auditTrail: eduAudit } = simulateEducationOutcome(profile, bias, rng);
  const { outcome: employment, auditTrail: empAudit } = simulateEmploymentOutcome(profile, bias, rng);

  return {
    credit,
    health,
    education,
    employment,
    _biasAuditTrail: { ...creditAudit, ...eduAudit, ...empAudit },
  };
}
