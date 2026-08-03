/**
 * Indian Fake Data Generator - Type Definitions
 *
 * Complete type system for the hierarchical, attention-based
 * demographic profile generator.
 */

// ─────────────────────────────────────────────────────────────
// 1. Feature Tree Types
// ─────────────────────────────────────────────────────────────

/** A single node in the hierarchical feature tree */
export interface FeatureNode {
  /** Unique identifier: e.g. "hindu", "uttar_pradesh", "brahmin" */
  id: string;
  /** Human-readable label */
  label: string;
  /** Probability weight (relative to siblings) — FP32 precision */
  weight: number;
  /** Child nodes forming the next layer of the tree */
  children?: FeatureNode[];
  /** Optional metadata attached to this node */
  meta?: Record<string, unknown>;
}

/** The complete feature tree with all demographic layers */
export interface FeatureTree {
  /** Root religion nodes */
  religions: FeatureNode[];
  /** Mapping: religionId → stateId → caste/community nodes */
  stateCasteMap: Record<string, Record<string, FeatureNode[]>>;
  /** Global state definitions with population weights */
  states: FeatureNode[];
}

// ─────────────────────────────────────────────────────────────
// 2. Profile Output Types
// ─────────────────────────────────────────────────────────────

/** Gender enum */
export type Gender = 'male' | 'female' | 'other';

/** Educational attainment levels from Census C-08 */
export type EducationLevel =
  | 'illiterate'
  | 'literate_below_primary'
  | 'primary'
  | 'middle'
  | 'secondary'
  | 'higher_secondary'
  | 'graduate'
  | 'postgraduate'
  | 'technical_diploma'
  | 'professional_degree';

/** Occupational sector from Census B-Series */
export type OccupationalSector =
  | 'cultivator'
  | 'agricultural_labourer'
  | 'household_industry'
  | 'other_worker'
  | 'non_worker';

/** Marital status */
export type MaritalStatus = 'never_married' | 'married' | 'widowed' | 'divorced_separated';

/** Residential classification */
export type AreaType = 'urban' | 'rural';

/** SC/ST/OBC/General social category */
export type SocialCategory = 'SC' | 'ST' | 'OBC' | 'General';

/** Blood group distribution (Indian population) */
export type BloodGroup = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

/** Dietary preference */
export type DietaryPreference = 'vegetarian' | 'non_vegetarian' | 'eggetarian' | 'vegan';

/** Employment sector */
export type EmploymentSector = 'government' | 'private' | 'self_employed' | 'public_sector' | 'informal' | 'unemployed' | 'student' | 'homemaker' | 'retired';

/** Ration card type */
export type RationCardType = 'APL' | 'BPL' | 'AAY' | 'AY' | 'none';

/** Health insurance type */
export type HealthInsuranceType = 'pmjay' | 'esis' | 'cghs' | 'private' | 'none';

/** Disability type (Census 2011) */
export type DisabilityType = 'none' | 'visual' | 'hearing' | 'speech' | 'locomotor' | 'mental_illness' | 'mental_retardation' | 'multiple';

/** Political leaning (CSDS/Lokniti survey framework) */
export type PoliticalLeaning = 'nationalist_right' | 'centre_right' | 'centrist' | 'centre_left' | 'leftist' | 'regionalist' | 'apolitical';

/** Religiosity level (Pew Research India 2021 framework) */
export type ReligiosityLevel = 'very_religious' | 'somewhat_religious' | 'not_very_religious' | 'not_at_all_religious';

/** Big Five personality trait scores (0-100 scale) */
export interface BigFivePersonality {
  /** Openness to experience (curiosity, creativity) */
  openness: number;
  /** Conscientiousness (discipline, organization) */
  conscientiousness: number;
  /** Extraversion (sociability, assertiveness) */
  extraversion: number;
  /** Agreeableness (cooperation, trust) */
  agreeableness: number;
  /** Neuroticism (emotional instability, anxiety) */
  neuroticism: number;
}

/** Cognitive and aptitude scores (correlated with education + SES + nutrition) */
export interface CognitiveProfile {
  /** General aptitude score (0-100, correlated with education access + nutrition) */
  aptitudeScore: number;
  /** Numeracy score (0-100) */
  numeracyScore: number;
  /** Literacy score (0-100) */
  literacyScore: number;
  /** Digital literacy score (0-100) */
  digitalLiteracyScore: number;
  /** Financial literacy score (0-100) */
  financialLiteracyScore: number;
}

