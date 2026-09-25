/**
 * Household Economy Kit Generator (v2.1.0, item 4)
 *
 * A `householdEconomy` block with a monthly budget split that sums exactly
 * to the profile's expenditure, 0-2 affordable loans with real EMI math,
 * and a credit history whose score bands track missed payments by
 * construction (0 misses always scores 695+, 3+ misses never above 700).
 *
 * Loans follow life: vehicle loans need a vehicle, agri loans need a
 * farm or village, home loans need a high income. Total EMI is capped at
 * 60% of monthly income, dropping or shrinking loans to fit.
 *
 * Runs on an isolated per-profile stream: zero impact on seeded output.
 */

import { weightedSampleFromRecord } from '../core/sampler.js';
import type {
  AreaType,
  CreditHistory,
  EmploymentSector,
  HouseholdEconomy,
  Loan,
  LoanType,
  MonthlyBudget,
  OccupationalSector,
  SeededRNG,
} from '../types.js';

export interface HouseholdEconomyOptions {
  age: number;
  annualIncomeINR: number;
  monthlyExpenditureINR: number;
  householdSize: number;
  employmentSector: EmploymentSector;
  areaType: AreaType;
  occupation: OccupationalSector;
  vehicleType?: string;
  numberOfChildren: number;
}

interface LoanSpec {
  type: LoanType;
  rate: number;
  minTenure: number;
  maxTenure: number;
  minFactor: number;
  maxFactor: number;
}

const LOAN_SPECS: Record<LoanType, LoanSpec> = {
  home: { type: 'home', rate: 9, minTenure: 120, maxTenure: 240, minFactor: 2.0, maxFactor: 4.0 },
  vehicle: { type: 'vehicle', rate: 11, minTenure: 36, maxTenure: 60, minFactor: 0.3, maxFactor: 0.8 },
  personal: { type: 'personal', rate: 14, minTenure: 12, maxTenure: 36, minFactor: 0.2, maxFactor: 0.5 },
  agri: { type: 'agri', rate: 7, minTenure: 12, maxTenure: 36, minFactor: 0.3, maxFactor: 0.8 },
  gold: { type: 'gold', rate: 12, minTenure: 12, maxTenure: 24, minFactor: 0.1, maxFactor: 0.3 },
  business: { type: 'business', rate: 13, minTenure: 24, maxTenure: 60, minFactor: 0.5, maxFactor: 1.5 },
};

/** Standard reducing-balance EMI */
export function emiFor(principal: number, annualRatePct: number, tenureMonths: number): number {
  const r = annualRatePct / 12 / 100;
  if (r <= 0) return Math.round(principal / tenureMonths);
  const factor = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * factor) / (factor - 1));
}

function round100(n: number): number {
  return Math.max(100, Math.round(n / 100) * 100);
}

const TIER_ADJ: Record<string, number> = {
  government: 40,
  public_sector: 30,
  private: 20,
  self_employed: 10,
  retired: 10,
  student: 0,
  homemaker: -10,
  informal: -20,
  unemployed: -40,
};

/**
 * Generate the household economy block for a profile.
 *
 * Runs on an isolated stream AFTER profile assembly (draws never touch
 * the main stream), so pre-existing fields for a seed stay identical.
 */
