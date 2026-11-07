import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return fs.readFileSync(path, 'utf-8');
}

function match(text: string, pattern: RegExp, label: string): string {
  const found = pattern.exec(text);
  if (!found) throw new Error(`could not read ${label}`);
  return found[1];
}

describe('version sync', () => {
  it('keeps every version source equal', () => {
    const pkg = JSON.parse(read('package.json')) as { version: string };
    const tsVersion = match(
      read('src/version.ts'), /LIB_VERSION\s*=\s*["']([^"']+)["']/, 'src/version.ts'
    );
    const pyVersion = match(
      read('python/src/indian_fakedata/_version.py'),
      /__version__\s*=\s*["']([^"']+)["']/,
      '_version.py'
    );
    const pyproject = match(
      read('python/pyproject.toml'), /^version\s*=\s*["']([^"']+)["']/m, 'pyproject.toml'
    );

    expect(tsVersion).toBe(pkg.version);
    expect(pyVersion).toBe(pkg.version);
    expect(pyproject).toBe(pkg.version);
  });

  it('keeps the npm and PyPI READMEs identical', () => {
    const root = read('README.md').replace(/\r\n/g, '\n');
    const python = read('python/README.md').replace(/\r\n/g, '\n');

    expect(python).toBe(root);
  });
});
