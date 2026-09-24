/**
 * CLI Streaming Utilities
 * 
 * Helper functions for flattening nested profile JSON structures and
 * escaping CSV cells in accordance with RFC 4180.
 */

/**
 * Recursively flattens an object into a single-level key-value map.
 * E.g., { personality: { openness: 80 } } -> { personality_openness: 80 }
 * Arrays are formatted as semicolon-separated lists.
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (Array.isArray(value)) {
      result[fullKey] = value.some(v => v && typeof v === 'object')
        ? value.map(v => JSON.stringify(v)).join('; ')
        : value.join('; ');
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/**
 * Escapes special characters for a CSV cell in accordance with RFC 4180.
 * If the value contains commas, double quotes, or newlines, it wraps the value
 * in double quotes and doubles any internal double quotes.
 */
export function escapeCSVValue(val: any): string {  if (val === null || val === undefined) {
    return '';
  }

  let str: string;
  if (typeof val === 'object') {
    str = JSON.stringify(val);
  } else {
    str = String(val);
  }

  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─────────────────────────────────────────────────────────────
// Field selection + run stats (v2.0.9, powers --fields / --stats)
// ─────────────────────────────────────────────────────────────

/**
 * Read a dot-separated path (e.g. "appearance.skinTone") from a record.
 * Returns undefined when any segment is missing.
 */
export function getPathValue(obj: any, path: string): any {
  return path.split('.').reduce(
    (cur, part) => (cur && typeof cur === 'object' ? cur[part] : undefined),
    obj
  );
}

/**
 * Project a record down to the requested fields (dot paths supported).
 * Missing paths are omitted. Preserves the requested order.
 */
export function pickRecordFields(record: any, fields: string[]): any {
  const out: Record<string, any> = {};
  for (const f of fields) {
    const v = getPathValue(record, f);
    if (v !== undefined) out[f] = v;
  }
  return out;
}

/** Categorical fields summarised by --stats */
export const STATS_FIELDS = ['religion', 'state', 'gender', 'areaType', 'education', 'occupation'];

export interface StatsCounters {
  total: number;
  byField: Record<string, Record<string, number>>;
}

export function createStatsCounters(): StatsCounters {
  return { total: 0, byField: {} };
}

/**
 * Count one record (plain or enriched — enriched counts its .profile).
 * Safe to call while streaming; only small counters are kept in memory.
 */
export function updateStatsCounters(counters: StatsCounters, record: any): void {
  const base = record?.profile ?? record;
  if (!base || typeof base !== 'object') return;
  counters.total++;
  for (const f of STATS_FIELDS) {
    const v = base[f];
    if (v === undefined || v === null) continue;
    const key = String(v);
    counters.byField[f] = counters.byField[f] ?? {};
    counters.byField[f][key] = (counters.byField[f][key] ?? 0) + 1;
  }
}

/** Render counters as human-readable stderr lines (top 5 per field). */
export function formatStatsCounters(counters: StatsCounters): string[] {
  const lines = [`[Stats] ${counters.total} profile${counters.total === 1 ? '' : 's'}`];
  for (const f of STATS_FIELDS) {
    const dist = counters.byField[f];
    if (!dist) continue;
    const top = Object.entries(dist)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, n]) => `${k} ${n} (${((n / counters.total) * 100).toFixed(1)}%)`)
      .join(', ');
    lines.push(`  ${f}: ${top}`);
  }
  return lines;
}
