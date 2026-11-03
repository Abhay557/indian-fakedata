import { describe, it, expect } from 'vitest';
import { generatePersona } from '../src/index.js';

describe('agent persona structure', () => {
  const { user, persona } = generatePersona({ seed: 2024 });

  it('returns a user and a persona', () => {
    expect(user).toBeDefined();
    expect(persona).toBeDefined();
  });

  it('contains all expected persona fields', () => {
    const expectedKeys = [
      'systemPrompt',
      'fullPrompt',
      'identityLine',
      'beliefs',
      'memorySeeds',
      'behaviorRules',
      'communicationStyle',
      'currentSituation',
      'stressResponse',
      'economicBehavior',
      'profileId',
      'nationalPrevalence',
    ];
    const actualKeys = Object.keys(persona);
    for (const key of expectedKeys) {
      expect(actualKeys).toContain(key);
    }
  });

  it('systemPrompt and fullPrompt are non-empty strings', () => {
    expect(persona.systemPrompt.length).toBeGreaterThan(100);
    expect(persona.fullPrompt.length).toBeGreaterThan(500);
  });

  it('fullPrompt mentions the person identity', () => {
    expect(persona.fullPrompt).toContain(user.firstName);
    expect(persona.fullPrompt).toContain(user.lastName);
    expect(persona.fullPrompt).toContain(String(user.age));
    expect(persona.fullPrompt).toContain(user.state);
  });

  it('identityLine is a short non-empty sentence', () => {
    expect(persona.identityLine.length).toBeGreaterThan(10);
    expect(persona.identityLine.length).toBeLessThan(300);
  });

  it('beliefs contain valid structured values', () => {
    const politicalValues = ['nationalist_right', 'centre_right', 'centrist', 'centre_left', 'leftist', 'regionalist', 'apolitical'];
    const religiosityValues = ['very_religious', 'somewhat_religious', 'not_very_religious', 'not_at_all_religious'];
    const worldviewValues = ['traditional', 'modern', 'hybrid'];

    expect(politicalValues).toContain(persona.beliefs.political);
    expect(religiosityValues).toContain(persona.beliefs.religiosity);
    expect(worldviewValues).toContain(persona.beliefs.worldview);

    const trusts = [persona.beliefs.trustInstitutions, persona.beliefs.trustReligiousInstitutions, persona.beliefs.collectivismScore];
    for (const trust of trusts) {
      expect(trust).toBeGreaterThanOrEqual(0);
      expect(trust).toBeLessThanOrEqual(100);
    }
  });

  it('communicationStyle has a language, formality and switching tendency', () => {
    const formalityValues = ['formal', 'informal', 'mixed'];
    expect(persona.communicationStyle.primaryLanguage.length).toBeGreaterThan(0);
    expect(formalityValues).toContain(persona.communicationStyle.formality);
    expect(persona.communicationStyle.codeSwitchingTendency).toBeGreaterThanOrEqual(0);
    expect(persona.communicationStyle.codeSwitchingTendency).toBeLessThanOrEqual(100);
  });

  it('stressResponse and economicBehavior are valid', () => {
    const stressValues = ['resigned', 'adaptive', 'resistant', 'community_dependent'];
    const economicValues = ['subsistence', 'saving', 'investing', 'entrepreneurial'];
    expect(stressValues).toContain(persona.stressResponse);
    expect(economicValues).toContain(persona.economicBehavior);
  });

  it('memorySeeds and behaviorRules are non-empty arrays', () => {
    expect(Array.isArray(persona.memorySeeds)).toBe(true);
    expect(persona.memorySeeds.length).toBeGreaterThan(0);
    expect(Array.isArray(persona.behaviorRules)).toBe(true);
    expect(persona.behaviorRules.length).toBeGreaterThan(0);
  });

  it('profileId matches the generated user id', () => {
    expect(persona.profileId).toBe(user.id);
  });

  it('nationalPrevalence is a positive number', () => {
    expect(persona.nationalPrevalence).toBeGreaterThan(0);
  });
});
