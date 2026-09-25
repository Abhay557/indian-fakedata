import { describe, expect, it } from 'vitest';

import { generate, emiFor } from '../src/index.js';
import { generateHouseholdEconomy } from '../src/utils/economy.js';
import { createRNG } from '../src/core/sampler.js';

const BASE = {
  age: 40,
  annualIncomeINR: 1235000,
  monthlyExpenditureINR: 89100,
  householdSize: 1,
  employmentSector: 'private' as const,
  areaType: 'urban' as const,
  occupation: 'other_worker' as const,
  vehicleType: 'two_wheeler',
  numberOfChildren: 1,
};

describe('household economy kit (v2.1.0, item 4)', () => {
  it('computes standard reducing-balance EMI', () => {
    // Rs 1,00,000 at 12% for 12 months ≈ Rs 8,885 (well-known figure)
    const emi = emiFor(100000, 12, 12);
    expect(emi).toBeGreaterThan(8800);
    expect(emi).toBeLessThan(8950);
  });

  it('budget parts sum exactly to monthly expenditure', () => {
    const rng = createRNG(31);
    for (let i = 0; i < 20; i++) {
      const e = generateHouseholdEconomy(
        { ...BASE, monthlyExpenditureINR: 20000 + i * 3500 }, rng);
      const b = e.monthlyBudget;
      const sum = b.food + b.housing + b.transport + b.education + b.health + b.other;
      expect(sum).toBe(20000 + i * 3500);
      for (const v of Object.values(b)) expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it('total EMI never exceeds 60% of monthly income', () => {
    const rows = generate({ count: 200, seed: 51 });
    for (const r of rows) {
      const econ = r.householdEconomy!;
      const emiSum = econ.loans.reduce((s, l) => s + l.emiINR, 0);
      expect(emiSum).toBeLessThanOrEqual(Math.round(r.annualIncomeINR / 12) * 0.6 + 1);
      for (const l of econ.loans) {
        expect(l.remainingMonths).toBeGreaterThanOrEqual(1);
        expect(l.remainingMonths).toBeLessThanOrEqual(l.tenureMonths);
        expect(l.emiINR).toBe(
          emiFor(l.principalINR, l.annualRatePct, l.tenureMonths));
      }
    }
  });

  it('loans follow life: vehicles need wheels, minors get nothing', () => {
    const rng = createRNG(32);
    const kid = generateHouseholdEconomy({ ...BASE, age: 10 }, rng);
    expect(kid.loans).toEqual([]);
    expect(kid.creditHistory.activeLoans).toBe(0);
    expect(kid.creditHistory.missedPayments12m).toBe(0);
    const noWheels = generateHouseholdEconomy(
      { ...BASE, vehicleType: 'none' }, createRNG(33));
    expect(noWheels.loans.map(l => l.type)).not.toContain('vehicle');
  });

  it('score bands track missed payments by construction', () => {
    const rows = generate({ count: 300, seed: 52 });
    let clean = 0;
    let bad = 0;
    for (const r of rows) {
      const h = r.householdEconomy!.creditHistory;
      expect(h.score).toBeGreaterThanOrEqual(300);
      expect(h.score).toBeLessThanOrEqual(900);
      if (h.missedPayments12m === 0) {
        expect(h.score).toBeGreaterThanOrEqual(695);
        clean++;
      }
      if (h.missedPayments12m >= 3) {
        expect(h.score).toBeLessThanOrEqual(700);
        bad++;
      }
    }
    expect(clean).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    const a = generateHouseholdEconomy(BASE, createRNG(34));
    expect(generateHouseholdEconomy(BASE, createRNG(34))).toEqual(a);
  });
});
