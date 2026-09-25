/**
 * Roman-to-Indic Transliteration Engine (v2.1.0, item 1)
 *
 * Simplified ITRANS-style scheme: plain ASCII names ("Pushpa", "Singh")
 * render into nine Indic scripts. Deterministic pure functions — no RNG —
 * so transliterated output never disturbs seeded generation.
 *
 * Deliberate simplifications (documented, not bugs): dental t/d/n by
 * default (no retroflex detection), anusvara for most nasal+plosive
 * clusters, final -i defaults long, medial vowel length unpredictable
 * from plain ASCII.
 */

// ── Script tables ────────────────────────────────────────────
// Each table: independent vowels, dependent vowel signs (matras),
// consonant base letters, virama, anusvara, nukta (null where unsupported).

interface ScriptTable {
  vowels: Record<string, string>;
  signs: Record<string, string>;
  consonants: Record<string, string>;
  virama: string;
  anusvara: string;
  nukta: string | null;
  /** Word-final bare-letter overrides, e.g. Malayalam chillu */
  finalForms?: Record<string, string>;
  /** Vocalic R for word-initial ri + consonant (Rishi, Ritu) */
  vocalicR: string;
  /** Dependent vocalic-R sign for sri clusters (Srishti); null → ra + i-sign */
  vocalicRSign: string | null;
  /** Tamil-style: ngh renders as bare ng + pulli (Singh → சிங், no ha) */
  dropNghH?: boolean;
  /** Gurmukhi-style: ngh renders as bindi + gha (Singh → ਸਿੰਘ) */
  binduGhForNgh?: boolean;
}

const DEVANAGARI: ScriptTable = {
  vowels: { a: 'अ', aa: 'आ', i: 'इ', ee: 'ई', u: 'उ', oo: 'ऊ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ' },
  signs: { aa: 'ा', i: 'ि', ee: 'ी', u: 'ु', oo: 'ू', e: 'े', ai: 'ै', o: 'ो', au: 'ौ' },
  consonants: {
    k: 'क', kh: 'ख', g: 'ग', gh: 'घ', ng: 'ङ',
    c: 'च', ch: 'च', chh: 'छ', j: 'ज', jh: 'झ', ny: 'ञ',
    t: 'त', th: 'थ', d: 'द', dh: 'ध', n: 'न',
    p: 'प', ph: 'फ', b: 'ब', bh: 'भ', m: 'म',
    y: 'य', r: 'र', l: 'ल', v: 'व',
    sh: 'श', ssa: 'ष', s: 'स', h: 'ह',
    ksh: 'क्ष', gy: 'ज्ञ', x: 'क्ष',
    f: 'फ', z: 'ज', q: 'क',
  },
  virama: '्', anusvara: 'ं', nukta: '़', vocalicR: 'ऋ', vocalicRSign: 'ृ',
};

const BENGALI: ScriptTable = {
  vowels: { a: 'অ', aa: 'আ', i: 'ই', ee: 'ঈ', u: 'উ', oo: 'ঊ', e: 'এ', ai: 'ঐ', o: 'ও', au: 'ঔ' },
  signs: { aa: 'া', i: 'ি', ee: 'ী', u: 'ু', oo: 'ূ', e: 'ে', ai: 'ৈ', o: 'ো', au: 'ৌ' },
  consonants: {
    k: 'ক', kh: 'খ', g: 'গ', gh: 'ঘ', ng: 'ঙ',
    c: 'চ', ch: 'চ', chh: 'ছ', j: 'জ', jh: 'ঝ', ny: 'ঞ',
    t: 'ত', th: 'থ', d: 'দ', dh: 'ধ', n: 'ন',
    p: 'প', ph: 'ফ', b: 'ব', bh: 'ভ', m: 'ম',
    y: 'য', r: 'র', l: 'ল', v: 'ব',
    sh: 'শ', ssa: 'ষ', s: 'স', h: 'হ',
    ksh: 'ক্ষ', gy: 'জ্ঞ', x: 'ক্ষ',
    f: 'ফ', z: 'জ', q: 'ক',
  },
  virama: '্', anusvara: 'ং', nukta: null, vocalicR: 'ঋ', vocalicRSign: 'ৃ',
};

