import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

import { LIB_VERSION } from '../src/version.js';

describe('changelog (v2.0.9)', () => {
  it('CHANGELOG.md mentions the current version', () => {
    const text = fs.readFileSync(path.resolve('CHANGELOG.md'), 'utf-8');
    expect(text).toContain(`## ${LIB_VERSION}`);
  });
});
