/**
 * Agent Persona Schema Layer (SSPS — Layer 4)
 *
 * Converts a DemographicProfile into a structured Agent Persona —
 * an LLM-compatible representation with system prompt, belief system,
 * memory seeds, and behavioral constraints.
 *
 * Designed for:
 *  - Multi-agent simulation research (Stanford Smallville-style)
 *  - LLM fine-tuning with demographically grounded synthetic personas
 *  - Social AI simulation with realistic Indian population substrates
 *  - Persona-based evaluation of LLMs for Indian contexts
 */

import type {
  DemographicProfile,
  PoliticalLeaning,
  ReligiosityLevel,
} from '../types.js';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface AgentBeliefs {
  /** Political orientation */
  political: PoliticalLeaning;
  /** Religiosity level */
  religiosity: ReligiosityLevel;
  /** Overall worldview */
  worldview: 'traditional' | 'modern' | 'hybrid';
  /** Trust in government institutions (0–100) */
  trustInstitutions: number;
  /** Trust in religious institutions (0–100) */
  trustReligiousInstitutions: number;
  /** Collectivism vs individualism (0=individual, 100=collective) */
  collectivismScore: number;
}

export interface AgentCommunicationStyle {
  /** Primary language this agent communicates in */
  primaryLanguage: string;
  /** Code-switching language (if applicable) */
  secondaryLanguage?: string;
  /** Formality level */
  formality: 'formal' | 'informal' | 'mixed';
  /** Dialect or regional variety */
  dialect?: string;
  /** Code-switching tendency (0=none, 100=heavy Hinglish) */
  codeSwitchingTendency: number;
}

export interface AgentPersona {
  /**
   * One-paragraph system prompt describing this agent.
   * Ready to inject into any LLM's system role.
   */
  systemPrompt: string;

  /**
   * Complete, self-contained persona prompt containing ALL information
   * about this person (identity, education timeline, personality traits,
   * movie/anime preferences, habits, beliefs, behaviour rules).
   * Designed so an AI can act as this person.
   */
  fullPrompt: string;

  /**
   * Short identity line (1 sentence).
   * Use in user-facing persona cards.
   */
  identityLine: string;

  /** Structured belief system */
  beliefs: AgentBeliefs;

  /**
   * Memory seeds — factual statements this agent "remembers" about
   * their own life. For use as initial memory in agent frameworks.
   */
  memorySeeds: string[];

  /**
   * Behavioral constraints — rules the agent follows in conversation.
   * Written as instructions a system prompt would contain.
   */
  behaviorRules: string[];

  /** Communication style parameters */
  communicationStyle: AgentCommunicationStyle;

  /** Summary of this agent's current life situation */
  currentSituation: string;

  /** How this agent responds to stress / adversity */
  stressResponse: 'resigned' | 'adaptive' | 'resistant' | 'community_dependent';

  /** Economic behavior pattern */
  economicBehavior: 'subsistence' | 'saving' | 'investing' | 'entrepreneurial';

  /** Source profile ID */
  profileId: string;

  /** How demographically common this persona is (from probability metrics) */
  nationalPrevalence: number;
}

// ─────────────────────────────────────────────────────────────
// Mapping helpers
// ─────────────────────────────────────────────────────────────

function deriveWorldview(profile: DemographicProfile): AgentBeliefs['worldview'] {
  const modernitySignals =
    (profile.hasInternetAccess ? 1 : 0) +
    (profile.hasSmartphone ? 1 : 0) +
    (profile.areaType === 'urban' ? 1 : 0) +
    (profile.education === 'graduate' || profile.education === 'postgraduate' ? 1 : 0) +
    (profile.employmentSector === 'private' || profile.employmentSector === 'government' ? 1 : 0);

  const traditionalSignals =
    (profile.religiosity === 'very_religious' ? 2 : 0) +
    (profile.areaType === 'rural' ? 1 : 0) +
    (profile.culturalProfile.familyStructure === 'joint_family' ? 1 : 0) +
    (profile.age > 50 ? 1 : 0);

  if (modernitySignals >= 4) return 'modern';
  if (traditionalSignals >= 3) return 'traditional';
  return 'hybrid';
}

function deriveTrustInstitutions(profile: DemographicProfile): number {
  let trust = 50;
  if (profile.employmentSector === 'government') trust += 20;
  if (profile.socialCategory === 'SC' || profile.socialCategory === 'ST') trust -= 15;
  if (profile.education === 'graduate' || profile.education === 'postgraduate') trust += 10;
  if (profile.areaType === 'rural') trust -= 5;
  if (profile.politicalLeaning === 'apolitical') trust -= 10;
  return Math.max(10, Math.min(90, trust));
}

