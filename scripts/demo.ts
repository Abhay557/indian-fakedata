/**
 * Demo Script — v4 with Cultural Profiles & Community Traits
 * Run with: npm run demo
 */

import { generate, getDistributionSummary } from '../src/index.js';

console.log('═══════════════════════════════════════════════════════════');
console.log('  Smart Synthetic Population Simulator v4');
console.log('  Cultural Profiles + Community Traits + Real-World Biases');
console.log('═══════════════════════════════════════════════════════════\n');

// ── Demo 1: Full profile ────────────────────────────────────
const [p] = generate({ count: 1, seed: 42 });
const countFields = (obj: any): number => {
  let c = 0;
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) c += countFields(obj[k]);
    else c++;
  }
  return c;
};
console.log(`✅ Total fields per profile: ${countFields(p)}\n`);

// ── Demo 2: Community Traits Comparison ─────────────────────
console.log('▶ COMMUNITY CULTURAL TRAITS COMPARISON\n');

const jainGuj = generate({ count: 500, seed: 300, constraints: { religion: 'Jain', state: 'Gujarat' } });
const brahminTN = generate({ count: 500, seed: 301, constraints: { religion: 'Hindu', state: 'Tamil Nadu' } }); 
const rajputRJ = generate({ count: 500, seed: 302, constraints: { religion: 'Hindu', state: 'Rajasthan' } });
const muslimUP = generate({ count: 500, seed: 303, constraints: { religion: 'Muslim', state: 'Uttar Pradesh' } });
const sikhPB = generate({ count: 500, seed: 304, constraints: { religion: 'Sikh', state: 'Punjab' } });
const bengaliWB = generate({ count: 500, seed: 305, constraints: { religion: 'Hindu', state: 'West Bengal' } });
const nairKL = generate({ count: 500, seed: 306, constraints: { religion: 'Hindu', state: 'Kerala' } });
const biharHindu = generate({ count: 500, seed: 307, constraints: { religion: 'Hindu', state: 'Bihar' } });

const avg = (arr: any[], fn: (x: any) => number) => (arr.reduce((s, x) => s + fn(x), 0) / arr.length).toFixed(1);
const pct = (arr: any[], fn: (x: any) => boolean) => ((arr.filter(fn).length / arr.length) * 100).toFixed(1) + '%';

console.log('                    Jain GJ   Brahm TN  Rajput RJ  Muslim UP  Sikh PB   Bengali   Nair KL   Bihar');
console.log('  ─────────────────────────────────────────────────────────────────────────────────────────────────');
console.log(`  Entrepreneurial:  ${avg(jainGuj, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.entrepreneurialScore).padStart(5)}`);
console.log(`  Academic:         ${avg(jainGuj, p=>p.culturalProfile.academicOrientation).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.academicOrientation).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.academicOrientation).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.academicOrientation).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.academicOrientation).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.academicOrientation).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.academicOrientation).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.academicOrientation).padStart(5)}`);
console.log(`  Military:         ${avg(jainGuj, p=>p.culturalProfile.militaryTradition).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.militaryTradition).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.militaryTradition).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.militaryTradition).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.militaryTradition).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.militaryTradition).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.militaryTradition).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.militaryTradition).padStart(5)}`);
console.log(`  Artistic:         ${avg(jainGuj, p=>p.culturalProfile.artisticInclination).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.artisticInclination).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.artisticInclination).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.artisticInclination).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.artisticInclination).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.artisticInclination).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.artisticInclination).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.artisticInclination).padStart(5)}`);
console.log(`  Agricultural:     ${avg(jainGuj, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.agriculturalRootedness).padStart(5)}`);
console.log(`  Artisan:          ${avg(jainGuj, p=>p.culturalProfile.artisanTradition).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.artisanTradition).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.artisanTradition).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.artisanTradition).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.artisanTradition).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.artisanTradition).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.artisanTradition).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.artisanTradition).padStart(5)}`);
console.log(`  Community Bond:   ${avg(jainGuj, p=>p.culturalProfile.communityBonding).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.communityBonding).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.communityBonding).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.communityBonding).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.communityBonding).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.communityBonding).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.communityBonding).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.communityBonding).padStart(5)}`);
console.log(`  Migration:        ${avg(jainGuj, p=>p.culturalProfile.migrationTendency).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.migrationTendency).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.migrationTendency).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.migrationTendency).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.migrationTendency).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.migrationTendency).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.migrationTendency).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.migrationTendency).padStart(5)}`);
console.log(`  Savings:          ${avg(jainGuj, p=>p.culturalProfile.savingsOrientation).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.savingsOrientation).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.savingsOrientation).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.savingsOrientation).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.savingsOrientation).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.savingsOrientation).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.savingsOrientation).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.savingsOrientation).padStart(5)}`);
console.log(`  Risk Appetite:    ${avg(jainGuj, p=>p.culturalProfile.riskAppetite).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.riskAppetite).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.riskAppetite).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.riskAppetite).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.riskAppetite).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.riskAppetite).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.riskAppetite).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.riskAppetite).padStart(5)}`);
console.log(`  Social Activism:  ${avg(jainGuj, p=>p.culturalProfile.socialActivism).padStart(5)}     ${avg(brahminTN, p=>p.culturalProfile.socialActivism).padStart(5)}     ${avg(rajputRJ, p=>p.culturalProfile.socialActivism).padStart(5)}      ${avg(muslimUP, p=>p.culturalProfile.socialActivism).padStart(5)}      ${avg(sikhPB, p=>p.culturalProfile.socialActivism).padStart(5)}     ${avg(bengaliWB, p=>p.culturalProfile.socialActivism).padStart(5)}     ${avg(nairKL, p=>p.culturalProfile.socialActivism).padStart(5)}     ${avg(biharHindu, p=>p.culturalProfile.socialActivism).padStart(5)}`);
console.log();

