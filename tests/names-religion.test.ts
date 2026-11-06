import { describe, expect, it } from 'vitest';
import { generate } from '../src/index.js';
import { compiledNames } from '../src/database/namesData.js';

// These names only belong in the Muslim list.
const MUSLIM_ONLY_NAMES = [
  'Danish', 'Sajid', 'Umar', 'Nadim', 'Nasir', 'Abid', 'Gulfam',
  'Tanveer', 'Nazim', 'Parvez', 'Naushad', 'Suhail', 'Zaheer', 'Faiz',
  'Anjum', 'Jamshed', 'Yasin', 'Ashfaq', 'Abrar', 'Shagufta', 'Khurshid',
  'Yusuf', 'Shabana', 'Sitara', 'Mariyam', 'Tabassum', 'Huma', 'Farah',
  'Mumtaz', 'Farheen', 'Zeba', 'Uzma', 'Nikhat', 'Ishrat', 'Zeenat',
  'Misbah', 'Iqra', 'Mehwish', 'Aftab', 'Nargis', 'Kaif', 'Jakir',
  'Shahnawaj', 'Sabir', 'Mansoor'
];

const lower = (value: string) => value.toLowerCase();
const blocklist = new Set(MUSLIM_ONLY_NAMES.map(lower));

function namesIn(religion: string): string[] {
  const names: string[] = [];
  const byState = (compiledNames as any)[religion] ?? {};
  for (const state of Object.keys(byState)) {
    for (const gender of Object.keys(byState[state])) {
      for (const entry of byState[state][gender]) {
        names.push(entry.name);
      }
    }
  }
  return names;
}

describe('names stay inside their religion', () => {
  it('does not keep clearly Muslim names in the Hindu list', () => {
    const bad = namesIn('hindu').filter((name) => blocklist.has(lower(name)));
    expect(bad).toEqual([]);
  });

  it('does not keep clearly Muslim names in the Sikh list', () => {
    const bad = namesIn('sikh').filter((name) => blocklist.has(lower(name)));
    expect(bad).toEqual([]);
  });

  it('still keeps those names in the Muslim list', () => {
    const muslimNames = new Set(namesIn('muslim').map(lower));
    expect(muslimNames.has('sajid')).toBe(true);
    expect(muslimNames.has('sabir')).toBe(true);
  });

  it('never generates a Hindu with a Muslim-only first name', () => {
    const profiles = generate({ count: 3000, seed: 2026 });
    const bad = profiles.filter(
      (p) => p.religion === 'Hindu' && blocklist.has(lower(p.firstName))
    );
    expect(bad).toEqual([]);
  });

  it('never generates a Sikh with a Muslim-only first name', () => {
    const profiles = generate({ count: 3000, seed: 2026 });
    const bad = profiles.filter(
      (p) => p.religion === 'Sikh' && blocklist.has(lower(p.firstName))
    );
    expect(bad).toEqual([]);
  });
});
