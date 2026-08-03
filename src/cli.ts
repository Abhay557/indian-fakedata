#!/usr/bin/env node

/**
 * Indian Fake Data Generator — CLI Entry Point
 *
 * @author Abhay Mourya <https://github.com/abhay557>
 * @license MIT
 *
 * Command-line tool to generate mock Indian population data
 * in JSON, JSONL, and CSV formats based on Census 2011 statistics.
 */

import fs from 'fs';
import path from 'path';
import { generateStream, generateEnrichedStream } from './utils/generator.js';
import { generateFamily } from './utils/relations.js';
import { flattenObject, escapeCSVValue } from './utils/cli-stream.js';

// ── Validation constants ───────────────────────────────────────────
const validGenders = ['male', 'female', 'other'];
const validSocialCategories = ['SC', 'ST', 'OBC', 'General'];
const validAreaTypes = ['urban', 'rural'];
const validNarrativeTypes = [
  'loan_application',
  'medical_consultation',
  'school_enrollment',
  'ration_card_application',
  'hinglish_conversation',
  'all',
];

// ── Colors ────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
};

function printHelp() {
  console.log(`
  ${C.bold}${C.cyan}Indian Synthetic Fake Data Generator CLI${C.reset}
  Generates culturally accurate, statistically consistent Indian demographic profiles
  backed by Census 2011 data using attention-like context masking.

  ${C.bold}USAGE:${C.reset}
    indian-fakedata [options]

  ${C.bold}CORE OPTIONS:${C.reset}
    -c, --count <n>        Number of profiles to generate ${C.dim}(default: 100)${C.reset}
    -o, --output <path>    File path to save output ${C.dim}(default: stdout)${C.reset}
    -f, --format <fmt>     Output format: json, jsonl, csv ${C.dim}(default: json)${C.reset}
    -s, --seed <value>     Reproducibility seed (number or string, e.g. "011")
    --no-metrics           Exclude probability metrics from output
    --family               Generate a full family (head + spouse + parents +
                           children + siblings) from a single seed
    -h, --help             Show this help screen

  ${C.bold}DEMOGRAPHIC CONSTRAINTS:${C.reset}
    --religion <string>        Fix religion ${C.dim}(Hindu, Muslim, Christian, Sikh, Buddhist, Jain)${C.reset}
    --state <string>           Fix state ${C.dim}(e.g., Maharashtra, Tamil Nadu, Punjab)${C.reset}
    --gender <gender>          Fix gender: male, female, other
    --caste <string>           Fix caste/community ${C.dim}(e.g., Brahmin, Maratha, Jat)${C.reset}
    --socialCategory <cat>     Fix social category: SC, ST, OBC, General
    --areaType <type>          Fix area type: urban, rural
    --minAge <number>          Minimum age constraint ${C.dim}(0-100)${C.reset}
    --maxAge <number>          Maximum age constraint ${C.dim}(0-100)${C.reset}
    --education <level>        Fix education ${C.dim}(illiterate, primary, secondary, graduate...)${C.reset}
    --occupation <sector>      Fix occupation ${C.dim}(cultivator, other_worker, non_worker...)${C.reset}
    --maritalStatus <status>   Fix marital status ${C.dim}(never_married, married, widowed...)${C.reset}

  ${C.bold}${C.magenta}ENRICHMENT LAYERS:${C.reset}
    --enrich               Enable ALL enrichment layers (outcomes + narrative:all + persona)
    --outcomes             ${C.dim}[Layer 2]${C.reset} Add credit score, health risk, employment outcome,
                           education attainment. Outputs in ${C.cyan}enriched.outcomes${C.reset} field.
    --bias <0-1>           Bias dial for outcome simulation.
                           ${C.dim}0.0 = pure meritocracy, 1.0 = max historical discrimination${C.reset}
                           ${C.dim}Default: 0.3 (calibrated to CMIE/CIBIL observed gaps)${C.reset}
    --narrative <type>     ${C.dim}[Layer 3]${C.reset} Generate realistic Indian text document.
                           Types: ${C.dim}loan_application, medical_consultation, school_enrollment,
                                  ration_card_application, hinglish_conversation, all${C.reset}
                           Can be repeated for multiple types: ${C.dim}--narrative loan_application --narrative hinglish_conversation${C.reset}
    --persona              ${C.dim}[Layer 4]${C.reset} Generate LLM-ready agent persona (system prompt,
                           beliefs, memory seeds, behavioral rules).

  ${C.bold}EXAMPLES:${C.reset}
    ${C.dim}# Basic generation${C.reset}
    indian-fakedata -c 1000 -o profiles.csv -f csv

    ${C.dim}# 50K profiles, Hindu, Maharashtra, JSONL${C.reset}
    indian-fakedata -c 50000 -f jsonl -o bigdata.jsonl --state Maharashtra --religion Hindu

    ${C.dim}# All enrichment layers, moderate bias${C.reset}
    indian-fakedata -c 100 --enrich --bias 0.3 -f jsonl -o enriched.jsonl

    ${C.dim}# Fairness audit — SC profiles with known bias${C.reset}
    indian-fakedata -c 5000 --outcomes --bias 0.5 --socialCategory SC -f jsonl -o sc_bias.jsonl

    ${C.dim}# LLM training corpus — Hinglish conversations + loan apps${C.reset}
    indian-fakedata -c 10000 --narrative hinglish_conversation --narrative loan_application -f jsonl -o corpus.jsonl

    ${C.dim}# Agent personas for simulation${C.reset}
    indian-fakedata -c 500 --persona -f jsonl -o agents.jsonl

    ${C.dim}# One complete profile, pretty-printed${C.reset}
    indian-fakedata -c 1 --enrich --bias 0.0 --seed 42

    ${C.dim}# A full family from a string seed${C.reset}
    indian-fakedata --family --seed 011
  `);
}

