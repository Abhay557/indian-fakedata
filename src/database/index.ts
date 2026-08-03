/**
 * Database Loader Module
 * 
 * Handles loading the compiled demographic database. Uses:
 * 1. Custom data directory (if provided)
 * 2. Built-in default data (fallback)
 * 
 * Also handles merging custom data with defaults.
 */

import fs from 'fs';
import path from 'path';

import type { CompiledDatabase } from '../types.js';
import { getDefaultDatabase } from './defaultData.js';

/**
 * Load the complete compiled database.
 * If a custom data directory is provided, attempts to load and merge
 * custom JSON files (states.json, religions.json, casteMap.json,
 * firstNames.json, surnames.json, districts.json) with the built-in defaults.
 */
export function loadDatabase(dataDir?: string): CompiledDatabase {
  const db = getDefaultDatabase();

  if (!dataDir || !fs.existsSync(dataDir)) return db;

  const custom: Partial<CompiledDatabase> = {};
  const files: Array<[string, keyof CompiledDatabase]> = [
    ['states', 'states'],
    ['religions', 'religions'],
    ['casteMap', 'casteMap'],
    ['firstNames', 'firstNames'],
    ['surnames', 'surnames'],
    ['districts', 'districts'],
  ];

  for (const [fileName, key] of files) {
    const filePath = path.join(dataDir, `${fileName}.json`);
    if (!fs.existsSync(filePath)) continue;
    try {
      (custom as Record<string, unknown>)[key] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      console.warn(`[indian-fakedata] Failed to load custom JSON at ${filePath}:`, (err as Error).message);
    }
  }

  return Object.keys(custom).length > 0 ? mergeDatabase(db, custom) : db;
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
