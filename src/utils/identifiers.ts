/**
 * Identity Document & Contact Generator
 * 
 * Generates realistic Indian identity documents, phone numbers,
 * email addresses, and financial identifiers. All formats follow
 * real-world structural patterns (Aadhaar uses a valid Verhoeff checksum;
 * others mimic official layouts).
 */

import type { SeededRNG, BloodGroup, Gender } from '../types.js';
import { weightedSample, bernoulliSample, gaussianSample, uniformSample } from '../core/sampler.js';

// ─────────────────────────────────────────────────────────────
// Aadhaar Number (12-digit with Verhoeff checksum)
// ─────────────────────────────────────────────────────────────

// Verhoeff tables for checksum validation
const verhoeffD: number[][] = [
  [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],
  [3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],
  [6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],
  [9,8,7,6,5,4,3,2,1,0]
];
const verhoeffP: number[][] = [
  [0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],
  [8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],
  [2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]
];
const verhoeffInv = [0,4,3,2,1,5,6,7,8,9];

function verhoeffChecksum(num: string): number {
  let c = 0;
  const digits = num.split('').reverse().map(Number);
  for (let i = 0; i < digits.length; i++) {
    c = verhoeffD[c][verhoeffP[(i + 1) % 8][digits[i]]];
  }
  return verhoeffInv[c];
}

/**
 * Generate a valid 12-digit Aadhaar number with Verhoeff checksum.
 * First digit is 2-9 (never 0 or 1).
 */
export function generateAadhaar(rng: SeededRNG): string {
  // Generate first 11 digits (first digit: 2-9)
  let digits = String(Math.floor(rng.next() * 8) + 2); // 2-9
  for (let i = 1; i < 11; i++) {
    digits += String(Math.floor(rng.next() * 10));
  }
  // Compute Verhoeff checksum for 12th digit
  const check = verhoeffChecksum(digits);
  return digits + check;
}

/**
 * Format Aadhaar with spaces: XXXX XXXX XXXX
 */
export function formatAadhaar(aadhaar: string): string {
  return `${aadhaar.slice(0, 4)} ${aadhaar.slice(4, 8)} ${aadhaar.slice(8, 12)}`;
}

// ─────────────────────────────────────────────────────────────
// PAN Number (ABCDE1234F format)
// ─────────────────────────────────────────────────────────────

/**
 * Generate a PAN number with the correct layout: AAAAA9999A.
 * - Chars 1-3: Random letters
 * - Char 4: Entity type (P = person)
 * - Char 5: First letter of the last name
 * - Chars 6-9: Random sequence number
 * - Char 10: Alphabetic character (chosen deterministically from the first
 *   9 characters so the number is self-consistent, but this is NOT the
 *   official Income Tax check-digit algorithm, which is not published)
 */
export function generatePAN(lastName: string, rng: SeededRNG): string {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const c1 = alpha[Math.floor(rng.next() * 26)];
  const c2 = alpha[Math.floor(rng.next() * 26)];
  const c3 = alpha[Math.floor(rng.next() * 26)];
  const entityType = 'P'; // Person
  const lastNameChar = (lastName.charAt(0) || 'A').toUpperCase();
  const num = String(Math.floor(rng.next() * 9999) + 1).padStart(4, '0');

  // Self-consistent (but unofficial) check character derived from the first 9 chars.
  const seed = `${c1}${c2}${c3}${entityType}${lastNameChar}${num}`;
  let sum = 0;
  for (let i = 0; i < seed.length; i++) {
    sum = (sum * 31 + seed.charCodeAt(i)) % 9973;
  }
  const checkChar = alpha[sum % 26];

  return `${c1}${c2}${c3}${entityType}${lastNameChar}${num}${checkChar}`;
}

// ─────────────────────────────────────────────────────────────
// Voter ID (EPIC Number)
// ─────────────────────────────────────────────────────────────

/**
 * Generate a Voter ID (EPIC-style) number.
 * Format: ABC1234567 (3 letters + 7 digits).
 * The 3-letter prefix is an informal per-state tag — not an official
 * Election Commission code, so generated numbers won't pass official checks.
 */
