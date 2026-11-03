import { describe, it, expect } from 'vitest';
import { createRNG } from '../src/index.js';
import {
  generateBankDetails,
  generateVehicleRegistration,
  generatePinCode,
} from '../src/utils/identifiers.js';

describe('Bank details generation', () => {
  it('returns a bank name, IFSC code and account number', () => {
    const rng = createRNG(51);
    for (let i = 0; i < 200; i++) {
      const bank = generateBankDetails(rng);
      expect(typeof bank.bankName).toBe('string');
      expect(bank.bankName.length).toBeGreaterThan(0);
      expect(bank.bankIFSC.length).toBeGreaterThan(0);
      expect(bank.bankAccountNumber).toMatch(/^\d{11}$/);
    }
  });

  it('uses a known IFSC prefix (4 letters + 0) followed by 6 digits', () => {
    const rng = createRNG(51);
    const prefixes = ['SBIN0', 'BARB0', 'PUNB0', 'HDFC0', 'ICIC0', 'UTIB0', 'KKBK0', 'UBIN0', 'CNRB0', 'IDIB0', 'BKID0', 'CBIN0', 'IOBA0', 'UCBA0'];
    for (let i = 0; i < 200; i++) {
      const bank = generateBankDetails(rng);
      const prefix = bank.bankIFSC.slice(0, 5);
      const branchCode = bank.bankIFSC.slice(5);
      expect(prefixes).toContain(prefix);
      expect(branchCode).toMatch(/^\d{6}$/);
    }
  });

  it('always returns an 11 character IFSC code', () => {
    const rng = createRNG(51);
    for (let i = 0; i < 200; i++) {
      const bank = generateBankDetails(rng);
      expect(bank.bankIFSC).toHaveLength(11);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generateBankDetails(createRNG(3));
    const second = generateBankDetails(createRNG(3));
    expect(first).toEqual(second);
  });
});

describe('Vehicle registration generation', () => {
  it('matches the RTO format: XX 00 AA 0000', () => {
    const rng = createRNG(61);
    for (let i = 0; i < 200; i++) {
      const reg = generateVehicleRegistration('maharashtra', rng);
      expect(reg).toMatch(/^[A-Z]{2} \d{2} [A-Z]{2} \d{4}$/);
    }
  });

  it('uses the correct state RTO code', () => {
    const rng = createRNG(61);
    const rtoCodes = ['MH 01', 'MH 02', 'MH 03', 'MH 04', 'MH 05', 'MH 06', 'MH 12', 'MH 14', 'MH 20', 'MH 31', 'MH 43', 'MH 46', 'MH 47'];
    for (let i = 0; i < 200; i++) {
      const reg = generateVehicleRegistration('maharashtra', rng);
      const rtoCode = reg.split(' ').slice(0, 2).join(' ');
      expect(rtoCodes).toContain(rtoCode);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generateVehicleRegistration('kerala', createRNG(8));
    const second = generateVehicleRegistration('kerala', createRNG(8));
    expect(first).toBe(second);
  });
});

describe('PIN code generation', () => {
  it('always returns 6 digits', () => {
    const rng = createRNG(19);
    for (let i = 0; i < 200; i++) {
      const pin = generatePinCode('rajasthan', rng);
      expect(pin).toMatch(/^\d{6}$/);
    }
  });

  it('stays inside the state PIN range', () => {
    const rng = createRNG(19);
    for (let i = 0; i < 500; i++) {
      const pin = Number(generatePinCode('rajasthan', rng));
      expect(pin).toBeGreaterThanOrEqual(301001);
      expect(pin).toBeLessThanOrEqual(345034);
    }
  });

  it('is deterministic for the same seed', () => {
    const first = generatePinCode('gujarat', createRNG(6));
    const second = generatePinCode('gujarat', createRNG(6));
    expect(first).toBe(second);
  });
});