/** Interest/hobby categories */
export interface Interests {
  /** Primary sport interest */
  primarySport: string;
  /** Pet preference */
  petPreference: 'dogs' | 'cats' | 'birds' | 'fish' | 'none';
  /** Entertainment preference */
  entertainment: string[];
  /** Reading habits */
  readingHabit: 'avid_reader' | 'occasional' | 'rare' | 'non_reader';
  /** Music preference */
  musicPreference: string;
  /** Social media platform preference */
  preferredSocialMedia?: string;
}

/** Habits and lifestyle behaviors */
export interface Habits {
  /** Tobacco use (NFHS-5) */
  tobaccoUse: 'none' | 'smoking' | 'chewing' | 'both';
  /** Alcohol consumption (NFHS-5) */
  alcoholUse: 'none' | 'occasional' | 'regular' | 'heavy';
  /** Exercise/fitness */
  exerciseFrequency: 'daily' | 'weekly' | 'occasional' | 'never';
  /** Sleep hours */
  avgSleepHours: number;
  /** Cooking preference */
  cooksAtHome: boolean;
  /** Morning person vs night owl */
  chronotype: 'early_riser' | 'moderate' | 'night_owl';
}

/** Expanded education details (AISHE data) */
export interface EducationDetails {
  /** Field of study (for higher education) */
  fieldOfStudy?: string;
  /** Institution type */
  institutionType: 'government' | 'private' | 'aided' | 'central_university' | 'iit_nit' | 'none';
  /** Medium of instruction */
  mediumOfInstruction: string;
  /** Year of last qualification */
  qualificationYear?: number;
  /** Competitive exam score percentile (if applicable) */
  competitiveExamPercentile?: number;
}

/** Community-level cultural traits (religion + caste + state correlated) */
export interface CulturalProfile {
  /** Business/entrepreneurial orientation (0-100). High: Marwari, Gujarati, Jain, Sindhi, Bania */
  entrepreneurialScore: number;
  /** Academic/intellectual orientation (0-100). High: Brahmin, Kayastha, Nair, Iyer, Bengali Bhadralok */
  academicOrientation: number;
  /** Artistic/cultural inclination (0-100). High: Bengali, Kashmiri, Kerala, Rajasthani */
  artisticInclination: number;
  /** Military/martial tradition (0-100). High: Rajput, Sikh, Gorkha, Maratha, Jat */
  militaryTradition: number;
  /** Agricultural rootedness (0-100). High: Jat, Yadav, Patel, Kamma, Reddy */
  agriculturalRootedness: number;
  /** Trade/artisan skill tradition (0-100). High: Ansari(weaving), Vishwakarma, Kumhar, Lohar */
  artisanTradition: number;
  /** Bureaucratic/administrative orientation (0-100). High: Kayastha, Khatri, Karana */
  bureaucraticOrientation: number;
  /** Social activism/reform orientation (0-100). High: Dalit communities, Buddhist converts */
  socialActivism: number;
  /** Community bonding/collectivism (0-100). High: Tribal, Sikh, Muslim, Jain */
  communityBonding: number;
  /** Migration tendency (0-100). High: Bihari, Marwari, Malayali, Sindhi */
  migrationTendency: number;
  /** Career preference pattern */
  careerPreference: 'business_trade' | 'government_service' | 'professional' | 'agriculture' | 'military_police' | 'artisan_craft' | 'tech_it' | 'medicine' | 'teaching' | 'labor';
  /** Family structure tendency */
  familyStructure: 'joint_family' | 'nuclear_family' | 'extended_family';
  /** Savings orientation (0-100). High: Marwari, Jain, Gujarati */
  savingsOrientation: number;
  /** Risk appetite for business/investment (0-100) */
  riskAppetite: number;
}