const stateVoterPrefixes: Record<string, string[]> = {
  andhra_pradesh: ['YAT', 'YSR', 'YAP'], arunachal_pradesh: ['SLA', 'SLI'],
  assam: ['BTX', 'JCH', 'KMJ'], bihar: ['BJI', 'BHP', 'BGP'],
  chhattisgarh: ['CGH', 'RGH'], delhi: ['DLI', 'NDL', 'SWD'],
  goa: ['GOA', 'NGO'], gujarat: ['GJN', 'GDN', 'SRT'],
  haryana: ['HRY', 'FBD', 'GGN'], himachal_pradesh: ['HMP', 'SML'],
  jammu_kashmir: ['JKD', 'JKS'], jharkhand: ['JHK', 'RNC'],
  karnataka: ['KRN', 'BLR', 'MYS'], kerala: ['KRL', 'TVM', 'KCH'],
  madhya_pradesh: ['MPH', 'BPL', 'IND'], maharashtra: ['MHR', 'MUM', 'PUN'],
  manipur: ['MNP'], meghalaya: ['MLY'], mizoram: ['MZR'],
  nagaland: ['NGL'], odisha: ['ODI', 'BBS'], punjab: ['PJB', 'LDH'],
  rajasthan: ['RJN', 'JPR', 'JDH'], sikkim: ['SKM'],
  tamil_nadu: ['TNJ', 'CHE', 'MDU'], telangana: ['TLG', 'HYD'],
  tripura: ['TRP'], uttar_pradesh: ['UPR', 'LKO', 'AGR'],
  uttarakhand: ['UTK', 'DDN'], west_bengal: ['WBN', 'KOL'],
  chandigarh: ['CHD'], puducherry: ['PDY'],
  andaman_nicobar: ['ANI'], dadra_nagar_haveli: ['DNH'],
  daman_diu: ['DMD'], lakshadweep: ['LKS']
};

export function generateVoterID(stateId: string, rng: SeededRNG): string {
  const prefixes = stateVoterPrefixes[stateId] ?? ['IND'];
  const prefix = uniformSample(prefixes, rng);
  let digits = '';
  for (let i = 0; i < 7; i++) {
    digits += String(Math.floor(rng.next() * 10));
  }
  return `${prefix}${digits}`;
}

// ─────────────────────────────────────────────────────────────
// Phone Number (10-digit with state-based operator prefix)
// ─────────────────────────────────────────────────────────────

// Mobile number prefixes by telecom circle (state).
// Only valid mobile series (first digit 6–9) are used; landline STD codes
// (e.g. 033, 194, 172) are excluded because they can never start a mobile number.
const stateMobilePrefixes: Record<string, string[]> = {
  andhra_pradesh: ['900', '901', '940', '944', '984', '903'],
  assam: ['700', '701', '860', '913'],
  bihar: ['702', '703', '862', '931', '959'],
  chhattisgarh: ['704', '770', '827'],
  delhi: ['880', '881', '882', '991', '995', '999', '706', '707'],
  goa: ['708', '832'],
  gujarat: ['709', '799', '942', '982', '630'],
  haryana: ['896', '897', '812', '813'],
  himachal_pradesh: ['941', '816', '817'],
  jammu_kashmir: ['622', '797'],
  jharkhand: ['771', '862', '863'],
  karnataka: ['720', '721', '944', '984', '630'],
  kerala: ['730', '731', '944', '984', '949'],
  madhya_pradesh: ['740', '741', '770', '827'],
  maharashtra: ['750', '751', '820', '821', '902', '903'],
  manipur: ['870'],
  meghalaya: ['871'],
  mizoram: ['872'],
  nagaland: ['873'],
  odisha: ['760', '761', '943'],
  punjab: ['780', '781', '988', '628'],
  rajasthan: ['790', '791', '941', '982'],
  sikkim: ['759'],
  tamil_nadu: ['800', '801', '944', '984', '630'],
  telangana: ['900', '910', '990', '630'],
  tripura: ['874'],
  uttar_pradesh: ['810', '811', '839', '905', '906', '941'],
  uttarakhand: ['830', '831'],
  west_bengal: ['840', '841', '903'],
  chandigarh: ['781'],
  puducherry: ['944'],
  andaman_nicobar: ['914'],
  dadra_nagar_haveli: ['912'],
  daman_diu: ['912'],
  lakshadweep: ['912']
};

export function generatePhoneNumber(stateId: string, rng: SeededRNG): string {
  const prefixes = stateMobilePrefixes[stateId] ?? ['900', '800', '700'];
  const prefix = uniformSample(prefixes, rng);
  let remaining = '';
  for (let i = 0; i < 10 - prefix.length; i++) {
    remaining += String(Math.floor(rng.next() * 10));
  }
  return prefix + remaining;
}

