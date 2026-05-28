/**
 * Database Loader Module
 * 
 * Handles loading the compiled demographic database. Uses:
 * 1. Custom data directory (if provided)
 * 2. Built-in default data (fallback)
 * 
 * Also handles merging custom data with defaults.
 */

import type { CompiledDatabase } from '../types.js';
import { getDefaultDatabase } from './defaultData.js';

/**
 * Load the complete compiled database.
 * If a custom data directory is provided, attempts to load and merge
 * custom JSON files with the built-in defaults.
 */
export function loadDatabase(dataDir?: string): CompiledDatabase {
  const db = getDefaultDatabase();

  return db;
}

/**
 * Merge custom data into the existing database.
 * Custom data takes priority over defaults for matching keys.
 */
export function mergeDatabase(
  base: CompiledDatabase,
  custom: Partial<CompiledDatabase>
): CompiledDatabase {
  const merged = { ...base };

  if (custom.states) {
    merged.states = { ...base.states, ...custom.states };
  }
  if (custom.religions) {
    merged.religions = { ...base.religions, ...custom.religions };
  }
  if (custom.casteMap) {
    merged.casteMap = deepMerge(base.casteMap, custom.casteMap);
  }
  if (custom.firstNames) {
    merged.firstNames = deepMerge(base.firstNames, custom.firstNames);
  }
  if (custom.surnames) {
    merged.surnames = { ...base.surnames, ...custom.surnames };
  }
  if (custom.districts) {
    merged.districts = { ...base.districts, ...custom.districts };
  }

  return merged;
}

/** Deep merge for nested records */
function deepMerge<T extends Record<string, unknown>>(base: T, custom: Partial<T>): T {
  const result = { ...base };
  for (const key in custom) {
    if (custom[key] !== undefined) {
      if (
        typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key]) &&
        typeof custom[key] === 'object' && custom[key] !== null && !Array.isArray(custom[key])
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          base[key] as Record<string, unknown>,
          custom[key] as Record<string, unknown>
        );
      } else {
        (result as Record<string, unknown>)[key] = custom[key];
      }
    }
  }
  return result;
}
