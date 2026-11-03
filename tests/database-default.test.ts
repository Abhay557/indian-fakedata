import { describe, it, expect } from 'vitest';
import { getDefaultDatabase } from '../src/index.js';

const db = getDefaultDatabase();

describe('default database', () => {
  it('contains all six expected tables', () => {
    expect(Object.keys(db).sort()).toEqual(['casteMap', 'districts', 'firstNames', 'religions', 'states', 'surnames']);
  });

  it('covers all 36 states and union territories', () => {
    expect(Object.keys(db.states)).toHaveLength(36);
  });

  it('gives every state a non-empty district list', () => {
    for (const stateId of Object.keys(db.states)) {
      const districts = db.districts[stateId];
      expect(districts).toBeDefined();
      expect(districts.length).toBeGreaterThan(0);
    }
  });

  it('every state has a 2-letter code and a positive population', () => {
    for (const state of Object.values(db.states)) {
      expect(state.stateCode).toMatch(/^[A-Z]{2}$/);
      expect(state.totalPopulation).toBeGreaterThan(0);
      expect(state.sexRatio).toBeGreaterThan(0);
    }
  });

  it('every state has a literacy rate between 0 and 100', () => {
    for (const state of Object.values(db.states)) {
      expect(state.literacyRate).toBeGreaterThanOrEqual(0);
      expect(state.literacyRate).toBeLessThanOrEqual(100);
    }
  });

  it('every state religion distribution sums to about 1', () => {
    for (const [stateId, state] of Object.entries(db.states)) {
      const total = Object.values(state.religionDistribution).reduce((sum, p) => sum + p, 0);
      expect(Math.abs(total - 1)).toBeLessThan(0.05);
      void stateId;
    }
  });

  it('every state has SC/ST proportions between 0 and 1', () => {
    for (const state of Object.values(db.states)) {
      expect(state.scProportion).toBeGreaterThanOrEqual(0);
      expect(state.scProportion).toBeLessThanOrEqual(1);
      expect(state.stProportion).toBeGreaterThanOrEqual(0);
      expect(state.stProportion).toBeLessThanOrEqual(1);
    }
  });

  it('contains all six religions with positive national proportions', () => {
    const ids = Object.keys(db.religions);
    expect(ids.sort()).toEqual(['buddhist', 'christian', 'hindu', 'jain', 'muslim', 'sikh'].sort());

    for (const religion of Object.values(db.religions)) {
      expect(religion.nationalProportion).toBeGreaterThan(0);
      expect(religion.label.length).toBeGreaterThan(0);
    }
  });

  it('national religion proportions sum to about 1', () => {
    const total = Object.values(db.religions).reduce((sum, r) => sum + r.nationalProportion, 0);
    expect(Math.abs(total - 1)).toBeLessThan(0.05);
  });

  it('every caste entry has a positive weight and a valid social category', () => {
    const validCategories = ['SC', 'ST', 'OBC', 'General'];
    for (const religionMap of Object.values(db.casteMap)) {
      for (const casteList of Object.values(religionMap)) {
        for (const caste of casteList) {
          expect(caste.weight).toBeGreaterThan(0);
          expect(validCategories).toContain(caste.socialCategory);
          expect(caste.id.length).toBeGreaterThan(0);
          expect(caste.label.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every surname entry has a positive weight and a valid name', () => {
    for (const list of Object.values(db.surnames)) {
      for (const entry of list) {
        expect(entry.weight).toBeGreaterThan(0);
        expect(entry.name.length).toBeGreaterThan(0);
        expect(['male', 'female', 'unisex']).toContain(entry.gender);
      }
    }
  });

  it('first names exist for every religion and gender', () => {
    for (const religionId of Object.keys(db.firstNames)) {
      const byGender = db.firstNames[religionId].default;
      expect(byGender).toBeDefined();
      expect(byGender.male.length).toBeGreaterThan(0);
      expect(byGender.female.length).toBeGreaterThan(0);
    }
  });

  it('surname lists exist for the main Sikh castes', () => {
    const allSurnameKeys = Object.keys(db.surnames);
    expect(allSurnameKeys).toContain('jat_sikh');
    expect(allSurnameKeys).toContain('khatri_sikh');
  });
});
