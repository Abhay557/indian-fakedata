import fs from 'fs';
import { flattenObject, escapeCSVValue } from './cli-stream.js';

/**
 * Helper to flatten an EnrichedProfile for CSV/tabular output.
 * Mirroring the implementation used in CLI for consistency.
 */
function flattenEnriched(enriched: any): Record<string, any> {
  const base = flattenObject(enriched.profile ?? enriched);

  if (enriched.outcomes) {
    const o = enriched.outcomes;
    base['outcomes.credit.creditScore']            = o.credit?.creditScore;
    base['outcomes.credit.loanApprovalProbability']= o.credit?.loanApprovalProbability;
    base['outcomes.credit.approvedLoanAmountINR']  = o.credit?.approvedLoanAmountINR ?? '';
    base['outcomes.credit.reasonCodes']            = (o.credit?.reasonCodes ?? []).join('|');
    base['outcomes.health.healthRiskScore']        = o.health?.healthRiskScore;
    base['outcomes.health.bmiCategory']            = o.health?.bmiCategory;
    base['outcomes.health.healthcareAccessProbability'] = o.health?.healthcareAccessProbability;
    base['outcomes.health.likelyConditions']       = (o.health?.likelyConditions ?? []).join('|');
    base['outcomes.education.functionalLiteracy']  = o.education?.functionalLiteracy;
    base['outcomes.education.dropoutRisk']         = o.education?.dropoutRisk;
    base['outcomes.education.educationalMobility'] = o.education?.educationalMobility;
    base['outcomes.employment.employmentQuality']  = o.employment?.employmentQuality;
    base['outcomes.employment.expectedMonthlyWageINR'] = o.employment?.expectedMonthlyWageINR;
    base['outcomes.employment.wageGapRatio']       = o.employment?.wageGapRatio;
    base['outcomes.employment.vulnerabilityIndex'] = o.employment?.vulnerabilityIndex;
  }

  if (enriched.agentPersona) {
    base['persona.identityLine']   = enriched.agentPersona.identityLine;
    base['persona.worldview']      = enriched.agentPersona.beliefs?.worldview;
    base['persona.economicBehavior'] = enriched.agentPersona.economicBehavior;
    base['persona.stressResponse'] = enriched.agentPersona.stressResponse;
    base['persona.nationalPrevalence'] = enriched.agentPersona.nationalPrevalence;
  }

  if (enriched.narratives) {
    for (const doc of enriched.narratives) {
      base[`narrative.${doc.type}.wordCount`] = doc.metadata?.wordCount;
      base[`narrative.${doc.type}.language`]  = doc.language;
    }
  }

  return base;
}

/**
 * Formats a list of demographic profiles into a string representation of
 * JSON, JSONL, or CSV.
 * 
 * @param profiles - An array of standard DemographicProfile or EnrichedProfile objects.
 * @param format - Output format target ('json', 'jsonl', or 'csv').
 * @returns The formatted string dataset.
 */
export function formatProfiles(profiles: any[], format: 'json' | 'jsonl' | 'csv'): string {
  const fmt = format.toLowerCase();
  
  if (fmt === 'json') {
    return JSON.stringify(profiles, null, 2);
  }

  if (fmt === 'jsonl') {
    if (profiles.length === 0) return '';
    return profiles.map(p => JSON.stringify(p)).join('\n') + '\n';
  }

  if (fmt === 'csv') {
    if (profiles.length === 0) return '';
    
    // Check if profiles are enriched or standard
    const isEnriched = profiles[0].profile !== undefined || profiles[0].outcomes !== undefined;
    const flatProfiles = profiles.map(p => isEnriched ? flattenEnriched(p) : flattenObject(p));
    
    const headers = Object.keys(flatProfiles[0]);
    const headerRow = headers.map(escapeCSVValue).join(',');
    const dataRows = flatProfiles.map(flat => 
      headers.map(h => escapeCSVValue(flat[h])).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n') + '\n';
  }

  throw new Error(`Unsupported format: ${format}. Supported formats are: json, jsonl, csv.`);
}

/**
 * Helper to save generated profiles directly to a file in standard format.
 * Automatically creates parent directories if they don't exist.
 * 
 * @param profiles - An array of standard DemographicProfile or EnrichedProfile objects.
 * @param filePath - Path to the file where data will be saved.
 * @param format - Output format target ('json', 'jsonl', or 'csv').
 */
export function saveProfilesToFile(profiles: any[], filePath: string, format: 'json' | 'jsonl' | 'csv'): void {
  const content = formatProfiles(profiles, format);
  fs.writeFileSync(filePath, content, 'utf8');
}