const GUJARATI: ScriptTable = {
  vowels: { a: 'અ', aa: 'આ', i: 'ઇ', ee: 'ઈ', u: 'ઉ', oo: 'ઊ', e: 'એ', ai: 'ઐ', o: 'ઓ', au: 'ઔ' },
  signs: { aa: 'ા', i: 'િ', ee: 'ી', u: 'ુ', oo: 'ૂ', e: 'ે', ai: 'ૈ', o: 'ો', au: 'ૌ' },
  consonants: {
    k: 'ક', kh: 'ખ', g: 'ગ', gh: 'ઘ', ng: 'ઙ',
    c: 'ચ', ch: 'ચ', chh: 'છ', j: 'જ', jh: 'ઝ', ny: 'ઞ',
    t: 'ત', th: 'થ', d: 'દ', dh: 'ધ', n: 'ન',
    p: 'પ', ph: 'ફ', b: 'બ', bh: 'ભ', m: 'મ',
    y: 'ય', r: 'ર', l: 'લ', v: 'વ',
    sh: 'શ', ssa: 'ષ', s: 'સ', h: 'હ',
    ksh: 'ક્ષ', gy: 'જ્ઞ', x: 'ક્ષ',
    f: 'ફ', z: 'જ', q: 'ક',
  },
  virama: '્', anusvara: 'ં', nukta: null, vocalicR: 'ઋ', vocalicRSign: 'ૃ',
};

const GURMUKHI: ScriptTable = {
  vowels: { a: 'ਅ', aa: 'ਆ', i: 'ਇ', ee: 'ਈ', u: 'ਉ', oo: 'ਊ', e: 'ਏ', ai: 'ਐ', o: 'ਓ', au: 'ਔ' },
  signs: { aa: 'ਾ', i: 'ਿ', ee: 'ੀ', u: 'ੁ', oo: 'ੂ', e: 'ੇ', ai: 'ੈ', o: 'ੋ', au: 'ੌ' },
  consonants: {
    k: 'ਕ', kh: 'ਖ', g: 'ਗ', gh: 'ਘ', ng: 'ਙ',
    c: 'ਚ', ch: 'ਚ', chh: 'ਛ', j: 'ਜ', jh: 'ਝ', ny: 'ਞ',
    t: 'ਤ', th: 'ਥ', d: 'ਦ', dh: 'ਧ', n: 'ਨ',
    p: 'ਪ', ph: 'ਫ', b: 'ਬ', bh: 'ਭ', m: 'ਮ',
    y: 'ਯ', r: 'ਰ', l: 'ਲ', v: 'ਵ',
    sh: 'ਸ਼', ssa: 'ਸ਼', s: 'ਸ', h: 'ਹ',
    ksh: 'ਕਸ਼', gy: 'ਗਯ', x: 'ਕਸ',
    f: 'ਫ', z: 'ਜ਼', q: 'ਕ',
  },
  virama: '੍', anusvara: 'ੰ', nukta: '਼', vocalicR: 'ਰਿ', vocalicRSign: null,
  dropNghH: true, binduGhForNgh: true,
};

const KANNADA: ScriptTable = {
  vowels: { a: 'ಅ', aa: 'ಆ', i: 'ಇ', ee: 'ಈ', u: 'ಉ', oo: 'ಊ', e: 'ಎ', ai: 'ಐ', o: 'ಒ', au: 'ಔ' },
  signs: { aa: 'ಾ', i: 'ಿ', ee: 'ೀ', u: 'ು', oo: 'ೂ', e: 'ೆ', ai: 'ೈ', o: 'ೋ', au: 'ೌ' },
  consonants: {
    k: 'ಕ', kh: 'ಖ', g: 'ಗ', gh: 'ಘ', ng: 'ಙ',
    c: 'ಚ', ch: 'ಚ', chh: 'ಛ', j: 'ಜ', jh: 'ಝ', ny: 'ಞ',
    t: 'ತ', th: 'ಥ', d: 'ದ', dh: 'ಧ', n: 'ನ',
    p: 'ಪ', ph: 'ಫ', b: 'ಬ', bh: 'ಭ', m: 'ಮ',
    y: 'ಯ', r: 'ರ', l: 'ಲ', v: 'ವ',
    sh: 'ಶ', ssa: 'ಷ', s: 'ಸ', h: 'ಹ',
    ksh: 'ಕ್ಷ', gy: 'ಜ್ಞ', x: 'ಕ್ಷ',
    f: 'ಫ', z: 'ಜ', q: 'ಕ',
  },
  virama: '್', anusvara: 'ಂ', nukta: null, vocalicR: 'ಋ', vocalicRSign: 'ೃ',
};

