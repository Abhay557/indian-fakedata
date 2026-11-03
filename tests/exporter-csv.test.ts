import { describe, it, expect } from 'vitest';
import { generate, generateEnriched, formatProfiles } from '../src/index.js';

// A CSV parser helper that is good enough for our tests:
// split on commas, but ignore commas inside quoted cells.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

describe('formatProfiles CSV', () => {
  it('writes a header row plus one row per profile', () => {
    const profiles = generate({ count: 10, seed: 4 });
    const text = formatProfiles(profiles, 'csv');

    const rows = parseCSV(text);
    expect(rows).toHaveLength(11); // 1 header + 10 data rows
  });

  it('flattens nested objects into dot-replaced underscored keys', () => {
    const profiles = generate({ count: 1, seed: 4 });
    const text = formatProfiles(profiles, 'csv');

    const rows = parseCSV(text);
    const header = rows[0];
    expect(header).toContain('appearance_heightCm');
    expect(header).toContain('personality_openness');
    expect(header).toContain('householdAssets_numberOfRooms');
  });

  it('keeps the same column order in every row', () => {
    const profiles = generate({ count: 10, seed: 4 });
    const text = formatProfiles(profiles, 'csv');
    const rows = parseCSV(text);

    const header = rows[0];
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i]).toHaveLength(header.length);
    }
  });

  it('escapes commas, quotes and newlines inside cells', () => {
    const nastyProfiles = [
      { name: 'simple', note: 'no special chars' },
      { name: 'with, comma', note: 'has "double quote"' },
      { name: 'with\nnewline', note: 'line1\nline2' },
    ];
    const text = formatProfiles(nastyProfiles, 'csv');
    const rows = parseCSV(text);

    // The parsed rows must give back the original values
    // (rows[0] is the header, so the data rows start at index 1)
    expect(rows[2][0]).toBe('with, comma');
    expect(rows[2][1]).toBe('has "double quote"');
    expect(rows[3][0]).toBe('with\nnewline');
    expect(rows[3][1]).toBe('line1\nline2');
  });

  it('turns arrays into a semicolon-joined string', () => {
    const profiles = [{ name: 'x', hobbies: ['a', 'b', 'c'] }];
    const text = formatProfiles(profiles, 'csv');
    const rows = parseCSV(text);
    expect(rows[1][1]).toBe('a; b; c');
  });

  it('returns an empty string for an empty list', () => {
    expect(formatProfiles([], 'csv')).toBe('');
  });

  it('includes outcome columns for enriched profiles', () => {
    const enriched = generateEnriched({ count: 2, seed: 2, includeOutcomes: true });
    const text = formatProfiles(enriched, 'csv');
    const rows = parseCSV(text);
    const header = rows[0];

    expect(header).toContain('outcomes.credit.creditScore');
    expect(header).toContain('outcomes.employment.employmentQuality');
    expect(header).toContain('outcomes.health.bmiCategory');
  });

  it('is deterministic for the same input', () => {
    const profiles = generate({ count: 5, seed: 8 });
    const first = formatProfiles(profiles, 'csv');
    const second = formatProfiles(profiles, 'csv');
    expect(first).toBe(second);
  });
});
