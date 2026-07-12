import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'database', 'namesData.ts');

interface NameEntry {
  name: string;
  weight: number;
  gender: 'male' | 'female' | 'unisex';
}

interface NamesDB {
  hindu: Record<string, Record<'male' | 'female' | 'other', NameEntry[]>>;
  muslim: Record<string, Record<'male' | 'female' | 'other', NameEntry[]>>;
  christian: Record<string, Record<'male' | 'female' | 'other', NameEntry[]>>;
  sikh: Record<string, Record<'male' | 'female' | 'other', NameEntry[]>>;
  buddhist: Record<string, Record<'male' | 'female' | 'other', NameEntry[]>>;
  jain: Record<string, Record<'male' | 'female' | 'other', NameEntry[]>>;
}

// Clean names: strip honorifics, extract first word, capitalize properly
function cleanName(rawName: string): string {
  if (!rawName) return '';
  
  let cleaned = rawName.toLowerCase().trim();
  
  // Strip common honorifics and prefixes
  const honorifics = [
    /^smt\.?\s+/, /^shri\.?\s+/, /^sh\.?\s+/, /^km\.?\s+/, /^late\s+/, 
    /^mr\.?\s+/, /^mrs\.?\s+/, /^dr\.?\s+/, /^kumar\s+/, /^kumari\s+/
  ];
  
  for (const regex of honorifics) {
    cleaned = cleaned.replace(regex, '');
  }
  
  // Extract first word
  const firstWord = cleaned.split(/[\s\-]+/)[0];
  
  // Clean special characters
  const alphabeticOnly = firstWord.replace(/[^a-z]/g, '');
  
  if (alphabeticOnly.length < 2) return '';
  
  // Capitalize first letter
  return alphabeticOnly.charAt(0).toUpperCase() + alphabeticOnly.slice(1);
}

// Classify name by religion based on prefix/suffix rules
function classifyReligion(name: string, isMale: boolean): keyof NamesDB {
  const lower = name.toLowerCase();
  
  // 1. Sikh Rules
  const sikhSuffixes = ['preet', 'jeet', 'meet', 'seen', 'leen', 'deep', 'bir', 'want', 'pal', 'jit', 'inder', 'vir', 'singh', 'kaur'];
  const sikhPrefixes = ['gur', 'har', 'man', 'jas', 'dal', 'sur', 'kul', 'bal', 'nav', 'sim'];
  if (sikhSuffixes.some(s => lower.endsWith(s)) || sikhPrefixes.some(p => lower.startsWith(p))) {
    return 'sikh';
  }
  
  // 2. Muslim Rules
  const muslimRoots = [
    'mohammed', 'mohammad', 'muhammad', 'ahmad', 'ahmed', 'ali', 'ibrahim', 'imran', 'arshad', 'farhan',
    'waseem', 'nadeem', 'salman', 'irfan', 'asif', 'shahid', 'riyaz', 'zaid', 'aamir', 'faisal', 'hamza',
    'bilal', 'usman', 'junaid', 'altaf', 'shakeel', 'rizwan', 'fatima', 'aisha', 'zainab', 'mariam', 'sana',
    'nazia', 'shabnam', 'rukhsar', 'yasmin', 'nafisa', 'salma', 'rehana', 'hina', 'amreen', 'sadiya', 'noor',
    'sara', 'ayesha', 'rahman', 'khan', 'syed', 'ansari', 'iqbal', 'latif', 'hafiz', 'tariq', 'farooq',
    'sajad', 'mushtaq', 'ghulam', 'javed', 'bashir', 'nighat', 'shafiqa', 'shameema', 'naseema', 'dilshada',
    'rukhsana', 'habeeb', 'anas', 'mujeeb', 'ashraf', 'shihab', 'noushad', 'amina', 'safeera', 'shamna',
    'jasna', 'bushra'
  ];
  if (muslimRoots.some(r => lower.includes(r))) {
    return 'muslim';
  }
  
  // 3. Christian Rules
  const christianRoots = [
    'john', 'joseph', 'thomas', 'george', 'david', 'samuel', 'philip', 'michael', 'anthony', 'robert',
    'francis', 'peter', 'daniel', 'james', 'stephen', 'mary', 'sarah', 'elizabeth', 'grace', 'martha',
    'rebecca', 'ann', 'rose', 'agnes', 'teresa', 'alice', 'rachel', 'fernandes', 'souza', 'pereira',
    'rodrigues', 'lobo', 'pinto', 'dias', 'almeida', 'kuriakose', 'varghese', 'chacko', 'mathew', 'abraham',
    'kurien', 'philip', 'george', 'lincy', 'molly', 'sherly', 'jessy', 'mini', 'bindu'
  ];
  if (christianRoots.some(r => lower.includes(r))) {
    return 'christian';
  }
  
  // 4. Buddhist & Jain Rules
  const budJainRoots = ['siddharth', 'ashok', 'milind', 'mahavir', 'shantilal', 'bodhi', 'gautam', 'gautami', 'hemant'];
  if (budJainRoots.some(r => lower.includes(r))) {
    return 'buddhist'; // Buddhist and Jain fallback
  }

  // 5. Default
  return 'hindu';
}