/**
 * Format phone number: +91 XXXXX XXXXX
 */
export function formatPhoneNumber(phone: string): string {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

// ─────────────────────────────────────────────────────────────
// Email Address
// ─────────────────────────────────────────────────────────────

const emailDomains = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
  'rediffmail.com', 'ymail.com', 'protonmail.com', 'icloud.com'
];

const emailDomainWeights = [
  { domain: 'gmail.com', weight: 50 },
  { domain: 'yahoo.com', weight: 15 },
  { domain: 'outlook.com', weight: 10 },
  { domain: 'hotmail.com', weight: 8 },
  { domain: 'rediffmail.com', weight: 8 },
  { domain: 'ymail.com', weight: 3 },
  { domain: 'protonmail.com', weight: 3 },
  { domain: 'icloud.com', weight: 3 }
];

export function generateEmail(firstName: string, lastName: string, rng: SeededRNG): string {
  const { item: domainObj } = weightedSample(emailDomainWeights, rng);
  const domain = domainObj.domain;
  
  const style = Math.floor(rng.next() * 5);
  const fn = firstName.toLowerCase().replace(/[^a-z]/g, '');
  const ln = lastName.toLowerCase().replace(/[^a-z]/g, '');
  const num = Math.floor(rng.next() * 999) + 1;
  
  switch (style) {
    case 0: return `${fn}.${ln}@${domain}`;
    case 1: return `${fn}${ln}${num}@${domain}`;
    case 2: return `${fn}_${ln}@${domain}`;
    case 3: return `${fn}${num}@${domain}`;
    default: return `${fn}.${ln}${num}@${domain}`;
  }
}

// ─────────────────────────────────────────────────────────────
// Date of Birth
// ─────────────────────────────────────────────────────────────

/**
 * Generate a date of birth from age.
 * Produces a realistic date within the year implied by the age.
 */