function getArgValue(i: number): string {
  if (i + 1 >= process.argv.length) {
    console.error(`${C.red}Error:${C.reset} Missing value for option ${process.argv[i]}`);
    process.exit(1);
  }
  return process.argv[i + 1];
}

// ── Output helpers ────────────────────────────────────────────────

/**
 * Flatten an EnrichedProfile for CSV output.
 * Puts profile fields first, then outcome fields, then persona identity line.
 * Narrative content is excluded from CSV (too large for tabular format).
 */
function flattenEnriched(enriched: any): Record<string, any> {
  const base = flattenObject(enriched.profile ?? enriched);

  if (enriched.outcomes) {
    const o = enriched.outcomes;
    base['outcomes.credit.creditScore'] = o.credit?.creditScore;
    base['outcomes.credit.loanApprovalProbability'] = o.credit?.loanApprovalProbability;
    base['outcomes.credit.approvedLoanAmountINR'] = o.credit?.approvedLoanAmountINR ?? '';
    base['outcomes.credit.reasonCodes'] = (o.credit?.reasonCodes ?? []).join('|');
    base['outcomes.health.healthRiskScore'] = o.health?.healthRiskScore;
    base['outcomes.health.bmiCategory'] = o.health?.bmiCategory;
    base['outcomes.health.healthcareAccessProbability'] = o.health?.healthcareAccessProbability;
    base['outcomes.health.likelyConditions'] = (o.health?.likelyConditions ?? []).join('|');
    base['outcomes.education.functionalLiteracy'] = o.education?.functionalLiteracy;
    base['outcomes.education.dropoutRisk'] = o.education?.dropoutRisk;
    base['outcomes.education.educationalMobility'] = o.education?.educationalMobility;
    base['outcomes.employment.employmentQuality'] = o.employment?.employmentQuality;
    base['outcomes.employment.expectedMonthlyWageINR'] = o.employment?.expectedMonthlyWageINR;
    base['outcomes.employment.wageGapRatio'] = o.employment?.wageGapRatio;
    base['outcomes.employment.vulnerabilityIndex'] = o.employment?.vulnerabilityIndex;
  }

  if (enriched.agentPersona) {
    base['persona.identityLine'] = enriched.agentPersona.identityLine;
    base['persona.worldview'] = enriched.agentPersona.beliefs?.worldview;
    base['persona.economicBehavior'] = enriched.agentPersona.economicBehavior;
    base['persona.stressResponse'] = enriched.agentPersona.stressResponse;
    base['persona.nationalPrevalence'] = enriched.agentPersona.nationalPrevalence;
  }

  if (enriched.narratives) {
    for (const doc of enriched.narratives) {
      base[`narrative.${doc.type}.wordCount`] = doc.metadata?.wordCount;
      base[`narrative.${doc.type}.language`] = doc.language;
      // Content is intentionally excluded from CSV — use JSONL for full content
    }
  }

  return base;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const constraints: any = {};
  let count = 100;
  let format = 'json';
  let outputPath: string | null = null;
  let seed: number | string | undefined = undefined;
  let includeProbabilityMetrics = true;
  let minAge: number | undefined = undefined;
  let maxAge: number | undefined = undefined;
  let familyMode = false;

  // enrichment flags
  let includeOutcomes = false;
  let biasLevel = 0.3;
  let narrativeTypes: string[] = [];
  let includeAgentPersona = false;


  if (process.argv.length < 3) {
    printHelp();
    process.exit(0);
  }

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];

    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);

    } else if (arg === '-c' || arg === '--count') {
      count = parseInt(getArgValue(i), 10);
      if (isNaN(count) || count <= 0) {
        console.error(`${C.red}Error:${C.reset} --count must be a positive integer.`);
        process.exit(1);
      }
      i++;

    } else if (arg === '-f' || arg === '--format') {
      format = getArgValue(i).toLowerCase();
      if (!['json', 'jsonl', 'csv'].includes(format)) {
        console.error(`${C.red}Error:${C.reset} --format must be one of: json, jsonl, csv.`);
        process.exit(1);
      }
      i++;

    } else if (arg === '-o' || arg === '--output') {
      outputPath = getArgValue(i);
      i++;

    } else if (arg === '-s' || arg === '--seed') {
      const val = getArgValue(i);
      const parsed = parseInt(val, 10);
      seed = (Number.isInteger(parsed) && String(parsed) === val) ? parsed : val;
      i++;

    } else if (arg === '--family') {
      familyMode = true;

    } else if (arg === '--no-metrics') {
      includeProbabilityMetrics = false;

      // ── Constraint flags ──────────────────────────────────────────
    } else if (arg === '--religion') {
      constraints.religion = getArgValue(i); i++;
    } else if (arg === '--state') {
      constraints.state = getArgValue(i); i++;
    } else if (arg === '--gender') {
      const val = getArgValue(i).toLowerCase();
      if (!validGenders.includes(val)) {
        console.error(`${C.red}Error:${C.reset} --gender must be one of: ${validGenders.join(', ')}.`);
        process.exit(1);
      }
      constraints.gender = val as any; i++;
    } else if (arg === '--caste') {
      constraints.caste = getArgValue(i); i++;
    } else if (arg === '--socialCategory') {
      const val = getArgValue(i);
      const matched = validSocialCategories.find(c => c.toLowerCase() === val.toLowerCase());
      if (!matched) {
        console.error(`${C.red}Error:${C.reset} --socialCategory must be one of: ${validSocialCategories.join(', ')}.`);
        process.exit(1);
      }
      constraints.socialCategory = matched as any; i++;
    } else if (arg === '--areaType') {
      const val = getArgValue(i).toLowerCase();
      if (!validAreaTypes.includes(val)) {
        console.error(`${C.red}Error:${C.reset} --areaType must be one of: ${validAreaTypes.join(', ')}.`);
        process.exit(1);
      }
      constraints.areaType = val as any; i++;
    } else if (arg === '--minAge') {
      minAge = parseInt(getArgValue(i), 10);
      if (isNaN(minAge) || minAge < 0) {
        console.error(`${C.red}Error:${C.reset} --minAge must be a non-negative integer.`);
        process.exit(1);
      }
      i++;
    } else if (arg === '--maxAge') {
      maxAge = parseInt(getArgValue(i), 10);
      if (isNaN(maxAge) || maxAge < 0) {
        console.error(`${C.red}Error:${C.reset} --maxAge must be a non-negative integer.`);
        process.exit(1);
      }
      i++;
    } else if (arg === '--education') {
      constraints.education = getArgValue(i) as any; i++;
    } else if (arg === '--occupation') {
      constraints.occupation = getArgValue(i) as any; i++;
    } else if (arg === '--maritalStatus') {
      constraints.maritalStatus = getArgValue(i) as any; i++;
      // ── Enrichment flags ───────────────────────────────────────

    } else if (arg === '--enrich') {
      // Enable all layers
      includeOutcomes = true;
      includeAgentPersona = true;
      if (!narrativeTypes.includes('all')) narrativeTypes = ['all'];

    } else if (arg === '--outcomes') {
      includeOutcomes = true;

    } else if (arg === '--bias') {
      biasLevel = parseFloat(getArgValue(i));
      if (isNaN(biasLevel) || biasLevel < 0 || biasLevel > 1) {
        console.error(`${C.red}Error:${C.reset} --bias must be a number between 0.0 and 1.0.`);
        process.exit(1);
      }
      i++;

    } else if (arg === '--narrative') {
      const val = getArgValue(i).toLowerCase();
      if (!validNarrativeTypes.includes(val)) {
        console.error(`${C.red}Error:${C.reset} --narrative must be one of: ${validNarrativeTypes.join(', ')}.`);
        process.exit(1);
      }
      if (!narrativeTypes.includes(val)) narrativeTypes.push(val);
      i++;

    } else if (arg === '--persona') {
      includeAgentPersona = true;

    } else {
      console.error(`${C.red}Error:${C.reset} Unknown option '${arg}'. Use -h or --help for usage.`);
      process.exit(1);
    }
  }

  // Resolve ageRange
  if (minAge !== undefined || maxAge !== undefined) {
    constraints.ageRange = { min: minAge ?? 0, max: maxAge ?? 100 };
  }

  // Determine enrichment mode
  const isEnriched = includeOutcomes || narrativeTypes.length > 0 || includeAgentPersona;

  // ── Output stream setup ──────────────────────────────────────────
  let writeStream: NodeJS.WritableStream;
  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    writeStream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    writeStream.on('error', (err) => {
      console.error(`\n${C.red}[Error] Failed to write to file:${C.reset}`, err.message);
      process.exit(1);
    });
  } else {
    writeStream = process.stdout;
  }

  // ── Progress info ─────────────────────────────────────────────────
  if (outputPath) {
    process.stderr.write(`${C.cyan}[Info]${C.reset} Output: ${outputPath}\n`);
    process.stderr.write(`${C.cyan}[Info]${C.reset} Format: ${format}\n`);
    process.stderr.write(`${C.cyan}[Info]${C.reset} Count:  ${count}\n`);
    if (isEnriched) {
      process.stderr.write(`${C.magenta}[Enriched]${C.reset}  Enrichment: ${[
        includeOutcomes ? `outcomes(bias=${biasLevel})` : '',
        narrativeTypes.length ? `narrative(${narrativeTypes.join(',')})` : '',
        includeAgentPersona ? 'persona' : '',
      ].filter(Boolean).join(' + ')}\n`);
    }
    process.stderr.write(`${C.cyan}[Info]${C.reset} Generating...\n`);
  }

  const startTime = Date.now();
  const logInterval = Math.max(1, Math.min(10000, Math.floor(count / 10)));

  const baseOptions = {
    count,
    seed,
    constraints,
    includeProbabilityMetrics,
  };

  const enrichedOptions = {
    ...baseOptions,
    includeOutcomes,
    biasLevel,
    narrativeTypes: narrativeTypes as any,
    includeAgentPersona,
  };

  try {
    let i = 0;

    // ── Family mode (relational household from one seed) ─────────
    if (familyMode) {
      if (format === 'csv') {
        console.error(`${C.red}Error:${C.reset} --family only supports json/jsonl output.`);
        process.exit(1);
      }
      const family = generateFamily({
        seed,
        constraints,
        includeProbabilityMetrics
      });
      const members: any[] = [family.head];
      if (family.spouse) members.push(family.spouse);
      if (family.parents.father) members.push(family.parents.father);
      if (family.parents.mother) members.push(family.parents.mother);
      members.push(...family.children, ...family.siblings);
      const output = { head: family.head, spouse: family.spouse, parents: family.parents, children: family.children, siblings: family.siblings };
      writeStream.write(format === 'json' ? JSON.stringify(output, null, 2) : JSON.stringify(output) + '\n');
      if (outputPath) (writeStream as fs.WriteStream).end();
      process.stderr.write(`\n${C.green}[Done]${C.reset} Family of ${members.length} members (head: ${family.head.firstName} ${family.head.lastName}, ${family.head.state}).\n`);
      return;
    }

    // ── JSON array output ──────────────────────────────────────────
    if (format === 'json') {
      writeStream.write('[\n');
      let isFirst = true;

      const stream = isEnriched
        ? generateEnrichedStream(enrichedOptions)
        : (function* () { for (const p of generateStream(baseOptions)) yield p; })();

      for (const record of stream) {
        if (!isFirst) writeStream.write(',\n');
        writeStream.write(count <= 100 ? JSON.stringify(record, null, 2) : JSON.stringify(record));
        isFirst = false;
        i++;
        if (outputPath && i % logInterval === 0) {
          const rate = Math.round(i / ((Date.now() - startTime) / 1000));
          process.stderr.write(`\r${C.cyan}[Progress]${C.reset} ${i}/${count} (${rate}/sec)...`);
        }
      }
      writeStream.write('\n]\n');

      // ── JSONL output ───────────────────────────────────────────────
    } else if (format === 'jsonl') {
      const stream = isEnriched
        ? generateEnrichedStream(enrichedOptions)
        : (function* () { for (const p of generateStream(baseOptions)) yield p; })();

      for (const record of stream) {
        writeStream.write(JSON.stringify(record) + '\n');
        i++;
        if (outputPath && i % logInterval === 0) {
          const rate = Math.round(i / ((Date.now() - startTime) / 1000));
          process.stderr.write(`\r${C.cyan}[Progress]${C.reset} ${i}/${count} (${rate}/sec)...`);
        }
      }

      // ── CSV output ─────────────────────────────────────────────────
    } else if (format === 'csv') {
      let headers: string[] = [];
      let isFirst = true;

      const stream = isEnriched
        ? generateEnrichedStream(enrichedOptions)
        : (function* () { for (const p of generateStream(baseOptions)) yield p; })();

      for (const record of stream) {
        const flat = isEnriched ? flattenEnriched(record) : flattenObject(record);
        if (isFirst) {
          headers = Object.keys(flat);
          writeStream.write(headers.map(escapeCSVValue).join(',') + '\n');
          isFirst = false;
        }
        writeStream.write(headers.map(h => escapeCSVValue(flat[h])).join(',') + '\n');
        i++;
        if (outputPath && i % logInterval === 0) {
          const rate = Math.round(i / ((Date.now() - startTime) / 1000));
          process.stderr.write(`\r${C.cyan}[Progress]${C.reset} ${i}/${count} (${rate}/sec)...`);
        }
      }
    }

    // ── Final summary ──────────────────────────────────────────────
    if (outputPath) {
      (writeStream as fs.WriteStream).end();
      const totalTime = (Date.now() - startTime) / 1000;
      const overallRate = Math.round(count / totalTime);
      process.stderr.write(`\n${C.green}[Done]${C.reset} ${count} profiles in ${totalTime.toFixed(2)}s (${overallRate} profiles/sec).\n`);
      if (isEnriched) {
        process.stderr.write(`${C.green}[Done]${C.reset} Output → ${outputPath}\n`);
      }
    }


  } catch (err: any) {
    console.error(`\n${C.red}[Error] Generation failed:${C.reset}`, err.message, err.stack ?? '');
    process.exit(1);
  }
}

main();