// Classify Hindu names into regional bins
function classifyRegion(name: string): string {
  const lower = name.toLowerCase();
  
  // 1. South (Tamil Nadu, Kerala, Karnataka, Andhra, Telangana)
  const southIndicators = [
    'venkat', 'srinivas', 'narasimha', 'rambabu', 'srikanth', 'subrahmanyam', 'padmavati', 'varalakshmi',
    'karthik', 'aravind', 'senthil', 'kumaran', 'ramachandran', 'saravanan', 'preethi', 'kavitha', 'saranya',
    'aswathy', 'sreelakshmi', 'amrutha', 'gopika', 'parvathy', 'unnikrishnan', 'biju', 'basavaraj', 'manjunath',
    'shivaraj', 'latha', 'netravathi', 'girija', 'hegde', 'nayak', 'gowda', 'shetty', 'pillai', 'nair', 'menon'
  ];
  if (southIndicators.some(i => lower.includes(i)) || lower.endsWith('an') || lower.endsWith('ayya') || lower.endsWith('aiah') || lower.endsWith('appa')) {
    return 'south';
  }
  
  // 2. East (West Bengal, Odisha, Assam, Northeast)
  const eastIndicators = [
    'sourav', 'anirban', 'debashis', 'subhajit', 'arijit', 'sayan', 'suman', 'dipankar', 'prosenjit',
    'arpita', 'sayantika', 'moumita', 'swarnali', 'debjani', 'poulami', 'rituparna', 'subrat', 'sambit',
    'pinaki', 'chinmay', 'satyajit', 'lipika', 'priyambada', 'itishree', 'mridul', 'ratul', 'junali',
    'bornali', 'patnaik', 'mohanty', 'chatterjee', 'mukherjee', 'banerjee', 'bose', 'ghosh', 'dutta', 'tenzing',
    'lobsang', 'wangdi', 'dorjee', 'zoram', 'lalthanzara', 'ningthoujam', 'joykumar', 'kiren', 'sangma', 'marak'
  ];
  if (eastIndicators.some(i => lower.includes(i)) || lower.endsWith('it') || lower.endsWith('is') || lower.endsWith('ul') || lower.endsWith('ab')) {
    return 'east';
  }
  
  // 3. North (Punjab, Haryana, Jammu & Kashmir, Delhi, Uttarakhand)
  const northIndicators = [
    'satbir', 'joginder', 'dharamvir', 'ranbir', 'balwan', 'rajbir', 'jaivir', 'satyawan', 'savita',
    'darshana', 'inder', 'vir', 'preet', 'jeet', 'rawat', 'negi', 'bisht', 'bhandari', 'joshi', 'pant',
    'bhatt', 'gairola', 'semwal', 'dobhal', 'dogra', 'kashmiri', 'pandit'
  ];
  if (northIndicators.some(i => lower.includes(i)) || lower.endsWith('bir') || lower.endsWith('want') || lower.endsWith('pal') || lower.endsWith('deep')) {
    return 'north';
  }

  // 4. West (Maharashtra, Gujarat, Rajasthan, Goa)
  const westIndicators = [
    'sachin', 'ganesh', 'suhas', 'tushar', 'ajinkya', 'rohan', 'amol', 'vishal', 'mahesh', 'vaibhav',
    'swapnil', 'omkar', 'manasi', 'gauri', 'supriya', 'ashwini', 'madhuri', 'sonali', 'shweta', 'rutuja',
    'prajakta', 'harsh', 'chirag', 'dhruv', 'jay', 'keval', 'neel', 'parth', 'darshan', 'bhavin',
    'jignesh', 'ketan', 'mehul', 'nilesh', 'paresh', 'jigar', 'hiren', 'mitesh', 'vatsal', 'dhaval',
    'hetal', 'bhumika', 'riddhi', 'siddhi', 'nidhi', 'maitri', 'janvi', 'krupa', 'tejal', 'gajendra',
    'mahendra', 'virendra', 'kuldeep', 'manohar', 'narendra', 'jagdish', 'dinesh', 'gopal', 'hemant',
    'shankar', 'manju', 'saroj', 'poonam', 'usman', 'suman', 'santosh', 'geeta', 'hemlata', 'pushpa',
    'patil', 'deshmukh', 'jadhav', 'pawar', 'chavan', 'shinde', 'bhosale', 'gaikwad', 'nimbalkar'
  ];
  if (westIndicators.some(i => lower.includes(i))) {
    return 'west';
  }
  
  return 'default';
}

