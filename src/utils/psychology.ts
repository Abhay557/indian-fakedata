/**
 * Psychology, Personality & Behavioral Generator
 * 
 * Generates psychographic and behavioral attributes with REAL-WORLD
 * statistical biases from actual survey data:
 * 
 * Sources:
 * - Political: CSDS/Lokniti National Election Studies (2014, 2019, 2024)
 * - Religiosity: Pew Research Center "Religion in India" (2021)
 * - Habits: NFHS-5 (2019-21) — tobacco, alcohol by state/gender/religion
 * - Personality: Cross-cultural Big Five studies (Schmitt et al. 2007)
 * - Education: AISHE (2020-21) enrollment data
 * - Cognitive: ASER reports, NFHS-5 nutrition + education access
 * - Interests: BARC India viewership, ICC surveys
 * 
 * ⚠️ BIAS NOTE: These correlations reflect REAL survey findings.
 *    They encode societal patterns — not moral judgments.
 *    Useful for: bias detection ML, fairness auditing, realistic training data.
 */

import type {
  SeededRNG, Gender, AreaType, SocialCategory, EducationLevel,
  PoliticalLeaning, ReligiosityLevel, BigFivePersonality,
  CognitiveProfile, Interests, Habits, EducationDetails
} from '../types.js';

import {
  weightedSample, weightedSampleFromRecord, bernoulliSample,
  gaussianSample, uniformSample
} from '../core/sampler.js';

// ═════════════════════════════════════════════════════════════
// 1. POLITICAL LEANING
// ═════════════════════════════════════════════════════════════

/**
 * Political leaning correlated with religion, caste, state, education, area.
 * 
 * Data source: CSDS/Lokniti NES 2019 + 2024 post-poll surveys:
 * - Hindus: ~55% BJP (nationalist_right), higher in upper castes (~65%)
 * - Muslims: ~85% opposition (centrist/left/regionalist)
 * - SC/ST: Split — BSP/Congress/regional + increasing BJP
 * - South India: Stronger regionalist tendencies
 * - Higher education: Slightly more diverse political views
 * - Youth: More nationalist-right in Hindi belt
 */
export function generatePoliticalLeaning(
  religionId: string,
  stateId: string,
  socialCategory: SocialCategory,
  education: EducationLevel,
  age: number,
  areaType: AreaType,
  rng: SeededRNG
): PoliticalLeaning {
  // Base distribution by religion (CSDS NES 2019)
  let dist: Record<string, number>;

  switch (religionId) {
    case 'hindu':
      dist = {
        nationalist_right: 0.38,
        centre_right: 0.18,
        centrist: 0.12,
        centre_left: 0.08,
        leftist: 0.03,
        regionalist: 0.11,
        apolitical: 0.10
      };
      break;
    case 'muslim':
      dist = {
        nationalist_right: 0.04,
        centre_right: 0.06,
        centrist: 0.22,
        centre_left: 0.18,
        leftist: 0.08,
        regionalist: 0.28,
        apolitical: 0.14
      };
      break;
    case 'christian':
      dist = {
        nationalist_right: 0.08,
        centre_right: 0.12,
        centrist: 0.20,
        centre_left: 0.15,
        leftist: 0.05,
        regionalist: 0.30,
        apolitical: 0.10
      };
      break;
    case 'sikh':
      dist = {
        nationalist_right: 0.18,
        centre_right: 0.12,
        centrist: 0.15,
        centre_left: 0.10,
        leftist: 0.05,
        regionalist: 0.30,  // SAD/AAP
        apolitical: 0.10
      };
      break;
    case 'buddhist':
      dist = {
        nationalist_right: 0.06,
        centre_right: 0.08,
        centrist: 0.15,
        centre_left: 0.25,
        leftist: 0.15,
        regionalist: 0.20,
        apolitical: 0.11
      };
      break;
    case 'jain':
      dist = {
        nationalist_right: 0.50,
        centre_right: 0.20,
        centrist: 0.10,
        centre_left: 0.05,
        leftist: 0.02,
        regionalist: 0.05,
        apolitical: 0.08
      };
      break;
    default:
      dist = {
        nationalist_right: 0.20,
        centre_right: 0.15,
        centrist: 0.20,
        centre_left: 0.15,
        leftist: 0.10,
        regionalist: 0.10,
        apolitical: 0.10
      };
  }

  // Caste modifiers (CSDS data: upper castes lean more right)
  if (religionId === 'hindu') {
    if (socialCategory === 'General') {
      dist.nationalist_right *= 1.4;
      dist.centre_right *= 1.2;
      dist.centre_left *= 0.6;
    } else if (socialCategory === 'OBC') {
      dist.nationalist_right *= 1.15;
      dist.regionalist *= 1.1;
    } else if (socialCategory === 'SC') {
      dist.centre_left *= 1.5;
      dist.leftist *= 1.3;
      dist.nationalist_right *= 0.75;
    } else if (socialCategory === 'ST') {
      dist.regionalist *= 1.4;
      dist.leftist *= 1.5;
      dist.nationalist_right *= 0.6;
    }
  }

  // State modifiers (regionalism)
  const regionalistStates = [
    'tamil_nadu', 'andhra_pradesh', 'telangana', 'west_bengal',
    'odisha', 'punjab', 'jammu_kashmir', 'sikkim',
    'meghalaya', 'nagaland', 'mizoram', 'manipur', 'tripura'
  ];
  if (regionalistStates.includes(stateId)) {
    dist.regionalist *= 1.8;
    dist.nationalist_right *= 0.6;
  }

  // Kerala: strong left tradition
  if (stateId === 'kerala') {
    dist.leftist *= 3.0;
    dist.centre_left *= 2.0;
    dist.nationalist_right *= 0.4;
  }

  // Hindi belt: stronger right lean
  const hindiBelt = ['uttar_pradesh', 'bihar', 'madhya_pradesh', 'rajasthan', 'haryana', 'gujarat', 'chhattisgarh', 'jharkhand'];
  if (hindiBelt.includes(stateId)) {
    dist.nationalist_right *= 1.3;
    dist.regionalist *= 0.5;
  }

  // Age modifier (youth more opinionated, elderly more traditional)
  if (age < 30) {
    dist.nationalist_right *= 1.15;
    dist.apolitical *= 0.8;
  } else if (age > 60) {
    dist.centrist *= 1.2;
    dist.apolitical *= 1.3;
  }

  // Education modifier (higher ed → slightly more diverse views)
  const highEdu = ['graduate', 'postgraduate', 'professional_degree'];
  if (highEdu.includes(education)) {
    dist.centrist *= 1.2;
    dist.centre_left *= 1.1;
    dist.apolitical *= 0.7;
  }
  if (education === 'illiterate') {
    dist.apolitical *= 2.0;
  }

  // Normalize and sample
  const { key } = weightedSampleFromRecord(dist, rng);
  return key as PoliticalLeaning;
}

