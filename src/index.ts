/**
 * Indian Fake Data Generator — Main Entry Point
 *
 * @author Abhay Mourya <https://github.com/abhay557>
 * @license MIT
 *
 * A generator for realistic Indian demographic data based on Census 2011 statistics.
 *
 * Adds three enrichment layers:
 *   - Layer 2: Outcome Simulation (credit, health, education, employment)
 *   - Layer 3: Narrative Text Generation (loan apps, medical notes, Hinglish chat)
 *   - Layer 4: Agent Persona Schema (LLM-ready system prompts and belief models)
 *
 * @packageDocumentation
 */

// ── Core Generation API ──────────────────────────────────────
export { generate, generateStream, getDistributionSummary } from './utils/generator.js';

// ── Enrichment API ────────────────────────────────────────
export { generateEnriched, generateEnrichedStream } from './utils/generator.js';

export { simulateOutcomes } from './utils/outcomes.js';
export { generateNarrative, generateAllNarratives } from './utils/narrative.js';
export { generateAgentPersona } from './utils/agent.js';

// ── User / Family / Persona API ──────────────────────────────
export { generateUser, generateUsers, generatePersona } from './utils/user.js';
export { generateFamily } from './utils/relations.js';
export type { UserOptions, UsersOptions } from './utils/user.js';
export type { FamilyOptions, FamilyUnit } from './utils/relations.js';

// ── Core Type Exports ────────────────────────────────────────
export type {
  DemographicProfile,
  GeneratorOptions,
  GenerationConstraints,
  ProbabilityMetrics,
  EnrichmentOptions,
  EnrichedProfile,
  Gender,
  EducationLevel,
  OccupationalSector,
  MaritalStatus,
  AreaType,
  SocialCategory,
  BloodGroup,
  DietaryPreference,
  EmploymentSector,
  RationCardType,
  HealthInsuranceType,
  DisabilityType,
  PoliticalLeaning,
  ReligiosityLevel,
  BigFivePersonality,
  CognitiveProfile,
  Interests,
  Habits,
  EducationDetails,
  EducationStage,
  PersonalityTraits,
  MoviePreferences,
  CulturalProfile,
  Appearance,
  HouseholdAssets,
  NameEntry,
  CasteEntry,
  CompiledDatabase,
  StateCensusData,
  ReligionCensusData,
  SeededRNG,
  FeatureNode,
  FeatureTree,
  AttentionMask,
  ResolvedPath
} from './types.js';

// ── Enrichment Type Exports ───────────────────────────────
export type { SimulatedOutcomes, CreditOutcome, HealthOutcome, EducationOutcome, EmploymentOutcome } from './utils/outcomes.js';
export type { NarrativeDocument, NarrativeDocumentType } from './utils/narrative.js';
export type { AgentPersona, AgentBeliefs, AgentCommunicationStyle } from './utils/agent.js';


// ── Utility Exports (for advanced users) ────────────────────
export { createRNG, weightedSample, weightedSampleFromRecord } from './core/sampler.js';
export { loadDatabase, mergeDatabase } from './database/index.js';
export { getDefaultDatabase } from './database/defaultData.js';
export { formatProfiles, saveProfilesToFile } from './utils/exporter.js';
export { generateAppearance, getRegion } from './utils/appearance.js';

// note for someone who is reading this code
// yee sab data probablity hai vho confidentail hai iske liye github par public nahi kar sakta
// kyu ki research paper bane ka hai iske liye public nahi kar sakta