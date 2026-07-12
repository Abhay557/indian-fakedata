/**
 * Test Exporters Script
 * Run with: npx tsx scripts/test_exporters.ts
 */

import fs from 'fs';
import path from 'path';
import { generate, generateEnriched, formatProfiles, saveProfilesToFile } from '../src/index.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('  Testing TypeScript Zero-Dependency Exporters');
console.log('═══════════════════════════════════════════════════════════\n');


const testOutputDir = path.join(process.cwd(), 'tests', 'temp-output');
if (!fs.existsSync(testOutputDir)) {
  fs.mkdirSync(testOutputDir, { recursive: true });
}

// 1. Generate standard profiles
console.log('[*] Generating 5 standard profiles...');
const baseProfiles = generate({ count: 5, seed: 101 });

// 2. Generate enriched profiles
console.log('[*] Generating 5 enriched profiles...');
const enrichedProfiles = generateEnriched({
  count: 5,
  seed: 102,
  includeOutcomes: true,
  includeAgentPersona: true,
  narrativeTypes: ['loan_application']
});

// 3. Test programmatic exporters
const formats: ('json' | 'jsonl' | 'csv')[] = ['json', 'jsonl', 'csv'];

for (const fmt of formats) {
  // Test Base Exporters
  const baseFile = path.join(testOutputDir, `base_profiles.${fmt}`);
  console.log(`[+] Exporting standard profiles to ${fmt} -> ${baseFile}`);
  saveProfilesToFile(baseProfiles, baseFile, fmt);
  
  if (fs.existsSync(baseFile)) {
    const size = fs.statSync(baseFile).size;
    console.log(`    File created successfully! Size: ${size} bytes`);
  } else {
    throw new Error(`Failed to create file: ${baseFile}`);
  }

  // Test Enriched Exporters
  const enrichedFile = path.join(testOutputDir, `enriched_profiles.${fmt}`);
  console.log(`[+] Exporting enriched profiles to ${fmt} -> ${enrichedFile}`);
  saveProfilesToFile(enrichedProfiles, enrichedFile, fmt);
  
  if (fs.existsSync(enrichedFile)) {
    const size = fs.statSync(enrichedFile).size;
    console.log(`    File created successfully! Size: ${size} bytes`);
  } else {
    throw new Error(`Failed to create file: ${enrichedFile}`);
  }
}

console.log('\n✅ All TypeScript exporters verified successfully!');
console.log('═══════════════════════════════════════════════════════════');
