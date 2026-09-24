import { describe, expect, it } from 'vitest';

import {
  generate,
  generateAgentPersona,
  generatePersona,
  generateEnriched,
} from '../src/index.js';

describe('persona language option (v2.0.9)', () => {
  it('default english output is unchanged', () => {
    const p = generate({ count: 1, seed: 31 })[0];
    const def = generateAgentPersona(p);
    const explicit = generateAgentPersona(p, { language: 'english' });
    expect(explicit).toEqual(def);
    expect(def.systemPrompt.startsWith('You are ')).toBe(true);
    expect(def.fullPrompt).toContain('IDENTITY');
  });

  it('hindi renders Devanagari system prompt and headers', () => {
    const p = generate({ count: 1, seed: 31 })[0];
    const persona = generateAgentPersona(p, { language: 'hindi' });
    expect(persona.systemPrompt).toContain('आप');
    expect(persona.systemPrompt).toContain(p.firstName);
    expect(persona.systemPrompt).toContain(p.district);
    expect(persona.fullPrompt).toContain('PEHCHAAN');
    expect(persona.fullPrompt).toContain('ROOP-RANG');
    expect(persona.fullPrompt).not.toContain('\nIDENTITY\n');
  });

  it('hinglish renders roman-mix system prompt with english headers', () => {
    const p = generate({ count: 1, seed: 31 })[0];
    const persona = generateAgentPersona(p, { language: 'hinglish' });
    expect(persona.systemPrompt).toContain(`Tum ${p.firstName}`);
    expect(persona.fullPrompt).toContain('IDENTITY');
    expect(persona.fullPrompt).toContain('Tum ');
  });

  it('plumbs through generatePersona and generateEnriched', () => {
    const { persona } = generatePersona({ seed: 31, personaLanguage: 'hindi' });
    expect(persona.systemPrompt).toContain('आप');
    const enriched = generateEnriched({
      count: 1,
      seed: 31,
      includeAgentPersona: true,
      agentPersonaLanguage: 'hinglish',
    });
    expect(enriched[0].agentPersona!.systemPrompt).toContain('Tum ');
  });
});
