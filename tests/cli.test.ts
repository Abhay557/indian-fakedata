import { describe, it, expect } from 'vitest';
import { flattenObject, escapeCSVValue } from '../src/utils/cli-stream.js';
import {
  getPathValue,
  pickRecordFields,
  createStatsCounters,
  updateStatsCounters,
  formatStatsCounters,
} from '../src/utils/cli-stream.js';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('CLI Streaming Utilities', () => {
  it('should flatten nested objects recursively', () => {
    const nested = {
      id: '123',
      name: { first: 'Abhay', last: 'Mourya' },
      stats: {
        iq: 120,
        personality: { openness: 80, conscientiousness: 90 }
      },
      interests: ['music', 'sports']
    };

    const flat = flattenObject(nested);

    expect(flat.id).toBe('123');
    expect(flat.name_first).toBe('Abhay');
    expect(flat.name_last).toBe('Mourya');
    expect(flat.stats_iq).toBe(120);
    expect(flat.stats_personality_openness).toBe(80);
    expect(flat.stats_personality_conscientiousness).toBe(90);
    expect(flat.interests).toBe('music; sports');
  });

  it('should escape CSV values correctly', () => {
    expect(escapeCSVValue(123)).toBe('123');
    expect(escapeCSVValue('hello')).toBe('hello');
    expect(escapeCSVValue('hello, world')).toBe('"hello, world"');
    expect(escapeCSVValue('hello "world"')).toBe('"hello ""world"""');
    expect(escapeCSVValue('hello\nworld')).toBe('"hello\nworld"');
    expect(escapeCSVValue(null)).toBe('');
    expect(escapeCSVValue(undefined)).toBe('');
  });
});

describe('CLI Integration Tests', () => {
  const outputDir = path.resolve('tests/temp-output');

  it('should run CLI in JSON format successfully', () => {
    const outPath = path.join(outputDir, 'test.json');
    execSync(`npx tsx src/cli.ts -c 10 -o "${outPath}" -f json`, { stdio: 'pipe' });

    expect(fs.existsSync(outPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(content.length).toBe(10);
    expect(content[0].firstName).toBeDefined();
  });

  it('should run CLI in CSV format successfully', () => {
    const outPath = path.join(outputDir, 'test.csv');
    execSync(`npx tsx src/cli.ts -c 10 -o "${outPath}" -f csv`, { stdio: 'pipe' });

    expect(fs.existsSync(outPath)).toBe(true);
    const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBe(11); // 1 header + 10 rows
    // v2.0.6: provenance markers sit right after id
    expect(lines[0].startsWith('id,synthetic,generator,firstName')).toBe(true);
    expect(lines[1].split(',')[1]).toBe('true');
  });

  it('should run CLI in JSONL format successfully', () => {
    const outPath = path.join(outputDir, 'test.jsonl');
    execSync(`npx tsx src/cli.ts -c 10 -o "${outPath}" -f jsonl`, { stdio: 'pipe' });

    expect(fs.existsSync(outPath)).toBe(true);
    const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBe(10);
    expect(JSON.parse(lines[0]).id).toBeDefined();
  });

  it('should accept a string seed (e.g. 011)', () => {
    const outPath = path.join(outputDir, 'seed011.json');
    execSync(`npx tsx src/cli.ts -c 2 -o "${outPath}" -f json --seed 011`, { stdio: 'pipe' });
    const content = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(content.length).toBe(2);
    expect(content[0].firstName).toBeDefined();
  });

  it('should run CLI in family mode with a string seed', () => {
    const outPath = path.join(outputDir, 'family011.json');
    execSync(`npx tsx src/cli.ts --family --seed 011 -o "${outPath}" -f json`, { stdio: 'pipe' });
    const family = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(family.head.firstName).toBeDefined();
    expect(Array.isArray(family.children)).toBe(true);
    expect(Array.isArray(family.siblings)).toBe(true);
    expect(family.parents).toBeDefined();
  });
});

describe('--fields / --stats (v2.0.9)', () => {
  it('picks top-level and dot-path fields, skipping missing ones', () => {
    const record = {
      firstName: 'Abhay', state: 'Punjab',
      appearance: { skinTone: 'wheatish', build: 'average' },
    };
    expect(pickRecordFields(record, ['firstName', 'appearance.skinTone', 'nope'])).toEqual({
      firstName: 'Abhay',
      'appearance.skinTone': 'wheatish',
    });
    expect(getPathValue(record, 'appearance.build')).toBe('average');
    expect(getPathValue(record, 'appearance.missing')).toBeUndefined();
  });

  it('counts categories and formats a readable summary', () => {
    const stats = createStatsCounters();
    updateStatsCounters(stats, { religion: 'Hindu', state: 'Punjab', gender: 'male', areaType: 'rural', education: 'primary', occupation: 'cultivator' });
    updateStatsCounters(stats, { profile: { religion: 'Muslim', state: 'Punjab', gender: 'female', areaType: 'urban', education: 'graduate', occupation: 'other_worker' } });
    // non-objects are ignored
    updateStatsCounters(stats, null);
    const lines = formatStatsCounters(stats);
    expect(lines[0]).toBe('[Stats] 2 profiles');
    expect(lines.join('\n')).toContain('religion: Hindu 1 (50.0%), Muslim 1 (50.0%)');
    expect(lines.join('\n')).toContain('state: Punjab 2 (100.0%)');
  });

  it('CLI --fields writes only the requested keys', () => {
    const outputDir = path.resolve('tests/temp-output');
    const outPath = path.join(outputDir, 'fields.json');
    execSync(
      `npx tsx src/cli.ts -c 3 --seed 7 --fields firstName,state,appearance.skinTone -o "${outPath}" -f json`,
      { stdio: 'pipe' }
    );
    const content = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
    expect(content.length).toBe(3);
    for (const row of content) {
      expect(Object.keys(row).sort()).toEqual(['appearance.skinTone', 'firstName', 'state']);
    }
  });

  it('CLI --stats prints a summary to stderr', () => {
    const outputDir = path.resolve('tests/temp-output');
    const outPath = path.join(outputDir, 'stats.json');
    const combined = execSync(
      `npx tsx src/cli.ts -c 5 --seed 7 --stats -o "${outPath}" -f json 2>&1`,
      { stdio: 'pipe', encoding: 'utf-8' }
    );
    expect(combined).toContain('[Stats] 5 profiles');
    expect(combined).toContain('gender:');
  });
});
