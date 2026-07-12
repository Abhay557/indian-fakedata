import { describe, it, expect } from 'vitest';
import { generate } from '../src/index.js';

describe('Scaled States & UTs Demographic Accuracy', () => {
  // Array of all 36 States and UTs keys in defaultData.ts
  const statesList = [
    'andhra_pradesh', 'arunachal_pradesh', 'assam', 'bihar', 'chhattisgarh',
    'goa', 'gujarat', 'haryana', 'himachal_pradesh', 'jammu_kashmir',
    'jharkhand', 'karnataka', 'kerala', 'madhya_pradesh', 'maharashtra',
    'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha',
    'punjab', 'rajasthan', 'sikkim', 'tamil_nadu', 'telangana',
    'tripura', 'uttar_pradesh', 'uttarakhand', 'west_bengal', 'delhi',
    'chandigarh', 'puducherry', 'andaman_nicobar', 'dadra_nagar_haveli',
    'daman_diu', 'lakshadweep'
  ];

  it('should generate valid profiles for all 36 States and UTs', () => {
    for (const stateId of statesList) {
      const stateLabel = stateId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Custom formatting exceptions for UTs
      let expectedLabel = stateLabel;
      if (stateId === 'jammu_kashmir') expectedLabel = 'Jammu & Kashmir';
      if (stateId === 'andaman_nicobar') expectedLabel = 'Andaman & Nicobar Islands';
      if (stateId === 'dadra_nagar_haveli') expectedLabel = 'Dadra & Nagar Haveli';
      if (stateId === 'daman_diu') expectedLabel = 'Daman & Diu';

      const profiles = generate({
        count: 5,
        seed: 12345,
        constraints: { state: expectedLabel }
      });

      expect(profiles).toHaveLength(5);
      for (const p of profiles) {
        expect(p.state).toBe(expectedLabel);
        expect(p.stateCode).toHaveLength(2);
        expect(p.pinCode).toHaveLength(6);
        expect(p.firstName).toBeTruthy();
        expect(p.lastName).toBeTruthy();
        expect(p.religion).toBeTruthy();
        expect(p.caste).toBeTruthy();
      }
    }
  });

  it('should respect dry-state status (Gujarat and Bihar)', () => {
    // Generate profiles for Gujarat and Bihar (dry states)
    const gujaratProfiles = generate({
      count: 200,
      seed: 42,
      constraints: { state: 'Gujarat' }
    });

    const biharProfiles = generate({
      count: 200,
      seed: 42,
      constraints: { state: 'Bihar' }
    });

    const gjAlcoholCount = gujaratProfiles.filter(p => p.habits.alcoholUse !== 'none').length;
    const brAlcoholCount = biharProfiles.filter(p => p.habits.alcoholUse !== 'none').length;

    // Dry states should have very low alcohol rates (due to regulatory multipliers)
    expect(gjAlcoholCount / 200).toBeLessThan(0.08);
    expect(brAlcoholCount / 200).toBeLessThan(0.08);
  });

  it('should verify specialized regional names and surnames', () => {
    // 1. Jammu & Kashmir - Pandit_jk
    const jkPandits = generate({
      count: 50,
      seed: 99,
      constraints: { state: 'Jammu & Kashmir', religion: 'Hindu' }
    }).filter(p => p.caste === 'Kashmiri Pandit');

    for (const p of jkPandits) {
      const allowedSurnames = ['Bhat', 'Kaul', 'Dhar', 'Raina', 'Bhatt', 'Pandit'];
      expect(allowedSurnames).toContain(p.lastName);
    }

    // 2. Sikkim - Bahun, Chhetri, Rai, Limbu, Tamang
    const sikkimHindus = generate({
      count: 50,
      seed: 101,
      constraints: { state: 'Sikkim', religion: 'Hindu' }
    });

    for (const p of sikkimHindus) {
      if (p.caste === 'Bahun (Brahmin)') {
        expect(['Sharma', 'Bahun', 'Kumar', 'Kumari', 'Devi']).toContain(p.lastName);
      }
      if (p.caste === 'Chhetri') {
        expect(['Chhetri', 'Rajput', 'Kumar', 'Kumari', 'Devi']).toContain(p.lastName);
      }
      if (p.caste === 'Rai') {
        expect(['Rai', 'Kumar', 'Kumari', 'Devi']).toContain(p.lastName);
      }
      if (p.caste === 'Limbu') {
        expect(['Subba', 'Limbu', 'Kumar', 'Kumari', 'Devi']).toContain(p.lastName);
      }
      if (p.caste === 'Tamang') {
        expect(['Tamang', 'Kumar', 'Kumari', 'Devi']).toContain(p.lastName);
      }
    }
  });

  it('should verify correct Pin Code ranges are generated for states', () => {
    const delhiPin = generate({ count: 1, seed: 10, constraints: { state: 'Delhi' } })[0].pinCode;
    expect(Number(delhiPin)).toBeGreaterThanOrEqual(110001);
    expect(Number(delhiPin)).toBeLessThanOrEqual(110097);

    const keralaPin = generate({ count: 1, seed: 20, constraints: { state: 'Kerala' } })[0].pinCode;
    expect(Number(keralaPin)).toBeGreaterThanOrEqual(670001);
    expect(Number(keralaPin)).toBeLessThanOrEqual(695615);

    const sikkimPin = generate({ count: 1, seed: 30, constraints: { state: 'Sikkim' } })[0].pinCode;
    expect(Number(sikkimPin)).toBeGreaterThanOrEqual(737101);
    expect(Number(sikkimPin)).toBeLessThanOrEqual(737139);
  });
});