// ═════════════════════════════════════════════════════════════
// 2. RELIGIOSITY
// ═════════════════════════════════════════════════════════════

/**
 * Religiosity level from Pew Research Center "Religion in India" (2021):
 * - Muslims: 77% say religion is "very important"
 * - Hindus: 64% say religion is "very important"
 * - Christians: 68% say religion is "very important"
 * - Sikhs: 69%
 * - Buddhists: 52%
 * - Jains: 92%
 * 
 * Additional correlations:
 * - Rural > Urban
 * - Women > Men
 * - Older > Younger
 * - Lower education > Higher education (weaker effect)
 */
export function generateReligiosity(
  religionId: string,
  gender: Gender,
  age: number,
  education: EducationLevel,
  areaType: AreaType,
  rng: SeededRNG
): ReligiosityLevel {
  // Base distribution by religion (Pew 2021)
  let dist: Record<string, number>;

  switch (religionId) {
    case 'muslim':
      dist = { very_religious: 0.77, somewhat_religious: 0.17, not_very_religious: 0.04, not_at_all_religious: 0.02 };
      break;
    case 'hindu':
      dist = { very_religious: 0.64, somewhat_religious: 0.24, not_very_religious: 0.08, not_at_all_religious: 0.04 };
      break;
    case 'christian':
      dist = { very_religious: 0.68, somewhat_religious: 0.22, not_very_religious: 0.07, not_at_all_religious: 0.03 };
      break;
    case 'sikh':
      dist = { very_religious: 0.69, somewhat_religious: 0.21, not_very_religious: 0.07, not_at_all_religious: 0.03 };
      break;
    case 'buddhist':
      dist = { very_religious: 0.52, somewhat_religious: 0.30, not_very_religious: 0.12, not_at_all_religious: 0.06 };
      break;
    case 'jain':
      dist = { very_religious: 0.92, somewhat_religious: 0.06, not_very_religious: 0.015, not_at_all_religious: 0.005 };
      break;
    default:
      dist = { very_religious: 0.50, somewhat_religious: 0.30, not_very_religious: 0.12, not_at_all_religious: 0.08 };
  }

  // Gender effect (Pew: women slightly more religious)
  if (gender === 'female') {
    dist.very_religious *= 1.1;
    dist.not_at_all_religious *= 0.7;
  }

  // Age effect (older = more religious)
  if (age > 50) {
    dist.very_religious *= 1.2;
    dist.not_at_all_religious *= 0.5;
  } else if (age < 25) {
    dist.very_religious *= 0.85;
    dist.not_very_religious *= 1.3;
    dist.not_at_all_religious *= 1.5;
  }

  // Area effect (rural = more religious)
  if (areaType === 'rural') {
    dist.very_religious *= 1.1;
    dist.not_at_all_religious *= 0.6;
  }

  // Education effect (weak but present)
  const highEdu = ['graduate', 'postgraduate', 'professional_degree'];
  if (highEdu.includes(education)) {
    dist.not_very_religious *= 1.3;
    dist.not_at_all_religious *= 1.5;
    dist.very_religious *= 0.9;
  }

  const { key } = weightedSampleFromRecord(dist, rng);
  return key as ReligiosityLevel;
}

