/**
 * Core Sampler Module
 * 
 * Provides seeded PRNG, weighted random sampling, and
 * statistical distribution generators (Box-Muller, LogNormal).
 * All operations use FP32-level precision.
 */

import type { SeededRNG, NameEntry } from '../types.js';

// ─────────────────────────────────────────────────────────────
// Mulberry32 PRNG — Fast, seeded, 32-bit PRNG
// ─────────────────────────────────────────────────────────────

/**
 * Converts a numeric or string seed into a stable 32-bit uint32.
 * String seeds (e.g. "011") are hashed with FNV-1a so the same
 * string always reproduces the same person/family.
 */
export function normalizeSeed(seed: number | string | undefined): number {
  if (seed === undefined || seed === null) return (Date.now() ^ (Math.random() * 0xFFFFFFFF)) >>> 0;
  if (typeof seed === 'number') return seed >>> 0;
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Creates a seeded PRNG using the Mulberry32 algorithm.
 * Produces high-quality 32-bit pseudo-random numbers.
 * Accepts numeric or string seeds ("011" is hashed deterministically).
 */
export function createRNG(initialSeed?: number | string): SeededRNG {
  let state = normalizeSeed(initialSeed);
  const originalSeed = state;

  function next(): number {
    // ye mulberry32 PRNG hai — chhota, fast, deterministic.
    // same seed doge to same sequence milega, har baar. yahi pura library ka base hai.
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    get seed() { return originalSeed; },
    reset(newSeed: number) { state = newSeed >>> 0; }
  };
}

// ─────────────────────────────────────────────────────────────
// Weighted Random Sampling
// ─────────────────────────────────────────────────────────────

/**
 * Picks one item from a weighted list using the inverse CDF method.
 * Returns both the selected item and its normalized probability.
 * 
 * @param items - Array of objects with a `weight` property
 * @param rng - Seeded PRNG instance
 * @returns { item, probability } — The selected item and its selection probability
 */
export function weightedSample<T extends { weight: number }>(
  items: T[],
  rng: SeededRNG
): { item: T; probability: number } {
  if (items.length === 0) {
    throw new Error('weightedSample: cannot sample from empty array');
  }
  if (items.length === 1) {
    return { item: items[0], probability: 1.0 };
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    throw new Error('weightedSample: total weight must be positive');
  }

  const r = rng.next() * totalWeight;
  let cumulative = 0;

  for (const item of items) {
    cumulative += item.weight;
    if (r < cumulative) {
      return {
        item,
        probability: item.weight / totalWeight
      };
    }
  }

  // Floating-point edge case: return last item
  const lastItem = items[items.length - 1];
  return {
    item: lastItem,
    probability: lastItem.weight / totalWeight
  };
}

/**
 * Picks one item from a list with uniform probability.
 */
export function uniformSample<T>(items: T[], rng: SeededRNG): T {
  if (items.length === 0) {
    throw new Error('uniformSample: cannot sample from empty array');
  }
  const idx = Math.floor(rng.next() * items.length);
  return items[Math.min(idx, items.length - 1)];
}

/**
 * Picks one key from a Record<string, number> where values are weights.
 * Returns the key and its normalized probability.
 */
export function weightedSampleFromRecord(
  dist: Record<string, number>,
  rng: SeededRNG
): { key: string; probability: number } {
  const entries = Object.entries(dist);
  if (entries.length === 0) {
    throw new Error('weightedSampleFromRecord: empty distribution');
  }

  const items = entries.map(([key, weight]) => ({ id: key, weight }));
  const { item, probability } = weightedSample(items, rng);
  return { key: item.id, probability };
}

// ─────────────────────────────────────────────────────────────
// Statistical Distribution Generators
// ─────────────────────────────────────────────────────────────

/**
 * Box-Muller transform: generates a normally distributed random value.
 * 
 * @param mean - Mean of the distribution
 * @param stddev - Standard deviation
 * @param rng - Seeded PRNG
 * @returns A normally distributed random number
 */
export function gaussianSample(mean: number, stddev: number, rng: SeededRNG): number {
  // Box-Muller transform — height, weight, scores sab isi pe chal rahe hain
  const u1 = rng.next();
  const u2 = rng.next();
  // Avoid log(0)
  const safeU1 = Math.max(u1, 1e-10);
  const z = Math.sqrt(-2 * Math.log(safeU1)) * Math.cos(2 * Math.PI * u2);
  return mean + stddev * z;
}

/**
 * Log-normal distribution sampler.
 * Useful for income, household size, and other right-skewed variables.
 * 
 * @param mu - Mean of the underlying normal distribution (log-scale)
 * @param sigma - Stddev of the underlying normal distribution (log-scale)
 * @param rng - Seeded PRNG
 * @returns A log-normally distributed random number (always positive)
 */
export function logNormalSample(mu: number, sigma: number, rng: SeededRNG): number {
  // income lognormal isliye — zyada log kam kamate hain, kuch log bahut zyada.
  // uniform laga deta to distribution fake lagti.
  const normalVal = gaussianSample(mu, sigma, rng);
  return Math.exp(normalVal);
}

/**
 * Generates an age following a realistic demographic age distribution.
 * Uses a mixture of distributions to model infant, youth, adult, and elderly populations.
 * 
 * @param rng - Seeded PRNG
 * @param minAge - Minimum age (default 0)
 * @param maxAge - Maximum age (default 100)
 * @returns A realistic age value
 */
export function ageSample(
  rng: SeededRNG,
  minAge: number = 0,
  maxAge: number = 100
): number {
  // India's age distribution approximation (2011 Census):
  // ~26% are 0-14, ~67% are 15-64, ~7% are 65+
  const r = rng.next();
  let age: number;
  
  if (r < 0.26) {
    // Children (0-14): slightly right-skewed
    age = Math.abs(gaussianSample(7, 4, rng));
    age = Math.min(age, 14);
  } else if (r < 0.93) {
    // Working age (15-64): broad distribution centered around 32
    age = gaussianSample(32, 12, rng);
    age = Math.max(15, Math.min(age, 64));
  } else {
    // Elderly (65+): left-skewed
    age = gaussianSample(72, 6, rng);
    age = Math.max(65, Math.min(age, maxAge));
  }

  age = Math.round(Math.max(minAge, Math.min(maxAge, age)));
  return age;
}

/**
 * Generates a household size following India's typical distribution.
 * Mean household size in India is approximately 4.9 (Census 2011).
 */
export function householdSizeSample(rng: SeededRNG, areaType: 'urban' | 'rural'): number {
  const mean = areaType === 'urban' ? 4.3 : 5.2;
  const sigma = 1.5;
  const raw = logNormalSample(Math.log(mean) - (sigma * sigma) / 2, sigma * 0.3, rng);
  return Math.max(1, Math.min(12, Math.round(raw)));
}

/**
 * Generates annual income in INR following a log-normal distribution.
 * Adjusted by state, area type, education, and occupation.
 */
export function incomeSample(
  rng: SeededRNG,
  params: {
    areaType: 'urban' | 'rural';
    education: string;
    occupation: string;
    state: string;
  }
): number {
  // Base log-mean (in INR)
  let baseMu = params.areaType === 'urban' ? 11.8 : 11.2; // ~133k urban, ~73k rural
  const sigma = 0.8;

  // Education multiplier
  const eduMultipliers: Record<string, number> = {
    'illiterate': -0.6,
    'literate_below_primary': -0.4,
    'primary': -0.2,
    'middle': 0,
    'secondary': 0.2,
    'higher_secondary': 0.4,
    'graduate': 0.8,
    'postgraduate': 1.1,
    'technical_diploma': 0.9,
    'professional_degree': 1.3
  };
  baseMu += eduMultipliers[params.education] ?? 0;

  // Occupation multiplier
  const occMultipliers: Record<string, number> = {
    'cultivator': -0.3,
    'agricultural_labourer': -0.5,
    'household_industry': -0.1,
    'other_worker': 0.2,
    'non_worker': -0.7
  };
  baseMu += occMultipliers[params.occupation] ?? 0;

  // State-level economic adjustment (top-earning states get boost)
  const highIncomeStates = ['maharashtra', 'delhi', 'karnataka', 'tamil_nadu', 'gujarat', 'haryana', 'goa'];
  const lowIncomeStates = ['bihar', 'jharkhand', 'uttar_pradesh', 'madhya_pradesh', 'odisha', 'chhattisgarh'];
  const stateKey = params.state.toLowerCase().replace(/\s+/g, '_');
  
  if (highIncomeStates.includes(stateKey)) baseMu += 0.3;
  if (lowIncomeStates.includes(stateKey)) baseMu -= 0.2;

  const income = logNormalSample(baseMu, sigma, rng);
  // Round to nearest 1000
  return Math.max(10000, Math.round(income / 1000) * 1000);
}

/**
 * Generates a boolean value based on a probability.
 */
export function bernoulliSample(probability: number, rng: SeededRNG): boolean {
  return rng.next() < probability;
}

/**
 * Samples a name from NameEntry array, returns name and probability.
 */
export function sampleName(
  names: NameEntry[],
  rng: SeededRNG
): { name: string; probability: number } {
  if (names.length === 0) {
    return { name: 'Unknown', probability: 0 };
  }
  const { item, probability } = weightedSample(
    names.map(n => ({ ...n, weight: n.weight })),
    rng
  );
  return { name: item.name, probability };
}
