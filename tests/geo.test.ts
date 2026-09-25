import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';
import { generateGeo, stateGeoBounds, stateGeoAnchor } from '../src/utils/geo.js';
import { createRNG } from '../src/core/sampler.js';

const STATES = [
  'andhra_pradesh', 'arunachal_pradesh', 'assam', 'bihar', 'chhattisgarh',
  'goa', 'gujarat', 'haryana', 'himachal_pradesh', 'jammu_kashmir',
  'jharkhand', 'karnataka', 'kerala', 'madhya_pradesh', 'maharashtra',
  'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab',
  'rajasthan', 'sikkim', 'tamil_nadu', 'telangana', 'tripura',
  'uttar_pradesh', 'uttarakhand', 'west_bengal', 'delhi', 'andaman_nicobar',
];

function distKm(a: [number, number], b: [number, number]): number {
  const dLat = (a[0] - b[0]) * 111;
  const dLon = (a[1] - b[1]) * 111 * Math.cos((a[0] * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
}

describe('geospatial points (v2.1.0, item 2)', () => {
  it('anchors sit inside their own bounding boxes', () => {
    for (const s of STATES) {
      const box = stateGeoBounds(s);
      expect(box, s).not.toBeNull();
      const [aLat, aLon] = stateGeoAnchor(s);
      const [minLat, maxLat, minLon, maxLon] = box!;
      expect(aLat).toBeGreaterThanOrEqual(minLat);
      expect(aLat).toBeLessThanOrEqual(maxLat);
      expect(aLon).toBeGreaterThanOrEqual(minLon);
      expect(aLon).toBeLessThanOrEqual(maxLon);
    }
  });

  it('every generated point lands inside its state box', () => {
    const rng = createRNG(3);
    for (const s of STATES) {
      const box = stateGeoBounds(s)!;
      for (let i = 0; i < 40; i++) {
        const p = generateGeo(s, i % 2 === 0 ? 'urban' : 'rural', rng);
        expect(p.latitude, `${s} lat`).toBeGreaterThanOrEqual(box[0]);
        expect(p.latitude, `${s} lat`).toBeLessThanOrEqual(box[1]);
        expect(p.longitude, `${s} lon`).toBeGreaterThanOrEqual(box[2]);
        expect(p.longitude, `${s} lon`).toBeLessThanOrEqual(box[3]);
      }
    }
  });

  it('tiny UTs without boxes stay near their anchor and inside India', () => {
    const rng = createRNG(4);
    for (const s of ['chandigarh', 'puducherry', 'dadra_nagar_haveli', 'daman_diu', 'lakshadweep']) {
      expect(stateGeoBounds(s)).toBeNull();
      const anchor = stateGeoAnchor(s);
      for (let i = 0; i < 40; i++) {
        const p = generateGeo(s, 'rural', rng);
        expect(p.latitude).toBeGreaterThanOrEqual(6);
        expect(p.latitude).toBeLessThanOrEqual(38);
        expect(p.longitude).toBeGreaterThanOrEqual(68);
        expect(p.longitude).toBeLessThanOrEqual(98);
        expect(distKm([p.latitude, p.longitude], anchor)).toBeLessThan(400);
      }
    }
  });

  it('unknown states fall back to central India', () => {
    const p = generateGeo('atlantis', 'urban', createRNG(5));
    expect(p.latitude).toBeGreaterThanOrEqual(6);
    expect(p.latitude).toBeLessThanOrEqual(38);
  });

  it('urban points cluster tighter than rural ones', () => {
    const anchor = stateGeoAnchor('uttar_pradesh');
    const mean = (pts: Array<{ latitude: number; longitude: number }>) =>
      pts.reduce((s, p) => s + distKm([p.latitude, p.longitude], anchor), 0) / pts.length;
    const urbanRng = createRNG(6);
    const ruralRng = createRNG(7);
    const urban = Array.from({ length: 300 }, () => generateGeo('uttar_pradesh', 'urban', urbanRng));
    const rural = Array.from({ length: 300 }, () => generateGeo('uttar_pradesh', 'rural', ruralRng));
    expect(mean(urban)).toBeLessThan(mean(rural));
  });

  it('is deterministic', () => {
    const a = generateGeo('punjab', 'urban', createRNG(8));
    expect(generateGeo('punjab', 'urban', createRNG(8))).toEqual(a);
  });

  it('every profile carries a geo point inside its own state', () => {
    const cases: Array<[string, string]> = [
      ['Punjab', 'punjab'],
      ['Kerala', 'kerala'],
      ['Maharashtra', 'maharashtra'],
      ['Tamil Nadu', 'tamil_nadu'],
      ['Uttar Pradesh', 'uttar_pradesh'],
      ['West Bengal', 'west_bengal'],
      ['Rajasthan', 'rajasthan'],
      ['Gujarat', 'gujarat'],
    ];
    for (const [stateName, sid] of cases) {
      const box = stateGeoBounds(sid)!;
      const rows = generate({ count: 30, seed: 91, constraints: { state: stateName } });
      expect(rows.length).toBeGreaterThan(0);
      for (const r of rows) {
        expect(r.geo).toBeDefined();
        expect(typeof r.geo.latitude).toBe('number');
        expect(typeof r.geo.longitude).toBe('number');
        expect(r.geo.latitude).toBeGreaterThanOrEqual(box[0]);
        expect(r.geo.latitude).toBeLessThanOrEqual(box[1]);
        expect(r.geo.longitude).toBeGreaterThanOrEqual(box[2]);
        expect(r.geo.longitude).toBeLessThanOrEqual(box[3]);
      }
    }
  });
});
