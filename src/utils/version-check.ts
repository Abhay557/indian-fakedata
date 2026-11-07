import { LIB_VERSION } from '../version.js';

export const NPM_REGISTRY_URL =
  'https://registry.npmjs.org/@abhay557/indian-fakedata/latest';

export interface FetchLike {
  (
    url: string,
    init?: { headers?: Record<string, string> }
  ): Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
}

export interface VersionCheckResult {
  current: string;
  latest: string | null;
  updateAvailable: boolean;
  error?: string;
}

function versionParts(version: string): number[] {
  return version
    .replace(/^v/, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
}

/** Compare dotted versions. Returns 1, 0 or -1. */
export function compareVersions(left: string, right: string): number {
  const a = versionParts(left);
  const b = versionParts(right);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/** Ask the npm registry whether a newer release exists. Never throws. */
export async function checkLatestVersion(
  fetchImpl: FetchLike = globalThis.fetch as unknown as FetchLike,
  registryUrl: string = NPM_REGISTRY_URL
): Promise<VersionCheckResult> {
  try {
    const response = await fetchImpl(registryUrl, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`registry returned HTTP ${response.status}`);
    const data = (await response.json()) as { version?: unknown };
    if (typeof data.version !== 'string') {
      throw new Error('registry response is missing a version');
    }
    return {
      current: LIB_VERSION,
      latest: data.version,
      updateAvailable: compareVersions(data.version, LIB_VERSION) > 0,
    };
  } catch (err) {
    return {
      current: LIB_VERSION,
      latest: null,
      updateAvailable: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