const MALAYALAM: ScriptTable = {
  vowels: { a: 'അ', aa: 'ആ', i: 'ഇ', ee: 'ഈ', u: 'ഉ', oo: 'ഊ', e: 'എ', ai: 'ഐ', o: 'ഒ', au: 'ഔ' },
  signs: { aa: 'ാ', i: 'ി', ee: 'ീ', u: 'ു', oo: 'ൂ', e: 'െ', ai: 'ൈ', o: 'ോ', au: 'ൌ' },
  consonants: {
    k: 'ക', kh: 'ഖ', g: 'ഗ', gh: 'ഘ', ng: 'ങ്ങ',
    c: 'ച', ch: 'ച', chh: 'ഛ', j: 'ജ', jh: 'ഝ', ny: 'ഞ്ഞ',
    t: 'ത', th: 'ഥ', d: 'ദ', dh: 'ധ', n: 'ന',
    p: 'പ', ph: 'ഫ', b: 'ബ', bh: 'ഭ', m: 'മ',
    y: 'യ', r: 'ര', l: 'ല', v: 'വ',
    sh: 'ശ', ssa: 'ഷ', s: 'സ', h: 'ഹ',
    ksh: 'ക്ഷ', gy: 'ജ്ഞ', x: 'ക്ഷ',
    f: 'ഫ', z: 'ജ', q: 'ക',
  },
  virama: '്', anusvara: 'ം', nukta: null, vocalicR: 'ഋ', vocalicRSign: 'ൃ',
  finalForms: { n: 'ൻ', r: 'ർ', l: 'ൽ' },
};

const TAMIL: ScriptTable = {
  vowels: { a: 'அ', aa: 'ஆ', i: 'இ', ee: 'ஈ', u: 'உ', oo: 'ஊ', e: 'எ', ai: 'ஐ', o: 'ஒ', au: 'ஔ' },
  signs: { aa: 'ா', i: 'ி', ee: 'ீ', u: 'ு', oo: 'ூ', e: 'ெ', ai: 'ை', o: 'ோ', au: 'ௌ' },
  consonants: {
    k: 'க', kh: 'க', g: 'க', gh: 'க', ng: 'ங',
    c: 'ச', ch: 'ச', chh: 'ச', j: 'ஜ', jh: 'ஜ', ny: 'ஞ',
    t: 'த', th: 'த', d: 'த', dh: 'த', n: 'ந',
    p: 'ப', ph: 'ப', b: 'ப', bh: 'ப', m: 'ம',
    y: 'ய', r: 'ர', l: 'ல', v: 'வ',
    sh: 'ஷ', ssa: 'ஷ', s: 'ஸ', h: 'ஹ',
    ksh: 'க்ஷ', gy: 'க்ய', x: 'க்ஸ',
    f: 'ஃப', z: 'ஜ', q: 'க',
  },
  virama: '்', anusvara: 'ங்', nukta: null, vocalicR: 'ரி', vocalicRSign: null,
  dropNghH: true,
};

const TELUGU: ScriptTable = {
  vowels: { a: 'అ', aa: 'ఆ', i: 'ఇ', ee: 'ఈ', u: 'ఉ', oo: 'ఊ', e: 'ఎ', ai: 'ఐ', o: 'ఒ', au: 'ఔ' },
  signs: { aa: 'ా', i: 'ి', ee: 'ీ', u: 'ు', oo: 'ూ', e: 'ె', ai: 'ై', o: 'ో', au: 'ౌ' },
  consonants: {
    k: 'క', kh: 'ఖ', g: 'గ', gh: 'ఘ', ng: 'ఙ',
    c: 'చ', ch: 'చ', chh: 'ఛ', j: 'జ', jh: 'ఝ', ny: 'ఞ',
    t: 'త', th: 'థ', d: 'ద', dh: 'ధ', n: 'న',
    p: 'ప', ph: 'ఫ', b: 'బ', bh: 'భ', m: 'మ',
    y: 'య', r: 'ర', l: 'ల', v: 'వ',
    sh: 'శ', ssa: 'ష', s: 'స', h: 'హ',
    ksh: 'క్ష', gy: 'జ్ఞ', x: 'క్ష',
    f: 'ఫ', z: 'జ', q: 'క',
  },
  virama: '్', anusvara: 'ం', nukta: null, vocalicR: 'ఋ', vocalicRSign: 'ృ',
};

