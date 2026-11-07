import { describe, it, expect } from 'vitest';

import { LIB_VERSION } from '../src/version.js';
import {
  checkLatestVersion,
  compareVersions,
  type FetchLike,
} from '../src/utils/version-check.js';

describe('version check', () => {
  it('compares dotted versions', () => {
    expect(compareVersions('2.1.1', '2.1.1')).toBe(0);
    expect(compareVersions('2.2.0', '2.1.1')).toBe(1);
    expect(compareVersions('2.1.0', '2.1.1')).toBe(-1);
    expect(compareVersions('2.1', '2.1.0')).toBe(0);
  });

  it('reports an available update', async () => {
    const fetcher: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ version: '999.0.0' }),
    });
    const result = await checkLatestVersion(fetcher);
    expect(result.current).toBe(LIB_VERSION);
    expect(result.latest).toBe('999.0.0');
    expect(result.updateAvailable).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('reports the current version as latest', async () => {
    const fetcher: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ version: LIB_VERSION }),
    });
    const result = await checkLatestVersion(fetcher);
    expect(result.updateAvailable).toBe(false);
  });

  it('returns an error instead of throwing', async () => {
    const fetcher: FetchLike = async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
    });
    const result = await checkLatestVersion(fetcher);
    expect(result.error).toContain('503');
    expect(result.latest).toBeNull();
    expect(result.updateAvailable).toBe(false);
  });
});
