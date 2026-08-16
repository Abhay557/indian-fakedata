/**
 * Movie & Anime Preference Generator (v2.0.3)
 *
 * Generates film viewing preferences correlated with age, gender, area,
 * education, income, and state (regional cinema is state-driven).
 *
 * Determinism: consumes RNG draws appended AFTER all existing generator
 * draws, so existing profile fields for a given seed stay unchanged.
 */

import type {
  AreaType,
  EducationLevel,
  Gender,
  MoviePreferences,
  SeededRNG
} from '../types.js';
import {
  weightedSampleFromRecord,
  bernoulliSample,
  uniformSample
} from '../core/sampler.js';

/** Regional cinema languages by state */
const STATE_CINEMA_LANGUAGE: Record<string, string> = {
  tamil_nadu: 'Tamil', kerala: 'Malayalam', karnataka: 'Kannada',
  andhra_pradesh: 'Telugu', telangana: 'Telugu', west_bengal: 'Bengali',
  maharashtra: 'Marathi', gujarat: 'Gujarati', odisha: 'Odia',
  punjab: 'Punjabi', assam: 'Assamese', bihar: 'Bhojpuri',
  uttar_pradesh: 'Bhojpuri', jharkhand: 'Bhojpuri', goa: 'Konkani',
  himachal_pradesh: 'Hindi', delhi: 'Hindi', haryana: 'Hindi',
  rajasthan: 'Hindi', madhya_pradesh: 'Hindi', chhattisgarh: 'Hindi',
  uttarakhand: 'Hindi', jammu_kashmir: 'Kashmiri'
};

const ANIME_TITLES = [
  'Naruto', 'Dragon Ball Z', 'One Piece', 'Attack on Titan', 'Demon Slayer',
  'Death Note', 'Jujutsu Kaisen', 'Pokémon', 'Haikyuu!!', 'Spy x Family',
  'Chainsaw Man', 'My Hero Academia', 'Tokyo Revengers', 'Bleach',
  'Your Name', 'Spirited Away', 'Weathering With You', 'Suzume'
];

const ANIME_GENRES = [
  'Shonen action', 'Slice of life', 'Sports', 'Romance',
  'Supernatural horror', 'Fantasy adventure', 'Mecha', 'Comedy'
];

/**
 * Generate movie/anime viewing preferences for a profile.
 */
export function generateMoviePreferences(
  gender: Gender,
  age: number,
  education: EducationLevel,
  areaType: AreaType,
  stateId: string,
  motherTongue: string,
  hasSmartphone: boolean,
  income: number,
  rng: SeededRNG
): MoviePreferences {
  const isYouth = age <= 30;

  // ── Primary platform ──
  let platformDist: Record<string, number>;
  if (isYouth && areaType === 'urban' && hasSmartphone) {
    platformDist = { ott: 45, youtube: 25, theatre: 15, television: 10, none: 5 };
  } else if (areaType === 'rural') {
    platformDist = { television: 45, youtube: 15, theatre: 10, ott: 8, none: 22 };
  } else {
    platformDist = { television: 30, ott: 30, youtube: 15, theatre: 10, none: 15 };
  }
  if (income < 100000) platformDist.ott *= 0.4;
  const { key: primaryPlatform } = weightedSampleFromRecord(platformDist, rng);

  // ── Watch frequency ──
  const freqDist: Record<string, number> = {
    daily: isYouth ? 30 : 15,
    weekly: 40,
    occasional: areaType === 'rural' ? 20 : 25,
    rare: areaType === 'rural' ? 15 : 10
  };
  const { key: watchFrequency } = weightedSampleFromRecord(freqDist, rng);

  // ── Favorite languages ──
  const languages: string[] = [];
  const regional = STATE_CINEMA_LANGUAGE[stateId] ?? motherTongue;
  if (regional && regional !== 'Hindi' && regional !== 'English') {
    languages.push(regional);
  }
  if (motherTongue && !languages.includes(motherTongue)) {
    languages.push(motherTongue);
  }
  if (areaType === 'urban' && (education === 'graduate' || education === 'postgraduate')) {
    if (rng.next() < 0.8) languages.push('English');
    if (rng.next() < 0.6) languages.push('Hindi');
  } else if (languages.length < 2) {
    // Hindi reaches almost everywhere through cinema
    if (languages[0] !== 'Hindi' && rng.next() < 0.7) languages.push('Hindi');
  }
  if (languages.length === 0) languages.push('Hindi');

  // ── Genres ──
  const genreWeights: Record<string, number> = {
    Action: gender === 'male' ? 30 : 12,
    Comedy: 22,
    Romance: gender === 'female' ? 25 : 10,
    Drama: 15,
    Thriller: 10,
    Horror: isYouth ? 8 : 3,
    'Sci-Fi': isYouth && areaType === 'urban' ? 12 : 4,
    'Historical/Biopic': age > 40 ? 15 : 6,
    'Crime': 6,
    'Musical/Dance': gender === 'female' && areaType === 'urban' ? 10 : 3,
    'Animation/Family': age > 35 || age < 13 ? 12 : 4
  };
  const genres: string[] = [];
  const genreCount = 2 + Math.floor(rng.next() * 3); // 2-4 genres
  for (let i = 0; i < genreCount && Object.keys(genreWeights).length > 0; i++) {
    const { key } = weightedSampleFromRecord(genreWeights, rng);
    genres.push(key);
    delete genreWeights[key];
  }

  // ── Anime ──
  // Anime fandom is concentrated among urban youth with internet access
  let animeBase = 0.02;
  if (isYouth) animeBase += 0.10;
  if (areaType === 'urban') animeBase += 0.06;
  if (hasSmartphone) animeBase += 0.06;
  if (education === 'graduate' || education === 'postgraduate') animeBase += 0.03;
  if (gender === 'male') animeBase += 0.02;
  const anime = bernoulliSample(Math.min(animeBase, 0.35), rng);

  let animePreferences: string[] | undefined;
  let favoriteAnimeTitles: string[] | undefined;
  if (anime) {
    const prefCount = 1 + Math.floor(rng.next() * 3);
    const pool = [...ANIME_GENRES];
    animePreferences = [];
    for (let i = 0; i < prefCount && pool.length > 0; i++) {
      animePreferences.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
    }
    const titleCount = 2 + Math.floor(rng.next() * 3);
    const titlePool = [...ANIME_TITLES];
    favoriteAnimeTitles = [];
    for (let i = 0; i < titleCount && titlePool.length > 0; i++) {
      favoriteAnimeTitles.push(titlePool.splice(Math.floor(rng.next() * titlePool.length), 1)[0]);
    }
  }

    return {
    genres,
    favoriteLanguages: languages.slice(0, 3),
    anime,
    ...(anime ? { animePreferences, favoriteAnimeTitles } : {}),
    primaryPlatform: primaryPlatform as MoviePreferences['primaryPlatform'],
    watchFrequency: watchFrequency as MoviePreferences['watchFrequency']
  };
}