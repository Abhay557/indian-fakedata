import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getDefaultDatabase, loadDatabase } from '../src/index.js';

const dataDir = path.resolve('tests/temp-output/custom-data');
const base = getDefaultDatabase();

beforeAll(() => {
  fs.mkdirSync(dataDir, { recursive: true });
});

afterAll(() => {
  fs.rmSync(dataDir, { recursive: true, force: true });
});

describe('loadDatabase with a custom data directory', () => {
  it('returns the default database when the directory does not exist', () => {
    const db = loadDatabase(path.join(dataDir, 'missing-dir'));
    expect(db).toEqual(base);
  });

  it('returns the default database when no directory is given', () => {
    expect(loadDatabase()).toEqual(base);
  });

  it('loads a custom religions file and merges it with defaults', () => {
    fs.writeFileSync(
      path.join(dataDir, 'religions.json'),
      JSON.stringify({
        hindu: { ...base.religions.hindu, nationalProportion: 0.5 },
      }),
    );

    const db = loadDatabase(dataDir);
    expect(db.religions.hindu.nationalProportion).toBe(0.5);
    // Other religions still come from the defaults
    expect(db.religions.muslim).toBeDefined();
  });

  it('skips custom files that do not exist', () => {
    const db = loadDatabase(dataDir);
    expect(db.states).toEqual(base.states);
    expect(db.districts).toEqual(base.districts);
  });

  it('survives a corrupted JSON file without crashing', () => {
    fs.writeFileSync(path.join(dataDir, 'states.json'), 'this is not json');

    let db;
    expect(() => {
      db = loadDatabase(dataDir);
    }).not.toThrow();

    // The corrupted file is skipped, so defaults remain
    expect(db.states).toEqual(base.states);
  });

  it('picks a custom state file when it is valid', () => {
    const customState = {
      stateCode: 'XX',
      stateName: 'Fake State',
      totalPopulation: 1,
      urbanPopulation: 1,
      ruralPopulation: 0,
      sexRatio: 950,
      literacyRate: 60,
      religionDistribution: { hindu: 1 },
      scProportion: 0,
      stProportion: 0,
      educationDistribution: {},
      occupationDistribution: {},
      languageDistribution: { Hindi: 1 },
      assetDistribution: {},
    };
    fs.writeFileSync(path.join(dataDir, 'states.json'), JSON.stringify({ fake_state: customState }));

    const db = loadDatabase(dataDir);
    expect(db.states.fake_state).toBeDefined();
    expect(db.states.fake_state.stateName).toBe('Fake State');
  });
});