// ═════════════════════════════════════════════════════════════
// 3. PERSONALITY (Big Five / OCEAN)
// ═════════════════════════════════════════════════════════════

/**
 * Big Five personality traits with demographic correlations:
 * 
 * Sources: Schmitt et al. 2007 (cross-cultural Big Five), 
 *          Indian adaptation studies (Lodhi et al.)
 * 
 * Correlations baked in:
 * - Women: higher agreeableness, neuroticism
 * - Urban: higher openness
 * - Higher education: higher openness, conscientiousness
 * - Agricultural workers: higher agreeableness, lower openness
 * - Youth: higher extraversion, lower agreeableness
 * - Religiosity: higher agreeableness, lower openness
 */
export function generatePersonality(
  gender: Gender,
  age: number,
  education: EducationLevel,
  areaType: AreaType,
  religiosity: ReligiosityLevel,
  occupation: string,
  rng: SeededRNG
): BigFivePersonality {
  // Base means (Indian norms, 0-100 scale)
  let oMean = 50, cMean = 52, eMean = 50, aMean = 55, nMean = 48;
  const stddev = 12;

  // Gender effects
  if (gender === 'female') {
    aMean += 4;   // women score higher on agreeableness
    nMean += 5;   // women score higher on neuroticism
    eMean += 1;
  } else if (gender === 'male') {
    oMean += 2;
    eMean += 2;
  }

  // Age effects
  if (age < 25) {
    eMean += 5;   // youth more extraverted
    aMean -= 3;   // youth less agreeable
    oMean += 3;   // youth more open
    nMean += 3;   // youth more neurotic
  } else if (age > 50) {
    cMean += 4;   // maturity → more conscientious
    aMean += 4;   // maturity → more agreeable
    nMean -= 4;   // maturity → less neurotic
    eMean -= 3;
  }

  // Education effects
  const highEdu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma'];
  if (highEdu.includes(education)) {
    oMean += 8;   // education increases openness significantly
    cMean += 5;   // education increases conscientiousness
    nMean -= 2;
  } else if (education === 'illiterate' || education === 'literate_below_primary') {
    oMean -= 8;
    cMean -= 3;
    aMean += 3;
  }

  // Area effects
  if (areaType === 'urban') {
    oMean += 4;   // urban = more open
    eMean += 2;
  } else {
    aMean += 3;   // rural = more agreeable
    cMean += 2;
  }

  // Religiosity effects (Saroglou 2002 meta-analysis)
  if (religiosity === 'very_religious') {
    aMean += 5;   // religious people more agreeable
    cMean += 4;   // more conscientious
    oMean -= 5;   // less open to experience
    nMean -= 2;
  } else if (religiosity === 'not_at_all_religious') {
    oMean += 5;
    aMean -= 3;
  }

  // Occupation effects
  if (occupation === 'cultivator' || occupation === 'agricultural_labourer') {
    aMean += 3;
    oMean -= 4;
    cMean += 2;
  }

  // Sample with gaussian noise
  return {
    openness: clampScore(gaussianSample(oMean, stddev, rng)),
    conscientiousness: clampScore(gaussianSample(cMean, stddev, rng)),
    extraversion: clampScore(gaussianSample(eMean, stddev, rng)),
    agreeableness: clampScore(gaussianSample(aMean, stddev, rng)),
    neuroticism: clampScore(gaussianSample(nMean, stddev, rng))
  };
}

function clampScore(val: number): number {
  return Math.round(Math.max(1, Math.min(100, val)));
}

