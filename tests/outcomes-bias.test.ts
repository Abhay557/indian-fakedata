import { describe, it, expect } from 'vitest';
import { generate, simulateOutcomes, createRNG } from '../src/index.js';

// Helper: create a small batch of profiles for a given social category.
// We use a fixed seed per profile so the whole test is reproducible.
function makeProfiles(socialCategory: string, count: number) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const profile = generate({
      seed: i + 1,
      constraints: { socialCategory: socialCategory as 'SC' | 'ST' | 'OBC' | 'General' },
    })[0];
    profiles.push(profile);
  }
  return profiles;
}

// Helper: run outcome simulation on one profile and return the result
function simulate(profile: any, biasLevel: number) {
  const rng = createRNG(1000 + profile.seed);
  return simulateOutcomes(profile, biasLevel, rng);
}

function averageScore(profiles: any[], biasLevel: number): number {
  let total = 0;
  for (const profile of profiles) {
    total += simulate(profile, biasLevel).credit.creditScore;
  }
  return total / profiles.length;
}

describe('outcome bias dial', () => {
  it('at bias 0, SC and General get similar credit scores (meritocracy)', () => {
    const general = makeProfiles('General', 150);
    const sc = makeProfiles('SC', 150);
    const diff = Math.abs(averageScore(general, 0) - averageScore(sc, 0));
    expect(diff).toBeLessThan(25);
  });

  it('at bias 1, SC credit scores are clearly lower than General', () => {
    const general = makeProfiles('General', 150);
    const sc = makeProfiles('SC', 150);
    const diff = averageScore(general, 1) - averageScore(sc, 1);
    expect(diff).toBeGreaterThan(25);
  });

  it('records the exact caste penalty in the audit trail', () => {
    const scProfile = makeProfiles('SC', 1)[0];
    const generalProfile = makeProfiles('General', 1)[0];

    const scAtZero = simulate(scProfile, 0)._biasAuditTrail.credit_caste_penalty;
    const scAtOne = simulate(scProfile, 1)._biasAuditTrail.credit_caste_penalty;
    const generalAtOne = simulate(generalProfile, 1)._biasAuditTrail.credit_caste_penalty;

    expect(scAtZero).toBeCloseTo(0, 10);
    expect(scAtOne).toBe(-65);
    expect(generalAtOne).toBeCloseTo(0, 10);
  });

  it('applies the religion penalty for Muslims', () => {
    const muslimProfile = generate({
      seed: 42,
      constraints: { religion: 'Muslim' },
    })[0];
    const trail = simulate(muslimProfile, 1)._biasAuditTrail;
    expect(trail.credit_religion_penalty).toBe(-30);
  });

  it('wageGapRatio is deterministic and follows caste + gender tables', () => {
    const maleGeneral = generate({ seed: 5, constraints: { socialCategory: 'General', gender: 'male' } })[0];
    const femaleSC = generate({ seed: 6, constraints: { socialCategory: 'SC', gender: 'female' } })[0];

    // Male General is the reference group: ratio always 1.0
    expect(simulate(maleGeneral, 0).employment.wageGapRatio).toBeCloseTo(1.0, 3);
    expect(simulate(maleGeneral, 1).employment.wageGapRatio).toBeCloseTo(1.0, 3);

    // Female SC at bias 1: 0.73 (caste) x 0.78 (gender)
    const femaleSCAtOne = simulate(femaleSC, 1).employment.wageGapRatio;
    expect(femaleSCAtOne).toBeCloseTo(0.73 * 0.78, 2);

    // Female SC at bias 0: no penalty at all
    const femaleSCAtZero = simulate(femaleSC, 0).employment.wageGapRatio;
    expect(femaleSCAtZero).toBeCloseTo(1.0, 2);
  });

  it('adds vulnerability bias for SC/ST profiles only', () => {
    const scProfile = makeProfiles('SC', 1)[0];
    const generalProfile = makeProfiles('General', 1)[0];

    expect(simulate(scProfile, 1)._biasAuditTrail.vulnerability_bias).toBeCloseTo(0.15, 3);
    expect(simulate(generalProfile, 1)._biasAuditTrail.vulnerability_bias).toBe(0);
  });

  it('keeps education quality bias proportional to the dial', () => {
    const scProfile = makeProfiles('SC', 1)[0];
    expect(simulate(scProfile, 0.5)._biasAuditTrail.education_quality_bias).toBeCloseTo(4, 3);
    expect(simulate(scProfile, 1)._biasAuditTrail.education_quality_bias).toBeCloseTo(8, 3);
  });
});
