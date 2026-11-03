import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('personality trait coherence', () => {
  const profiles = generate({ count: 300, seed: 88 });

  it('socialBehavior follows the extraversion score', () => {
    for (const p of profiles) {
      const extraversion = p.personality.extraversion;
      const socialBehavior = p.personalityTraits.socialBehavior;

      if (extraversion >= 60) {
        expect(socialBehavior).toBe('outgoing');
      } else if (extraversion <= 40) {
        expect(socialBehavior).toBe('introverted');
      } else {
        expect(socialBehavior).toBe('ambivert');
      }
    }
  });

  it('communicationStyle follows the threshold rules', () => {
    for (const p of profiles) {
      const { extraversion, agreeableness } = p.personality;
      const style = p.personalityTraits.communicationStyle;

      if (extraversion >= 60 && agreeableness <= 45) {
        expect(style).toBe('direct');
      } else if (agreeableness >= 60) {
        expect(style).toBe('polite_indirect');
      } else if (extraversion >= 55) {
        expect(style).toBe('expressive');
      } else {
        expect(style).toBe('reserved');
      }
    }
  });

  it('decisionStyle follows the threshold rules', () => {
    for (const p of profiles) {
      const { openness, conscientiousness, agreeableness } = p.personality;
      const decision = p.personalityTraits.decisionStyle;

      if (openness >= 60 && conscientiousness <= 45) {
        expect(decision).toBe('impulsive');
      } else if (conscientiousness >= 60) {
        expect(decision).toBe('analytical');
      } else if (agreeableness >= 60) {
        expect(decision).toBe('family_consulting');
      } else {
        expect(decision).toBe('intuitive');
      }
    }
  });

  it('high extraversion labels appear only when the score is high', () => {
    for (const p of profiles) {
      const labels = p.personalityTraits.traitLabels;
      if (p.personality.extraversion >= 55) {
        expect(labels).toContain('outgoing');
      } else {
        expect(labels).toContain('introspective');
      }
    }
  });

  it('strengths and weaknesses have exactly 3 entries each', () => {
    for (const p of profiles) {
      expect(p.personalityTraits.strengths).toHaveLength(3);
      expect(p.personalityTraits.weaknesses).toHaveLength(3);
      for (const s of p.personalityTraits.strengths) {
        expect(s.length).toBeGreaterThan(0);
      }
      for (const w of p.personalityTraits.weaknesses) {
        expect(w.length).toBeGreaterThan(0);
      }
    }
  });
});
