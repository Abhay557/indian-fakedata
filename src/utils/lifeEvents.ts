/**
 * Life Events Timeline Generator (v2.1.0, item 3)
 *
 * A chronological list of dated life events — birth, marriage, children,
 * migration, job switches and retirement — cross-checked against the
 * profile's age, marital status, child count, migration flag and both
 * existing timelines (job years mirror the employment timeline exactly).
 *
 * Runs on an isolated per-profile stream: zero impact on seeded output.
 */

import type {
  EmploymentSector,
  EmploymentStage,
  MaritalStatus,
  SeededRNG,
} from '../types.js';

/** Life event kinds in rough life order */
export type LifeEventType =
  | 'born'
  | 'job_started'
  | 'job_changed'
  | 'married'
  | 'child_born'
  | 'migrated'
  | 'retired'
  | 'widowed'
  | 'divorced';

export interface LifeEvent {
  /** Calendar year of the event */
  year: number;
  event: LifeEventType;
  /** One-line human description */
  detail: string;
}

export interface LifeEventsOptions {
  age: number;
  dateOfBirth: string;
  maritalStatus: MaritalStatus;
  numberOfChildren: number;
  spouseName?: string;
  isMigrant: boolean;
  migrationOriginState?: string;
  state: string;
  district: string;
  employmentSector: EmploymentSector;
  employmentTimeline: EmploymentStage[];
  /** Defaults to the current calendar year */
  currentYear?: number;
}

/**
 * Generate the life events timeline for a profile.
 *
 * Runs on an isolated stream AFTER profile assembly (draws never touch
 * the main stream), so pre-existing fields for a seed stay identical.
 */
export function generateLifeEvents(
  opts: LifeEventsOptions,
  rng: SeededRNG
): LifeEvent[] {
  const currentYear = opts.currentYear ?? new Date().getFullYear();
  const birthYear = parseInt(opts.dateOfBirth.slice(0, 4), 10) || currentYear - opts.age;
  const events: LifeEvent[] = [];

  events.push({ year: birthYear, event: 'born', detail: `Born in ${opts.district}.` });

  // Job switches mirror the employment timeline exactly (no new facts)
  for (let i = 0; i < opts.employmentTimeline.length; i++) {
    const s = opts.employmentTimeline[i];
    events.push({
      year: Math.min(Math.max(s.startYear, birthYear), currentYear),
      event: i === 0 ? 'job_started' : 'job_changed',
      detail: i === 0
        ? `Started working as ${s.jobTitle}.`
        : `Changed job to ${s.jobTitle}.`,
    });
  }

  // Marriage (only placeable from age 18)
  let marriageYear: number | undefined;
  if (
    opts.maritalStatus !== 'never_married' &&
    opts.age >= 18
  ) {
    const span = Math.max(1, Math.min(opts.age - 18, 12));
    marriageYear = birthYear + 18 + Math.floor(rng.next() * span);
    if (marriageYear <= currentYear) {
      events.push({
        year: marriageYear,
        event: 'married',
        detail: opts.spouseName
          ? `Married ${opts.spouseName}.`
          : 'Got married.',
      });
    } else {
      marriageYear = undefined;
    }
  }

  // Widowhood / separation strictly after the wedding year
  if (opts.maritalStatus === 'widowed' && marriageYear !== undefined) {
    const span = Math.max(1, currentYear - marriageYear - 1);
    events.push({
      year: Math.min(marriageYear + 1 + Math.floor(rng.next() * span), currentYear),
      event: 'widowed',
      detail: 'Spouse passed away.',
    });
  }
  if (opts.maritalStatus === 'divorced_separated' && marriageYear !== undefined) {
    const span = Math.max(1, currentYear - marriageYear - 1);
    events.push({
      year: Math.min(marriageYear + 1 + Math.floor(rng.next() * span), currentYear),
      event: 'divorced',
      detail: 'Separated from spouse.',
    });
  }

  // Children, evenly spaced from the wedding (or age 20) to this year
  if (opts.numberOfChildren > 0) {
    let startFrom = marriageYear !== undefined ? marriageYear + 1 : birthYear + 20;
    startFrom = Math.min(startFrom, currentYear);
    const n = opts.numberOfChildren;
    for (let i = 0; i < n; i++) {
      const year = n === 1
        ? startFrom
        : startFrom + Math.round((i * (currentYear - startFrom)) / (n - 1));
      events.push({ year, event: 'child_born', detail: `Birth of child ${i + 1}.` });
    }
  }

  // Migration (moved with family at any age, so even children record it)
  if (opts.isMigrant && opts.migrationOriginState) {
    const span = Math.max(1, currentYear - birthYear);
    events.push({
      year: Math.min(birthYear + Math.floor(rng.next() * span), currentYear),
      event: 'migrated',
      detail: `Migrated from ${opts.migrationOriginState} to ${opts.state}.`,
    });
  }

  // Retirement at 60 (or this year, whichever is earlier)
  if (opts.employmentSector === 'retired') {
    events.push({
      year: Math.min(birthYear + 60, currentYear),
      event: 'retired',
      detail: 'Retired from work.',
    });
  }

  // Chronological (stable: ties keep life order)
  events.sort((a, b) => a.year - b.year);
  return events;
}
