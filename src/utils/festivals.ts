/**
 * Festival Calendar Generator (v2.1.0, item 5)
 *
 * Every profile gets a `festivals` list: observances with Gregorian dates
 * for the current calendar year, driven by religion and state. Major
 * pan-Indian festivals come from the profile's religion; regional ones
 * (Pongal, Bihu, Onam, Durga Puja, Chhath, Teej, Baisakhi, Ganesh
 * Chaturthi) only appear in their states.
 *
 * Dates are typical Gregorian dates for lunisolar festivals, which shift
 * a few weeks year to year — the docs say so plainly.
 *
 * Runs on an isolated per-profile stream: zero impact on seeded output.
 */

import type { ReligiosityLevel, SeededRNG } from '../types.js';

export interface Festival {
  /** Festival name, e.g. 'Diwali' */
  name: string;
  /** Date in the current calendar year (YYYY-MM-DD, typical date) */
  date: string;
  /** Religion this festival belongs to */
  religion: string;
  /** True for state-specific festivals (Pongal, Bihu, ...) */
  regional: boolean;
}

export interface FestivalOptions {
  religionId: string;
  religionLabel: string;
  stateId: string;
  religiosity: ReligiosityLevel;
  /** Defaults to the current calendar year */
  currentYear?: number;
}

interface FestivalDef {
  name: string;
  /** Typical month (1-12) */
  month: number;
  /** Typical day of month */
  day: number;
  religions: string[];
  /** If set, only observed in these states */
  states?: string[];
  /** Base observance weight */
  weight: number;
}

const FESTIVALS: FestivalDef[] = [
  // Hindu pan-Indian
  { name: 'Diwali', month: 10, day: 20, religions: ['hindu', 'sikh', 'jain'], weight: 95 },
  { name: 'Holi', month: 3, day: 8, religions: ['hindu'], weight: 85 },
  { name: 'Dussehra', month: 10, day: 12, religions: ['hindu'], weight: 80 },
  { name: 'Raksha Bandhan', month: 8, day: 19, religions: ['hindu', 'sikh'], weight: 75 },
  { name: 'Janmashtami', month: 8, day: 26, religions: ['hindu'], weight: 60 },
  { name: 'Maha Shivaratri', month: 2, day: 26, religions: ['hindu'], weight: 55 },
  { name: 'Navratri', month: 10, day: 3, religions: ['hindu'], weight: 50 },
  // Muslim pan-Indian
  { name: 'Eid al-Fitr', month: 3, day: 31, religions: ['muslim'], weight: 95 },
  { name: 'Eid al-Adha', month: 6, day: 7, religions: ['muslim'], weight: 85 },
  { name: 'Muharram', month: 7, day: 7, religions: ['muslim'], weight: 50 },
  // Christian pan-Indian
  { name: 'Christmas', month: 12, day: 25, religions: ['christian'], weight: 95 },
  { name: 'Good Friday', month: 4, day: 18, religions: ['christian'], weight: 70 },
  { name: 'Easter', month: 4, day: 20, religions: ['christian'], weight: 65 },
  // Sikh
  { name: 'Baisakhi', month: 4, day: 13, religions: ['sikh'], weight: 90 },
  { name: 'Guru Nanak Gurpurab', month: 11, day: 15, religions: ['sikh'], weight: 85 },
  // Buddhist
  { name: 'Buddha Purnima', month: 5, day: 12, religions: ['buddhist'], weight: 90 },
  // Jain
  { name: 'Mahavir Jayanti', month: 4, day: 10, religions: ['jain'], weight: 90 },
  // Regional
  { name: 'Pongal', month: 1, day: 14, religions: ['hindu'], states: ['tamil_nadu'], weight: 95, },
  { name: 'Bihu', month: 4, day: 14, religions: ['hindu'], states: ['assam'], weight: 95 },
  { name: 'Onam', month: 9, day: 5, religions: ['hindu'], states: ['kerala'], weight: 95 },
  { name: 'Durga Puja', month: 10, day: 10, religions: ['hindu'], states: ['west_bengal', 'assam', 'odisha', 'tripura'], weight: 90 },
  { name: 'Chhath Puja', month: 11, day: 7, religions: ['hindu'], states: ['bihar', 'uttar_pradesh', 'jharkhand'], weight: 90 },
  { name: 'Teej', month: 8, day: 7, religions: ['hindu'], states: ['rajasthan', 'haryana', 'uttar_pradesh'], weight: 80 },
  { name: 'Ganesh Chaturthi', month: 9, day: 7, religions: ['hindu'], states: ['maharashtra', 'goa', 'karnataka'], weight: 85 },
  { name: 'Baisakhi Harvest Fair', month: 4, day: 13, religions: ['hindu'], states: ['punjab', 'haryana'], weight: 80 },
  { name: 'Hornbill Festival', month: 12, day: 1, religions: ['christian'], states: ['nagaland'], weight: 85 },
];

/** Observance probability by religiosity */
const OBSERVE: Record<ReligiosityLevel, number> = {
  very_religious: 0.95,
  somewhat_religious: 0.8,
  not_very_religious: 0.5,
  not_at_all_religious: 0.25,
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Generate the festival calendar for a profile.
 *
 * Runs on an isolated stream AFTER profile assembly (draws never touch
 * the main stream), so pre-existing fields for a seed stay identical.
 */
export function generateFestivals(
  opts: FestivalOptions,
  rng: SeededRNG
): Festival[] {
  const currentYear = opts.currentYear ?? new Date().getFullYear();
  const p = OBSERVE[opts.religiosity] ?? 0.8;

  const out: Festival[] = [];
  for (const f of FESTIVALS) {
    if (!f.religions.includes(opts.religionId)) continue;
    if (f.states && !f.states.includes(opts.stateId)) continue;
    // weight nudges, religiosity decides
    if (rng.next() < p * (0.6 + (0.4 * f.weight) / 100)) {
      out.push({
        name: f.name,
        date: `${currentYear}-${pad(f.month)}-${pad(f.day)}`,
        religion: opts.religionLabel,
        regional: f.states !== undefined,
      });
    }
  }

  // Everyone marks at least their biggest festival
  if (out.length === 0) {
    const first = FESTIVALS.find(
      f => f.religions.includes(opts.religionId) &&
        (!f.states || f.states.includes(opts.stateId))
    );
    if (first) {
      out.push({
        name: first.name,
        date: `${currentYear}-${pad(first.month)}-${pad(first.day)}`,
        religion: opts.religionLabel,
        regional: first.states !== undefined,
      });
    }
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}
