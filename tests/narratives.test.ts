import { describe, expect, it } from 'vitest';

import {
  generate,
  simulateOutcomes,
  generateNarrative,
  generateAllNarratives,
  createRNG,
} from '../src/index.js';

function enrichedOf(seed: number) {
  const profile = generate({ count: 1, seed })[0];
  const outcomes = simulateOutcomes(profile, 0.3, createRNG(seed));
  return { profile, outcomes };
}

describe('new narrative types (v2.0.9)', () => {
  it('generates a resume grounded in the profile', () => {
    const { profile, outcomes } = enrichedOf(21);
    const doc = generateNarrative(profile, outcomes, 'resume');
    expect(doc.type).toBe('resume');
    expect(doc.language).toBe('english');
    expect(doc.metadata.profileId).toBe(profile.id);
    expect(doc.metadata.wordCount).toBeGreaterThan(30);
    // header prints the name uppercased
    expect(doc.content).toContain(profile.firstName.toUpperCase());
    expect(doc.content).toContain(profile.lastName.toUpperCase());
    expect(doc.content).toContain('RESUME');
    const tl = profile.employmentTimeline ?? [];
    if (tl.length > 0) {
      expect(doc.content).toContain(tl[0].jobTitle);
    }
    expect(doc.metadata.sensitiveFields).toContain('phoneNumber');
  });

  it('generates a customer support chat in Hinglish', () => {
    const { profile, outcomes } = enrichedOf(22);
    const doc = generateNarrative(profile, outcomes, 'customer_support_chat');
    expect(doc.type).toBe('customer_support_chat');
    expect(doc.language).toBe('hinglish');
    expect(doc.metadata.profileId).toBe(profile.id);
    expect(doc.metadata.wordCount).toBeGreaterThan(30);
    expect(doc.content).toContain(profile.firstName);
    expect(doc.content).toContain('Support Agent');
    // phone is masked, full number never printed
    expect(doc.content).not.toContain(profile.phoneNumber);
  });

  it('generateAllNarratives appends the new types at the end', () => {
    const { profile, outcomes } = enrichedOf(23);
    const docs = generateAllNarratives(profile, outcomes);
    expect(docs.map(d => d.type)).toEqual([
      'loan_application',
      'medical_consultation',
      'hinglish_conversation',
      'ration_card_application',
      'school_enrollment',
      'resume',
      'customer_support_chat',
    ]);
  });

  it('narratives are deterministic for the same profile', () => {
    const { profile, outcomes } = enrichedOf(24);
    const a = generateNarrative(profile, outcomes, 'resume');
    const b = generateNarrative(profile, outcomes, 'resume');
    expect(a).toEqual(b);
  });
});