export function generateDOB(age: number, rng: SeededRNG): string {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  const month = Math.floor(rng.next() * 12) + 1;
  const maxDay = new Date(birthYear, month, 0).getDate();
  const day = Math.floor(rng.next() * maxDay) + 1;
  return `${birthYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Blood Group
// ─────────────────────────────────────────────────────────────

/**
 * Indian blood group distribution (approximate):
 * B+: 32.26%, O+: 30.13%, A+: 22.88%, AB+: 7.74%,
 * B-: 2.52%, O-: 2.49%, A-: 1.36%, AB-: 0.62%
 */
export function generateBloodGroup(rng: SeededRNG): BloodGroup {
  const groups: Array<{ group: BloodGroup; weight: number }> = [
    { group: 'B+', weight: 32.26 },
    { group: 'O+', weight: 30.13 },
    { group: 'A+', weight: 22.88 },
    { group: 'AB+', weight: 7.74 },
    { group: 'B-', weight: 2.52 },
    { group: 'O-', weight: 2.49 },
    { group: 'A-', weight: 1.36 },
    { group: 'AB-', weight: 0.62 }
  ];
  const { item } = weightedSample(groups, rng);
  return item.group;
}

// ─────────────────────────────────────────────────────────────
// Biometrics (Height, Weight, BMI)
// ─────────────────────────────────────────────────────────────

/**
 * Generate height in cm based on gender, age, and state.
 * Indian average: Male ~165cm, Female ~152cm (NFHS-5 2019-21)
 */
export function generateHeight(gender: Gender, age: number, rng: SeededRNG): number {
  let mean: number;
  let stddev: number;
  
  if (age < 5) {
    mean = gender === 'female' ? 85 : 87;
    stddev = 8;
  } else if (age < 12) {
    mean = gender === 'female' ? 120 + (age - 5) * 5 : 122 + (age - 5) * 5;
    stddev = 6;
  } else if (age < 18) {
    mean = gender === 'female' ? 150 + (age - 12) * 1.5 : 148 + (age - 12) * 3;
    stddev = 5;
  } else {
    mean = gender === 'female' ? 152 : 165;
    stddev = gender === 'female' ? 5.5 : 6.5;
    // Elderly shrink slightly
    if (age > 60) {
      mean -= (age - 60) * 0.3;
    }
  }
  
  return Math.round(gaussianSample(mean, stddev, rng) * 10) / 10;
}

/**
 * Generate weight in kg correlated with height, gender, age, and area.
 * Uses BMI-based approach.
 */
export function generateWeight(
  gender: Gender,
  age: number,
  heightCm: number,
  areaType: 'urban' | 'rural',
  rng: SeededRNG
): number {
  // Target BMI distribution (Indian average: ~22-23)
  let bmiMean = areaType === 'urban' ? 23.5 : 21.5;
  const bmiStddev = 3.5;
  
  // Children have lower BMI
  if (age < 18) {
    bmiMean = 16 + age * 0.3;
  }
  // Elderly have slightly lower BMI
  if (age > 65) {
    bmiMean -= 1;
  }
  
  const bmi = Math.max(14, Math.min(40, gaussianSample(bmiMean, bmiStddev, rng)));
  const heightM = heightCm / 100;
  const weight = bmi * heightM * heightM;
  
  return Math.round(weight * 10) / 10;
}

// ─────────────────────────────────────────────────────────────
// Bank Details
// ─────────────────────────────────────────────────────────────

const banks: Array<{ name: string; ifscPrefix: string; weight: number }> = [
  { name: 'State Bank of India', ifscPrefix: 'SBIN0', weight: 25 },
  { name: 'Bank of Baroda', ifscPrefix: 'BARB0', weight: 8 },
  { name: 'Punjab National Bank', ifscPrefix: 'PUNB0', weight: 8 },
  { name: 'HDFC Bank', ifscPrefix: 'HDFC0', weight: 12 },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC0', weight: 10 },
  { name: 'Axis Bank', ifscPrefix: 'UTIB0', weight: 7 },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK0', weight: 5 },
  { name: 'Union Bank of India', ifscPrefix: 'UBIN0', weight: 5 },
  { name: 'Canara Bank', ifscPrefix: 'CNRB0', weight: 5 },
  { name: 'Indian Bank', ifscPrefix: 'IDIB0', weight: 4 },
  { name: 'Bank of India', ifscPrefix: 'BKID0', weight: 4 },
  { name: 'Central Bank of India', ifscPrefix: 'CBIN0', weight: 3 },
  { name: 'Indian Overseas Bank', ifscPrefix: 'IOBA0', weight: 2 },
  { name: 'UCO Bank', ifscPrefix: 'UCBA0', weight: 2 }
];

export function generateBankDetails(rng: SeededRNG): {
  bankName: string;
  bankIFSC: string;
  bankAccountNumber: string;
} {
  const { item: bank } = weightedSample(banks, rng);
  
  // Generate branch code (6 digits after prefix)
  let branchCode = '';
  for (let i = 0; i < 6; i++) {
    branchCode += String(Math.floor(rng.next() * 10));
  }
  
  // Generate 11-digit account number
  let accountNumber = '';
  for (let i = 0; i < 11; i++) {
    accountNumber += String(Math.floor(rng.next() * 10));
  }
  
  return {
    bankName: bank.name,
    bankIFSC: bank.ifscPrefix + branchCode,
    bankAccountNumber: accountNumber
  };
}

// ─────────────────────────────────────────────────────────────
// Vehicle Registration
// ─────────────────────────────────────────────────────────────

const stateRTOCodes: Record<string, string[]> = {
  andhra_pradesh: ['AP 01', 'AP 02', 'AP 03', 'AP 05', 'AP 07', 'AP 09', 'AP 10', 'AP 16', 'AP 21', 'AP 28', 'AP 31', 'AP 36', 'AP 39'],
  arunachal_pradesh: ['AR 01', 'AR 02'], assam: ['AS 01', 'AS 02', 'AS 03', 'AS 04', 'AS 06'],
  bihar: ['BR 01', 'BR 02', 'BR 03', 'BR 04', 'BR 06', 'BR 19', 'BR 21', 'BR 22'],
  chhattisgarh: ['CG 04', 'CG 07', 'CG 10'], delhi: ['DL 01', 'DL 02', 'DL 03', 'DL 04', 'DL 05', 'DL 06', 'DL 07', 'DL 08', 'DL 09', 'DL 10', 'DL 12', 'DL 13'],
  goa: ['GA 01', 'GA 02', 'GA 03', 'GA 04'], gujarat: ['GJ 01', 'GJ 02', 'GJ 03', 'GJ 05', 'GJ 06', 'GJ 15', 'GJ 18', 'GJ 27'],
  haryana: ['HR 01', 'HR 02', 'HR 03', 'HR 05', 'HR 06', 'HR 10', 'HR 20', 'HR 26', 'HR 51', 'HR 55'],
  himachal_pradesh: ['HP 01', 'HP 03', 'HP 04'], jammu_kashmir: ['JK 01', 'JK 02', 'JK 03', 'JK 05'],
  jharkhand: ['JH 01', 'JH 02', 'JH 03', 'JH 04', 'JH 05', 'JH 10'],
  karnataka: ['KA 01', 'KA 02', 'KA 03', 'KA 04', 'KA 05', 'KA 09', 'KA 19', 'KA 50', 'KA 51', 'KA 53'],
  kerala: ['KL 01', 'KL 02', 'KL 03', 'KL 04', 'KL 05', 'KL 07', 'KL 08', 'KL 10', 'KL 14'],
  madhya_pradesh: ['MP 01', 'MP 02', 'MP 04', 'MP 07', 'MP 09', 'MP 20'],
  maharashtra: ['MH 01', 'MH 02', 'MH 03', 'MH 04', 'MH 05', 'MH 06', 'MH 12', 'MH 14', 'MH 20', 'MH 31', 'MH 43', 'MH 46', 'MH 47'],
  manipur: ['MN 01', 'MN 02'], meghalaya: ['ML 01', 'ML 02', 'ML 05'],
  mizoram: ['MZ 01', 'MZ 02'], nagaland: ['NL 01', 'NL 02', 'NL 07'],
  odisha: ['OD 01', 'OD 02', 'OD 03', 'OD 05', 'OD 06'],
  punjab: ['PB 01', 'PB 02', 'PB 03', 'PB 04', 'PB 05', 'PB 06', 'PB 08', 'PB 10', 'PB 65'],
  rajasthan: ['RJ 01', 'RJ 02', 'RJ 06', 'RJ 07', 'RJ 09', 'RJ 14', 'RJ 19', 'RJ 20', 'RJ 27'],
  sikkim: ['SK 01', 'SK 02'], tamil_nadu: ['TN 01', 'TN 02', 'TN 03', 'TN 04', 'TN 05', 'TN 07', 'TN 09', 'TN 10', 'TN 14', 'TN 18', 'TN 20', 'TN 22', 'TN 38'],
  telangana: ['TS 01', 'TS 02', 'TS 07', 'TS 08', 'TS 09', 'TS 10', 'TS 12', 'TS 13'],
  tripura: ['TR 01', 'TR 02'], uttar_pradesh: ['UP 01', 'UP 02', 'UP 11', 'UP 12', 'UP 13', 'UP 14', 'UP 15', 'UP 16', 'UP 20', 'UP 25', 'UP 32', 'UP 50', 'UP 65', 'UP 70', 'UP 78', 'UP 80', 'UP 81'],
  uttarakhand: ['UK 01', 'UK 02', 'UK 04', 'UK 07'],
  west_bengal: ['WB 01', 'WB 02', 'WB 06', 'WB 10', 'WB 19', 'WB 24', 'WB 26', 'WB 74'],
  chandigarh: ['CH 01', 'CH 02', 'CH 03', 'CH 04'], puducherry: ['PY 01', 'PY 02', 'PY 03', 'PY 05'],
  andaman_nicobar: ['AN 01'], dadra_nagar_haveli: ['DN 09'], daman_diu: ['DD 01', 'DD 02'], lakshadweep: ['LD 01']
};

export function generateVehicleRegistration(stateId: string, rng: SeededRNG): string {
  const codes = stateRTOCodes[stateId] ?? ['DL 01'];
  const rtoCode = uniformSample(codes, rng);
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const c1 = alpha[Math.floor(rng.next() * 26)];
  const c2 = alpha[Math.floor(rng.next() * 26)];
  const num = String(Math.floor(rng.next() * 9999) + 1).padStart(4, '0');
  return `${rtoCode} ${c1}${c2} ${num}`;
}

// ─────────────────────────────────────────────────────────────
// PIN Code (State-mapped)
// ─────────────────────────────────────────────────────────────

const statePinRanges: Record<string, [number, number]> = {
  delhi: [110001, 110097], chandigarh: [160001, 160101],
  haryana: [121001, 136156], himachal_pradesh: [171001, 177601],
  jammu_kashmir: [180001, 194404], punjab: [140001, 160104],
  rajasthan: [301001, 345034], uttarakhand: [244001, 263680],
  uttar_pradesh: [200001, 285223], bihar: [800001, 855126],
  jharkhand: [813101, 835325], odisha: [750001, 770076],
  west_bengal: [700001, 743711], chhattisgarh: [490001, 497778],
  madhya_pradesh: [450001, 488448], gujarat: [360001, 396590],
  maharashtra: [400001, 445402], goa: [403001, 403806],
  andhra_pradesh: [500001, 535593], karnataka: [560001, 591346],
  kerala: [670001, 695615], tamil_nadu: [600001, 643253],
  telangana: [500001, 509412], assam: [781001, 788931],
  meghalaya: [793001, 794115], tripura: [799001, 799290],
  mizoram: [796001, 796901], manipur: [795001, 795159],
  nagaland: [797001, 798627], arunachal_pradesh: [790001, 792131],
  sikkim: [737101, 737139], andaman_nicobar: [744101, 744304],
  lakshadweep: [682551, 682559], puducherry: [605001, 609607],
  dadra_nagar_haveli: [396191, 396240], daman_diu: [396210, 396220]
};

export function generatePinCode(stateId: string, rng: SeededRNG): string {
  const range = statePinRanges[stateId] ?? [100001, 999999];
  const pin = Math.floor(rng.next() * (range[1] - range[0])) + range[0];
  return String(pin).padStart(6, '0');
}

// ─────────────────────────────────────────────────────────────
// Address Generation
// ─────────────────────────────────────────────────────────────

const urbanLocalities = [
  'Indira Nagar', 'Gandhi Nagar', 'Nehru Colony', 'Rajiv Gandhi Nagar', 'Shastri Nagar',
  'Ambedkar Colony', 'Laxmi Nagar', 'Ram Nagar', 'Shivaji Nagar', 'Patel Nagar',
  'Vikas Nagar', 'Adarsh Colony', 'Jawahar Nagar', 'Subhash Nagar', 'Model Town',
  'Civil Lines', 'Sadar Bazar', 'Station Road', 'MG Road', 'Ring Road',
  'Sector 1', 'Sector 5', 'Sector 10', 'Sector 15', 'Sector 22',
  'Phase 1', 'Phase 2', 'Block A', 'Block B', 'Block C',
  'Vasant Kunj', 'Rohini', 'Dwarka', 'Malviya Nagar', 'Saket',
  'Koramangala', 'Indiranagar', 'JP Nagar', 'HSR Layout', 'Whitefield',
  'Bandra West', 'Andheri East', 'Powai', 'Goregaon', 'Thane West'
];

const ruralLocalities = [
  'Village Main Road', 'Gram Panchayat', 'Near Primary School', 'Near Temple',
  'Near Mosque', 'Near Church', 'Near Gurudwara', 'Post Office Road',
  'Kisan Colony', 'Harijan Basti', 'New Colony', 'Old Village',
  'Near Bus Stand', 'Near Railway Station', 'Mill Road', 'Tank Road',
  'Near PHC', 'Near Govt School', 'Panchayat Bhawan', 'Near Market'
];

const streetTypes = [
  'Street', 'Road', 'Lane', 'Gali', 'Marg', 'Path', 'Cross', 'Main Road'
];

export function generateAddress(
  district: string,
  areaType: 'urban' | 'rural',
  rng: SeededRNG
): { addressLine: string; locality: string } {
  const localities = areaType === 'urban' ? urbanLocalities : ruralLocalities;
  const locality = uniformSample(localities, rng);
  
  const houseNum = areaType === 'urban'
    ? `${Math.floor(rng.next() * 999) + 1}/${String.fromCharCode(65 + Math.floor(rng.next() * 8))}`
    : String(Math.floor(rng.next() * 500) + 1);
  
  const street = uniformSample(streetTypes, rng);
  
  const addressLine = `${houseNum}, ${locality}, ${district}`;
  
  return { addressLine, locality };
}

// ─────────────────────────────────────────────────────────────
// UPI ID
// ─────────────────────────────────────────────────────────────

const upiSuffixes = ['@ybl', '@paytm', '@oksbi', '@okicici', '@okaxis', '@upi', '@apl', '@ibl'];

export function generateUPI(phoneNumber: string, firstName: string, rng: SeededRNG): string {
  const style = Math.floor(rng.next() * 3);
  const suffix = uniformSample(upiSuffixes, rng);
  
  switch (style) {
    case 0: return `${phoneNumber}${suffix}`;
    case 1: return `${firstName.toLowerCase()}${suffix}`;
    default: return `${phoneNumber}${suffix}`;
  }
}