// ═════════════════════════════════════════════════════════════
// 4. COGNITIVE / APTITUDE PROFILE
// ═════════════════════════════════════════════════════════════

/**
 * Cognitive aptitude correlated with:
 * - Education level (strongest predictor)
 * - Socioeconomic status (income → nutrition → cognitive development)
 * - Area type (urban schools have better resources)
 * - Age (peak at 25-40, decline after 60)
 * 
 * Sources:
 * - ASER (Annual Status of Education Report) — foundational literacy/numeracy
 * - NFHS-5 — stunting/nutrition data → cognitive development link
 * - PISA/ASER data for Indian context
 * 
 * ⚠️ NOT correlated with religion/caste directly — 
 *    the correlation appears through education access + SES mediators.
 */
export function generateCognitiveProfile(
  education: EducationLevel,
  income: number,
  areaType: AreaType,
  age: number,
  hasSmartphone: boolean,
  rng: SeededRNG
): CognitiveProfile {
  // Education → base aptitude (strongest signal)
  const eduBaseMap: Record<string, number> = {
    illiterate: 25,
    literate_below_primary: 32,
    primary: 38,
    middle: 45,
    secondary: 55,
    higher_secondary: 62,
    graduate: 72,
    postgraduate: 80,
    technical_diploma: 75,
    professional_degree: 85
  };
  let baseMean = eduBaseMap[education] ?? 50;

  // SES/Income effect (proxy for nutrition, childhood development)
  if (income > 500000) baseMean += 5;
  else if (income > 200000) baseMean += 2;
  else if (income < 60000) baseMean -= 5;
  else if (income < 100000) baseMean -= 2;

  // Area effect (urban schools have better infrastructure)
  if (areaType === 'urban') baseMean += 3;
  else baseMean -= 2;

  // Age effect (cognitive peak ~25-40)
  if (age < 10) baseMean -= 15;
  else if (age < 18) baseMean -= 5;
  else if (age > 65) baseMean -= 8;
  else if (age > 50) baseMean -= 3;

  const stddev = 10;

  const aptitude = clampScore(gaussianSample(baseMean, stddev, rng));

  // Numeracy: correlated with aptitude but also education
  const numeracyBase = education === 'illiterate'
    ? baseMean - 10
    : baseMean + (education === 'professional_degree' ? 5 : 0);
  const numeracy = clampScore(gaussianSample(numeracyBase, stddev, rng));

  // Literacy: strongly education-dependent
  const literacyBase = education === 'illiterate' ? 10 : baseMean + 5;
  const literacy = clampScore(gaussianSample(literacyBase, stddev, rng));

  // Digital literacy: age + smartphone + education
  let digBase = hasSmartphone ? baseMean + 5 : baseMean - 15;
  if (age > 50) digBase -= 10;
  if (age < 30) digBase += 5;
  const digital = clampScore(gaussianSample(digBase, 12, rng));

  // Financial literacy: education + income + area
  let finBase = baseMean - 5;
  if (income > 300000) finBase += 5;
  if (areaType === 'urban') finBase += 3;
  const financial = clampScore(gaussianSample(finBase, 12, rng));

  return {
    aptitudeScore: aptitude,
    numeracyScore: numeracy,
    literacyScore: literacy,
    digitalLiteracyScore: digital,
    financialLiteracyScore: financial
  };
}

// ═════════════════════════════════════════════════════════════
// 5. INTERESTS
// ═════════════════════════════════════════════════════════════

/**
 * Interests correlated with gender, age, religion, state, education, area.
 * 
 * Real biases:
 * - Cricket: ~90%+ of Indian males interested (BARC India)
 * - Kabaddi: Growing, especially rural, lower-income demographics
 * - Football: Strong in West Bengal, Kerala, NE India, Goa
 * - Bollywood: Massive across demographics, but genre varies
 * - Pets: Dogs more popular in rural/semi-urban, cats in some regions
 * - Music: Regional music preferences (Bhojpuri in UP/Bihar, etc.)
 */