/** Household asset ownership indicators (Census H-Series) */
export interface HouseholdAssets {
  hasRadioTransistor: boolean;
  hasTelevision: boolean;
  hasComputer: boolean;
  hasPhone: boolean;
  hasBicycle: boolean;
  hasScooter: boolean;
  hasCar: boolean;
  bankingService: boolean;
  treatedWaterSource: boolean;
  latrineFacility: boolean;
  /** Number of rooms in the dwelling (1–5+) */
  numberOfRooms: number;
  /** Roof material type */
  roofMaterial: 'concrete' | 'tiles' | 'metal_sheet' | 'thatch' | 'other';
  /** Wall material type */
  wallMaterial: 'burnt_brick' | 'stone' | 'mud' | 'wood' | 'other';
  /** Primary cooking fuel */
  cookingFuel: 'lpg' | 'firewood' | 'crop_residue' | 'cowdung' | 'kerosene' | 'coal' | 'biogas' | 'electricity' | 'other';
  /** Primary lighting source */
  lightingSource: 'electricity' | 'kerosene' | 'solar' | 'other';
  /** Primary drinking water source */
  drinkingWaterSource: 'tap_treated' | 'tap_untreated' | 'handpump' | 'tubewell' | 'well_covered' | 'well_uncovered' | 'river' | 'other';
}

/** A single generated demographic profile */
export interface DemographicProfile {
  /** Unique UUID for this profile */
  id: string;

  // ── Identity ──────────────────────────────────────────
  firstName: string;
  lastName: string;
  /** Father's name (religion + caste consistent) */
  fatherName: string;
  /** Mother's name (religion + caste consistent) */
  motherName: string;
  /** Spouse name (if married, same religion) */
  spouseName?: string;
  gender: Gender;
  age: number;
  /** Full date of birth (ISO 8601) */
  dateOfBirth: string;
  bloodGroup: BloodGroup;

  // ── Biometrics ────────────────────────────────────────
  /** Height in cm */
  heightCm: number;
  /** Weight in kg */
  weightKg: number;
  /** Body Mass Index */
  bmi: number;

  // ── Identity Documents ────────────────────────────────
  /** 12-digit Aadhaar number (Verhoeff checksum valid) */
  aadhaarNumber: string;
  /** PAN card number (ABCDE1234F format) */
  panNumber: string;
  /** Voter ID (ABC1234567 format) */
  voterIdNumber: string;
  /** 10-digit mobile number with state-based prefix */
  phoneNumber: string;
  /** Email address */
  email: string;

  // ── Location ──────────────────────────────────────────
  state: string;
  stateCode: string;
  district: string;
  areaType: AreaType;
  /** Full address line */
  addressLine: string;
  /** Locality / village / mohalla */
  locality: string;
  /** 6-digit PIN code (state-mapped) */
  pinCode: string;

  // ── Demographics ──────────────────────────────────────
  religion: string;
  caste: string;
  socialCategory: SocialCategory;
  motherTongue: string;
  secondLanguage?: string;

  // ── Socioeconomic ─────────────────────────────────────
  education: EducationLevel;
  occupation: OccupationalSector;
  /** Detailed employment sector */
  employmentSector: EmploymentSector;
  maritalStatus: MaritalStatus;
  annualIncomeINR: number;
  /** Monthly household expenditure in INR */
  monthlyExpenditureINR: number;
  /** Number of children (correlated with age, marital status) */
  numberOfChildren: number;

  // ── Lifestyle ──────────────────────────────────────────
  /** Veg/Non-veg (correlated with religion + state) */
  dietaryPreference: DietaryPreference;
  /** Disability status (Census 2011: 2.21%) */
  disability: DisabilityType;
  /** Born in same state or migrant */
  isMigrant: boolean;
  /** State of origin (if migrant) */
  migrationOriginState?: string;

  // ── Financial ─────────────────────────────────────────
  /** Bank IFSC code (state-mapped) */
  bankIFSC: string;
  /** Bank name */
  bankName: string;
  /** Bank account number (11-digit) */
  bankAccountNumber: string;
  /** Ration card type (income-correlated) */
  rationCardType: RationCardType;
  /** Health insurance type */
  healthInsurance: HealthInsuranceType;
  /** Land ownership in acres (rural only, 0 for urban) */
  landOwnershipAcres: number;

  // ── Vehicle ───────────────────────────────────────────
  /** Vehicle registration number (state-coded: MH-12-AB-1234) */
  vehicleRegistration?: string;
  /** Vehicle type */
  vehicleType?: 'two_wheeler' | 'four_wheeler' | 'commercial' | 'none';

  // ── Digital ───────────────────────────────────────────
  /** Has internet access */
  hasInternetAccess: boolean;
  /** Has smartphone */
  hasSmartphone: boolean;
  /** Uses social media */
  usesSocialMedia: boolean;
  /** UPI ID (phone-based) */
  upiId?: string;

