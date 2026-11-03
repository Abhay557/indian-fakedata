import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generate, saveProfilesToFile } from '../src/index.js';

const outputDir = path.resolve('tests/temp-output/exporter');
const profiles = generate({ count: 8, seed: 12 });

beforeAll(() => {
  fs.mkdirSync(outputDir, { recursive: true });
});

afterAll(() => {
  fs.rmSync(outputDir, { recursive: true, force: true });
});

describe('saveProfilesToFile', () => {
  it('saves JSON that can be read back as the same profiles', () => {
    const filePath = path.join(outputDir, 'profiles.json');
    saveProfilesToFile(profiles, filePath, 'json');

    const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(saved).toEqual(profiles);
  });

  it('saves JSONL with one profile per line', () => {
    const filePath = path.join(outputDir, 'profiles.jsonl');
    saveProfilesToFile(profiles, filePath, 'jsonl');

    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(profiles.length);

    const parsed = lines.map((line) => JSON.parse(line));
    expect(parsed).toEqual(profiles);
  });

  it('saves CSV with a header and the right number of rows', () => {
    const filePath = path.join(outputDir, 'profiles.csv');
    saveProfilesToFile(profiles, filePath, 'csv');

    const text = fs.readFileSync(filePath, 'utf8');
    const rows = text.trim().split('\n');
    expect(rows).toHaveLength(profiles.length + 1); // header + data
    expect(rows[0]).toContain('firstName');
  });

  it('creates parent directories automatically', () => {
    const nestedDir = path.join(outputDir, 'nested', 'deep');
    const filePath = path.join(nestedDir, 'profiles.jsonl');
    saveProfilesToFile(profiles.slice(0, 2), filePath, 'jsonl');

    expect(fs.existsSync(filePath)).toBe(true);
    const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
    expect(lines).toHaveLength(2);
  });

  it('writes an empty array as empty content', () => {
    const filePath = path.join(outputDir, 'empty.json');
    saveProfilesToFile([], filePath, 'json');
    expect(fs.readFileSync(filePath, 'utf8')).toBe('[]');
  });
});
