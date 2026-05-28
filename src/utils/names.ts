/**
 * Name Generator Module
 * 
 * Handles first name and surname selection based on the resolved
 * demographic path. Uses religion, state, caste, and gender context
 * to pick culturally accurate names.
 */

import type { SeededRNG, CompiledDatabase, Gender, NameEntry } from '../types.js';
import { weightedSample, uniformSample } from '../core/sampler.js';

function getStateRegion(stateId: string): string {
  const south = ['karnataka', 'kerala', 'tamil_nadu', 'andhra_pradesh', 'telangana', 'puducherry', 'lakshadweep'];
  const east = ['west_bengal', 'odisha', 'bihar', 'jharkhand', 'assam', 'sikkim', 'arunachal_pradesh', 'nagaland', 'manipur', 'mizoram', 'tripura', 'meghalaya'];
  const north = ['punjab', 'haryana', 'delhi', 'himachal_pradesh', 'jammu_kashmir', 'uttarakhand', 'chandigarh', 'ladakh'];
  const west = ['maharashtra', 'gujarat', 'goa', 'rajasthan', 'dadra_nagar_haveli', 'daman_diu'];

  if (south.includes(stateId)) return 'south';
  if (east.includes(stateId)) return 'east';
  if (north.includes(stateId)) return 'north';
  if (west.includes(stateId)) return 'west';
  return 'default';
}

/**
 * Select a first name based on religion, state, and gender.
 * Cascading lookup: religion+state → religion+region → religion+default → any default
 */
export function selectFirstName(
  db: CompiledDatabase,
  religionId: string,
  stateId: string,
  gender: Gender,
  rng: SeededRNG
): { name: string; probability: number } {
  const byReligion = db.firstNames[religionId];
  
  if (byReligion) {
    // Try state-specific names first
    let byState = byReligion[stateId];
    if (!byState) {
      // Try regional grouping fallback
      const regionId = getStateRegion(stateId);
      byState = byReligion[regionId];
    }
    
    if (byState && byState[gender] && byState[gender].length > 0) {
      return sampleFromNameList(byState[gender], rng);
    }
    
    // Fallback to default names for this religion
    const byDefault = byReligion['default'];
    if (byDefault && byDefault[gender] && byDefault[gender].length > 0) {
      return sampleFromNameList(byDefault[gender], rng);
    }
    
    // Try 'other' gender
    if (byDefault && byDefault['other'] && byDefault['other'].length > 0) {
      return sampleFromNameList(byDefault['other'], rng);
    }
  }
  
  // Last resort: pick from Hindu defaults (most common)
  const hinduDefault = db.firstNames['hindu']?.['default']?.[gender];
  if (hinduDefault && hinduDefault.length > 0) {
    return sampleFromNameList(hinduDefault, rng);
  }
  
  return { name: gender === 'male' ? 'Arjun' : 'Priya', probability: 0.01 };
}

/**
 * Select a surname based on caste/community.
 * Cascading lookup: casteId → normalized casteId → generic
 */
export function selectSurname(
  db: CompiledDatabase,
  casteId: string,
  gender: Gender,
  rng: SeededRNG
): { name: string; probability: number } {
  // Direct caste match
  let surnameList = db.surnames[casteId];
  
  if (!surnameList || surnameList.length === 0) {
    // Try normalized key
    const normalizedKey = casteId.toLowerCase().replace(/[\s\-]+/g, '_');
    surnameList = db.surnames[normalizedKey];
  }
  
  if (!surnameList || surnameList.length === 0) {
    // Try partial match
    for (const [key, list] of Object.entries(db.surnames)) {
      if (key.includes(casteId) || casteId.includes(key)) {
        surnameList = list;
        break;
      }
    }
  }
  
  if (surnameList && surnameList.length > 0) {
    // Filter by gender if applicable (some surnames are gender-specific, e.g., Sikh: Singh/Kaur)
    const genderFiltered = surnameList.filter(s => s.gender === gender || s.gender === 'unisex');
    if (genderFiltered.length > 0) {
      return sampleFromNameList(genderFiltered, rng);
    }
    return sampleFromNameList(surnameList, rng);
  }
  
  // Generic fallback surnames
  const genericSurnames: NameEntry[] = [
    { name: 'Kumar', weight: 15, gender: 'male' },
    { name: 'Kumari', weight: 10, gender: 'female' },
    { name: 'Devi', weight: 10, gender: 'female' },
    { name: 'Singh', weight: 12, gender: 'male' },
    { name: 'Prasad', weight: 8, gender: 'male' },
    { name: 'Das', weight: 8, gender: 'unisex' },
    { name: 'Ram', weight: 5, gender: 'male' },
    { name: 'Lal', weight: 5, gender: 'male' }
  ];
  
  const filtered = genericSurnames.filter(s => s.gender === gender || s.gender === 'unisex');
  if (filtered.length > 0) {
    return sampleFromNameList(filtered, rng);
  }
  return sampleFromNameList(genericSurnames, rng);
}

/**
 * Select a mother tongue based on state's language distribution.
 */
export function selectMotherTongue(
  db: CompiledDatabase,
  stateId: string,
  rng: SeededRNG
): string {
  const stateData = db.states[stateId];
  if (!stateData || !stateData.languageDistribution) {
    return 'Hindi';
  }
  
  const entries = Object.entries(stateData.languageDistribution);
  if (entries.length === 0) return 'Hindi';
  
  const items = entries.map(([lang, weight]) => ({ name: lang, weight }));
  const { item } = weightedSample(items, rng);
  
  // Capitalize first letter
  return item.name.charAt(0).toUpperCase() + item.name.slice(1);
}

/**
 * Select a second language (different from mother tongue).
 */
export function selectSecondLanguage(
  db: CompiledDatabase,
  stateId: string,
  motherTongue: string,
  education: string,
  rng: SeededRNG
): string | undefined {
  // Lower-educated people are less likely to know a second language
  const eduLevels = ['illiterate', 'literate_below_primary', 'primary'];
  if (eduLevels.includes(education)) {
    if (rng.next() > 0.3) return undefined;
  }
  
  // Common second languages
  const secondLanguages = [
    { name: 'Hindi', weight: 30 },
    { name: 'English', weight: 25 },
    { name: 'Urdu', weight: 5 },
    { name: 'Bengali', weight: 3 },
    { name: 'Tamil', weight: 3 },
    { name: 'Telugu', weight: 3 },
    { name: 'Marathi', weight: 3 },
    { name: 'Gujarati', weight: 2 },
    { name: 'Kannada', weight: 2 },
    { name: 'Malayalam', weight: 2 },
    { name: 'Punjabi', weight: 2 },
    { name: 'Odia', weight: 1 }
  ];
  
  // Filter out mother tongue
  const mtLower = motherTongue.toLowerCase();
  const available = secondLanguages.filter(l => l.name.toLowerCase() !== mtLower);
  
  if (available.length === 0) return undefined;
  
  const { item } = weightedSample(available, rng);
  return item.name;
}

/**
 * Select a district based on state.
 */
export function selectDistrict(
  db: CompiledDatabase,
  stateId: string,
  rng: SeededRNG
): string {
  const districtList = db.districts[stateId];
  if (!districtList || districtList.length === 0) {
    return db.states[stateId]?.stateName ?? 'Unknown';
  }
  return uniformSample(districtList, rng);
}

// ─────────────────────────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────────────────────────

function sampleFromNameList(
  names: NameEntry[],
  rng: SeededRNG
): { name: string; probability: number } {
  const { item, probability } = weightedSample(names, rng);
  return { name: item.name, probability };
}