// ── Demo 3: Career preferences by community ─────────────────
console.log('▶ CAREER PREFERENCE DISTRIBUTION\n');
const careerOf = (arr: any[]) => {
  const counts: Record<string, number> = {};
  for (const p of arr) {
    counts[p.culturalProfile.careerPreference] = (counts[p.culturalProfile.careerPreference] ?? 0) + 1;
  }
  const top3 = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 3);
  return top3.map(([k,v]) => `${k}:${((v/arr.length)*100).toFixed(0)}%`).join(', ');
};
console.log(`  Jain Gujarati: ${careerOf(jainGuj)}`);
console.log(`  Brahmin TN:    ${careerOf(brahminTN)}`);
console.log(`  Rajput RJ:     ${careerOf(rajputRJ)}`);
console.log(`  Muslim UP:     ${careerOf(muslimUP)}`);
console.log(`  Sikh Punjab:   ${careerOf(sikhPB)}`);
console.log(`  Bengali WB:    ${careerOf(bengaliWB)}`);
console.log(`  Nair Kerala:   ${careerOf(nairKL)}`);
console.log(`  Bihar Hindu:   ${careerOf(biharHindu)}`);
console.log();

// ── Demo 4: Family structure ────────────────────────────────
console.log('▶ FAMILY STRUCTURE\n');
console.log(`  Jain GJ Joint: ${pct(jainGuj, p => p.culturalProfile.familyStructure === 'joint_family')}`);
console.log(`  Sikh PB Joint:  ${pct(sikhPB, p => p.culturalProfile.familyStructure === 'joint_family')}`);
console.log(`  Kerala Nuclear: ${pct(nairKL, p => p.culturalProfile.familyStructure === 'nuclear_family')}`);
console.log(`  Bihar Joint:    ${pct(biharHindu, p => p.culturalProfile.familyStructure === 'joint_family')}`);
console.log();

// ── Demo 5: Single profile showcase ─────────────────────────
console.log('▶ SAMPLE JAIN GUJARATI PROFILE\n');
const [jainSample] = generate({ count: 1, seed: 999, constraints: { religion: 'Jain', state: 'Gujarat' } });
console.log(`  ${jainSample.firstName} ${jainSample.lastName} | ${jainSample.religion} ${jainSample.caste}`);
console.log(`  Entrepreneurial: ${jainSample.culturalProfile.entrepreneurialScore}/100`);
console.log(`  Savings: ${jainSample.culturalProfile.savingsOrientation}/100`);
console.log(`  Risk Appetite: ${jainSample.culturalProfile.riskAppetite}/100`);
console.log(`  Career: ${jainSample.culturalProfile.careerPreference}`);
console.log(`  Family: ${jainSample.culturalProfile.familyStructure}`);
console.log(`  Diet: ${jainSample.dietaryPreference}`);
console.log(`  Religiosity: ${jainSample.religiosity}`);
console.log();

console.log('═══════════════════════════════════════════════════════════');
console.log('  Demo Complete!');
console.log('═══════════════════════════════════════════════════════════');
