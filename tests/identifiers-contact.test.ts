import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/index.js';
import {
  generateVoterID,
  generatePhoneNumber,
  formatPhoneNumber,
  generateEmail,
  generateUPI,
} from '../src/utils/identifiers.js';

describe('Voter ID generation', () => {
  it('always returns 3 letters followed by 7 digits', () => {
    const rng = createRNG(21);
    for (let i = 0; i < 300; i++) {
      const voterId = generateVoterID('maharashtra', rng);
      expect(voterId).toMatch(/^[A-Z]{3}\d{7}$/);
    }
  });

  it('falls back to a generic prefix for unknown states', () => {
    const rng = createRNG(4);
    const voterId = generateVoterID('unknown_state', rng);
    expect(voterId.startsWith('IND')).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    const first = generateVoterID('bihar', createRNG(66));
    const second = generateVoterID('bihar', createRNG(66));
    expect(first).toBe(second);
  });
});

describe('Phone number generation', () => {
  it('always returns exactly 10 digits', () => {
    const rng = createRNG(13);
    for (let i = 0; i < 300; i++) {
      const phone = generatePhoneNumber('karnataka', rng);
      expect(phone).toMatch(/^\d{10}$/);
    }
  });

  it('starts with a valid mobile digit (6-9)', () => {
    const rng = createRNG(13);
    for (let i = 0; i < 300; i++) {
      const phone = generatePhoneNumber('karnataka', rng);
      const firstDigit = Number(phone[0]);
      expect(firstDigit).toBeGreaterThanOrEqual(6);
      expect(firstDigit).toBeLessThanOrEqual(9);
    }
  });

  it('uses a state-specific prefix when one exists', () => {
    const rng = createRNG(13);
    const prefixes = ['900', '901', '940', '944', '984', '903'];
    let usedPrefix = '';
    for (let i = 0; i < 200; i++) {
      const phone = generatePhoneNumber('andhra_pradesh', rng);
      usedPrefix = phone.slice(0, 3);
      expect(prefixes).toContain(usedPrefix);
    }
  });

  it('formats as +91 XXXXX XXXXX', () => {
    const rng = createRNG(2);
    const phone = generatePhoneNumber('delhi', rng);
    const expected = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
    expect(formatPhoneNumber(phone)).toBe(expected);
  });

  it('is deterministic for the same seed', () => {
    const first = generatePhoneNumber('tamil_nadu', createRNG(9));
    const second = generatePhoneNumber('tamil_nadu', createRNG(9));
    expect(first).toBe(second);
  });
});

describe('Email generation', () => {
  it('always contains exactly one @ and a known domain', () => {
    const rng = createRNG(31);
    const domains = [
      'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
      'rediffmail.com', 'ymail.com', 'protonmail.com', 'icloud.com',
    ];
    for (let i = 0; i < 300; i++) {
      const email = generateEmail('Rahul', 'Mehta', rng);
      expect(email.split('@')).toHaveLength(2);
      const domain = email.split('@')[1];
      expect(domains).toContain(domain);
    }
  });

  it('is always lowercase', () => {
    const rng = createRNG(31);
    for (let i = 0; i < 100; i++) {
      const email = generateEmail('Rahul', 'Mehta', rng);
      expect(email).toBe(email.toLowerCase());
    }
  });

  it('contains parts of the first and last name', () => {
    const rng = createRNG(31);
    for (let i = 0; i < 100; i++) {
      const email = generateEmail('Rahul', 'Mehta', rng);
      const localPart = email.split('@')[0];
      expect(localPart).toMatch(/rahul|mehta/);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generateEmail('Neha', 'Gupta', createRNG(44));
    const second = generateEmail('Neha', 'Gupta', createRNG(44));
    expect(first).toBe(second);
  });
});

describe('UPI ID generation', () => {
  it('always ends with a known UPI suffix', () => {
    const rng = createRNG(17);
    const suffixes = ['@ybl', '@paytm', '@oksbi', '@okicici', '@okaxis', '@upi', '@apl', '@ibl'];
    for (let i = 0; i < 200; i++) {
      const upi = generateUPI('9876543210', 'amit', rng);
      const suffix = upi.slice(upi.lastIndexOf('@'));
      expect(suffixes).toContain(suffix);
    }
  });

  it('contains either the phone number or the first name', () => {
    const rng = createRNG(17);
    for (let i = 0; i < 200; i++) {
      const upi = generateUPI('9876543210', 'amit', rng);
      const localPart = upi.split('@')[0];
      expect(localPart === '9876543210' || localPart === 'amit').toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generateUPI('9876543210', 'amit', createRNG(25));
    const second = generateUPI('9876543210', 'amit', createRNG(25));
    expect(first).toBe(second);
  });
});
