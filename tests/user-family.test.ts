/**
 * Tests for the User / Family / Persona API.
 *
 * Covers:
 * - String seed support (stable, reproducible)
 * - generateUser / generateUsers (README sample shape)
 * - generateFamily (relational consistency: surnames, ages, communities)
 * - generatePersona (profile + LLM persona)
 */

import { describe, it, expect } from 'vitest';
import {
  generateUser,
  generateUsers,
  generateFamily,
  generatePersona,
  createRNG
} from '../src/index.js';

describe('String seeds', () => {
  it('hashes a string seed deterministically', () => {
    const rng1 = createRNG('011');
    const rng2 = createRNG('011');
    const rng3 = createRNG('012');
    expect(rng1.seed).toBe(rng2.seed);
    expect(rng1.seed).not.toBe(rng3.seed);
    expect(Array.from({ length: 20 }, () => rng1.next()))
      .toEqual(Array.from({ length: 20 }, () => rng2.next()));
  });

  it('reproduces the same user for the same string seed', () => {
    const a = generateUser({ seed: '011' });
    const b = generateUser({ seed: '011' });
    expect(a.firstName).toBe(b.firstName);
    expect(a.lastName).toBe(b.lastName);
    expect(a.state).toBe(b.state);
    expect(a.aadhaarNumber).toBe(b.aadhaarNumber);
  });

  it('produces a different user for a different string seed', () => {
    const a = generateUser({ seed: '011' });
    const b = generateUser({ seed: '012' });
    expect(a.firstName + a.lastName).not.toBe(b.firstName + b.lastName);
  });
});

describe('generateUser / generateUsers', () => {
  it('returns a single profile matching the README sample shape', () => {
    const user = generateUser({ seed: 7 });
    expect(user).toMatchObject({
      firstName: expect.any(String),
      lastName: expect.any(String),
      state: expect.any(String),
      district: expect.any(String),
      age: expect.any(Number),
      gender: expect.any(String),
      religion: expect.any(String),
      seed: expect.any(Number)
    });
  });

  it('supports the highlyEducated shortcut', () => {
    const user = generateUser({ highlyEducated: true });
    expect(['graduate', 'postgraduate', 'professional_degree', 'technical_diploma'])
      .toContain(user.education);
  });

  it('supports the gender and maritalStatus shortcuts', () => {
    const user = generateUser({ gender: 'female', maritalStatus: 'never_married' });
    expect(user.gender).toBe('female');
    expect(user.maritalStatus).toBe('never_married');
  });

  it('generateUsers returns the requested count', () => {
    const users = generateUsers({ count: 5, seed: '011' });
    expect(users).toHaveLength(5);
    // First user of a single-seed multi-generate stream should still be stable
    const single = generateUser({ seed: '011' });
    expect(users[0].firstName).toBe(single.firstName);
  });

  it('respects pass-through constraints', () => {
    const user = generateUser({ constraints: { state: 'Kerala', religion: 'Hindu' } });
    expect(user.state).toBe('Kerala');
    expect(user.religion).toBe('Hindu');
  });
});

describe('generateFamily', () => {
  it('keeps the same surname across all members', () => {
    const family = generateFamily({ seed: '011' });
    const members = [
      family.head,
      family.spouse,
      ...family.children,
      ...family.siblings,
      family.parents.father
    ].filter(Boolean);
    expect(members.length).toBeGreaterThan(1);
    for (const m of members) {
      expect(m!.lastName).toBe(family.head.lastName);
    }
  });

  it('keeps the same state, religion and caste across all members', () => {
    const family = generateFamily({ seed: '011' });
    const members = [
      family.head,
      family.spouse,
      ...family.children,
      ...family.siblings,
      family.parents.father,
      family.parents.mother
    ].filter(Boolean);
    for (const m of members) {
      expect(m!.state).toBe(family.head.state);
      expect(m!.religion).toBe(family.head.religion);
      expect(m!.caste).toBe(family.head.caste);
    }
  });

  it('generates a spouse only when the head is married/widowed', () => {
    const single = generateFamily({ seed: '999', constraints: { maritalStatus: 'never_married' } });
    expect(single.spouse).toBeUndefined();
    expect(single.children).toHaveLength(0);

    const married = generateFamily({ seed: '011' });
    if (married.head.maritalStatus === 'married' || married.head.maritalStatus === 'widowed') {
      expect(married.spouse).toBeDefined();
    } else {
      expect(married.spouse).toBeUndefined();
    }
  });

  it('keeps children younger than the head', () => {
    const family = generateFamily({ seed: '011' });
    for (const child of family.children) {
      expect(child.age).toBeLessThan(family.head.age);
    }
  });

  it('keeps parents older than the head', () => {
    const family = generateFamily({ seed: '011' });
    if (family.parents.father) expect(family.parents.father.age).toBeGreaterThan(family.head.age);
    if (family.parents.mother) expect(family.parents.mother.age).toBeGreaterThan(family.head.age);
  });

  it('spouse gender is opposite to the head', () => {
    const family = generateFamily({ seed: '011' });
    if (family.spouse) {
      expect(family.spouse.gender).toBe(family.head.gender === 'male' ? 'female' : 'male');
    }
  });

  it('is fully reproducible for the same seed', () => {
    const a = generateFamily({ seed: '011' });
    const b = generateFamily({ seed: '011' });
    expect(a.head.firstName).toBe(b.head.firstName);
    expect(a.spouse?.firstName).toBe(b.spouse?.firstName);
    expect(a.children.map(c => c.firstName)).toEqual(b.children.map(c => c.firstName));
    expect(a.siblings.map(s => s.firstName)).toEqual(b.siblings.map(s => s.firstName));
    expect(a.parents.father?.firstName).toBe(b.parents.father?.firstName);
    expect(a.parents.mother?.firstName).toBe(b.parents.mother?.firstName);
  });

  it('respects head constraints (e.g. state)', () => {
    const family = generateFamily({ seed: '011', constraints: { state: 'Punjab', religion: 'Sikh' } });
    expect(family.head.state).toBe('Punjab');
    expect(family.head.religion).toBe('Sikh');
    const members = [family.spouse, ...family.children, ...family.siblings].filter(Boolean);
    for (const m of members) {
      expect(m!.state).toBe('Punjab');
      expect(m!.religion).toBe('Sikh');
    }
  });
});

describe('generatePersona', () => {
  it('returns a user plus an LLM persona', () => {
    const { user, persona } = generatePersona({ seed: '011' });
    expect(user.firstName).toBeTruthy();
    expect(persona.systemPrompt).toContain(user.firstName);
    expect(persona.identityLine).toBeTruthy();
    expect(persona.beliefs).toBeDefined();
    expect(Array.isArray(persona.memorySeeds)).toBe(true);
    expect(Array.isArray(persona.behaviorRules)).toBe(true);
  });

  it('is reproducible for the same seed', () => {
    const a = generatePersona({ seed: '011' });
    const b = generatePersona({ seed: '011' });
    expect(a.user.firstName).toBe(b.user.firstName);
    expect(a.persona.systemPrompt).toBe(b.persona.systemPrompt);
  });
});