  // ── Psychological & Behavioral ────────────────────────
  /** Big Five personality trait scores (OCEAN model) */
  personality: BigFivePersonality;
  /** Political leaning (CSDS/Lokniti survey data) */
  politicalLeaning: PoliticalLeaning;
  /** Religiosity level (Pew Research India 2021) */
  religiosity: ReligiosityLevel;
  /** Cognitive/aptitude scores (education + SES correlated) */
  cognitiveProfile: CognitiveProfile;
  /** Interests and hobbies */
  interests: Interests;
  /** Habits and lifestyle behaviors */
  habits: Habits;
  /** Expanded education details */
  educationDetails: EducationDetails;
  /** Community-level cultural traits */
  culturalProfile: CulturalProfile;

  // ── Household ─────────────────────────────────────────
  householdSize: number;
  householdAssets: HouseholdAssets;

  // ── Probability Metrics ───────────────────────────────
  probabilityMetrics: ProbabilityMetrics;

  // ── Metadata ──────────────────────────────────────────
  /** ISO 8601 timestamp of generation */
  generatedAt: string;
  /** Seed used (for reproducibility) */
  seed: number;
}

/** Probability breakdown showing how likely this profile is in real life */
export interface ProbabilityMetrics {
  /** P(religion) — national frequency of this religion */
  nationalReligionFreq: number;
  /** P(state | religion) — conditional probability of this state given religion */
  stateGivenReligionProb: number;
  /** P(caste | religion, state) — conditional probability of caste given religion+state */
  casteGivenContextProb: number;
  /** P(surname | caste) — probability of this surname given the caste */
  lastNameGivenCasteProb: number;
  /** P(socialCategory | state, religion) — probability of SC/ST/OBC/General */
  socialCategoryProb: number;
  /** P(education | state, areaType, socialCategory) */
  educationProb: number;
  /** P(occupation | state, education, gender) */
  occupationProb: number;
  /** Full joint probability — product of all conditional layers */
  jointProbability: number;
}

// ─────────────────────────────────────────────────────────────
// 3. Constraint / Configuration Types
// ─────────────────────────────────────────────────────────────

/** User-supplied constraints to guide generation */
export interface GenerationConstraints {
  /** Fix the religion (e.g. "Hindu", "Muslim") */
  religion?: string;
  /** Fix the state (e.g. "Kerala", "Punjab") */
  state?: string;
  /** Fix the gender */
  gender?: Gender;
  /** Fix the caste/community */
  caste?: string;
  /** Fix the social category */
  socialCategory?: SocialCategory;
  /** Fix the area type */
  areaType?: AreaType;
  /** Age range constraint */
  ageRange?: { min: number; max: number };
  /** Fix education level */
  education?: EducationLevel;
  /** Fix occupation sector */
  occupation?: OccupationalSector;
  /** Fix marital status */
  maritalStatus?: MaritalStatus;
  /** Fix the surname (family name). Useful for family/relational generation */
  surname?: string;
}

/** Options for the generator */
export interface GeneratorOptions {
  /** Number of profiles to generate (default: 1) */
  count?: number;
  /** Reproducibility seed (optional, auto-generated if not set). Numeric or string ("011") */
  seed?: number | string;
  /** User constraints */
  constraints?: GenerationConstraints;
  /** If true, include full probability metrics in output (default: true) */
  includeProbabilityMetrics?: boolean;
  /** Path to custom data directory (overrides built-in defaults) */
  dataDir?: string;
  /** Locale / country (default: 'IN' for India) */
  locale?: string;
}

// ─────────────────────────────────────────────────────────────
// 4. Internal Engine Types
// ─────────────────────────────────────────────────────────────

/** Attention mask vector for a single layer */
export interface AttentionMask {
  /** Layer name (e.g. 'religion', 'state', 'caste') */
  layer: string;
  /** Map of nodeId → masked weight (0 = blocked, original = allowed) */
  weights: Map<string, number>;
}

/** A resolved path through the feature tree */
export interface ResolvedPath {
  religionId: string;
  stateId: string;
  casteId: string;
  socialCategory: SocialCategory;
  /** The cumulative joint probability at this path */
  jointProb: number;
}

