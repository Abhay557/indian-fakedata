import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';
import { getRegion, REGION_HEIGHT_OFFSET_CM } from '../src/utils/appearance.js';

const BUILDS = ['slim', 'average', 'stocky', 'heavy'];
const FACE_SHAPES = ['oval', 'round', 'square', 'oblong', 'heart', 'diamond'];
const SKIN_TONES = ['fair', 'wheatish', 'brown', 'deep_brown', 'dark'];
const NOSE_TYPES = ['straight', 'aquiline', 'flat', 'broad', 'button', 'hooked'];
const EYE_COLORS = ['brown', 'dark_brown', 'black', 'hazel', 'green', 'grey'];
const EYE_SHAPES = ['almond', 'round', 'hooded', 'monolid', 'deep_set'];
const HAIR_COLORS = ['black', 'dark_brown', 'brown', 'grey', 'white'];
const HAIR_TEXTURES = ['straight', 'wavy', 'curly', 'coily'];
const HAIR_LENGTHS = ['bald', 'short', 'medium', 'long'];
const FACIAL_HAIR = ['none', 'stubble', 'moustache', 'full_beard', 'goatee'];

describe('appearance attribute (v2.0.8)', () => {
  it('every profile carries a valid nested appearance object', () => {
    const rows = generate({ count: 100 });
    for (const r of rows) {
      const a = r.appearance;
      expect(a).toBeDefined();
      expect(a.heightCm).toBe(r.heightCm);
      expect(BUILDS).toContain(a.build);
      expect(FACE_SHAPES).toContain(a.faceShape);
      expect(SKIN_TONES).toContain(a.skinTone);
      expect(NOSE_TYPES).toContain(a.noseType);
      expect(EYE_COLORS).toContain(a.eyeColor);
      expect(EYE_SHAPES).toContain(a.eyeShape);
      expect(HAIR_COLORS).toContain(a.hairColor);
      expect(HAIR_TEXTURES).toContain(a.hairTexture);
      expect(HAIR_LENGTHS).toContain(a.hairLength);
      if (r.gender === 'male') {
        expect(FACIAL_HAIR).toContain(a.facialHair);
      } else {
        expect(a.facialHair).toBeUndefined();
      }
    }
  });

  it('same seed reproduces the same appearance (determinism)', () => {
    const a = generate({ count: 1, seed: 42 })[0].appearance;
    const b = generate({ count: 1, seed: 42 })[0].appearance;
    expect(a).toEqual(b);
  });

  it('region mapping covers the main North/South/NE states', () => {
    expect(getRegion('punjab')).toBe('north_west');
    expect(getRegion('kerala')).toBe('south');
    expect(getRegion('nagaland')).toBe('north_east');
    expect(getRegion('maharashtra')).toBe('central');
    // Offset ordering: North/West tallest, South & NE shorter
    expect(REGION_HEIGHT_OFFSET_CM.north_west).toBeGreaterThan(REGION_HEIGHT_OFFSET_CM.south);
    expect(REGION_HEIGHT_OFFSET_CM.south).toBeGreaterThan(REGION_HEIGHT_OFFSET_CM.north_east);
  });

  it('North/West average height exceeds South over many samples', () => {
    const north: number[] = [], south: number[] = [];
    for (let i = 0; i < 400; i++) {
      north.push(generate({ count: 1, seed: i, constraints: { state: 'Punjab', gender: 'male', ageRange: { min: 25, max: 35 } } })[0].heightCm);
      south.push(generate({ count: 1, seed: i, constraints: { state: 'Kerala', gender: 'male', ageRange: { min: 25, max: 35 } } })[0].heightCm);
    }
    const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
    expect(avg(north)).toBeGreaterThan(avg(south));
  });
});
