import fs from 'fs';
import vm from 'vm';

import { describe, expect, it } from 'vitest';

import { generate } from '../src/index.js';
import { LIB_VERSION } from '../src/version.js';

describe('docs bundle', () => {
  it('matches the current generator output', () => {
    const bundle = fs.readFileSync('docs/assets/lib.js', 'utf-8');
    const context: Record<string, unknown> = { console };
    vm.runInNewContext(bundle, context);

    const lib = context.IndianFakeData as {
      generate: (options: { seed: number }) => Array<Record<string, unknown>>;
    };
    const [bundled] = lib.generate({ seed: 7 });
    const [current] = generate({ seed: 7 });

    expect(bundled).toEqual(current);
  });

  it('uses the current version in the homepage sample', () => {
    const html = fs.readFileSync('docs/index.html', 'utf-8');
    expect(html).toContain(`indian-fakedata@${LIB_VERSION}`);
    expect(html).not.toContain('generatedAt');
  });

  it('keeps the published Python samples current', () => {
    for (const seed of [7, 11, 13]) {
      const sample = JSON.parse(
        fs.readFileSync(`docs/samples/python-${seed}.json`, 'utf-8')
      );
      expect(sample.generator).toBe(`indian-fakedata@${LIB_VERSION}`);
      expect(sample).not.toHaveProperty('generatedAt');
    }
  });
});
