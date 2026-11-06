import { describe, it, expect } from 'vitest';
import { generatePersona } from '../src/index.js';

describe('agent persona reproducibility', () => {
  it('the same seed always gives the same persona', () => {
    const first = generatePersona({ seed: 42 });
    const second = generatePersona({ seed: 42 });

    expect(first.persona).toEqual(second.persona);

    expect(first.user).toEqual(second.user);
  });

  it('different seeds give different personas', () => {
    const first = generatePersona({ seed: 42 });
    const second = generatePersona({ seed: 43 });

    expect(first.persona.systemPrompt).not.toBe(second.persona.systemPrompt);
  });

  it('string seeds are reproducible too', () => {
    const first = generatePersona({ seed: '011' });
    const second = generatePersona({ seed: '011' });

    expect(first.persona).toEqual(second.persona);
  });

  it('memory seeds are personal statements about the person', () => {
    const { persona } = generatePersona({ seed: 7 });
    for (const seed of persona.memorySeeds) {
      expect(seed.length).toBeGreaterThan(20);
    }
    // At least one seed must be a first-person statement
    const allSeeds = persona.memorySeeds.join(' ');
    expect(allSeeds).toContain('I ');
  });
});
