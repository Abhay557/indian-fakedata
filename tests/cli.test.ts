import { describe, it, expect } from 'vitest';
import { flattenObject, escapeCSVValue } from '../src/utils/cli-stream.js';
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
    expect(lines[0].startsWith('id,firstName')).toBe(true);
  });

  it('should run CLI in JSONL format successfully', () => {
    const outPath = path.join(outputDir, 'test.jsonl');
    execSync(`npx tsx src/cli.ts -c 10 -o "${outPath}" -f jsonl`, { stdio: 'pipe' });

    expect(fs.existsSync(outPath)).toBe(true);
    const lines = fs.readFileSync(outPath, 'utf-8').trim().split('\n');
    expect(lines.length).toBe(10);
    expect(JSON.parse(lines[0]).id).toBeDefined();
  });
});
