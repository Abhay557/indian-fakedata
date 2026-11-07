/**
 * PII Stripping Helper (v2.0.9)
 *
 * `stripPII` returns a share-safe copy of a profile with direct identifiers
 * emptied: Aadhaar, PAN, voter ID, phone, email, bank account number, UPI ID,
 * PIN code, geo coordinates and both the Roman and native-script street
 * address lines. Names are kept by default (personas and narratives join on
 * them) unless `maskNames` is set.
 *
 * Emptied fields stay present as "" so CSV/JSON shapes and column order are
 * unchanged downstream. A `piiStripped: true` marker records that the copy
 * was sanitised. The synthetic/generator provenance markers are retained.
 *
 * Note: stripped copies intentionally fail strict `validateProfile` (the
 * identifiers it requires are gone) — validate BEFORE stripping.
 *
 * Pure function: no RNG, no I/O, input is never mutated.
 */

import type { DemographicProfile } from '../types.js';
import type { FamilyUnit } from './relations.js';

export interface StripPIIOptions {
  /** Replace names with initials (default false — names are kept for joins) */
  maskNames?: boolean;
}

/** Direct-identifier fields emptied by stripPII */
export const PII_FIELDS = [
  'aadhaarNumber',
  'panNumber',
  'voterIdNumber',
  'phoneNumber',
  'email',
  'bankAccountNumber',
  'upiId',
  'addressLine',
  'pinCode',
] as const;

const NAME_FIELDS = [
  'firstName',
  'lastName',
  'fatherName',
  'motherName',
  'spouseName',
] as const;

function toInitials(name: string | undefined): string | undefined {
  if (name === undefined) return undefined;
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => `${w[0]}.`)
    .join(' ');
}

const REDACTED = '[REDACTED]';

const PII_TEXT_PATTERNS: RegExp[] = [
  /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  /\b[A-Z]{5}\d{4}[A-Z]\b/g,
  /\b[A-Z]{3}\d{7}\b/g,
  /(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}\b/g,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\b/g,
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceToken(text: string, value: string, replacement: string): string {
  if (!value) return text;
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(value)}(?![\\p{L}\\p{N}])`,
    'gu'
  );
  return text.replace(pattern, replacement);
}

function profileTextPII(
  profile: DemographicProfile,
  maskNames: boolean
): Array<{ value: string; replacement: string }> {
  const items: Array<{ value: string; replacement: string }> = [];
  for (const f of PII_FIELDS) {
    const value = (profile as unknown as Record<string, unknown>)[f];
    if (typeof value === 'string' && value) {
      items.push({ value, replacement: REDACTED });
    }
  }
  if (profile.nativeScript?.addressLine) {
    items.push({ value: profile.nativeScript.addressLine, replacement: REDACTED });
  }
  if (maskNames) {
    const names = [
      ...NAME_FIELDS.map(f => (profile as unknown as Record<string, unknown>)[f]),
      profile.nativeScript?.firstName,
      profile.nativeScript?.lastName,
    ];
    for (const name of names) {
      if (typeof name === 'string' && name) {
        items.push({ value: name, replacement: toInitials(name) ?? REDACTED });
      }
    }
  }
  return items.sort((a, b) => b.value.length - a.value.length);
}

/**
 * Redact direct identifiers from generated text (narratives, personas, etc.).
 * Pass the profile the text was generated from so exact values such as the
 * address and bank account can be removed; common patterns are always caught.
 */
export function redactPII(
  text: string,
  profile?: DemographicProfile,
  options: StripPIIOptions = {}
): string {
  let out = text;
  if (profile) {
    for (const item of profileTextPII(profile, options.maskNames ?? false)) {
      out = replaceToken(out, item.value, item.replacement);
    }
  }
  for (const pattern of PII_TEXT_PATTERNS) {
    out = out.replace(pattern, REDACTED);
  }
  return out;
}

/**
 * Return a sanitised copy of the profile safe for sharing/demos.
 * The input object is never modified.
 */
export function stripPII(
  profile: DemographicProfile,
  options: StripPIIOptions = {}
): DemographicProfile {
  const copy: DemographicProfile = { ...profile };

  for (const f of PII_FIELDS) {
    (copy as unknown as Record<string, unknown>)[f] = '';
  }

  copy.geo = { latitude: 0, longitude: 0 };
  copy.nativeScript = { ...copy.nativeScript, addressLine: '' };

  if (options.maskNames) {
    for (const f of NAME_FIELDS) {
      const v = (copy as unknown as Record<string, unknown>)[f];
      if (typeof v === 'string') {
        (copy as unknown as Record<string, unknown>)[f] = toInitials(v);
      }
    }
    copy.nativeScript = {
      ...copy.nativeScript,
      firstName: toInitials(copy.nativeScript.firstName) ?? '',
      lastName: toInitials(copy.nativeScript.lastName) ?? '',
    };
  }

  copy.piiStripped = true;
  return copy;
}

/** Return a sanitised copy of every member in a family unit. */
export function stripFamilyPII(
  family: FamilyUnit,
  options: StripPIIOptions = {}
): FamilyUnit {
  const clean = (profile?: DemographicProfile) =>
    profile ? stripPII(profile, options) : undefined;

  return {
    head: clean(family.head)!,
    spouse: clean(family.spouse),
    parents: {
      father: clean(family.parents.father),
      mother: clean(family.parents.mother),
    },
    children: family.children.map(child => clean(child)!),
    siblings: family.siblings.map(sibling => clean(sibling)!),
  };
}