/** Compiled census data record for a single state */
export interface StateCensusData {
  stateCode: string;
  stateName: string;
  totalPopulation: number;
  urbanPopulation: number;
  ruralPopulation: number;
  sexRatio: number; // females per 1000 males
  literacyRate: number;
  /** Religion distribution: religionId → proportion (0–1) */
  religionDistribution: Record<string, number>;
  /** SC proportion */
  scProportion: number;
  /** ST proportion */
  stProportion: number;
  /** Education distribution per area type */
  educationDistribution: Record<AreaType, Record<EducationLevel, number>>;
  /** Occupation distribution per gender */
  occupationDistribution: Record<Gender, Record<OccupationalSector, number>>;
  /** Language distribution: languageId → proportion */
  languageDistribution: Record<string, number>;
  /** Asset ownership rates (urban vs rural) */
  assetDistribution: Record<AreaType, Partial<Record<keyof HouseholdAssets, number>>>;
}

/** Compiled religion data */
export interface ReligionCensusData {
  id: string;
  label: string;
  /** National proportion (0–1) */
  nationalProportion: number;
  /** State-wise conditional: stateId → P(state | religion) */
  stateConditionals: Record<string, number>;
}

/** Compiled name database entry */
export interface NameEntry {
  name: string;
  /** Relative weight / frequency */
  weight: number;
  /** Associated gender(s) */
  gender: Gender | 'unisex';
}

/** Complete compiled database loaded at runtime */
export interface CompiledDatabase {
  /** All state census records */
  states: Record<string, StateCensusData>;
  /** Religion census records */
  religions: Record<string, ReligionCensusData>;
  /** Caste/community mapping: religionId → stateId → CasteEntry[] */
  casteMap: Record<string, Record<string, CasteEntry[]>>;
  /** First names: religionId → stateId → gender → NameEntry[] */
  firstNames: Record<string, Record<string, Record<Gender, NameEntry[]>>>;
  /** Surnames: casteId → NameEntry[] */
  surnames: Record<string, NameEntry[]>;
  /** District list: stateId → districtName[] */
  districts: Record<string, string[]>;
}

/** A caste/community entry in the database */
export interface CasteEntry {
  id: string;
  label: string;
  /** Relative weight within this religion-state context */
  weight: number;
  /** Social category this caste belongs to */
  socialCategory: SocialCategory;
}

// ─────────────────────────────────────────────────────────────
// 5. Seeded PRNG Types
// ─────────────────────────────────────────────────────────────

/** Interface for a seeded pseudo-random number generator */
export interface SeededRNG {
  /** Returns a uniform random float in [0, 1) */
  next(): number;
  /** Returns the current seed state */
  seed: number;
  /** Resets to a specific seed */
  reset(seed: number): void;
}

// ─────────────────────────────────────────────────────────────
// 6. SSPS Enrichment Types
// ─────────────────────────────────────────────────────────────

/**
 * Options for the enriched profile generator (SSPS).
 * All layer flags default to false for backwards compatibility.
 */
export interface EnrichmentOptions {
  /**
   * Include Layer 2: Outcome Simulation (credit, health, education, employment).
   * @default false
   */
  includeOutcomes?: boolean;
  /**
   * Bias level for outcome simulation (0.0 = meritocracy, 1.0 = max historical discrimination).
   * Only used when includeOutcomes = true.
   * @default 0.3
   */
  biasLevel?: number;
  /**
   * Include Layer 3: Narrative text documents.
   * Specify which document types to generate, or 'all'.
   * @default undefined (disabled)
   */
  narrativeTypes?: Array<
    | 'loan_application'
    | 'medical_consultation'
    | 'hinglish_conversation'
    | 'ration_card_application'
    | 'school_enrollment'
    | 'all'
  >;
  /**
   * Include Layer 4: Agent Persona Schema for LLM simulation.
   * @default false
   */
  includeAgentPersona?: boolean;
}

/**
 * A fully enriched profile — the base DemographicProfile plus
 * all three new layers from SSPS .
 */
export interface EnrichedProfile {
  /** The base 123-field demographic profile (unchanged from v1) */
  profile: DemographicProfile;
  /** Layer 2: Simulated life outcomes (optional) */
  outcomes?: import('./utils/outcomes.js').SimulatedOutcomes;
  /** Layer 3: Generated narrative documents (optional) */
  narratives?: import('./utils/narrative.js').NarrativeDocument[];
  /** Layer 4: LLM-ready agent persona (optional) */
  agentPersona?: import('./utils/agent.js').AgentPersona;
}