export function generateInterests(
  gender: Gender,
  age: number,
  religionId: string,
  stateId: string,
  education: EducationLevel,
  areaType: AreaType,
  hasSmartphone: boolean,
  rng: SeededRNG
): Interests {
  // ── Sport ──
  const sportDist: Record<string, number> = {
    cricket: gender === 'male' ? 55 : 30,
    kabaddi: areaType === 'rural' ? 8 : 3,
    football: 5,
    badminton: 4,
    volleyball: areaType === 'rural' ? 5 : 2,
    hockey: 2,
    athletics: 2,
    wrestling: areaType === 'rural' ? 3 : 1,
    none: gender === 'female' ? 20 : 8,
    kho_kho: 2,
    carrom: 3,
    chess: education === 'graduate' || education === 'postgraduate' ? 3 : 1
  };

  // State-specific sport biases
  const footballStates = ['west_bengal', 'kerala', 'goa', 'manipur', 'meghalaya', 'mizoram', 'sikkim'];
  if (footballStates.includes(stateId)) {
    sportDist.football *= 5;
    sportDist.cricket *= 0.7;
  }
  if (stateId === 'haryana' || stateId === 'punjab') {
    sportDist.wrestling *= 4;
    sportDist.kabaddi *= 2;
  }
  if (stateId === 'manipur' || stateId === 'mizoram') {
    sportDist.football *= 3;
    sportDist.boxing = 3;
  }

  const { key: primarySport } = weightedSampleFromRecord(sportDist, rng);

  // ── Pet preference ──
  const petDist: Record<string, number> = {
    dogs: 25,
    cats: 8,
    birds: areaType === 'rural' ? 5 : 2,
    fish: areaType === 'urban' ? 3 : 1,
    none: 55
  };
  // Muslims traditionally less dog-friendly (cultural factor)
  if (religionId === 'muslim') {
    petDist.dogs *= 0.3;
    petDist.cats *= 3;
    petDist.birds *= 2;
  }
  // Rural more dogs (guard dogs)
  if (areaType === 'rural') petDist.dogs *= 1.5;

  const { key: petPref } = weightedSampleFromRecord(petDist, rng);

  // ── Entertainment ──
  const entertainment: string[] = [];
  const entertainmentPool = [
    { name: 'Bollywood', prob: 0.80 },
    { name: 'TV Serials', prob: gender === 'female' ? 0.65 : 0.35 },
    { name: 'Cricket Matches', prob: gender === 'male' ? 0.70 : 0.35 },
    { name: 'News', prob: age > 30 ? 0.50 : 0.20 },
    { name: 'YouTube', prob: hasSmartphone ? 0.65 : 0.10 },
    { name: 'OTT/Netflix', prob: hasSmartphone && areaType === 'urban' ? 0.35 : 0.05 },
    { name: 'Regional Cinema', prob: ['tamil_nadu', 'kerala', 'andhra_pradesh', 'telangana', 'karnataka', 'west_bengal'].includes(stateId) ? 0.60 : 0.20 },
    { name: 'Gaming', prob: age < 30 && hasSmartphone ? 0.35 : 0.05 },
    { name: 'Religious Programs', prob: religionId === 'muslim' || religionId === 'jain' ? 0.45 : 0.25 },
    { name: 'Devotional Music', prob: religionId === 'hindu' ? 0.35 : religionId === 'sikh' ? 0.40 : 0.15 }
  ];

  for (const item of entertainmentPool) {
    if (bernoulliSample(item.prob, rng)) {
      entertainment.push(item.name);
    }
  }
  if (entertainment.length === 0) entertainment.push('Bollywood');

  // ── Reading ──
  const readDist: Record<string, number> = {
    avid_reader: education === 'postgraduate' || education === 'professional_degree' ? 15 : 5,
    occasional: ['graduate', 'higher_secondary'].includes(education) ? 25 : 10,
    rare: 30,
    non_reader: education === 'illiterate' ? 80 : 35
  };
  const { key: readingHabit } = weightedSampleFromRecord(readDist, rng);

  // ── Music ──
  const musicDist: Record<string, number> = {
    Bollywood: 40,
    Devotional: religionId === 'hindu' ? 15 : religionId === 'muslim' ? 10 : religionId === 'sikh' ? 20 : 8,
    Regional_Folk: areaType === 'rural' ? 20 : 8,
    Pop_Western: areaType === 'urban' && age < 30 ? 12 : 3,
    Classical: education === 'graduate' || education === 'postgraduate' ? 8 : 2,
    Qawwali: religionId === 'muslim' ? 15 : 2,
    Bhangra: stateId === 'punjab' ? 25 : 3,
    Carnatic: ['tamil_nadu', 'karnataka', 'kerala', 'andhra_pradesh'].includes(stateId) ? 12 : 1,
    Hip_Hop: age < 25 && areaType === 'urban' ? 10 : 1,
    Bhojpuri: ['uttar_pradesh', 'bihar', 'jharkhand'].includes(stateId) ? 15 : 1
  };
  const { key: musicPreference } = weightedSampleFromRecord(musicDist, rng);

  // ── Social media platform ──
  let preferredSocialMedia: string | undefined;
  if (hasSmartphone && age >= 13) {
    const smDist: Record<string, number> = {
      WhatsApp: 50,
      Instagram: age < 35 ? 20 : 5,
      Facebook: age > 25 ? 15 : 5,
      YouTube: 15,
      Twitter_X: education === 'graduate' || education === 'postgraduate' ? 5 : 1,
      Telegram: 3,
      ShareChat: areaType === 'rural' ? 8 : 2,
      Koo: religionId === 'hindu' && age > 30 ? 2 : 0.5
    };
    const { key: sm } = weightedSampleFromRecord(smDist, rng);
    preferredSocialMedia = sm;
  }

  return {
    primarySport,
    petPreference: petPref as Interests['petPreference'],
    entertainment,
    readingHabit: readingHabit as Interests['readingHabit'],
    musicPreference: musicPreference.replace(/_/g, ' '),
    preferredSocialMedia
  };
}