const ODIA: ScriptTable = {
  vowels: { a: 'ଅ', aa: 'ଆ', i: 'ଇ', ee: 'ଈ', u: 'ଉ', oo: 'ଊ', e: 'ଏ', ai: 'ଐ', o: 'ଓ', au: 'ଔ' },
  signs: { aa: 'ା', i: 'ି', ee: 'ୀ', u: 'ୁ', oo: 'ୂ', e: 'େ', ai: 'ୈ', o: 'ୋ', au: 'ୌ' },
  consonants: {
    k: 'କ', kh: 'ଖ', g: 'ଗ', gh: 'ଘ', ng: 'ଙ',
    c: 'ଚ', ch: 'ଚ', chh: 'ଛ', j: 'ଜ', jh: 'ଝ', ny: 'ଞ',
    t: 'ତ', th: 'ଥ', d: 'ଦ', dh: 'ଧ', n: 'ନ',
    p: 'ପ', ph: 'ଫ', b: 'ବ', bh: 'ଭ', m: 'ମ',
    y: 'ଯ', r: 'ର', l: 'ଲ', v: 'ଵ',
    sh: 'ଶ', ssa: 'ଷ', s: 'ସ', h: 'ହ',
    ksh: 'କ୍ଷ', gy: 'ଜ୍ଞ', x: 'କ୍ସ',
    f: 'ଫ', z: 'ଜ', q: 'କ',
  },
  virama: '୍', anusvara: 'ଂ', nukta: null, vocalicR: 'ଋ', vocalicRSign: 'ୃ',
};

/** Supported script names */
export type ScriptName =
  | 'Devanagari' | 'Bengali' | 'Gujarati' | 'Gurmukhi' | 'Kannada'
  | 'Malayalam' | 'Tamil' | 'Telugu' | 'Odia' | 'Latin';

const TABLES: Record<Exclude<ScriptName, 'Latin'>, ScriptTable> = {
  Devanagari: DEVANAGARI,
  Bengali: BENGALI,
  Gujarati: GUJARATI,
  Gurmukhi: GURMUKHI,
  Kannada: KANNADA,
  Malayalam: MALAYALAM,
  Tamil: TAMIL,
  Telugu: TELUGU,
  Odia: ODIA,
};

/** Mother tongue (lowercase) → native script. Unlisted → Latin passthrough. */
const LANGUAGE_SCRIPT: Record<string, ScriptName> = {
  hindi: 'Devanagari', marathi: 'Devanagari', nepali: 'Devanagari',
  dogri: 'Devanagari', konkani: 'Devanagari', sindhi: 'Devanagari',
  maithili: 'Devanagari', bhojpuri: 'Devanagari', magahi: 'Devanagari',
  awadhi: 'Devanagari', chhattisgarhi: 'Devanagari', rajasthani: 'Devanagari',
  garhwali: 'Devanagari', kumaoni: 'Devanagari', pahari: 'Devanagari',
  bhili: 'Devanagari', gondi: 'Devanagari', kinnauri: 'Devanagari',
  bengali: 'Bengali', assamese: 'Bengali',
  gujarati: 'Gujarati',
  punjabi: 'Gurmukhi',
  kannada: 'Kannada', tulu: 'Kannada',
  malayalam: 'Malayalam',
  tamil: 'Tamil',
  telugu: 'Telugu',
  odia: 'Odia',
};

