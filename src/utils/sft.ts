/**
 * SFT Pair Builder (v2.1.0, item 7)
 *
 * Turns a profile (and optionally its narrative documents) into
 * instruction/response pairs for supervised fine-tuning, in Alpaca style:
 * { instruction, input, output, source }. Every response is templated
 * strictly from profile fields, so pairs are grounded by construction —
 * nothing is hallucinated.
 *
 * Pure functions, no RNG: output is fully determined by the inputs.
 */

import type { DemographicProfile } from '../types.js';
import type { NarrativeDocument } from './narrative.js';

/** One supervised fine-tuning example */
export interface SFTPair {
  instruction: string;
  input: string;
  output: string;
  /** Where this pair came from: 'persona' or a narrative doc type */
  source: string;
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function personaPairs(profile: DemographicProfile): SFTPair[] {
  const name = `${profile.firstName} ${profile.lastName}`;
  return [
    {
      instruction: `You are ${name}. Introduce yourself in the first person.`,
      input: '',
      output:
        `My name is ${name}. I am a ${profile.age}-year-old ${profile.gender} ` +
        `from ${profile.district}, ${profile.state}. I work as a ${profile.employmentSector} ` +
        `and my mother tongue is ${profile.motherTongue}.`,
      source: 'persona',
    },
    {
      instruction: `As ${profile.firstName}, describe what you do for a living.`,
      input: '',
      output:
        `I work as a ${profile.employmentSector} and earn about ` +
        `${inr(profile.annualIncomeINR / 12)} a month to support ` +
        `my household of ${profile.householdSize}.`,
      source: 'persona',
    },
    {
      instruction: `As ${profile.firstName}, describe your family.`,
      input: '',
      output:
        profile.maritalStatus === 'married'
          ? `I am married to ${profile.spouseName ?? 'my spouse'} and have ` +
            `${profile.numberOfChildren} ${profile.numberOfChildren === 1 ? 'child' : 'children'}. ` +
            `We live in ${profile.areaType} ${profile.district}.`
          : `I am currently ${profile.maritalStatus.replace(/_/g, ' ')} and live ` +
            `in ${profile.areaType} ${profile.district} with ${profile.householdSize} family members.`,
      source: 'persona',
    },
    {
      instruction: `As ${profile.firstName}, talk about your education and languages.`,
      input: '',
      output:
        `My highest education is ${profile.education.replace(/_/g, ' ')}. ` +
        `I speak ${profile.motherTongue}` +
        (profile.secondLanguage ? ` and ${profile.secondLanguage}` : '') +
        `.`,
      source: 'persona',
    },
    {
      instruction: `As ${profile.firstName}, how do you handle household money?`,
      input: '',
      output:
        `Our household spends about ${inr(profile.monthlyExpenditureINR)} a month. ` +
        `I ${profile.culturalProfile.savingsOrientation > 60 ? 'save money diligently' : 'spend within our means'}.`,
      source: 'persona',
    },
  ];
}

const NARRATIVE_QUESTIONS: Record<string, (p: DemographicProfile) => { q: string; a: string }> = {
  loan_application: p => ({
    q: 'Who is this loan application from, and which bank is it addressed to?',
    a: `It is a personal loan application from ${p.firstName} ${p.lastName} of ${p.district}, addressed to ${p.bankName}.`,
  }),
  medical_consultation: p => ({
    q: 'Who is the patient in this consultation record and where are they from?',
    a: `The patient is ${p.firstName} ${p.lastName}, a ${p.age}-year-old from ${p.district}, ${p.state}.`,
  }),
  hinglish_conversation: p => ({
    q: 'Who are the speakers in this chat and what language mix do they use?',
    a: `${p.firstName} chats with a friend in Hinglish, mixing ${p.motherTongue} and English.`,
  }),
  ration_card_application: p => ({
    q: 'Whose ration card application is this and what type is requested?',
    a: `It belongs to ${p.firstName} ${p.lastName} of ${p.district}, holding a ${p.rationCardType} card.`,
  }),
  school_enrollment: p => ({
    q: 'Who is being enrolled and in which district?',
    a: `${p.firstName} ${p.lastName} is being enrolled for school in ${p.district} district.`,
  }),
  resume: p => ({
    q: 'Whose resume is this and what work do they do?',
    a: `It is the resume of ${p.firstName} ${p.lastName}, working as a ${p.employmentSector}.`,
  }),
  customer_support_chat: p => ({
    q: 'Who is the customer in this support chat and which bank helps them?',
    a: `The customer is ${p.firstName} ${p.lastName}, helped by ${p.bankName} customer care.`,
  }),
};

/**
 * Build grounded SFT pairs for one profile, plus one reading-comprehension
 * pair per narrative document when provided.
 */
export function buildSFTPairs(
  profile: DemographicProfile,
  narratives: NarrativeDocument[] = []
): SFTPair[] {
  const pairs = personaPairs(profile);
  for (const doc of narratives) {
    const maker = NARRATIVE_QUESTIONS[doc.type];
    if (!maker) continue;
    const { q, a } = maker(profile);
    pairs.push({ instruction: q, input: doc.content, output: a, source: doc.type });
  }
  return pairs;
}

/** Serialize pairs as JSONL, one example per line. */
export function sftPairsToJsonl(pairs: SFTPair[]): string {
  return pairs.map(p => JSON.stringify(p)).join('\n') + (pairs.length > 0 ? '\n' : '');
}
