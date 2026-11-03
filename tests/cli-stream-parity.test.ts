import { describe, it, expect } from 'vitest';
import { generate, generateStream, generateEnriched, generateEnrichedStream } from '../src/index.js';

// The generatedAt timestamp is set to the wall-clock time of generation,
// so it can differ by a few milliseconds between two runs. We ignore it
// when comparing batch output with stream output.
function withoutGeneratedAt(profiles: any[]) {
  return profiles.map((p) => ({ ...p, generatedAt: 'same' }));
}

describe('streaming generation parity', () => {
  it('generateStream yields the same profiles as generate', () => {
    const batch = generate({ count: 20, seed: 99 });
    const streamed = [...generateStream({ count: 20, seed: 99 })];

    expect(withoutGeneratedAt(streamed)).toEqual(withoutGeneratedAt(batch));
  });

  it('generateStream respects constraints', () => {
    const streamed = [...generateStream({ count: 30, seed: 5, constraints: { religion: 'Sikh' } })];
    expect(streamed).toHaveLength(30);
    for (const p of streamed) {
      expect(p.religion).toBe('Sikh');
    }
  });

  it('generateEnrichedStream yields the same enriched profiles as generateEnriched', () => {
    const options = {
      count: 10,
      seed: 77,
      includeOutcomes: true,
      includeAgentPersona: true,
      narrativeTypes: ['loan_application' as const],
    };
    const batch = generateEnriched(options);
    const streamed = [...generateEnrichedStream(options)];

    const batchWithoutTimestamps = batch.map((e) => ({ ...e, profile: { ...e.profile, generatedAt: 'same' } }));
    const streamedWithoutTimestamps = streamed.map((e) => ({ ...e, profile: { ...e.profile, generatedAt: 'same' } }));
    expect(streamedWithoutTimestamps).toEqual(batchWithoutTimestamps);
  });

  it('generateEnrichedStream yields the requested number of profiles', () => {
    const streamed = [...generateEnrichedStream({ count: 7, seed: 3, includeOutcomes: true })];
    expect(streamed).toHaveLength(7);
    for (const enriched of streamed) {
      expect(enriched.outcomes).toBeDefined();
    }
  });
});