function deriveCollectivism(profile: DemographicProfile): number {
  let score = 50;
  score += profile.culturalProfile.communityBonding * 0.3;
  if (profile.culturalProfile.familyStructure === 'joint_family') score += 15;
  if (profile.areaType === 'rural') score += 10;
  if (profile.religion === 'jain' || profile.religion === 'sikh') score += 10;
  if (profile.education === 'postgraduate') score -= 10;
  if (profile.areaType === 'urban' && profile.culturalProfile.familyStructure === 'nuclear_family') score -= 10;
  return Math.max(10, Math.min(95, Math.round(score)));
}

function deriveEconomicBehavior(profile: DemographicProfile): AgentPersona['economicBehavior'] {
  if (profile.culturalProfile.entrepreneurialScore > 70) return 'entrepreneurial';
  if (profile.culturalProfile.savingsOrientation > 65) return 'saving';
  if (profile.annualIncomeINR > 500000 && profile.hasSmartphone) return 'investing';
  return 'subsistence';
}

function deriveStressResponse(profile: DemographicProfile): AgentPersona['stressResponse'] {
  if (profile.culturalProfile.communityBonding > 70) return 'community_dependent';
  if (profile.culturalProfile.entrepreneurialScore > 65 || profile.culturalProfile.riskAppetite > 60) return 'adaptive';
  if (profile.culturalProfile.socialActivism > 60) return 'resistant';
  return 'resigned';
}

function deriveCodeSwitching(profile: DemographicProfile): number {
  // Hinglish tendency: high for urban, Hindi-belt, educated young adults
  if (profile.areaType === 'rural') return 10;
  if (profile.motherTongue === 'hindi' || profile.motherTongue === 'urdu') {
    if (profile.education === 'graduate' || profile.education === 'postgraduate') return 70;
    return 40;
  }
  if (profile.secondLanguage === 'Hindi') return 30;
  return 15;
}

// ─────────────────────────────────────────────────────────────
// System Prompt Generator
// ─────────────────────────────────────────────────────────────

function buildSystemPrompt(profile: DemographicProfile): string {
  const worldview = deriveWorldview(profile);
  const occupation = profile.occupation === 'non_worker'
    ? (profile.age < 18 ? 'student' : 'homemaker/non-worker')
    : profile.employmentSector;

  const religiousPractice =
    profile.religiosity === 'very_religious'
      ? `is deeply devout and regularly observes ${profile.religion} religious practices`
      : profile.religiosity === 'somewhat_religious'
        ? `practices ${profile.religion} in a moderate way, participating in major festivals and rituals`
        : `identifies as ${profile.religion} but does not actively practise`;

  const politicalView =
    profile.politicalLeaning === 'apolitical'
      ? 'is largely apolitical and disengaged from electoral politics'
      : `leans ${profile.politicalLeaning.replace('_', '-')} politically`;

  const familyContext =
    profile.culturalProfile.familyStructure === 'joint_family'
      ? 'lives in a joint family household'
      : profile.culturalProfile.familyStructure === 'extended_family'
        ? 'lives with extended family nearby'
        : 'lives in a nuclear family setup';

  return `You are ${profile.firstName} ${profile.lastName}, a ${profile.age}-year-old ${profile.gender} from ${profile.district}, ${profile.state}, India. You belong to the ${profile.caste} community (${profile.socialCategory} category) and follow ${profile.religion}. Your mother tongue is ${profile.motherTongue}${profile.secondLanguage ? `, and you also speak ${profile.secondLanguage}` : ''}. You work as a ${occupation} and earn approximately ${Math.round(profile.annualIncomeINR / 12 / 1000)}K INR per month. You ${familyContext} with ${profile.householdSize} family members. You ${religiousPractice}. You ${politicalView}. Your worldview is broadly ${worldview}. You grew up in a ${profile.areaType} environment and your cultural background as a ${profile.caste} shapes your values around ${profile.culturalProfile.careerPreference.replace('_', ' ')}, family ${profile.culturalProfile.familyStructure.replace('_', ' ')}, and ${profile.culturalProfile.savingsOrientation > 60 ? 'saving money diligently' : 'spending within means'}. When responding, speak naturally in the way someone of your background would — ${profile.areaType === 'urban' && (profile.motherTongue === 'hindi' || profile.secondLanguage === 'Hindi') ? 'mixing Hindi and English naturally (Hinglish)' : `primarily in ${profile.motherTongue}-influenced speech`}. Draw on your lived experience in ${profile.district}, your work as a ${occupation}, and your family responsibilities.`;
}

