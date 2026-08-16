/**
 * Tests for the v2.0.3 enrichment layer:
 * education timeline, personality traits, movie/anime preferences,
 * and the full persona prompt.
 */

import { describe, it, expect } from 'vitest';
import { generateUser, generatePersona } from '../src/index.js';

const PLATFORMS = ['ott', 'youtube', 'theatre', 'television', 'none'];
const FREQUENCIES = ['daily', 'weekly', 'occasional', 'rare'];
const STAGE_ORDER = [
  'primary', 'middle', 'secondary', 'higher_secondary',
  'graduate', 'postgraduate', 'technical_diploma', 'professional_degree'
];

describe('educationTimeline', () => {
  it('has a chronologically ordered, contiguous timeline', () => {
    const user = generateUser({ seed: 42 });
    const timeline = user.educationTimeline;
    expect(timeline.length).toBeGreaterThan(0);
    for (let i = 0; i < timeline.length; i++) {
      const stage = timeline[i];
      expect(stage.startYear).toBeLessThanOrEqual(stage.endYear);
      if (i > 0) {
        expect(stage.startYear).toBe(timeline[i - 1].endYear);
        expect(STAGE_ORDER.indexOf(stage.level))
          .toBeGreaterThan(STAGE_ORDER.indexOf(timeline[i - 1].level));
      }
    }
  });

  it('marks the final stage in_progress when age is below completion age', () => {
    // Age 6 cannot have completed primary school
    const young = generateUser({ seed: 42, constraints: { ageRange: { min: 5, max: 8 } } });
    const last = young.educationTimeline[young.educationTimeline.length - 1];
    expect(last.status).toBe('in_progress');
    expect(last.score).toBeUndefined();
  });

  it('assigns a score to every completed stage', () => {
    const user = generateUser({ seed: 7, constraints: { education: 'postgraduate' } });
    for (const stage of user.educationTimeline) {
      if (stage.status === 'completed') {
        expect(stage.score).toMatch(/\d+(\.\d+)?%/);
      }
    }
  });

  it('assigns a valid college board/university name', () => {
    const user = generateUser({ seed: 7, constraints: { state: 'Assam', education: 'graduate' } });
    const grad = user.educationTimeline.find(s => s.level === 'graduate');
    expect(grad).toBeDefined();
    expect(grad!.boardOrUniversity).toMatch(/^(University of |University Grants Commission|Autonomous University)/);
  });

  it('is deterministic for the same seed', () => {
    const a = generateUser({ seed: '011' });
    const b = generateUser({ seed: '011' });
    expect(a.educationTimeline).toEqual(b.educationTimeline);
  });
});

describe('personalityTraits', () => {
  it('derives 5 labels, 3 strengths and 3 weaknesses from Big Five', () => {
    const user = generateUser({ seed: 42 });
    expect(user.personalityTraits.traitLabels).toHaveLength(5);
    expect(user.personalityTraits.strengths).toHaveLength(3);
    expect(user.personalityTraits.weaknesses).toHaveLength(3);
    expect(user.personalityTraits.summary.length).toBeGreaterThan(20);
    expect(['outgoing', 'introverted', 'ambivert']).toContain(user.personalityTraits.socialBehavior);
  });

  it('is deterministic and requires no RNG draws', () => {
    const a = generateUser({ seed: '011' });
    const b = generateUser({ seed: '011' });
    expect(a.personalityTraits).toEqual(b.personalityTraits);
  });
});

describe('moviePreferences', () => {
  it('returns 2-4 genres, non-empty languages and valid platform/frequency', () => {
    const user = generateUser({ seed: 42 });
    expect(user.moviePreferences.genres.length).toBeGreaterThanOrEqual(2);
    expect(user.moviePreferences.genres.length).toBeLessThanOrEqual(4);
    expect(user.moviePreferences.favoriteLanguages.length).toBeGreaterThan(0);
    expect(PLATFORMS).toContain(user.moviePreferences.primaryPlatform);
    expect(FREQUENCIES).toContain(user.moviePreferences.watchFrequency);
  });

  it('prefers the regional cinema language of the state', () => {
    const user = generateUser({ seed: 7, constraints: { state: 'Kerala' } });
    expect(user.moviePreferences.favoriteLanguages).toContain('Malayalam');
  });

  it('only includes anime fields when anime is true', () => {
    const user = generateUser({ seed: 42 });
    if (user.moviePreferences.anime) {
      expect(user.moviePreferences.animePreferences!.length).toBeGreaterThan(0);
      expect(user.moviePreferences.favoriteAnimeTitles!.length).toBeGreaterThan(0);
    } else {
      expect(user.moviePreferences.animePreferences).toBeUndefined();
      expect(user.moviePreferences.favoriteAnimeTitles).toBeUndefined();
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateUser({ seed: '011' });
    const b = generateUser({ seed: '011' });
    expect(a.moviePreferences).toEqual(b.moviePreferences);
  });
});

describe('full persona prompt', () => {
  it('contains identity, education, movies and behaviour sections', () => {
    const { persona } = generatePersona({ seed: 42 });
    expect(persona.fullPrompt.length).toBeGreaterThan(1000);
    expect(persona.fullPrompt).toContain('IDENTITY');
    expect(persona.fullPrompt).toContain('EDUCATION');
    expect(persona.fullPrompt).toContain('PERSONALITY');
    expect(persona.fullPrompt).toContain('INTERESTS & PREFERENCES');
    expect(persona.fullPrompt).toContain('HOW TO SPEAK & BEHAVE');
  });

  it('embeds the user identity into the prompt', () => {
    const { user, persona } = generatePersona({ seed: 42 });
    expect(persona.fullPrompt).toContain(`${user.firstName} ${user.lastName}`);
    expect(persona.fullPrompt).toContain(user.state);
    expect(persona.fullPrompt).toContain(user.district);
  });

  it('is deterministic for the same seed', () => {
    const a = generatePersona({ seed: '011' });
    const b = generatePersona({ seed: '011' });
    expect(a.persona.fullPrompt).toBe(b.persona.fullPrompt);
  });
});