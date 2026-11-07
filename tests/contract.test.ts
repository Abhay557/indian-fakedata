import { execSync } from 'child_process';
import fs from 'fs';

import { describe, expect, it } from 'vitest';

import * as lib from '../src/index.js';

const contract = JSON.parse(
  fs.readFileSync('contract/api.json', 'utf-8')
) as {
  profileKeys: string[];
  cliFlags: string[];
  coreApi: Array<{ typescript: string; python: string }>;
};

describe('shared contract', () => {
  it('generates the agreed profile fields', () => {
    const [profile] = lib.generate({ seed: 7 });
    expect(Object.keys(profile)).toEqual(contract.profileKeys);
  });

  it('exposes the agreed core functions', () => {
    for (const entry of contract.coreApi) {
      expect(typeof (lib as Record<string, unknown>)[entry.typescript]).toBe('function');
    }
  });

  it('documents the agreed CLI flags', () => {
    const help = execSync('npx tsx src/cli.ts --help', { encoding: 'utf-8' });
    const flags = [...new Set(help.match(/--[A-Za-z][A-Za-z0-9-]*/g) ?? [])].sort();
    expect(flags).toEqual(contract.cliFlags);
  });
});
