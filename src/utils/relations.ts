/**
 * Relational / Family Generation
 *
 * Given a seed (numeric or string, e.g. "011"), generates the head
 * profile plus its relational household:
 *
 *   head ─┬─ spouse   (if married/widowed, matching surname & age)
 *         ├─ parents  (father + mother, older, same community)
 *         ├─ children (age-appropriate, matching surname)
 *         └─ siblings (0–2, overlapping ages, same community)
 *
 * All relatives are derived deterministically from the SAME seed, so
 * `generateFamily({ seed: "011" })` always reproduces the same family.
 * Names, religion, state, caste, and surname stay consistent across
 * members — e.g. `father.firstName` matches `head.fatherName`.
 */

import { generate } from './generator.js';
import { createRNG, normalizeSeed } from '../core/sampler.js';
import type {
  DemographicProfile,
  GenerationConstraints,
  Gender
} from '../types.js';

export interface FamilyOptions {
  /** Reproducibility seed — numeric or string ("011") */
  seed?: number | string;
  /** Constraints applied to the head of the family (religion, state, ...) */
  constraints?: GenerationConstraints;
  /** Max siblings to generate (default: 2) */
  maxSiblings?: number;
  /** Include probability metrics (default: true) */
  includeProbabilityMetrics?: boolean;
  /** Path to a custom data directory */
  dataDir?: string;
}

/** One complete relational unit rooted at a single seed */
export interface FamilyUnit {
  /** The person generated directly from the seed */
  head: DemographicProfile;
  /** Spouse (present when head is married/widowed) */
  spouse?: DemographicProfile;
  /** Parents — father/mother present when head is not an orphan model */
  parents: {
    father?: DemographicProfile;
    mother?: DemographicProfile;
  };
  /** Age-appropriate children (count follows head.numberOfChildren) */
  children: DemographicProfile[];
  /** Siblings with overlapping age ranges */
  siblings: DemographicProfile[];
}

/**
 * Deterministic sub-seed for a family role derived from the base seed.
 * Roles never collide across members while staying fully reproducible.
 */
