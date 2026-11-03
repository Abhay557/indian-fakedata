import { describe, it, expect } from 'vitest';
import { generate, simulateOutcomes, createRNG } from '../src/index.js';

// Make a few profiles with different backgrounds
function makeProfiles(count: number) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const profile = generate({ seed: i + 1 })[0];
    profiles.push(profile);
  }
  return profiles;
}

function simulate(profile: any, biasLevel = 0.3) {
  const rng = createRNG(5000 + profile.seed);
  return simulateOutcomes(profile, biasLevel, rng);
}

describe('outcome value domains', () => {
  const profiles = makeProfiles(100);
  const results = profiles.map((p) => simulate(p));

  it('credit score stays inside 300-900', () => {
    for (const r of results) {
      expect(r.credit.creditScore).toBeGreaterThanOrEqual(300);
      expect(r.credit.creditScore).toBeLessThanOrEqual(900);
    }
  });

  it('loan approval probability stays inside 0.02-0.97', () => {
    for (const r of results) {
      expect(r.credit.loanApprovalProbability).toBeGreaterThanOrEqual(0.02);
      expect(r.credit.loanApprovalProbability).toBeLessThanOrEqual(0.97);
    }
  });

  it('approved loan amount is either undefined or within limits', () => {
    for (const r of results) {
      const amount = r.credit.approvedLoanAmountINR;
      if (amount !== undefined) {
        expect(amount).toBeGreaterThanOrEqual(50000);
        expect(amount).toBeLessThanOrEqual(10000000);
      }
    }
  });

  it('health risk score stays inside 0-100', () => {
    for (const r of results) {
      expect(r.health.healthRiskScore).toBeGreaterThanOrEqual(0);
      expect(r.health.healthRiskScore).toBeLessThanOrEqual(100);
    }
  });

  it('BMI category is one of the four valid categories', () => {
    const valid = ['underweight', 'normal', 'overweight', 'obese'];
    for (const r of results) {
      expect(valid).toContain(r.health.bmiCategory);
    }
  });

  it('healthcare access probability stays inside 0.1-0.98', () => {
    for (const r of results) {
      expect(r.health.healthcareAccessProbability).toBeGreaterThanOrEqual(0.1);
      expect(r.health.healthcareAccessProbability).toBeLessThanOrEqual(0.98);
    }
  });

  it('functional literacy stays inside 0-100', () => {
    for (const r of results) {
      expect(r.education.functionalLiteracy).toBeGreaterThanOrEqual(0);
      expect(r.education.functionalLiteracy).toBeLessThanOrEqual(100);
    }
  });

  it('dropout risk stays inside 0-0.95', () => {
    for (const r of results) {
      expect(r.education.dropoutRisk).toBeGreaterThanOrEqual(0);
      expect(r.education.dropoutRisk).toBeLessThanOrEqual(0.95);
    }
  });

  it('educational mobility stays inside 0.05-0.95', () => {
    for (const r of results) {
      expect(r.education.educationalMobility).toBeGreaterThanOrEqual(0.05);
      expect(r.education.educationalMobility).toBeLessThanOrEqual(0.95);
    }
  });

  it('employment quality is one of the six valid labels', () => {
    const valid = ['formal_high', 'formal_mid', 'formal_low', 'informal', 'underemployed', 'unemployed'];
    for (const r of results) {
      expect(valid).toContain(r.employment.employmentQuality);
    }
  });

  it('expected monthly wage stays inside 3000-500000', () => {
    for (const r of results) {
      expect(r.employment.expectedMonthlyWageINR).toBeGreaterThanOrEqual(3000);
      expect(r.employment.expectedMonthlyWageINR).toBeLessThanOrEqual(500000);
    }
  });

  it('wage gap ratio stays inside 0.5-1.0', () => {
    for (const r of results) {
      expect(r.employment.wageGapRatio).toBeGreaterThanOrEqual(0.5);
      expect(r.employment.wageGapRatio).toBeLessThanOrEqual(1.0);
    }
  });

  it('vulnerability index stays inside 0-0.95', () => {
    for (const r of results) {
      expect(r.employment.vulnerabilityIndex).toBeGreaterThanOrEqual(0);
      expect(r.employment.vulnerabilityIndex).toBeLessThanOrEqual(0.95);
    }
  });

  it('the audit trail always records the four expected keys', () => {
    for (const r of results) {
      const trail = r._biasAuditTrail;
      expect(trail).toHaveProperty('credit_caste_penalty');
      expect(trail).toHaveProperty('credit_religion_penalty');
      expect(trail).toHaveProperty('education_quality_bias');
      expect(trail).toHaveProperty('employment_caste_wage_penalty');
    }
  });

  it('is deterministic for the same profile, bias and seed', () => {
    const profile = profiles[0];
    const first = simulate(profile, 0.3);
    const second = simulate(profile, 0.3);
    expect(first).toEqual(second);
  });
});