// ═════════════════════════════════════════════════════════════
// 6. HABITS
// ═════════════════════════════════════════════════════════════

/**
 * Habits correlated with gender, religion, age, state, area.
 * 
 * NFHS-5 (2019-21) data:
 * Tobacco:
 * - Men: 38% use any tobacco, Women: 8.9%
 * - Highest: Mizoram (72.9%), Tripura (64.2%), Manipur (56.0%)
 * - Lowest: Goa (12.8%), Punjab (13.8%)
 * - Muslims: slightly lower smoking but higher chewing (gutka)
 * 
 * Alcohol:
 * - Men: 22.2%, Women: 1.3% (NFHS-5)
 * - Christians/Tribals: higher
 * - Muslims: very low (religious prohibition)
 * - Highest: Arunachal Pradesh (53.4%), Goa (33.7%)
 */
export function generateHabits(
  gender: Gender,
  age: number,
  religionId: string,
  stateId: string,
  areaType: AreaType,
  education: EducationLevel,
  income: number,
  rng: SeededRNG
): Habits {
  // ── Tobacco (NFHS-5) ──
  let tobaccoProb = gender === 'male' ? 0.38 : 0.089;
  
  // State modifiers
  const highTobaccoStates: Record<string, number> = {
    mizoram: 2.0, tripura: 1.7, manipur: 1.5, meghalaya: 1.4,
    nagaland: 1.3, assam: 1.3, odisha: 1.2, jharkhand: 1.2,
    chhattisgarh: 1.2, bihar: 1.1, madhya_pradesh: 1.1
  };
  const lowTobaccoStates: Record<string, number> = {
    goa: 0.35, punjab: 0.4, himachal_pradesh: 0.5,
    delhi: 0.6, chandigarh: 0.5, kerala: 0.6
  };
  tobaccoProb *= highTobaccoStates[stateId] ?? lowTobaccoStates[stateId] ?? 1.0;

  // Religion modifier
  if (religionId === 'sikh') tobaccoProb *= 0.4; // Sikh religious prohibition
  if (religionId === 'jain') tobaccoProb *= 0.2;

  // Age: peak 30-50
  if (age < 18) tobaccoProb *= 0.1;
  else if (age < 25) tobaccoProb *= 0.5;
  else if (age > 60) tobaccoProb *= 0.8;

  // Education: higher ed = less tobacco
  const highEdu = ['graduate', 'postgraduate', 'professional_degree'];
  if (highEdu.includes(education)) tobaccoProb *= 0.5;

  let tobaccoUse: Habits['tobaccoUse'] = 'none';
  if (bernoulliSample(Math.min(tobaccoProb, 0.9), rng)) {
    const typeDist: Record<string, number> = {
      smoking: 0.4,
      chewing: 0.45,
      both: 0.15
    };
    // NE India: more smoking. North India: more chewing
    if (['mizoram', 'manipur', 'nagaland', 'meghalaya'].includes(stateId)) {
      typeDist.smoking = 0.7;
      typeDist.chewing = 0.2;
    }
    if (religionId === 'muslim') {
      typeDist.chewing = 0.6; // gutka/paan
      typeDist.smoking = 0.3;
    }
    const { key } = weightedSampleFromRecord(typeDist, rng);
    tobaccoUse = key as Habits['tobaccoUse'];
  }

  // ── Alcohol (NFHS-5) ──
  let alcoholProb = gender === 'male' ? 0.222 : 0.013;
  
  // Religion: Muslims almost zero (haram)
  if (religionId === 'muslim') alcoholProb *= 0.05;
  if (religionId === 'jain') alcoholProb *= 0.1;
  // Christians and tribals higher
  if (religionId === 'christian') alcoholProb *= 1.6;

  // State
  const highAlcoholStates: Record<string, number> = {
    arunachal_pradesh: 2.5, goa: 1.6, chhattisgarh: 1.5,
    telangana: 1.4, andhra_pradesh: 1.3, jharkhand: 1.3,
    sikkim: 1.4, meghalaya: 1.3, manipur: 1.2
  };
  const lowAlcoholStates: Record<string, number> = {
    gujarat: 0.2, bihar: 0.3, // dry states
    lakshadweep: 0.1
  };
  alcoholProb *= highAlcoholStates[stateId] ?? lowAlcoholStates[stateId] ?? 1.0;

  if (age < 18) alcoholProb *= 0.02;
  else if (age < 25) alcoholProb *= 0.6;

  let alcoholUse: Habits['alcoholUse'] = 'none';
  if (bernoulliSample(Math.min(alcoholProb, 0.8), rng)) {
    const alcDist: Record<string, number> = { occasional: 0.55, regular: 0.35, heavy: 0.10 };
    if (income < 100000) alcDist.heavy *= 1.5;
    const { key } = weightedSampleFromRecord(alcDist, rng);
    alcoholUse = key as Habits['alcoholUse'];
  }

  // ── Exercise ──
  const exDist: Record<string, number> = {
    daily: areaType === 'urban' && highEdu.includes(education) ? 15 : 5,
    weekly: areaType === 'urban' ? 15 : 8,
    occasional: 25,
    never: areaType === 'rural' ? 50 : 40
  };
  // Agricultural work counts as physical activity, but we measure deliberate exercise
  if (age > 60) exDist.never *= 1.5;
  if (age < 25) exDist.daily *= 1.5;
  const { key: exerciseFrequency } = weightedSampleFromRecord(exDist, rng);

  // ── Sleep ──
  let sleepMean = 7.0;
  if (areaType === 'rural') sleepMean += 0.5;
  if (age > 60) sleepMean += 0.5;
  if (age < 18) sleepMean += 0.8;
  const avgSleepHours = Math.round(gaussianSample(sleepMean, 0.8, rng) * 10) / 10;

  // ── Cooking ──
  const cooksAtHome = gender === 'female'
    ? bernoulliSample(0.85, rng)
    : bernoulliSample(areaType === 'urban' ? 0.25 : 0.10, rng);

  // ── Chronotype ──
  const chronDist: Record<string, number> = {
    early_riser: areaType === 'rural' ? 55 : 30,
    moderate: 35,
    night_owl: areaType === 'urban' && age < 30 ? 25 : 10
  };
  const { key: chronotype } = weightedSampleFromRecord(chronDist, rng);

  return {
    tobaccoUse,
    alcoholUse,
    exerciseFrequency: exerciseFrequency as Habits['exerciseFrequency'],
    avgSleepHours: Math.max(4, Math.min(12, avgSleepHours)),
    cooksAtHome,
    chronotype: chronotype as Habits['chronotype']
  };
}