function roleSeed(base: number, role: string, index = 0): number {
  // FNV-1a of the role string — distinct roles never share a stream
  let h = 0x811c9dc5;
  for (let i = 0; i < role.length; i++) {
    h ^= role.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const mix = (h >>> 0) ^ Math.imul(index + 1, 0x9e3779b9) ^ base;
  return mix >>> 0;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Generates a full relational household from a single seed.
 *
 * @example
 * ```ts
 * const family = generateFamily({ seed: '011' });
 * family.head.firstName;          // stable for seed '011'
 * family.spouse?.lastName;        // same surname as head
 * family.children.map(c => c.age); // younger than head
 * ```
 */
export function generateFamily(options: FamilyOptions = {}): FamilyUnit {
  const base = normalizeSeed(options.seed);
  const baseConstraints = { ...options.constraints };

  const head = generate({
    seed: base,
    constraints: baseConstraints,
    includeProbabilityMetrics: options.includeProbabilityMetrics,
    dataDir: options.dataDir
  })[0];

  const headSurname = head.lastName;
  const familySeed = `${options.seed ?? base}`;

  // Shared community constraints for every relative
  const community: GenerationConstraints = {
    religion: head.religion,
    state: head.state,
    caste: head.caste,
    surname: headSurname
  };

  const family: FamilyUnit = { head, parents: {}, children: [], siblings: [] };

  // ── Spouse ────────────────────────────────────────────────
  if (head.maritalStatus === 'married' || head.maritalStatus === 'widowed') {
    const spouseGender: Gender = head.gender === 'male' ? 'female' : 'male';
    const spouse = generate({
      seed: roleSeed(base, 'spouse'),
      constraints: {
        ...community,
        gender: spouseGender,
        ageRange: {
          min: clamp(head.age - 5, 18, 100),
          max: clamp(head.age + 5, 18, 100)
        },
        maritalStatus: 'married'
      },
      includeProbabilityMetrics: options.includeProbabilityMetrics,
      dataDir: options.dataDir
    })[0];

    // Reconcile names so spouse matches head.spouseName exactly
    const spouseTokens = head.spouseName?.split(' ') ?? [];
    if (spouseTokens.length > 0) {
      spouse.firstName = spouseTokens[0];
      spouse.lastName = spouseTokens.slice(1).join(' ') || headSurname;
    }
    family.spouse = spouse;
  }

  // ── Parents ───────────────────────────────────────────────
  // Father: head.age + 20..45; Mother: head.age + 16..40
  const parentRng = createRNG(roleSeed(base, 'parents'));
  const fatherAge = clamp(head.age + 20 + Math.round(parentRng.next() * 25), 38, 100);
  const motherAge = clamp(head.age + 16 + Math.round(parentRng.next() * 24), 34, 100);

  const fatherTokens = head.fatherName?.split(' ') ?? [];
  const motherTokens = head.motherName?.split(' ') ?? [];

  const father = generate({
    seed: roleSeed(base, 'father'),
    constraints: {
      ...community,
      gender: 'male',
      ageRange: { min: fatherAge - 2, max: fatherAge + 2 },
      maritalStatus: 'married'
    },
    includeProbabilityMetrics: options.includeProbabilityMetrics,
    dataDir: options.dataDir
  })[0];
  if (fatherTokens.length > 0) {
    father.firstName = fatherTokens[0];
    father.lastName = fatherTokens.slice(1).join(' ') || headSurname;
  }
  family.parents.father = father;

  const mother = generate({
    seed: roleSeed(base, 'mother'),
    constraints: {
      ...community,
      gender: 'female',
      ageRange: { min: motherAge - 2, max: motherAge + 2 },
      maritalStatus: 'married'
    },
    includeProbabilityMetrics: options.includeProbabilityMetrics,
    dataDir: options.dataDir
  })[0];
  if (motherTokens.length > 0) {
    // head.motherName uses the mother's (maiden) surname — keep it
    mother.firstName = motherTokens[0];
    mother.lastName = motherTokens.slice(1).join(' ') || headSurname;
  }
  family.parents.mother = mother;

  // Cross-link parents' spouse names
  if (head.fatherName) mother.spouseName = head.fatherName;
  if (head.motherName) father.spouseName = head.motherName;

  // ── Children ──────────────────────────────────────────────
  const childCount = head.maritalStatus === 'never_married' ? 0 : head.numberOfChildren;
  const maxChildAge = clamp(head.age - 16, 0, 100);
  for (let i = 0; i < childCount; i++) {
    const childRng = createRNG(roleSeed(base, 'child', i));
    const childAge = clamp(Math.max(0, maxChildAge - Math.round(childRng.next() * 8)), 0, maxChildAge);
    const childGender: Gender = childRng.next() < 0.5 ? 'male' : 'female';
    const child = generate({
      seed: roleSeed(base, 'child', i),
      constraints: {
        ...community,
        gender: childGender,
        ageRange: { min: Math.max(0, childAge - 2), max: childAge + 2 },
        maritalStatus: 'never_married'
      },
      includeProbabilityMetrics: options.includeProbabilityMetrics,
      dataDir: options.dataDir
    })[0];
    child.lastName = headSurname;
    if (head.gender === 'female') child.motherName = `${head.firstName} ${head.lastName}`;
    if (head.gender === 'male') child.fatherName = `${head.firstName} ${head.lastName}`;
    family.children.push(child);
  }

  // ── Siblings ──────────────────────────────────────────────
  const siblingRng = createRNG(roleSeed(base, 'siblings'));
  const siblingCount = Math.min(options.maxSiblings ?? 2, Math.floor(siblingRng.next() * 3));
  for (let i = 0; i < siblingCount; i++) {
    const siblingGender: Gender = siblingRng.next() < 0.5 ? 'male' : 'female';
    const siblingAge = clamp(head.age - 15 + Math.round(siblingRng.next() * 25), 0, 100);
    const sibling = generate({
      seed: roleSeed(base, 'sibling', i),
      constraints: {
        ...community,
        gender: siblingGender,
        ageRange: { min: Math.max(0, siblingAge - 2), max: siblingAge + 2 }
      },
      includeProbabilityMetrics: options.includeProbabilityMetrics,
      dataDir: options.dataDir
    })[0];
    sibling.lastName = headSurname;
    if (head.fatherName) sibling.fatherName = head.fatherName;
    if (head.motherName) sibling.motherName = head.motherName;
    family.siblings.push(sibling);
  }

  return family;
}