/** Script for a mother-tongue value ('Hindi', 'Bengali', ...). */
export function scriptForLanguage(motherTongue: string): ScriptName {
  return LANGUAGE_SCRIPT[motherTongue.trim().toLowerCase()] ?? 'Latin';
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const CONSONANTS = new Set('bcdfghjklmnpqrstvwxyz'.split(''));

/** Roman clusters that take anusvara before them (nasal + plosive/sibilant) */
const ANUSVARA_BEFORE = new Set([
  'k', 'kh', 'g', 'gh', 'c', 'ch', 'j', 'jh',
  't', 'th', 'd', 'dh', 'p', 'ph', 'b', 'bh', 's', 'sh', 'h',
]);

function isVowelKey(s: string, i: number): string | null {
  for (const len of [2, 1]) {
    const chunk = s.slice(i, i + len);
    if (chunk === 'aa' || chunk === 'ai' || chunk === 'au' ||
        chunk === 'ee' || chunk === 'oo' || VOWELS.has(chunk)) {
      return chunk;
    }
  }
  return null;
}

function isConsonantKey(s: string, i: number): string | null {
  for (const len of [3, 2, 1]) {
    const chunk = s.slice(i, i + len);
    if (chunk === 'ksh' || chunk === 'ngh' || chunk === 'chh') return chunk;
    if (len === 2 && (chunk === 'kh' || chunk === 'gh' || chunk === 'ch' ||
      chunk === 'jh' || chunk === 'th' || chunk === 'dh' || chunk === 'ph' ||
      chunk === 'bh' || chunk === 'sh' || chunk === 'gy')) {
      return chunk;
    }
    if (len === 1 && CONSONANTS.has(chunk)) return chunk;
  }
  return null;
}

/**
 * Should a halant join two adjacent consonants? Only standard conjunct
 * clusters take one (Sneha, Swati, Pushpa, Shukla, geminates like Chennai).
 * Open syllables like Rajnath or Anwar never do.
 */
function needsHalant(c1: string, c2: string): boolean {
  if (c1.length === 1 && c2.startsWith(c1)) return true; // geminates: Chennai, Anna
  const h1 = c1 === 'sh' ? 's' : c1;
  if (h1 === 's') return true; // s-clusters incl ṣa clusters: Swa, Sna, Pushpa
  if (h1 === 'ksh') return true; // Lakshmi
  if (h1 === 'k' && (c2[0] === 'l' || c2[0] === 'm')) return true; // Shukla, Rukmani
  if (h1 === 'g' && c2[0] === 'n') return true; // Agni
  if ((h1 === 't' || h1 === 'p') && c2[0] === 's') return true; // Utsav, Apsara
  if (c1 === 'n' || c1 === 'm') return false;
  const head = c2[0];
  if (head === 'n' || head === 'm' || head === 'y' || head === 'r' ||
      head === 'l' || head === 'v' || head === 'h') {
    return false;
  }
  return false;
}

/** Transliterate one lowercase letter-run into a script table. */
function transliterateRun(run: string, t: ScriptTable): string {
  let out = '';
  let i = 0;
  const n = run.length;
  let afterVocalicR = false;
  const atStart = () => out === '';

  while (i < n) {
    const justHadVocalicR = afterVocalicR;
    afterVocalicR = false;
    // initial s + r + i → Sanskritic Sru (Srishti)
    if (atStart() && run.startsWith('sri', i) && i + 3 <= n) {
      if (t.vocalicRSign) {
        out += t.consonants['s'] + t.vocalicRSign;
      } else {
        out += t.consonants['s'] + t.virama + t.consonants['r'] + t.signs['i'];
      }
      i += 3;
      continue;
    }
    // word-initial ri + consonant → vocalic R (Rishi, Ritu)
    if (atStart() && run.startsWith('ri', i) && i + 2 < n && CONSONANTS.has(run[i + 2])) {
      out += t.vocalicR;
      afterVocalicR = true;
      i += 2;
      continue;
    }
    // ngh → anusvara + ha (Singh); Tamil drops the ha, Gurmukhi
    // writes bindi + gha
    if (run.startsWith('ngh', i)) {
      if (t.binduGhForNgh) {
        out += t.anusvara + t.consonants['gh'];
      } else {
        out += t.anusvara;
        if (!t.dropNghH) out += t.consonants['h'];
      }
      i += 3;
      continue;
    }
    // repha: r + consonant → ra + halant (Sharma)
    if (run[i] === 'r' && i + 1 < n && CONSONANTS.has(run[i + 1]) && run[i + 1] !== 'r' && run[i + 1] !== 'h') {
      out += t.consonants['r'] + t.virama;
      i += 1;
      continue;
    }
    // nasal + plosive/sibilant → anusvara (Pant, Mumbai)
    if ((run[i] === 'n' || run[i] === 'm') && i + 1 < n) {
      const ck = isConsonantKey(run, i + 1);
      if (ck && ANUSVARA_BEFORE.has(ck) && !(run[i] === 'n' && (ck === 'y' || ck === 'r' || ck === 'l' || ck === 'v'))) {
        out += t.anusvara;
        i += 1;
        continue;
      }
    }
    const vk = isVowelKey(run, i);
    if (vk) {
      // Final -a/-ai/-i in Hindi names are conventionally long
      // (Pushpa→पुष्पा, Mumbai→मुंबई, Rani→रानी). Medial stays short.
      const isFinalV = i + vk.length === n;
      if (atStart()) {
        out += t.vowels[vk] ?? vk;
      } else if (vk === 'a') {
        if (isFinalV) out += t.signs['aa'] ?? '';
      } else if (vk === 'ai' && isFinalV) {
        out += t.signs['ee'] ?? '';
      } else if (vk === 'i' && isFinalV) {
        out += t.signs['ee'] ?? '';
      } else {
        out += t.signs[vk] ?? '';
      }
      i += vk.length;
      continue;
    }
    const ck0 = isConsonantKey(run, i);
    if (ck0) {
      // w is just v in Indic scripts (Sawant)
      const ck = ck0 === 'w' ? 'v' : ck0;
      // sh before p/t/k/n is really ṣa (Pushpa, Krishna);
      // sh right after vocalic R too (Rishi)
      const useSsa = ck === 'sh' && (justHadVocalicR || (() => {
        const nk = isConsonantKey(run, i + 2);
        return nk === 'p' || nk === 't' || nk === 'k' || nk === 'n';
      })());
      let letter = (useSsa ? t.consonants['ssa'] : undefined) ?? t.consonants[ck] ?? ck;
      // Tamil s before a vowel is ச (Singh, Suresh), before a consonant ஸ் (Stanley)
      if (t === TAMIL && ck === 's') {
        letter = isVowelKey(run, i + 1) ? 'ச' : 'ஸ';
      }
      // nukta consonants where supported (Faiz, Qasim)
      if ((ck === 'f' || ck === 'z' || ck === 'q') && t.nukta) {
        letter += t.nukta;
      }
      // C + y + vowel → ligature. A ya-ligature + 'a' always takes
      // explicit ा (Gaya, Kanya, Divya), unlike tra-ligatures (Mitra).
      if (i + ck.length + 1 < n && run[i + ck.length] === 'y') {
        const yv = isVowelKey(run, i + ck.length + 1);
        if (yv) {
          out += letter + t.virama + t.consonants['y'];
          if (yv === 'a') {
            out += t.signs['aa'] ?? '';
          } else {
            out += t.signs[yv] ?? '';
          }
          i += ck.length + 1 + yv.length;
          continue;
        }
      }
      // C + r + vowel → tra-ligature (Prakash)
      if (i + ck.length + 1 < n && run[i + ck.length] === 'r') {
        const rv = isVowelKey(run, i + ck.length + 1);
        if (rv) {
          out += letter + t.virama + t.consonants['r'];
          if (rv !== 'a') out += t.signs[rv] ?? '';
          i += ck.length + 1 + rv.length;
          continue;
        }
      }
      // word-final consonant: bare letter, or chillu where defined.
      // (Medial vowel length is unpredictable from plain ASCII, so final
      // aspirates stay bare too: Nath reads fine either way.)
      const isFinal = i + ck.length === n;
      if (isFinal && t.finalForms && t.finalForms[ck]) {
        out += t.finalForms[ck];
      } else {
        out += letter;
        // medial consonant cluster → halant only for standard conjuncts
        if (!isFinal) {
          const nk = isConsonantKey(run, i + ck.length);
          if (nk && needsHalant(ck, nk)) out += t.virama;
        }
      }
      i += ck.length;
      continue;
    }
    // unknown char: skip
    i += 1;
  }
  return out;
}

/**
 * Transliterate Roman text into an Indic script.
 * Letter runs are converted; digits, spaces and punctuation pass through.
 * 'Latin' returns the input unchanged.
 */
export function transliterate(text: string, script: ScriptName): string {
  if (script === 'Latin' || !text) return text;
  const t = TABLES[script];
  if (!t) return text;
  return text.replace(/[A-Za-z]+/g, run => transliterateRun(run.toLowerCase(), t));
}

/** Does this text contain Indic-script characters from the supported blocks? */
export function containsIndic(text: string): boolean {
  return /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(text);
}