function buildIdentityLine(profile: DemographicProfile): string {
  return `${profile.firstName} ${profile.lastName}, ${profile.age}, ${profile.occupation === 'non_worker' && profile.age < 18 ? 'student' : profile.employmentSector} from ${profile.district}, ${profile.state} (${profile.religion}, ${profile.socialCategory}).`;
}

function formatScore(score: string | undefined): string {
  return score ? ` (${score})` : '';
}

/**
 * Build the complete, self-contained persona prompt.
 *
 * Contains every piece of information about the person so an LLM can
 * act as them: identity, background, education timeline, work, personality,
 * interests (incl. movies/anime), habits, beliefs and behaviour rules.
 */
function buildFullPrompt(profile: DemographicProfile): string {
  // systemPrompt short chat ke liye hai; ye full roleplay prompt hai —
  // sections me likha hai taaki LLM ko poora context structured mile.
  const worldview = deriveWorldview(profile);
  const occupation = profile.occupation === 'non_worker'
    ? (profile.age < 18 ? 'student' : profile.employmentSector)
    : profile.employmentSector;

  const lines: string[] = [];

  lines.push(`You are ${profile.firstName} ${profile.lastName}, a ${profile.age}-year-old ${profile.gender} from ${profile.district}, ${profile.state}, India. Born on ${profile.dateOfBirth.slice(0, 10)} (${profile.bloodGroup} blood group, ${profile.heightCm} cm, ${profile.weightKg} kg).`);

  lines.push('');
  lines.push('IDENTITY');
  lines.push(`- Religion: ${profile.religion}; Caste/community: ${profile.caste}; Social category: ${profile.socialCategory}`);
  lines.push(`- Mother tongue: ${profile.motherTongue}${profile.secondLanguage ? `; also speaks ${profile.secondLanguage}` : ''}`);
  lines.push(`- Marital status: ${profile.maritalStatus.replace(/_/g, ' ')}${profile.spouseName ? `; spouse: ${profile.spouseName}` : ''}${profile.numberOfChildren > 0 ? `; ${profile.numberOfChildren} ${profile.numberOfChildren === 1 ? 'child' : 'children'}` : ''}`);
  lines.push(`- Lives in a ${profile.culturalProfile.familyStructure.replace(/_/g, ' ')} of ${profile.householdSize} members, ${profile.areaType} ${profile.district}`);
  lines.push(`- Father: ${profile.fatherName}; Mother: ${profile.motherName}`);
  lines.push(`- ${profile.isMigrant ? `Migrated from ${profile.migrationOriginState}` : `Born and raised in ${profile.district}, ${profile.state}`}`);

  lines.push('');
  lines.push('EDUCATION');
  if (profile.educationDetails.mediumOfInstruction) {
    lines.push(`- Medium of instruction: ${profile.educationDetails.mediumOfInstruction}`);
  }
  if (profile.educationTimeline.length === 0) {
    lines.push('- No formal schooling');
  } else {
    for (const stage of profile.educationTimeline) {
      const state = stage.status === 'in_progress' ? ' (ongoing)' : stage.status === 'dropped_out' ? ' (dropped out)' : '';
      lines.push(`- ${stage.startYear}–${stage.endYear}: ${stage.stageName} — ${stage.institutionName} (${stage.boardOrUniversity})${stage.stream ? `, ${stage.stream}` : ''}${stage.fieldOfStudy ? `, ${stage.fieldOfStudy}` : ''}${formatScore(stage.score)}${state}`);
    }
  }
  lines.push(`- Highest qualification: ${profile.education.replace(/_/g, ' ')}`);

  lines.push('');
  lines.push('WORK & FINANCES');
  lines.push(`- Occupation: ${profile.occupation.replace(/_/g, ' ')} (${occupation}); annual income: ₹${Math.round(profile.annualIncomeINR / 1000)}K; monthly household spend: ₹${Math.round(profile.monthlyExpenditureINR / 1000)}K${profile.landOwnershipAcres > 0 ? `; owns ${profile.landOwnershipAcres} acres of land` : ''}`);
  if (profile.rationCardType !== 'none') lines.push(`- Holds a ${profile.rationCardType} ration card; health insurance: ${profile.healthInsurance}`);

  lines.push('');
  lines.push('PERSONALITY');
  lines.push(`- ${profile.personalityTraits.summary}`);
  lines.push(`- Trait labels: ${profile.personalityTraits.traitLabels.join(', ')}`);
  lines.push(`- Strengths: ${profile.personalityTraits.strengths.join('; ')}`);
  lines.push(`- Weaknesses: ${profile.personalityTraits.weaknesses.join('; ')}`);
  lines.push(`- Communication style: ${profile.personalityTraits.communicationStyle.replace(/_/g, ' ')}; decision style: ${profile.personalityTraits.decisionStyle.replace(/_/g, ' ')}; social behaviour: ${profile.personalityTraits.socialBehavior}`);
  lines.push(`- Big Five scores — openness ${profile.personality.openness}, conscientiousness ${profile.personality.conscientiousness}, extraversion ${profile.personality.extraversion}, agreeableness ${profile.personality.agreeableness}, neuroticism ${profile.personality.neuroticism} (0-100)`);

  lines.push('');
  lines.push('INTERESTS & PREFERENCES');
  lines.push(`- Sport: ${profile.interests.primarySport}; reading: ${profile.interests.readingHabit.replace(/_/g, ' ')}; music: ${profile.interests.musicPreference}`);
  lines.push(`- Entertainment: ${profile.interests.entertainment.join(', ')}${profile.interests.preferredSocialMedia ? `; social media: ${profile.interests.preferredSocialMedia}` : ''}`);
  lines.push(`- Movies: ${profile.moviePreferences.genres.join(', ')} (in ${profile.moviePreferences.favoriteLanguages.join(', ')})`);
  if (profile.moviePreferences.anime) {
    lines.push(`- Anime fan: yes — prefers ${(profile.moviePreferences.animePreferences ?? []).join(', ')}, favourites include ${(profile.moviePreferences.favoriteAnimeTitles ?? []).join(', ')}`);
  }
  lines.push(`- Watches content primarily on ${profile.moviePreferences.primaryPlatform} (${profile.moviePreferences.watchFrequency})`);
  lines.push(`- Diet: ${profile.dietaryPreference.replace(/_/g, ' ')}; pet preference: ${profile.interests.petPreference.replace(/_/g, ' ')}`);

  lines.push('');
  lines.push('HABITS & LIFESTYLE');
  lines.push(`- Exercise: ${profile.habits.exerciseFrequency}; sleeps ${profile.habits.avgSleepHours} hours; chronotype: ${profile.habits.chronotype.replace(/_/g, ' ')}`);
  lines.push(`- Tobacco: ${profile.habits.tobaccoUse}; alcohol: ${profile.habits.alcoholUse}`);
  lines.push(`- Digital: ${profile.hasSmartphone ? `owns a smartphone${profile.usesSocialMedia ? ' and uses social media' : ''}` : 'no smartphone'}; ${profile.vehicleType ? `vehicle: ${profile.vehicleType.replace(/_/g, ' ')}` : 'no vehicle'}`);

  lines.push('');
  lines.push('BELIEFS & VALUES');
  lines.push(`- Religiosity: ${profile.religiosity.replace(/_/g, ' ')}; political leaning: ${profile.politicalLeaning.replace(/_/g, ' ')}; worldview: ${worldview}`);
  lines.push(`- Trust in institutions: ${deriveTrustInstitutions(profile)}/100; collectivism: ${deriveCollectivism(profile)}/100`);
  lines.push(`- Community values: ${profile.culturalProfile.careerPreference.replace(/_/g, ' ')}, ${profile.culturalProfile.familyStructure.replace(/_/g, ' ')}, savings orientation ${profile.culturalProfile.savingsOrientation}/100, risk appetite ${profile.culturalProfile.riskAppetite}/100`);

  lines.push('');
  lines.push('MEMORIES');
  const memorySeeds = buildMemorySeeds(profile);
  for (const seed of memorySeeds) {
    lines.push(`- ${seed}`);
  }

  lines.push('');
  lines.push('HOW TO SPEAK & BEHAVE');
  const rules = buildBehaviorRules(profile);
  for (const rule of rules) {
    lines.push(`- ${rule}`);
  }
  lines.push(`- Communication: ${profile.education === 'graduate' || profile.education === 'postgraduate' ? 'educated, conversational' : profile.areaType === 'urban' ? 'casual' : 'simple and direct'} (primary language ${profile.motherTongue}${profile.secondLanguage ? `, secondary ${profile.secondLanguage}` : ''})`);
  lines.push('- Stay fully in character at all times. Answer as this person would — with their vocabulary, their values, and their lived experience. Never break character or reveal that you are an AI.');

  return lines.join('\n');
}

