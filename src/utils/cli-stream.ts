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
export function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) {
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
