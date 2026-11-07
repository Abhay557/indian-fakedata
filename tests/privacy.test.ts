import { describe, expect, it } from 'vitest';

import { generate, stripPII, redactPII, validateProfile, PII_FIELDS } from '../src/index.js';

describe('stripPII (v2.0.9)', () => {
  it('empties direct identifiers but keeps shape and provenance', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    const clean = stripPII(p);
    for (const f of PII_FIELDS) {
      expect(clean[f as keyof typeof clean]).toBe('');
    }
    expect(clean.geo).toEqual({ latitude: 0, longitude: 0 });
    expect(clean.nativeScript.addressLine).toBe('');
    expect(p.nativeScript.addressLine.length).toBeGreaterThan(0);
    expect(clean.piiStripped).toBe(true);
    // provenance retained
    expect(clean.synthetic).toBe(true);
    expect(clean.generator).toBe(p.generator);
    // everything else identical
    expect(clean.firstName).toBe(p.firstName);
    expect(clean.district).toBe(p.district);
    expect(clean.employmentTimeline).toEqual(p.employmentTimeline);
    // input never mutated
    expect(p.phoneNumber.length).toBeGreaterThan(0);
    expect(p.piiStripped).toBeUndefined();
  });

  it('maskNames replaces names with initials', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    const clean = stripPII(p, { maskNames: true });
    expect(clean.firstName).toBe(`${p.firstName[0]}.`);
    expect(clean.lastName).not.toContain(p.lastName);
    expect(clean.fatherName).toContain('.');
    expect(clean.nativeScript.firstName).toContain('.');
    expect(clean.nativeScript.firstName).not.toBe(p.nativeScript.firstName);
    expect(clean.nativeScript.lastName).not.toBe(p.nativeScript.lastName);
  });

  it('redacts identifiers from generated text', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    const spacedAadhaar = p.aadhaarNumber.replace(/(.{4})/g, '$1 ').trim();
    const text = [
      `Aadhaar: ${p.aadhaarNumber} (${spacedAadhaar})`,
      `PAN: ${p.panNumber}`,
      `Voter: ${p.voterIdNumber}`,
      `Phone: +91 ${p.phoneNumber}`,
      `Email: ${p.email}`,
      `Account: ${p.bankAccountNumber}`,
      `Address: ${p.addressLine}`,
      `PIN: ${p.pinCode}`,
      p.upiId ? `UPI: ${p.upiId}` : '',
    ].join('\n');

    const clean = redactPII(text, p);
    expect(clean).toContain('[REDACTED]');
    for (const value of [
      p.aadhaarNumber, p.panNumber, p.voterIdNumber, p.phoneNumber,
      p.email, p.bankAccountNumber, p.addressLine, p.pinCode, p.upiId,
    ]) {
      if (value) expect(clean).not.toContain(value);
    }
  });

  it('redacts identifier patterns without a profile', () => {
    const clean = redactPII('Call 9876543210 or mail a@b.com');
    expect(clean).toBe('Call [REDACTED] or mail [REDACTED]');
  });

  it('maskNames applies to generated text too', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    const clean = redactPII(`Hello ${p.firstName} ${p.lastName}`, p, {
      maskNames: true,
    });
    expect(clean).not.toContain(p.firstName);
    expect(clean).not.toContain(p.lastName);
    expect(clean).toContain(`${p.firstName[0]}.`);
  });

  it('stripped copies intentionally fail strict validation', () => {
    const p = generate({ count: 1, seed: 61 })[0];
    expect(validateProfile(p).valid).toBe(true);
    const clean = stripPII(p);
    const result = validateProfile(clean);
    expect(result.valid).toBe(false);
    expect(result.errors.join('|')).toContain('aadhaarNumber');
  });
});