function processCSV(filePath: string, isMale: boolean, db: NamesDB): void {
  if (!fs.existsSync(filePath)) {
    console.warn(`[Categorizer] Missing file: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  console.log(`[Categorizer] Processing ${lines.length} lines from ${path.basename(filePath)}...`);
  
  const nameCounts: Record<string, Record<string, Record<string, number>>> = {};
  
  for (let idx = 1; idx < lines.length; idx++) {
    const line = lines[idx].trim();
    if (!line) continue;
    
    // Format: name, gender, race
    const parts = line.split(',');
    const rawName = parts[0];
    const cleaned = cleanName(rawName);
    
    if (!cleaned) continue;
    
    const rel = classifyReligion(cleaned, isMale);
    const reg = rel === 'hindu' ? classifyRegion(cleaned) : 'default';
    
    if (!nameCounts[rel]) nameCounts[rel] = {};
    const key = `${reg}_${isMale ? 'male' : 'female'}`;
    if (!nameCounts[rel][key]) nameCounts[rel][key] = {};
    
    nameCounts[rel][key][cleaned] = (nameCounts[rel][key][cleaned] ?? 0) + 1;
  }
  
  // Merge into DB with weights based on frequencies
  for (const [rel, regMap] of Object.entries(nameCounts)) {
    for (const [key, counts] of Object.entries(regMap)) {
      const [reg, gender] = key.split('_');
      const targetList = db[rel as keyof NamesDB][reg][gender as 'male' | 'female'];
      
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1500); // Limit to top 1500 names per state/gender category for balance
        
      for (const [name, count] of sorted) {
        // Only push if not already present
        if (!targetList.some(e => e.name === name)) {
          targetList.push({
            name,
            weight: Math.min(20, Math.max(1, count)), // Normalise weights to 1-20
            gender: isMale ? 'male' : 'female'
          });
        }
      }
    }
  }
}

async function run() {
  console.log('[Categorizer] Initialising names compiler...');
  
  const db: NamesDB = {
    hindu: {
      default: { male: [], female: [], other: [] },
      south: { male: [], female: [], other: [] },
      east: { male: [], female: [], other: [] },
      north: { male: [], female: [], other: [] },
      west: { male: [], female: [], other: [] }
    },
    muslim: {
      default: { male: [], female: [], other: [] }
    },
    christian: {
      default: { male: [], female: [], other: [] }
    },
    sikh: {
      default: { male: [], female: [], other: [] }
    },
    buddhist: {
      default: { male: [], female: [], other: [] }
    },
    jain: {
      default: { male: [], female: [], other: [] }
    }
  };
  
  // Process Male & Female raw CSV files
  processCSV(path.join(DATA_DIR, 'Indian-Male-Names.csv'), true, db);
  processCSV(path.join(DATA_DIR, 'Indian-Female-Names.csv'), false, db);
  
  // Ensure we add 'other' gender defaults
  for (const rel of Object.keys(db)) {
    for (const reg of Object.keys(db[rel as keyof NamesDB])) {
      const target = db[rel as keyof NamesDB][reg];
      target.other = [
        ...(target.male.slice(0, 5).map(e => ({ name: e.name, weight: e.weight, gender: 'unisex' as const }))),
        ...(target.female.slice(0, 5).map(e => ({ name: e.name, weight: e.weight, gender: 'unisex' as const })))
      ];
    }
  }
  
  // Write the completed database file
  const fileContent = `/**
 * Autogenerated Comprehensive Names Database
 * Mapped programmatically from public registries by scripts/categorize-names.ts
 */

import type { NameEntry, Gender } from '../types.js';

export const compiledNames: Record<string, Record<string, Record<Gender, NameEntry[]>>> = ${JSON.stringify(db, null, 2)};
`;
  
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf-8');
  
  console.log(`[Categorizer] Success! Autogenerated database saved to: ${OUTPUT_FILE}`);
  
  // Print some statistics
  let totalHindu = 0;
  for (const reg of Object.keys(db.hindu)) {
    totalHindu += db.hindu[reg].male.length + db.hindu[reg].female.length;
  }
  console.log(`[Categorizer] Mapped ${totalHindu} Hindu names across regions.`);
  console.log(`[Categorizer] Mapped ${db.muslim.default.male.length + db.muslim.default.female.length} Muslim names.`);
  console.log(`[Categorizer] Mapped ${db.christian.default.male.length + db.christian.default.female.length} Christian names.`);
  console.log(`[Categorizer] Mapped ${db.sikh.default.male.length + db.sikh.default.female.length} Sikh names.`);
}

run();
