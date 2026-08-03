/**
 * User / Persona API (faker-style entry points)
 *
 * Thin, ergonomic wrappers around the core generator that mirror the
 * "users()" shape shown in the README sample output:
 *
 * @example
 * ```ts
 * // One user (same shape as the README sample profile)
 * const user = generateUser({ seed: 7 });
 *
 * // Many users driven by one seed
 * const users = generateUsers({ count: 5, seed: '011' });
 *
 * // A highly educated female IT professional from Bangalore
 * const dev = generateUser({ highlyEducated: true, constraints: { state: 'Karnataka' } });
 *
 * // A full user + LLM-ready agent persona in one call
 * const { user, persona } = generatePersona({ seed: '011' });
 * ```
 */

import { generate } from './generator.js';
import { generateAgentPersona } from './agent.js';
import type {
  DemographicProfile,
  GenerationConstraints,
  Gender
} from '../types.js';

export interface UserOptions {
  /** Reproducibility seed. Numeric or string ("011") */
  seed?: number | string;
  /** Pass-through demographic constraints (religion, state, gender, education, ...) */
  constraints?: GenerationConstraints;
  /** Shortcut: force a graduate-level (or above) education */
  highlyEducated?: boolean;
  /** Shortcut: fix gender */
  gender?: Gender;
  /** Shortcut: fix marital status */
  maritalStatus?: GenerationConstraints['maritalStatus'];
  /** Include probability metrics (default: true) */
  includeProbabilityMetrics?: boolean;
  /** Path to a custom data directory */
  dataDir?: string;
}

export interface UsersOptions extends UserOptions {
  /** Number of users to generate (default: 1) */
  count?: number;
}

function toConstraints(options: UserOptions): GenerationConstraints {
  const base = { ...options.constraints };
  if (options.highlyEducated) {
    base.education = 'postgraduate';
  }
  if (options.gender) base.gender = options.gender;
  if (options.maritalStatus) base.maritalStatus = options.maritalStatus;
  return base;
}

/**
 * Generate a single user — mirroring the README "Output Sample" shape.
 */
export function generateUser(options: UserOptions = {}): DemographicProfile {
  return generate({
    seed: options.seed,
    constraints: toConstraints(options),
    includeProbabilityMetrics: options.includeProbabilityMetrics,
    dataDir: options.dataDir
  })[0];
}

/**
 * Generate `count` users driven by a single seed.
 */
export function generateUsers(options: UserOptions & { count?: number } = {}): DemographicProfile[] {
  return generate({
    count: options.count ?? 1,
    seed: options.seed,
    constraints: toConstraints(options),
    includeProbabilityMetrics: options.includeProbabilityMetrics,
    dataDir: options.dataDir
  });
}

/**
 * Generate a user plus its LLM-ready agent persona (system prompt,
 * beliefs, memory seeds, behaviour rules) in one call.
 */
export function generatePersona(options: UserOptions = {}) {
  const profile = generateUser(options);
  const persona = generateAgentPersona(profile);
  return { user: profile, persona };
}

export type { AgentPersona } from './agent.js';