export function generateHouseholdEconomy(
  opts: HouseholdEconomyOptions,
  rng: SeededRNG
): HouseholdEconomy {
  const monthlyIncome = Math.max(1, Math.round(opts.annualIncomeINR / 12));

  // ── Monthly budget: shares scaled to sum exactly to expenditure ──
  const hasKids = opts.numberOfChildren > 0;
  const foodShare = 0.35 + rng.next() * 0.1 + Math.min(0.05, opts.householdSize * 0.008);
  const housingShare = (opts.areaType === 'urban' ? 0.18 : 0.12) + rng.next() * 0.07;
  const transportShare = 0.08 + rng.next() * 0.04;
  const educationShare = hasKids ? 0.05 + rng.next() * 0.07 : 0.01 + rng.next() * 0.02;
  const healthShare = 0.05 + rng.next() * 0.05;
  const rawTotal = foodShare + housingShare + transportShare + educationShare + healthShare;
  const total = Math.max(0, opts.monthlyExpenditureINR);
  const scale = rawTotal > 0 ? total / rawTotal : 0;
  const monthlyBudget: MonthlyBudget = {
    food: Math.round(foodShare * scale),
    housing: Math.round(housingShare * scale),
    transport: Math.round(transportShare * scale),
    education: Math.round(educationShare * scale),
    health: Math.round(healthShare * scale),
    other: 0,
  };
  // largest remainder lands on food so the parts sum exactly
  const partsSum =
    monthlyBudget.housing + monthlyBudget.transport +
    monthlyBudget.education + monthlyBudget.health;
  monthlyBudget.other = Math.max(0, total - monthlyBudget.food - partsSum);
  monthlyBudget.food = Math.max(0, total - partsSum - monthlyBudget.other);

  // ── Loans follow life ──
  const loans: Loan[] = [];
  if (opts.age >= 18 && monthlyIncome > 0) {
    const eligible: LoanType[] = ['personal', 'gold'];
    if (opts.vehicleType && opts.vehicleType !== 'none') eligible.push('vehicle');
    if (opts.occupation === 'cultivator' || opts.occupation === 'agricultural_labourer' || opts.areaType === 'rural') {
      eligible.push('agri');
    }
    if (opts.employmentSector === 'self_employed') eligible.push('business');
    if (opts.annualIncomeINR >= 600000) eligible.push('home');

    const { key } = weightedSampleFromRecord({ 0: 30, 1: 45, 2: 25 }, rng);
    const want = Math.min(parseInt(key, 10), eligible.length);
    const bag = [...eligible];
    for (let i = 0; i < want; i++) {
      const type = bag.splice(Math.floor(rng.next() * bag.length), 1)[0];
      const spec = LOAN_SPECS[type];
      const principal = round100(
        opts.annualIncomeINR * (spec.minFactor + rng.next() * (spec.maxFactor - spec.minFactor))
      );
      const tenureMonths =
        spec.minTenure + Math.floor(rng.next() * (spec.maxTenure - spec.minTenure + 1));
      loans.push({
        type,
        principalINR: principal,
        annualRatePct: spec.rate,
        tenureMonths,
        emiINR: emiFor(principal, spec.rate, tenureMonths),
        remainingMonths: 1 + Math.floor(rng.next() * tenureMonths),
      });
    }

    // Affordability fit: total EMI capped at 60% of monthly income
    const cap = monthlyIncome * 0.6;
    if (cap < 50) {
      loans.length = 0; // no income to service debt with
    } else {
      let emiSum = loans.reduce((s, l) => s + l.emiINR, 0);
      while (loans.length > 1 && emiSum > cap) {
        const dropped = loans.pop()!;
        emiSum -= dropped.emiINR;
      }
      if (loans.length === 1 && emiSum > cap) {
        const l = loans[0];
        const targetEmi = Math.max(1, Math.floor(cap));
        // shrink principal until the EMI fits (rate and tenure fixed)
        let principal = l.principalINR;
        while (emiFor(principal, l.annualRatePct, l.tenureMonths) > targetEmi && principal > 1000) {
          principal = Math.floor(principal * 0.9);
        }
        l.principalINR = Math.max(100, Math.floor(principal / 100) * 100);
        l.emiINR = emiFor(l.principalINR, l.annualRatePct, l.tenureMonths);
      }
    }
  }

  // ── Credit history banded to missed payments ──
  const emiSum = loans.reduce((s, l) => s + l.emiINR, 0);
  const burden = monthlyIncome > 0 ? emiSum / monthlyIncome : 0;
  let missed: number;
  if (loans.length === 0) {
    missed = 0;
  } else if (burden > 0.5) {
    missed = 2 + Math.floor(rng.next() * 5);
  } else if (burden > 0.3) {
    missed = Math.floor(rng.next() * 4);
  } else {
    missed = rng.next() < 0.7 ? 0 : 1;
  }
  const tier = TIER_ADJ[opts.employmentSector] ?? 0;
  const incomeAdj = opts.annualIncomeINR >= 1000000 ? 20 : opts.annualIncomeINR < 100000 ? -20 : 0;
  const jitter = Math.floor(rng.next() * 31) - 15;
  // Bands are contractual: spotless payers never drop below 695,
  // chronic defaulters never rise above 700.
  const floor = missed === 0 ? 695 : 300;
  const ceiling = missed >= 3 ? 700 : 900;
  const score = Math.min(ceiling, Math.max(floor, 750 - 35 * missed + tier + incomeAdj + jitter));

  return {
    monthlyBudget,
    loans,
    creditHistory: {
      score,
      activeLoans: loans.length,
      missedPayments12m: missed,
      oldestAccountYears: loans.length === 0
        ? 0
        : 1 + Math.floor(rng.next() * (Math.min(15, Math.max(0, opts.age - 18)) + 1)),
    },
  };
}