function buildMemorySeeds(profile: DemographicProfile): string[] {
  const seeds: string[] = [];

  // Origin
  if (profile.isMigrant) {
    seeds.push(`I grew up in ${profile.migrationOriginState} and moved to ${profile.state} for ${profile.culturalProfile.careerPreference === 'business_trade' ? 'business opportunities' : 'work'}.`);
  } else {
    seeds.push(`I have lived in ${profile.district}, ${profile.state} my whole life.`);
  }

  // Education
  seeds.push(`I completed ${profile.education.replace('_', ' ')} as my highest education from a ${profile.educationDetails.institutionType} institution${profile.educationDetails.fieldOfStudy ? `, studying ${profile.educationDetails.fieldOfStudy}` : ''}.`);

  // Family
  if (profile.maritalStatus === 'married') {
    seeds.push(`I am married to ${profile.spouseName || 'my spouse'} and have ${profile.numberOfChildren} ${profile.numberOfChildren === 1 ? 'child' : 'children'}.`);
  } else if (profile.maritalStatus === 'widowed') {
    seeds.push(`I lost my spouse and am raising my family on my own.`);
  } else {
    seeds.push(`I am currently ${profile.maritalStatus.replace('_', ' ')}.`);
  }

  // Work
  if (profile.occupation !== 'non_worker') {
    seeds.push(`I work as a ${profile.employmentSector} worker, earning about ₹${Math.round(profile.annualIncomeINR / 12 / 1000)}K per month.`);
  }

  // Religion
  if (profile.religiosity === 'very_religious') {
    seeds.push(`My faith in ${profile.religion} is the most important part of my life. I pray and observe religious duties regularly.`);
  } else if (profile.religiosity === 'somewhat_religious') {
    seeds.push(`I observe major ${profile.religion} festivals and visit the temple/mosque/gurudwara on important occasions.`);
  }

  // Economic situation
  if (profile.annualIncomeINR < 100000) {
    seeds.push(`Money is tight. Every month is a struggle to make ends meet, especially with ${profile.householdSize} people to feed.`);
  } else if (profile.annualIncomeINR > 500000) {
    seeds.push(`We are comfortable financially. I try to save and plan ahead for my family's future.`);
  } else {
    seeds.push(`Life is manageable. We live within our means and try to save when we can.`);
  }

  // Community
  seeds.push(`As a ${profile.caste} person, I grew up with strong ${profile.culturalProfile.communityBonding > 70 ? 'community ties and mutual support networks' : 'values of self-reliance and hard work'}.`);

  // Digital life
  if (!profile.hasSmartphone) {
    seeds.push(`I do not have a smartphone. I rely on others for digital communication.`);
  } else if (profile.usesSocialMedia) {
    seeds.push(`I use ${profile.interests.preferredSocialMedia || 'WhatsApp'} to stay connected with family and news.`);
  }

  return seeds;
}

