/**
 * Evaluation Harness (v2.1.0, item 9)
 *
 * Scores a batch of profiles with one quality number (0-100) built from
 * three parts: distribution drift against census tables (total variation
 * distance on religion, state, gender, area and social category),
 * schema validity rate, and internal consistency rate (timeline labels,
 * life-event order, budget sums, EMI caps, geo bounds).
 *
 * Pure function of the input batch (database tables are fixed): fully
 * deterministic, no RNG.
 */

import type { CompiledDatabase, DemographicProfile } from '../types.js';
import { loadDatabase } from '../database/index.js';
import { validateProfile } from './schema.js';

/** Drift result for one categorical field */
export interface DriftResult {
  expected: Record<string, number>;
  observed: Record<string, number>;
  /** Total variation distance, 0 (identical) to 1 */
  tvd: number;
  pass: boolean;
}

/** Whole-batch evaluation report */
export interface EvalReport {
  sampleSize: number;
  /** 0-100: half drift, quarter validity, quarter consistency */
  qualityScore: number;
  drift: Record<string, DriftResult>;
  /** Fraction of profiles passing validateProfile */
  validityRate: number;
  /** Fraction of profiles with zero consistency issues */
  consistencyRate: number;
  /** Issue code -> number of affected profiles */
  issues: Record<string, number>;
}

/** Census 2011 based national shares for fields without state tables */
const FIXED_EXPECTED: Record<string, Record<string, number>> = {
  gender: { male: 0.515, female: 0.484, other: 0.001 },
  areaType: { urban: 0.31, rural: 0.69 },
  socialCategory: { SC: 0.166, ST: 0.086, OBC: 0.41, General: 0.338 },
};

/** TVD at or below this counts as passing */
const DRIFT_PASS_TVD = 0.12;

function tvd(observed: Record<string, number>, expected: Record<string, number>): number {
  const keys = new Set([...Object.keys(observed), ...Object.keys(expected)]);
  let sum = 0;
  for (const k of keys) sum += Math.abs((observed[k] ?? 0) - (expected[k] ?? 0));
  return sum / 2;
}

function shares(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(counts)) out[k] = n / values.length;
  return out;
}

/**
 * Internal consistency issues for one profile. Empty means clean.
 * Exported so the CLI and researchers can reuse the exact checks.
 */
export function checkConsistency(profile: DemographicProfile): string[] {
  const issues: string[] = [];

  if (!validateProfile(profile).valid) issues.push('invalid_schema');

  if (profile.occupation !== 'non_worker') {
    for (const s of profile.employmentTimeline ?? []) {
      if (s.occupation !== profile.occupation) {
        issues.push('timeline_occupation');
        break;
      }
    }
  }

  const events = profile.lifeEvents ?? [];
  const birthYear = parseInt(profile.dateOfBirth.slice(0, 4), 10);
  for (let i = 0; i < events.length; i++) {
    if (i > 0 && events[i].year < events[i - 1].year) {
      issues.push('life_events_order');
      break;
    }
    if (!Number.isNaN(birthYear) && events[i].year < birthYear) {
      issues.push('life_events_range');
      break;
    }
  }

  if (profile.householdEconomy) {
    const b = profile.householdEconomy.monthlyBudget;
    const sum = b.food + b.housing + b.transport + b.education + b.health + b.other;
    if (sum !== profile.monthlyExpenditureINR) issues.push('budget_sum');
    const emi = profile.householdEconomy.loans.reduce((s, l) => s + l.emiINR, 0);
    const monthly = Math.max(1, Math.round(profile.annualIncomeINR / 12));
    if (emi > monthly * 0.6 + 1) issues.push('emi_cap');
  }

  return issues;
}

/**
 * Evaluate a batch of profiles. Deterministic: same batch, same report.
 */
export function evaluateDataset(
  profiles: DemographicProfile[],
  db: CompiledDatabase = loadDatabase()
): EvalReport {
  // Expected tables: religion + state from the database, rest census-fixed
  const religionExpected: Record<string, number> = {};
  for (const r of Object.values(db.religions)) {
    religionExpected[r.label] = r.nationalProportion;
  }
  let popTotal = 0;
  for (const s of Object.values(db.states)) popTotal += s.totalPopulation;
  const stateExpected: Record<string, number> = {};
  for (const s of Object.values(db.states)) {
    stateExpected[s.stateName] = popTotal > 0 ? s.totalPopulation / popTotal : 0;
  }

  const fields: Record<string, { values: string[]; expected: Record<string, number> }> = {
    religion: { values: profiles.map(p => p.religion), expected: religionExpected },
    state: { values: profiles.map(p => p.state), expected: stateExpected },
    gender: { values: profiles.map(p => p.gender), expected: FIXED_EXPECTED.gender },
    areaType: { values: profiles.map(p => p.areaType), expected: FIXED_EXPECTED.areaType },
    socialCategory: { values: profiles.map(p => p.socialCategory), expected: FIXED_EXPECTED.socialCategory },
  };

  const drift: Record<string, DriftResult> = {};
  let driftScoreSum = 0;
  let driftCount = 0;
  if (profiles.length > 0) {
    for (const [field, { values, expected }] of Object.entries(fields)) {
      const observed = shares(values);
      const d = tvd(observed, expected);
      drift[field] = { expected, observed, tvd: Math.round(d * 10000) / 10000, pass: d <= DRIFT_PASS_TVD };
      driftScoreSum += Math.max(0, 100 - d * 400);
      driftCount++;
    }
  }

  let valid = 0;
  let clean = 0;
  const issues: Record<string, number> = {};
  for (const p of profiles) {
    if (validateProfile(p).valid) valid++;
    const found = checkConsistency(p);
    if (found.length === 0) clean++;
    for (const code of found) issues[code] = (issues[code] ?? 0) + 1;
  }

  const n = profiles.length;
  const validityRate = n > 0 ? valid / n : 0;
  const consistencyRate = n > 0 ? clean / n : 0;
  const driftMean = driftCount > 0 ? driftScoreSum / driftCount : 0;
  const qualityScore = n > 0
    ? Math.round(driftMean * 0.5 + validityRate * 100 * 0.25 + consistencyRate * 100 * 0.25)
    : 0;

  return { sampleSize: n, qualityScore, drift, validityRate, consistencyRate, issues };
}
