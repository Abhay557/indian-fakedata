import { describe, expect, it } from 'vitest';

import { generate, generateAgentPersona, simulateOutcomes, generateNarrative } from '../src/index.js';
import { generateFestivals, profileFestivals } from '../src/utils/festivals.js';
import { createRNG } from '../src/core/sampler.js';

describe('festival calendar (v2.1.0, item 5)', () => {
  it('hindus mark Diwali, muslims mark Eid, christians mark Christmas', () => {
    const diwali = generateFestivals(
      { religionId: 'hindu', religionLabel: 'Hindu', stateId: 'uttar_pradesh', religiosity: 'very_religious', currentYear: 2026 },
      createRNG(41));
    expect(diwali.map(f => f.name)).toContain('Diwali');
    const eid = generateFestivals(
      { religionId: 'muslim', religionLabel: 'Muslim', stateId: 'uttar_pradesh', religiosity: 'very_religious', currentYear: 2026 },
      createRNG(42));
    expect(eid.map(f => f.name)).toContain('Eid al-Fitr');
    const xmas = generateFestivals(
      { religionId: 'christian', religionLabel: 'Christian', stateId: 'kerala', religiosity: 'very_religious', currentYear: 2026 },
      createRNG(40));
    expect(xmas.map(f => f.name)).toContain('Christmas');
  });

  it('regional festivals stay in their states', () => {
    const tn = generateFestivals(
      { religionId: 'hindu', religionLabel: 'Hindu', stateId: 'tamil_nadu', religiosity: 'very_religious', currentYear: 2026 },
      createRNG(44));
    expect(tn.map(f => f.name)).toContain('Pongal');
    expect(tn.find(f => f.name === 'Pongal')!.regional).toBe(true);
    const up = generateFestivals(
      { religionId: 'hindu', religionLabel: 'Hindu', stateId: 'uttar_pradesh', religiosity: 'very_religious', currentYear: 2026 },
      createRNG(44));
    expect(up.map(f => f.name)).not.toContain('Pongal');
    expect(up.map(f => f.name)).not.toContain('Bihu');
  });

  it('dates are valid and sorted in the given year', () => {
    const docs = generateFestivals(
      { religionId: 'sikh', religionLabel: 'Sikh', stateId: 'punjab', religiosity: 'somewhat_religious', currentYear: 2026 },
      createRNG(45));
    expect(docs.length).toBeGreaterThan(0);
    const dates = docs.map(f => f.date);
    expect([...dates].sort()).toEqual(dates);
    for (const d of docs) {
      expect(d.date).toMatch(/^2026-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/);
      expect(d.religion).toBe('Sikh');
    }
  });

  it('is deterministic', () => {
    const opts = { religionId: 'hindu', religionLabel: 'Hindu', stateId: 'bihar', religiosity: 'somewhat_religious', currentYear: 2026 } as const;
    const a = generateFestivals(opts, createRNG(46));
    expect(generateFestivals(opts, createRNG(46))).toEqual(a);
  });

  it('festivals flow into persona memories and chats', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    expect('festivals' in p).toBe(false);
    const mine = profileFestivals(p);
    expect(mine.length).toBeGreaterThan(0);
    const persona = generateAgentPersona(p);
    expect(persona.memorySeeds.join(' ')).toContain(mine[0].name);
    const outcomes = simulateOutcomes(p, 0.3, createRNG(61));
    const chat = generateNarrative(p, outcomes, 'hinglish_conversation');
    expect(chat.content).toContain(mine[0].name);
  });

  it('festivals on profiles match religion and state', () => {
    const rows = generate({ count: 300, seed: 61 });
    const regionalStates: Record<string, string[]> = {
      Pongal: ['Tamil Nadu'],
      Bihu: ['Assam'],
      Onam: ['Kerala'],
      'Durga Puja': ['West Bengal', 'Assam', 'Odisha', 'Tripura'],
      'Chhath Puja': ['Bihar', 'Uttar Pradesh', 'Jharkhand'],
      Teej: ['Rajasthan', 'Haryana', 'Uttar Pradesh'],
      'Ganesh Chaturthi': ['Maharashtra', 'Goa', 'Karnataka'],
      'Baisakhi Harvest Fair': ['Punjab', 'Haryana'],
      'Hornbill Festival': ['Nagaland'],
    };
    let checked = 0;
    for (const r of rows) {
      const docs = profileFestivals(r);
      for (const d of docs) {
        expect(d.religion).toBe(r.religion);
        expect(d.date).toMatch(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/);
        const allowed = regionalStates[d.name];
        if (allowed) {
          expect(d.regional).toBe(true);
          expect(allowed).toContain(r.state);
        }
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});
