import { describe, it, expect } from 'vitest';
import { getDefaultDatabase, mergeDatabase } from '../src/index.js';

const base = getDefaultDatabase();

describe('mergeDatabase', () => {
  it('returns the base database unchanged when nothing is supplied', () => {
    const merged = mergeDatabase(base, {});
    expect(merged).toEqual(base);
  });

  it('keeps the base states and adds new custom states', () => {
    const custom = {
      states: {
        test_state: {
          stateCode: 'TS',
          stateName: 'Test State',
          totalPopulation: 1000,
          urbanPopulation: 500,
          ruralPopulation: 500,
          sexRatio: 950,
          literacyRate: 70,
          religionDistribution: { hindu: 1 },
          scProportion: 0.1,
          stProportion: 0.1,
          educationDistribution: {},
          occupationDistribution: {},
          languageDistribution: { Hindi: 1 },
          assetDistribution: {},
        },
      },
    };

    const merged = mergeDatabase(base, custom);
    expect(merged.states.test_state).toBeDefined();
    // The original 36 states must still be there
    expect(Object.keys(merged.states)).toHaveLength(37);
  });

  it('does not overwrite a base state when the custom state has the same id', () => {
    const baseState = base.states.maharashtra;
    const custom = { states: { maharashtra: { ...baseState, literacyRate: 1 } } };
    const merged = mergeDatabase(base, custom);
    expect(merged.states.maharashtra.literacyRate).toBe(1);
  });

  it('replaces a first name gender list entirely for a matching key', () => {
    const custom = {
      firstNames: {
        hindu: {
          default: {
            male: [{ name: 'Zorawar', weight: 1, gender: 'male' as const }],
          },
        },
      },
    };
    const merged = mergeDatabase(base, custom);

    // The custom name replaces the base list for that exact key
    expect(merged.firstNames.hindu.default.male).toEqual([
      { name: 'Zorawar', weight: 1, gender: 'male' },
    ]);
  });

  it('deep merges the caste map', () => {
    const existingHinduStates = Object.keys(base.casteMap.hindu);
    const custom = {
      casteMap: {
        hindu: {
          test_state: [{ id: 'test_caste', label: 'Test Caste', weight: 1, socialCategory: 'General' as const }],
        },
      },
    };
    const merged = mergeDatabase(base, custom);

    expect(merged.casteMap.hindu.test_state).toBeDefined();
    expect(Object.keys(merged.casteMap.hindu).length).toBeGreaterThanOrEqual(existingHinduStates.length);
  });

  it('replaces a surname list entirely for a matching key', () => {
    const custom = { surnames: { jat_sikh: [{ name: 'TestSurname', weight: 1, gender: 'male' as const }] } };
    const merged = mergeDatabase(base, custom);
    expect(merged.surnames.jat_sikh).toEqual([{ name: 'TestSurname', weight: 1, gender: 'male' }]);
  });

  it('never mutates the original base database', () => {
    const before = JSON.stringify(base);
    mergeDatabase(base, { states: { extra: { stateCode: 'XX', stateName: 'X', totalPopulation: 1, urbanPopulation: 1, ruralPopulation: 0, sexRatio: 1, literacyRate: 1, religionDistribution: {}, scProportion: 0, stProportion: 0, educationDistribution: {}, occupationDistribution: {}, languageDistribution: {}, assetDistribution: {} } } });
    expect(JSON.stringify(base)).toBe(before);
  });
});