// ═════════════════════════════════════════════════════════════
// 7. EDUCATION DETAILS
// ═════════════════════════════════════════════════════════════

/**
 * Expanded education details from AISHE (All India Survey on Higher Education).
 * 
 * Biases:
 * - STEM fields: male-dominated (65:35 in engineering, AISHE 2021)
 * - Arts/Humanities: female-majority
 * - Commerce: balanced
 * - IIT/NIT: heavily General/OBC, urban, male
 * - Medium: Hindi belt → Hindi medium; South → regional language; Urban elite → English
 */
export function generateEducationDetails(
  education: EducationLevel,
  gender: Gender,
  stateId: string,
  socialCategory: SocialCategory,
  areaType: AreaType,
  income: number,
  age: number,
  rng: SeededRNG
): EducationDetails {
  // ── Field of study ──
  let fieldOfStudy: string | undefined;
  
  const higherEdu = ['graduate', 'postgraduate', 'professional_degree', 'technical_diploma'];
  if (higherEdu.includes(education)) {
    const fieldDist: Record<string, number> = {
      'Arts/Humanities': gender === 'female' ? 30 : 20,
      'Commerce/Business': 18,
      'Science': 15,
      'Engineering/Technology': gender === 'male' ? 20 : 8,
      'Medicine/Health': gender === 'female' ? 8 : 5,
      'Law': 4,
      'Education/B.Ed': gender === 'female' ? 8 : 3,
      'Computer Science/IT': areaType === 'urban' ? 8 : 3,
      'Agriculture': areaType === 'rural' ? 5 : 1,
      'Management/MBA': income > 300000 ? 5 : 2
    };
    
    if (education === 'technical_diploma') {
      fieldDist['Engineering/Technology'] *= 3;
      fieldDist['Computer Science/IT'] *= 2;
      fieldDist['Arts/Humanities'] *= 0.2;
    }
    if (education === 'professional_degree') {
      fieldDist['Medicine/Health'] *= 3;
      fieldDist['Law'] *= 3;
      fieldDist['Engineering/Technology'] *= 2;
    }
    
    const { key } = weightedSampleFromRecord(fieldDist, rng);
    fieldOfStudy = key;
  }

  // ── Institution type ──
  let institutionType: EducationDetails['institutionType'] = 'none';
  if (higherEdu.includes(education)) {
    const instDist: Record<string, number> = {
      government: 35,
      private: 40,
      aided: 15,
      central_university: 5,
      iit_nit: 2
    };
    // IIT/NIT: urban, higher income, more General/OBC
    if (areaType === 'rural') instDist.iit_nit *= 0.3;
    if (income < 200000) instDist.iit_nit *= 0.3;
    if (socialCategory === 'SC' || socialCategory === 'ST') instDist.iit_nit *= 0.5; // reservation exists but still underrepresented
    if (gender === 'female') instDist.iit_nit *= 0.4; // ~20% female in IITs
    
    // SC/ST more in government institutions (reservation)
    if (socialCategory === 'SC' || socialCategory === 'ST') {
      instDist.government *= 1.5;
      instDist.private *= 0.7;
    }
    
    const { key } = weightedSampleFromRecord(instDist, rng);
    institutionType = key as EducationDetails['institutionType'];
  } else if (['secondary', 'higher_secondary', 'middle', 'primary'].includes(education)) {
    const schoolDist: Record<string, number> = {
      government: areaType === 'rural' ? 60 : 35,
      private: areaType === 'urban' ? 45 : 20,
      aided: 15
    };
    if (income > 300000) schoolDist.private *= 2;
    const { key } = weightedSampleFromRecord(schoolDist, rng);
    institutionType = key as EducationDetails['institutionType'];
  }

  // ── Medium of instruction ──
  let mediumOfInstruction: string;
  const stateLanguageMap: Record<string, string> = {
    tamil_nadu: 'Tamil', kerala: 'Malayalam', karnataka: 'Kannada',
    andhra_pradesh: 'Telugu', telangana: 'Telugu', west_bengal: 'Bengali',
    maharashtra: 'Marathi', gujarat: 'Gujarati', odisha: 'Odia',
    punjab: 'Punjabi', assam: 'Assamese', goa: 'Konkani'
  };
  
  if (institutionType === 'iit_nit' || institutionType === 'central_university') {
    mediumOfInstruction = 'English';
  } else if (areaType === 'urban' && income > 300000) {
    mediumOfInstruction = rng.next() < 0.6 ? 'English' : (stateLanguageMap[stateId] ?? 'Hindi');
  } else {
    const localLang = stateLanguageMap[stateId] ?? 'Hindi';
    mediumOfInstruction = rng.next() < 0.2 ? 'English' : localLang;
  }

  // ── Qualification year ──
  let qualificationYear: number | undefined;
  if (education !== 'illiterate' && education !== 'literate_below_primary') {
    const currentYear = new Date().getFullYear();
    const eduAge: Record<string, number> = {
      primary: 11, middle: 14, secondary: 16,
      higher_secondary: 18, graduate: 22, postgraduate: 24,
      technical_diploma: 21, professional_degree: 25
    };
    const completionAge = eduAge[education] ?? 18;
    qualificationYear = Math.min(currentYear, Math.max(1960, currentYear - age + completionAge));
  }

  // ── Competitive exam percentile ──
  let competitiveExamPercentile: number | undefined;
  if (institutionType === 'iit_nit') {
    competitiveExamPercentile = Math.round(gaussianSample(95, 3, rng) * 10) / 10;
  } else if (institutionType === 'central_university') {
    competitiveExamPercentile = Math.round(gaussianSample(85, 8, rng) * 10) / 10;
  } else if (higherEdu.includes(education) && rng.next() < 0.3) {
    competitiveExamPercentile = Math.round(gaussianSample(65, 15, rng) * 10) / 10;
  }
  if (competitiveExamPercentile !== undefined) {
    competitiveExamPercentile = Math.max(1, Math.min(99.9, competitiveExamPercentile));
  }

  return {
    fieldOfStudy,
    institutionType,
    mediumOfInstruction,
    qualificationYear,
    competitiveExamPercentile
  };
}