function buildBehaviorRules(profile: DemographicProfile): string[] {
  const rules: string[] = [];

  // Language
  const codeSwitching = deriveCodeSwitching(profile);
  if (codeSwitching > 50) {
    rules.push(`Speak naturally in Hinglish (Hindi-English mix), using Hindi words naturally in English sentences.`);
  } else if (profile.motherTongue !== 'hindi' && profile.motherTongue !== 'english') {
    rules.push(`Occasionally use ${profile.motherTongue} words or phrases when expressing strong emotions or cultural concepts.`);
  } else {
    rules.push(`Speak in ${profile.areaType === 'urban' ? 'polished Hindi or English' : 'simple, direct language'}.`);
  }

  // Formality
  if (profile.education === 'graduate' || profile.education === 'postgraduate') {
    rules.push(`Communicate in a reasonably educated manner — grammatically aware but conversational.`);
  } else if (profile.education === 'illiterate' || profile.education === 'primary') {
    rules.push(`Use simple vocabulary. Avoid complex or technical language.`);
  }

  // Religion-based constraints
  if (profile.religion === 'muslim' && profile.religiosity === 'very_religious') {
    rules.push(`Use Islamic greetings (Assalamu Alaikum) and phrases (Inshallah, Alhamdulillah, Mashallah) naturally in speech.`);
  } else if (profile.religion === 'sikh' && profile.religiosity !== 'not_at_all_religious') {
    rules.push(`Use Punjabi Sikh expressions (Waheguru, Sat Sri Akal) naturally when appropriate.`);
  } else if (profile.religion === 'hindu' && profile.religiosity === 'very_religious') {
    rules.push(`Reference Hindu customs, festivals, and deities naturally when relevant.`);
  }

  // Economic realism
  if (profile.annualIncomeINR < 100000) {
    rules.push(`Frame decisions around cost and affordability. Financial stress is a real and present concern.`);
  }

  // Political views
  if (profile.politicalLeaning === 'apolitical') {
    rules.push(`Avoid political discussions. Redirect to personal/family matters when politics is raised.`);
  } else if (profile.politicalLeaning === 'nationalist_right') {
    rules.push(`Express pride in Indian culture and tradition. Skeptical of foreign influences.`);
  } else if (profile.politicalLeaning === 'regionalist') {
    rules.push(`Identify strongly with ${profile.state}'s regional culture and language. Prioritize local issues.`);
  }

  // Social category realism
  if (profile.socialCategory === 'SC' || profile.socialCategory === 'ST') {
    rules.push(`Be aware of social hierarchies and discrimination as a lived reality, without dramatizing it unnecessarily.`);
  }

  // Always be consistent
  rules.push(`Always stay in character. Your responses should feel authentic to someone from ${profile.district}, ${profile.state} with your background.`);

  return rules;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Convert a DemographicProfile into an LLM-ready Agent Persona.
 *
 * The resulting persona can be used as:
 * - A system prompt for ChatGPT/Claude/Gemini for persona-based roleplay
 * - An agent configuration for multi-agent simulation frameworks
 * - A training example for persona-aware LLM fine-tuning
 *
 * @param profile - A fully generated DemographicProfile from SSPS
 */
export function generateAgentPersona(profile: DemographicProfile): AgentPersona {
  const worldview = deriveWorldview(profile);
  const codeSwitching = deriveCodeSwitching(profile);

  const beliefs: AgentBeliefs = {
    political: profile.politicalLeaning,
    religiosity: profile.religiosity,
    worldview,
    trustInstitutions: deriveTrustInstitutions(profile),
    trustReligiousInstitutions:
      profile.religiosity === 'very_religious' ? 85 :
      profile.religiosity === 'somewhat_religious' ? 60 :
      profile.religiosity === 'not_very_religious' ? 35 : 15,
    collectivismScore: deriveCollectivism(profile),
  };

  const communicationStyle: AgentCommunicationStyle = {
    primaryLanguage: profile.motherTongue,
    secondaryLanguage: profile.secondLanguage,
    formality: profile.education === 'graduate' || profile.education === 'postgraduate'
      ? 'mixed'
      : profile.areaType === 'urban' ? 'mixed' : 'informal',
    dialect: profile.state === 'Bihar' ? 'Bhojpuri-inflected Hindi'
      : profile.state === 'Punjab' ? 'Punjabi-inflected'
      : profile.state === 'Tamil Nadu' ? 'Tamil-accented English'
      : undefined,
    codeSwitchingTendency: codeSwitching,
  };

  const currentSituation = `${profile.firstName} is currently ${
    profile.maritalStatus === 'married' ? `married with ${profile.numberOfChildren} children` :
    profile.maritalStatus === 'widowed' ? 'widowed' :
    profile.maritalStatus === 'never_married' ? 'unmarried' : 'separated'
  }, living in a ${profile.culturalProfile.familyStructure.replace('_', ' ')} in ${profile.areaType} ${profile.district}. ${
    profile.annualIncomeINR < 100000 ? 'The family faces financial constraints.' :
    profile.annualIncomeINR > 500000 ? 'The family is economically stable.' :
    'The family manages within a modest income.'
  } ${profile.isMigrant ? `Originally from ${profile.migrationOriginState}.` : ''}`;

  return {
    systemPrompt: buildSystemPrompt(profile),
    fullPrompt: buildFullPrompt(profile),
    identityLine: buildIdentityLine(profile),
    beliefs,
    memorySeeds: buildMemorySeeds(profile),
    behaviorRules: buildBehaviorRules(profile),
    communicationStyle,
    currentSituation,
    stressResponse: deriveStressResponse(profile),
    economicBehavior: deriveEconomicBehavior(profile),
    profileId: profile.id,
    nationalPrevalence: profile.probabilityMetrics.jointProbability,
  };
}
