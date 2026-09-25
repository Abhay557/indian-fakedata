/**
 * Grounded QA Pair Builder (v2.1.0, item 8)
 *
 * Turns a profile into question/answer pairs for retrieval and reading-
 * comprehension evaluation. Every answer is templated strictly from
 * profile fields, and each pair carries `citations`: the exact field
 * paths the answer was built from. Tests assert every citation resolves
 * and the cited values appear in the answer, so grounding is checked,
 * not promised.
 *
 * Pure functions, no RNG: output is fully determined by the input.
 */

import type { DemographicProfile } from '../types.js';
import { profileFestivals } from './festivals.js';

/** One grounded question/answer example */
export interface QAPair {
  question: string;
  answer: string;
  /** Profile field paths the answer was built from */
  citations: string[];
  source: string;
}

function inr(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/**
 * Build grounded QA pairs for one profile. Skips questions whose
 * fields are absent, so old or stripped profiles simply yield fewer pairs.
 */
export function buildQAPairs(profile: DemographicProfile): QAPair[] {
  const p = profile;
  const name = `${p.firstName} ${p.lastName}`;
  const pairs: QAPair[] = [
    {
      question: `What is the full name of the person from ${p.district}?`,
      answer: `The person from ${p.district} is ${name}.`,
      citations: ['firstName', 'lastName', 'district'],
      source: 'profile',
    },
    {
      question: `How old is ${p.firstName} and where do they live?`,
      answer: `${p.firstName} is ${p.age} years old and lives in ${p.district}, ${p.state}.`,
      citations: ['firstName', 'age', 'district', 'state'],
      source: 'profile',
    },
    {
      question: `What does ${p.firstName} do for a living and what do they earn?`,
      answer: `${p.firstName} works as a ${p.employmentSector} and earns about ${inr(p.annualIncomeINR / 12)} a month (${inr(p.annualIncomeINR)} a year).`,
      citations: ['firstName', 'employmentSector', 'annualIncomeINR'],
      source: 'profile',
    },
    {
      question: `What is ${p.firstName}'s education and which languages do they speak?`,
      answer: `${p.firstName}'s highest education is ${p.education.replace(/_/g, ' ')} and they speak ${p.motherTongue}${p.secondLanguage ? ` and ${p.secondLanguage}` : ''}.`,
      citations: p.secondLanguage
        ? ['firstName', 'education', 'motherTongue', 'secondLanguage']
        : ['firstName', 'education', 'motherTongue'],
      source: 'profile',
    },
    {
      question: `Describe ${p.firstName}'s family situation.`,
      answer: p.maritalStatus === 'married'
        ? `${p.firstName} is married with ${p.numberOfChildren} ${p.numberOfChildren === 1 ? 'child' : 'children'} in a household of ${p.householdSize}.`
        : `${p.firstName} is ${p.maritalStatus.replace(/_/g, ' ')} with ${p.numberOfChildren} ${p.numberOfChildren === 1 ? 'child' : 'children'}, living in a household of ${p.householdSize}.`,
      citations: ['firstName', 'maritalStatus', 'numberOfChildren', 'householdSize'],
      source: 'profile',
    },
    {
      question: `What does ${p.firstName} look like?`,
      answer: `${p.firstName} has ${p.appearance.skinTone} skin, ${p.appearance.hairColor} ${p.appearance.hairTexture} hair and an ${p.appearance.build} build, and is ${p.heightCm} cm tall.`,
      citations: ['firstName', 'appearance.skinTone', 'appearance.hairColor', 'appearance.hairTexture', 'appearance.build', 'heightCm'],
      source: 'profile',
    },
  ];

  const timeline = p.employmentTimeline ?? [];
  if (timeline.length > 0) {
    const current = timeline[timeline.length - 1];
    pairs.push({
      question: `What is ${p.firstName}'s most recent job?`,
      answer: `${p.firstName}'s most recent job is ${current.jobTitle}, started in ${current.startYear}.`,
      citations: ['firstName', 'employmentTimeline'],
      source: 'profile',
    });
  }

  if (p.skills && p.skills.languages.length > 0) {
    const langs = p.skills.languages.map(l => `${l.language} (${l.speaking})`).join(', ');
    pairs.push({
      question: `Which languages does ${p.firstName} speak and how well?`,
      answer: `${p.firstName} speaks ${langs}.`,
      citations: ['firstName', 'skills'],
      source: 'profile',
    });
  }

  if (p.geo) {
    pairs.push({
      question: `Where on the map does ${p.firstName} live?`,
      answer: `${p.firstName} lives near ${p.geo.latitude}, ${p.geo.longitude} in ${p.district}, ${p.state}.`,
      citations: ['firstName', 'geo', 'district', 'state'],
      source: 'profile',
    });
  }

  const festivals = profileFestivals(p);
  if (festivals.length > 0) {
    pairs.push({
      question: `Which festival does ${p.firstName} celebrate first this year?`,
      answer: `${p.firstName} celebrates ${festivals[0].name} on ${festivals[0].date}.`,
      citations: ['firstName'],
      source: 'profile',
    });
  }

  if (p.householdEconomy) {
    pairs.push({
      question: `What is ${p.firstName}'s credit score band?`,
      answer: `${p.firstName}'s credit score is ${p.householdEconomy.creditHistory.score}, with ${p.householdEconomy.creditHistory.missedPayments12m} missed payments in the last 12 months.`,
      citations: ['firstName', 'householdEconomy'],
      source: 'profile',
    });
  }

  const married = (p.lifeEvents ?? []).find(e => e.event === 'married');
  if (married) {
    pairs.push({
      question: `When did ${p.firstName} get married?`,
      answer: `${p.firstName} got married in ${married.year}.`,
      citations: ['firstName', 'lifeEvents'],
      source: 'profile',
    });
  }

  return pairs;
}
