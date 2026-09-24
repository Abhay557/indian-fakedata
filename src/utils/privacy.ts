/**
 * PII Stripping Helper (v2.0.9)
 *
 * `stripPII` returns a share-safe copy of a profile with direct identifiers
 * emptied: Aadhaar, PAN, voter ID, phone, email, bank account number, UPI ID
 * and the street-level address line. Names are kept by default (personas and
 * narratives join on them) unless `maskNames` is set.
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

  if (options.maskNames) {
    for (const f of NAME_FIELDS) {
      const v = (copy as unknown as Record<string, unknown>)[f];
      if (typeof v === 'string') {
        (copy as unknown as Record<string, unknown>)[f] = toInitials(v);
      }
    }
  }

  copy.piiStripped = true;
  return copy;
}
