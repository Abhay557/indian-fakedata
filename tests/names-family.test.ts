import { describe, it, expect } from 'vitest';
import { generate, generateFamily } from '../src/index.js';

describe('family name conventions in generated profiles', () => {
  const profiles = generate({ count: 300, seed: 123 });

  it('fatherName always ends with the profile surname', () => {
    for (const p of profiles) {
      const parts = p.fatherName.split(' ');
      expect(parts[parts.length - 1]).toBe(p.lastName);
    }
  });

  it('motherName is two words and keeps her own maiden surname', () => {
    for (const p of profiles) {
      const parts = p.motherName.split(' ');
      expect(parts).toHaveLength(2);
      // The mother keeps her maiden surname (may differ from the profile surname)
      expect(parts[0]).not.toBe(p.firstName);
    }
  });

  it('spouseName ends with the same surname when present', () => {
    let marriedFound = 0;
    for (const p of profiles) {
      if (p.spouseName) {
        marriedFound++;
        const parts = p.spouseName.split(' ');
        expect(parts[parts.length - 1]).toBe(p.lastName);
      }
    }
    // Make sure we actually saw some married profiles
    expect(marriedFound).toBeGreaterThan(50);
  });

  it('father and mother names are always different people', () => {
    for (const p of profiles) {
      expect(p.fatherName).not.toBe(p.motherName);
    }
  });

  it('father and spouse are almost never the same person', () => {
    let collisions = 0;
    let married = 0;
    for (const p of profiles) {
      if (p.spouseName) {
        married++;
        if (p.fatherName === p.spouseName) collisions++;
      }
    }
    // A rare collision is possible by chance (names repeat), but it
    // should stay well below 5% of all married profiles.
    expect(collisions / married).toBeLessThan(0.05);
  });

  it('every family member except the mother shares the head surname', () => {
    const family = generateFamily({ seed: 2024 });
    // The mother keeps her maiden surname by design, so only the father,
    // spouse, children and siblings are required to share the surname.
    const sharingMembers = [
      family.head,
      family.spouse,
      family.parents.father,
      ...family.children,
      ...family.siblings,
    ].filter((m) => m !== undefined && m !== null);

    for (const member of sharingMembers) {
      expect(member.lastName).toBe(family.head.lastName);
    }
  });

  it('children are younger than their parents', () => {
    const family = generateFamily({ seed: 2024 });
    for (const child of family.children ?? []) {
      expect(child.age).toBeLessThan(family.head.age);
      if (family.spouse) {
        expect(child.age).toBeLessThan(family.spouse.age);
      }
    }
  });
});
