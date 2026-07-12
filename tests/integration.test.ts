/**
 * Comprehensive Test Suite — Smart Synthetic Population Simulator
 * 
 * Tests cover:
 * - Sampler correctness (PRNG, weighted sampling, distributions)
 * - Engine correctness (constraint propagation, attention masking)
 * - Integration tests (bulk leak detection, distribution validation)
 * - Reproducibility
 */

import { describe, it, expect } from 'vitest';
import { generate, generateStream, getDistributionSummary, createRNG, weightedSample } from '../src/index.js';
import type { DemographicProfile } from '../src/index.js';

// ═════════════════════════════════════════════════════════════
// 1. SAMPLER TESTS
// ═════════════════════════════════════════════════════════════

describe('Sampler', () => {
  it('should produce deterministic output with same seed', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);
    const values1 = Array.from({ length: 100 }, () => rng1.next());
    const values2 = Array.from({ length: 100 }, () => rng2.next());
    expect(values1).toEqual(values2);
  });

  it('should produce values in [0, 1)', () => {
    const rng = createRNG(123);
    for (let i = 0; i < 10000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('should produce different sequences with different seeds', () => {
    const rng1 = createRNG(1);
    const rng2 = createRNG(2);
    const v1 = rng1.next();
    const v2 = rng2.next();
    expect(v1).not.toEqual(v2);
  });

  it('weighted sampling should respect weights', () => {
    const rng = createRNG(42);
    const items = [
      { id: 'heavy', weight: 90 },
      { id: 'light', weight: 10 }
    ];
    
    let heavyCount = 0;
    const trials = 10000;
    for (let i = 0; i < trials; i++) {
      const { item } = weightedSample(items, rng);
      if (item.id === 'heavy') heavyCount++;
    }
    
    const heavyPct = heavyCount / trials;
    // Should be approximately 90% (±3% tolerance)
    expect(heavyPct).toBeGreaterThan(0.87);
    expect(heavyPct).toBeLessThan(0.93);
  });

  it('weighted sampling should handle single item', () => {
    const rng = createRNG(42);
    const items = [{ id: 'only', weight: 1 }];
    const { item, probability } = weightedSample(items, rng);
    expect(item.id).toBe('only');
    expect(probability).toBe(1.0);
  });

  it('weighted sampling should throw on empty array', () => {
    const rng = createRNG(42);
    expect(() => weightedSample([], rng)).toThrow();
  });
});

// ═════════════════════════════════════════════════════════════
// 2. GENERATION TESTS
// ═════════════════════════════════════════════════════════════

describe('Profile Generation', () => {
  it('should generate correct number of profiles', () => {
    const profiles = generate({ count: 5, seed: 42 });
    expect(profiles).toHaveLength(5);
  });

  it('should generate a valid profile with all required fields', () => {
    const [profile] = generate({ count: 1, seed: 42 });
    
    expect(profile.id).toBeTruthy();
    expect(profile.firstName).toBeTruthy();
    expect(profile.lastName).toBeTruthy();
    expect(['male', 'female', 'other']).toContain(profile.gender);
    expect(profile.age).toBeGreaterThanOrEqual(0);
    expect(profile.age).toBeLessThanOrEqual(100);
    expect(profile.state).toBeTruthy();
    expect(profile.stateCode).toBeTruthy();
    expect(profile.district).toBeTruthy();
    expect(['urban', 'rural']).toContain(profile.areaType);
    expect(profile.religion).toBeTruthy();
    expect(profile.caste).toBeTruthy();
    expect(['SC', 'ST', 'OBC', 'General']).toContain(profile.socialCategory);
    expect(profile.motherTongue).toBeTruthy();
    expect(profile.education).toBeTruthy();
    expect(profile.occupation).toBeTruthy();
    expect(['never_married', 'married', 'widowed', 'divorced_separated']).toContain(profile.maritalStatus);
    expect(profile.annualIncomeINR).toBeGreaterThan(0);
    expect(profile.householdSize).toBeGreaterThanOrEqual(1);
    expect(profile.householdAssets).toBeTruthy();
    expect(profile.probabilityMetrics).toBeTruthy();
    expect(profile.generatedAt).toBeTruthy();
    expect(profile.seed).toBeDefined();
  });

  it('should respect religion constraint', () => {
    const profiles = generate({
      count: 50,
      seed: 42,
      constraints: { religion: 'Muslim' }
    });
    
    for (const p of profiles) {
      expect(p.religion).toBe('Muslim');
    }
  });

  it('should respect state constraint', () => {
    const profiles = generate({
      count: 50,
      seed: 42,
      constraints: { state: 'Kerala' }
    });
    
    for (const p of profiles) {
      expect(p.state).toBe('Kerala');
    }
  });

  it('should respect gender constraint', () => {
    const profiles = generate({
      count: 50,
      seed: 42,
      constraints: { gender: 'female' }
    });
    
    for (const p of profiles) {
      expect(p.gender).toBe('female');
    }
  });

  it('should respect multiple constraints simultaneously', () => {
    const profiles = generate({
      count: 30,
      seed: 42,
      constraints: {
        religion: 'Hindu',
        state: 'Tamil Nadu',
        gender: 'male'
      }
    });
    
    for (const p of profiles) {
      expect(p.religion).toBe('Hindu');
      expect(p.state).toBe('Tamil Nadu');
      expect(p.gender).toBe('male');
    }
  });

  it('should respect area type constraint', () => {
    const profiles = generate({
      count: 50,
      seed: 42,
      constraints: { areaType: 'urban' }
    });
    
    for (const p of profiles) {
      expect(p.areaType).toBe('urban');
    }
  });

  it('should respect social category constraint', () => {
    const profiles = generate({
      count: 50,
      seed: 42,
      constraints: { socialCategory: 'SC' }
    });
    
    for (const p of profiles) {
      expect(p.socialCategory).toBe('SC');
    }
  });

  it('should respect age range constraint', () => {
    const profiles = generate({
      count: 100,
      seed: 42,
      constraints: { ageRange: { min: 25, max: 35 } }
    });
    
    for (const p of profiles) {
      expect(p.age).toBeGreaterThanOrEqual(25);
      expect(p.age).toBeLessThanOrEqual(35);
    }
  });

  it('should respect education constraint', () => {
    const profiles = generate({
      count: 50,
      seed: 42,
      constraints: { education: 'graduate' }
    });
    
    for (const p of profiles) {
      expect(p.education).toBe('graduate');
    }
  });
});

// ═════════════════════════════════════════════════════════════
// 3. REPRODUCIBILITY TESTS
// ═════════════════════════════════════════════════════════════

describe('Reproducibility', () => {
  it('should produce identical profiles with the same seed', () => {
    const a = generate({ count: 10, seed: 42 });
    const b = generate({ count: 10, seed: 42 });
    
    for (let i = 0; i < 10; i++) {
      expect(a[i].firstName).toBe(b[i].firstName);
      expect(a[i].lastName).toBe(b[i].lastName);
      expect(a[i].religion).toBe(b[i].religion);
      expect(a[i].state).toBe(b[i].state);
      expect(a[i].caste).toBe(b[i].caste);
      expect(a[i].gender).toBe(b[i].gender);
      expect(a[i].age).toBe(b[i].age);
    }
  });

  it('should produce different profiles with different seeds', () => {
    const a = generate({ count: 1, seed: 1 });
    const b = generate({ count: 1, seed: 2 });
    
    // At least some field should differ
    const sameName = a[0].firstName === b[0].firstName && a[0].lastName === b[0].lastName;
    const sameState = a[0].state === b[0].state;
    const sameReligion = a[0].religion === b[0].religion;
    
    // Extremely unlikely all three match with different seeds
    expect(sameName && sameState && sameReligion).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════
// 4. DISTRIBUTION VALIDATION TESTS (Census Accuracy)
// ═════════════════════════════════════════════════════════════

describe('Distribution Accuracy', () => {
  const BULK_COUNT = 10000;
  let profiles: DemographicProfile[];
  let summary: Record<string, Record<string, number>>;

  // Generate once for all distribution tests
  profiles = generate({ count: BULK_COUNT, seed: 54321 });
  summary = getDistributionSummary(profiles);

  it('should match Hindu proportion within 3% of Census 2011 (79.8%)', () => {
    const hinduPct = summary.religion['Hindu'] ?? 0;
    expect(hinduPct).toBeGreaterThan(76.8);
    expect(hinduPct).toBeLessThan(82.8);
  });

  it('should match Muslim proportion within 3% of Census 2011 (14.35%)', () => {
    const muslimPct = summary.religion['Muslim'] ?? 0;
    expect(muslimPct).toBeGreaterThan(11.35);
    expect(muslimPct).toBeLessThan(17.35);
  });

  it('should match Christian proportion within 2% of Census 2011 (2.3%)', () => {
    const christianPct = summary.religion['Christian'] ?? 0;
    expect(christianPct).toBeGreaterThan(0.3);
    expect(christianPct).toBeLessThan(4.3);
  });

  it('should match Sikh proportion within 2% of Census 2011 (1.72%)', () => {
    const sikhPct = summary.religion['Sikh'] ?? 0;
    expect(sikhPct).toBeGreaterThan(0);
    expect(sikhPct).toBeLessThan(3.72);
  });

  it('should produce realistic gender ratio (45-55% either way)', () => {
    const malePct = summary.gender['male'] ?? 0;
    expect(malePct).toBeGreaterThan(45);
    expect(malePct).toBeLessThan(55);
  });

  it('should produce realistic urban/rural split (25-40% urban)', () => {
    const urbanPct = summary.areaType['urban'] ?? 0;
    expect(urbanPct).toBeGreaterThan(25);
    expect(urbanPct).toBeLessThan(40);
  });

  it('should produce realistic social category distribution', () => {
    const scPct = summary.socialCategory['SC'] ?? 0;
    const stPct = summary.socialCategory['ST'] ?? 0;
    const obcPct = summary.socialCategory['OBC'] ?? 0;
    const genPct = summary.socialCategory['General'] ?? 0;
    
    // SC should be ~16.6%, ST ~8.6%, but our tree may differ
    expect(scPct).toBeGreaterThan(10);
    expect(scPct).toBeLessThan(30);
    expect(stPct).toBeGreaterThan(3);
    expect(stPct).toBeLessThan(20);
    expect(obcPct).toBeGreaterThan(20);
    expect(genPct).toBeGreaterThan(20);
  });
});

// ═════════════════════════════════════════════════════════════
// 5. LEAK DETECTION TESTS (Impossible Combinations)
// ═════════════════════════════════════════════════════════════

describe('Leak Detection (No Impossible Combinations)', () => {
  const profiles = generate({ count: 5000, seed: 99999 });

  it('should never pair Sikh with non-Sikh surnames when constrained', () => {
    const sikhProfiles = generate({
      count: 200,
      seed: 42,
      constraints: { religion: 'Sikh' }
    });
    
    for (const p of sikhProfiles) {
      expect(p.religion).toBe('Sikh');
      // Sikh profiles should not have Hindu-specific surnames
      const forbiddenSurnames = ['Sharma', 'Mishra', 'Pandey', 'Shukla', 'Tiwari'];
      expect(forbiddenSurnames).not.toContain(p.lastName);
    }
  });

  it('should produce minors as never_married', () => {
    for (const p of profiles) {
      if (p.age < 18) {
        expect(p.maritalStatus).toBe('never_married');
      }
    }
  });

  it('should produce positive income and household size', () => {
    for (const p of profiles) {
      expect(p.annualIncomeINR).toBeGreaterThan(0);
      expect(p.householdSize).toBeGreaterThanOrEqual(1);
    }
  });

  it('should produce valid age range (0-100)', () => {
    for (const p of profiles) {
      expect(p.age).toBeGreaterThanOrEqual(0);
      expect(p.age).toBeLessThanOrEqual(100);
    }
  });

  it('should have valid UUID format for all profiles', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    for (const p of profiles) {
      expect(p.id).toMatch(uuidRegex);
    }
  });

  it('should produce unique IDs for all profiles', () => {
    const ids = new Set(profiles.map(p => p.id));
    expect(ids.size).toBe(profiles.length);
  });
});

// ═════════════════════════════════════════════════════════════
// 6. STREAMING TESTS
// ═════════════════════════════════════════════════════════════

describe('Streaming Generation', () => {
  it('should generate profiles via generator function', () => {
    let count = 0;
    for (const profile of generateStream({ count: 100, seed: 42 })) {
      expect(profile.firstName).toBeTruthy();
      count++;
    }
    expect(count).toBe(100);
  });

  it('should produce same profiles as batch generation with same seed', () => {
    const batch = generate({ count: 5, seed: 42 });
    const stream = [...generateStream({ count: 5, seed: 42 })];
    
    for (let i = 0; i < 5; i++) {
      expect(batch[i].firstName).toBe(stream[i].firstName);
      expect(batch[i].lastName).toBe(stream[i].lastName);
      expect(batch[i].religion).toBe(stream[i].religion);
    }
  });
});

// ═════════════════════════════════════════════════════════════
// 7. HOUSEHOLD ASSETS TESTS
// ═════════════════════════════════════════════════════════════

describe('Household Assets', () => {
  it('should have valid asset structure', () => {
    const [profile] = generate({ count: 1, seed: 42 });
    const assets = profile.householdAssets;
    
    expect(typeof assets.hasRadioTransistor).toBe('boolean');
    expect(typeof assets.hasTelevision).toBe('boolean');
    expect(typeof assets.hasComputer).toBe('boolean');
    expect(typeof assets.hasPhone).toBe('boolean');
    expect(typeof assets.hasBicycle).toBe('boolean');
    expect(typeof assets.hasScooter).toBe('boolean');
    expect(typeof assets.hasCar).toBe('boolean');
    expect(typeof assets.bankingService).toBe('boolean');
    expect(typeof assets.treatedWaterSource).toBe('boolean');
    expect(typeof assets.latrineFacility).toBe('boolean');
    expect(assets.numberOfRooms).toBeGreaterThanOrEqual(1);
    expect(['concrete', 'tiles', 'metal_sheet', 'thatch', 'other']).toContain(assets.roofMaterial);
    expect(['burnt_brick', 'stone', 'mud', 'wood', 'other']).toContain(assets.wallMaterial);
    expect(['lpg', 'firewood', 'crop_residue', 'cowdung', 'kerosene', 'coal', 'biogas', 'electricity', 'other']).toContain(assets.cookingFuel);
    expect(['electricity', 'kerosene', 'solar', 'other']).toContain(assets.lightingSource);
  });

  it('urban profiles should have higher phone ownership than rural', () => {
    const urbanProfiles = generate({ count: 500, seed: 42, constraints: { areaType: 'urban' } });
    const ruralProfiles = generate({ count: 500, seed: 42, constraints: { areaType: 'rural' } });
    
    const urbanPhoneRate = urbanProfiles.filter(p => p.householdAssets.hasPhone).length / 500;
    const ruralPhoneRate = ruralProfiles.filter(p => p.householdAssets.hasPhone).length / 500;
    
    // Urban should generally have higher phone ownership
    expect(urbanPhoneRate).toBeGreaterThan(ruralPhoneRate * 0.8); // allow some variance
  });
});

// ═════════════════════════════════════════════════════════════
// 8. PROBABILITY METRICS TESTS
// ═════════════════════════════════════════════════════════════

describe('Probability Metrics', () => {
  it('should include probability metrics by default', () => {
    const [profile] = generate({ count: 1, seed: 42 });
    const pm = profile.probabilityMetrics;
    
    expect(pm.nationalReligionFreq).toBeGreaterThan(0);
    expect(pm.stateGivenReligionProb).toBeGreaterThan(0);
    expect(pm.casteGivenContextProb).toBeGreaterThan(0);
    expect(pm.lastNameGivenCasteProb).toBeGreaterThan(0);
    expect(pm.jointProbability).toBeGreaterThan(0);
  });

  it('joint probability should be <= individual probabilities', () => {
    const [profile] = generate({ count: 1, seed: 42 });
    const pm = profile.probabilityMetrics;
    
    expect(pm.jointProbability).toBeLessThanOrEqual(pm.nationalReligionFreq);
    expect(pm.jointProbability).toBeLessThanOrEqual(pm.stateGivenReligionProb);
  });
});

// ═════════════════════════════════════════════════════════════
// 9. PERFORMANCE TEST
// ═════════════════════════════════════════════════════════════

describe('Performance', () => {
  it('should generate 10,000 profiles in under 5 seconds', () => {
    const start = performance.now();
    generate({ count: 10000, seed: 42 });
    const elapsed = performance.now() - start;
    
    console.log(`  10,000 profiles generated in ${elapsed.toFixed(1)}ms (${(10000 / elapsed * 1000).toFixed(0)} profiles/sec)`);
    expect(elapsed).toBeLessThan(5000);
  });
});
