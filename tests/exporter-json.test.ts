import { describe, it, expect } from 'vitest';
import { generate, generateEnriched, formatProfiles } from '../src/index.js';

describe('formatProfiles JSON', () => {
  it('returns valid JSON that parses back to the same profiles', () => {
    const profiles = generate({ count: 5, seed: 7 });
    const text = formatProfiles(profiles, 'json');

    const parsed = JSON.parse(text);
    expect(parsed).toEqual(profiles);
  });

  it('is pretty-printed with newlines', () => {
    const profiles = generate({ count: 2, seed: 1 });
    const text = formatProfiles(profiles, 'json');
    expect(text.includes('\n')).toBe(true);
  });

  it('works with an empty list', () => {
    const text = formatProfiles([], 'json');
    expect(JSON.parse(text)).toEqual([]);
  });
});

describe('formatProfiles JSONL', () => {
  it('writes one profile per line', () => {
    const profiles = generate({ count: 10, seed: 3 });
    const text = formatProfiles(profiles, 'jsonl');

    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(10);
  });

  it('every line parses to one of the original profiles', () => {
    const profiles = generate({ count: 10, seed: 3 });
    const text = formatProfiles(profiles, 'jsonl');

    const lines = text.trim().split('\n');
    for (let i = 0; i < lines.length; i++) {
      expect(JSON.parse(lines[i])).toEqual(profiles[i]);
    }
  });

  it('returns an empty string for an empty list', () => {
    expect(formatProfiles([], 'jsonl')).toBe('');
  });

  it('serializes enriched profiles with their layers', () => {
    const enriched = generateEnriched({
      count: 3,
      seed: 5,
      includeOutcomes: true,
      includeAgentPersona: true,
    });
    const text = formatProfiles(enriched, 'jsonl');
    const first = JSON.parse(text.trim().split('\n')[0]);

    expect(first.profile).toBeDefined();
    expect(first.outcomes.credit).toBeDefined();
    expect(first.agentPersona.systemPrompt).toBeDefined();
  });

  it('is deterministic for the same input', () => {
    const profiles = generate({ count: 4, seed: 9 });
    const first = formatProfiles(profiles, 'jsonl');
    const second = formatProfiles(profiles, 'jsonl');
    expect(first).toBe(second);
  });
});
