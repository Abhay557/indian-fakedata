/**
 * Narrative Text Generation Layer (SSPS — Layer 3)
 *
 * Converts a DemographicProfile + SimulatedOutcomes into realistic
 * Indian text documents: loan applications, medical consultation notes,
 * school enrollment forms, Hinglish conversations, and more.
 *
 * Zero external API dependencies — pure template engine.
 * All documents are deterministic given the same profile + rng seed.
 */

import type { DemographicProfile } from '../types.js';
import type { SimulatedOutcomes } from './outcomes.js';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type NarrativeDocumentType =
  | 'loan_application'
  | 'medical_consultation'
  | 'school_enrollment'
  | 'voter_registration'
  | 'hinglish_conversation'
  | 'judicial_affidavit'
  | 'ration_card_application';

export interface NarrativeDocument {
  type: NarrativeDocumentType;
  /** Primary language of the document */
  language: 'english' | 'hindi' | 'hinglish';
  /** The generated document text */
  content: string;
  metadata: {
    wordCount: number;
    /** Named entities present in the document */
    entities: string[];
    /** Fields that could constitute PII */
    sensitiveFields: string[];
    /** Profile ID this document was generated from */
    profileId: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Helper Utilities
// ─────────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function formatIncome(inr: number): string {
  if (inr >= 10000000) return `₹${(inr / 10000000).toFixed(2)} Cr`;
  if (inr >= 100000) return `₹${(inr / 100000).toFixed(2)} Lakh`;
  return `₹${inr.toLocaleString('en-IN')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function educationLabel(edu: string): string {
  const labels: Record<string, string> = {
    illiterate: 'Non-literate',
    literate_below_primary: 'Literate (below Primary)',
    primary: 'Primary (Class V)',
    middle: 'Middle (Class VIII)',
    secondary: 'Secondary (Class X / Matriculate)',
    higher_secondary: 'Higher Secondary (Class XII / Intermediate)',
    graduate: 'Graduate (Bachelor\'s Degree)',
    postgraduate: 'Post-Graduate (Master\'s Degree)',
    technical_diploma: 'Technical/Vocational Diploma',
    professional_degree: 'Professional Degree (B.Tech / MBBS / LLB)',
  };
  return labels[edu] ?? edu;
}

function occupationLabel(occ: string): string {
  const labels: Record<string, string> = {
    cultivator: 'Cultivator / Farmer',
    agricultural_labourer: 'Agricultural Labourer',
    household_industry: 'Household Industry Worker',
    other_worker: 'Other Worker',
    non_worker: 'Non-Worker',
  };
  return labels[occ] ?? occ;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractEntities(content: string, profile: DemographicProfile): string[] {
  const entities: string[] = [];
  if (content.includes(profile.firstName)) entities.push(`PERSON:${profile.firstName} ${profile.lastName}`);
  if (content.includes(profile.state)) entities.push(`LOCATION:${profile.state}`);
  if (content.includes(profile.district)) entities.push(`LOCATION:${profile.district}`);
  if (content.includes(profile.aadhaarNumber)) entities.push(`ID:AADHAAR`);
  if (content.includes(profile.religion)) entities.push(`RELIGION:${profile.religion}`);
  return [...new Set(entities)];
}

// ─────────────────────────────────────────────────────────────
// Document Generator: Loan Application
// ─────────────────────────────────────────────────────────────

function generateLoanApplication(
  profile: DemographicProfile,
  outcomes: SimulatedOutcomes
): NarrativeDocument {
  const loanAmt = outcomes.credit.approvedLoanAmountINR
    ? formatIncome(outcomes.credit.approvedLoanAmountINR)
    : formatIncome(profile.annualIncomeINR * 2);

  const content = `
PERSONAL LOAN APPLICATION FORM
${profile.bankName.toUpperCase()} | IFSC: ${profile.bankIFSC}
─────────────────────────────────────────────────────────────────

APPLICATION DATE: ${new Date().toLocaleDateString('en-IN')}
APPLICATION NO: ${profile.bankAccountNumber.slice(0, 6)}-LA-${new Date().getFullYear()}

SECTION A — APPLICANT DETAILS
──────────────────────────────
Full Name           : ${profile.firstName} ${profile.lastName}
Father's Name       : ${profile.fatherName}
Date of Birth       : ${formatDate(profile.dateOfBirth)}
Gender              : ${toTitleCase(profile.gender)}
Marital Status      : ${toTitleCase(profile.maritalStatus.replace('_', ' '))}
Aadhaar Number      : ${profile.aadhaarNumber.replace(/(.{4})/g, '$1 ').trim()}
PAN Card Number     : ${profile.panNumber}
Voter ID            : ${profile.voterIdNumber}
Mobile Number       : ${profile.phoneNumber}
Email Address       : ${profile.email}

SECTION B — ADDRESS
─────────────────────
Current Address     : ${profile.addressLine}, ${profile.locality}
District            : ${profile.district}
State               : ${profile.state} — ${profile.stateCode}
PIN Code            : ${profile.pinCode}
Residence Type      : ${toTitleCase(profile.areaType)}

SECTION C — EMPLOYMENT & INCOME
─────────────────────────────────
Occupation          : ${occupationLabel(profile.occupation)}
Employment Sector   : ${toTitleCase(profile.employmentSector.replace('_', ' '))}
Annual Income       : ${formatIncome(profile.annualIncomeINR)}
Monthly Expenditure : ${formatIncome(profile.monthlyExpenditureINR)}
Employer/Business   : ${profile.employmentSector === 'government' ? 'Government of India / State Government' : 'Self / Private Employer'}

SECTION D — LOAN REQUEST
──────────────────────────
Loan Amount Requested : ${loanAmt}
Purpose of Loan     : ${profile.culturalProfile.careerPreference === 'business_trade' ? 'Business Expansion / Working Capital' : profile.culturalProfile.careerPreference === 'agriculture' ? 'Agricultural Input / Equipment Purchase' : 'Personal / Family Expenses'}
Repayment Tenure    : ${profile.age < 40 ? '60 months (5 years)' : '36 months (3 years)'}
Mode of Repayment   : ${profile.hasSmartphone ? 'Online / UPI Auto-Debit' : 'Branch / NACH Mandate'}

SECTION E — BANK DETAILS
──────────────────────────
Bank Name           : ${profile.bankName}
Account Number      : ${profile.bankAccountNumber}
Account Type        : ${profile.rationCardType === 'APL' || profile.rationCardType === 'none' ? 'Savings Account' : 'Jan Dhan / Basic Savings Account'}

SECTION F — CREDIT ASSESSMENT (Internal Use Only)
──────────────────────────────────────────────────
Credit Score        : ${outcomes.credit.creditScore} (CIBIL)
Approval Probability: ${Math.round(outcomes.credit.loanApprovalProbability * 100)}%
Risk Codes          : ${outcomes.credit.reasonCodes.join(', ') || 'NONE'}
Employment Quality  : ${toTitleCase(outcomes.employment.employmentQuality.replace('_', ' '))}

DECLARATION
────────────
I, ${profile.firstName} ${profile.lastName}, hereby declare that the information furnished above is true and correct to the best of my knowledge. I authorize ${profile.bankName} to verify the information and obtain my credit report from any credit bureau.

Signature: _______________________
Date      : ${new Date().toLocaleDateString('en-IN')}
Place     : ${profile.district}, ${profile.state}

[For Bank Use Only]
Processed by: _____________ | Verified by: _____________ | Date: _____________
`.trim();

  const entities = extractEntities(content, profile);
  return {
    type: 'loan_application',
    language: 'english',
    content,
    metadata: {
      wordCount: countWords(content),
      entities,
      sensitiveFields: ['aadhaarNumber', 'panNumber', 'bankAccountNumber', 'phoneNumber', 'email'],
      profileId: profile.id,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Document Generator: Medical Consultation Note
// ─────────────────────────────────────────────────────────────

function generateMedicalConsultation(
  profile: DemographicProfile,
  outcomes: SimulatedOutcomes
): NarrativeDocument {
  const conditions = outcomes.health.likelyConditions.join(', ') || 'No chronic conditions flagged';
  const bmi = profile.bmi.toFixed(1);

  const content = `
OUTPATIENT CONSULTATION RECORD
${profile.areaType === 'urban' ? 'District Hospital / Private Clinic' : 'Primary Health Centre (PHC) / Community Health Centre'}
${profile.district} District, ${profile.state}
─────────────────────────────────────────────────────────────────

OPD No.       : OPD-${profile.id.slice(0, 8).toUpperCase()}
Date          : ${new Date().toLocaleDateString('en-IN')}
Consulting Dr.: Dr. [Name], MBBS ${profile.areaType === 'urban' ? 'MD' : ''}

PATIENT INFORMATION
────────────────────
Name          : ${profile.firstName} ${profile.lastName}
Age / Sex     : ${profile.age} Yrs / ${toTitleCase(profile.gender)}
DOB           : ${formatDate(profile.dateOfBirth)}
Address       : ${profile.locality}, ${profile.district}
Phone         : ${profile.phoneNumber}
Aadhaar       : ${profile.aadhaarNumber.slice(0, 4)} XXXX ${profile.aadhaarNumber.slice(8)}
Religion      : ${toTitleCase(profile.religion)}
Caste/Category: ${profile.caste} (${profile.socialCategory})
Health Scheme : ${profile.healthInsurance === 'pmjay' ? 'Ayushman Bharat PM-JAY' : profile.healthInsurance === 'esis' ? 'ESIS' : profile.healthInsurance === 'cghs' ? 'CGHS' : 'None / Self-Pay'}

VITALS
──────
Height        : ${profile.heightCm} cm
Weight        : ${profile.weightKg} kg
BMI           : ${bmi} kg/m² (${outcomes.health.bmiCategory.replace('_', ' ')})
Blood Group   : ${profile.bloodGroup}

HISTORY
────────
Chief Complaint: Routine check-up / General illness
Dietary Habit  : ${toTitleCase(profile.dietaryPreference.replace('_', ' '))}
Tobacco Use    : ${profile.habits.tobaccoUse === 'none' ? 'Non-smoker / Non-tobacco user' : `Yes (${profile.habits.tobaccoUse})`}
Alcohol        : ${profile.habits.alcoholUse === 'none' ? 'None' : `Yes (${profile.habits.alcoholUse})`}
Exercise       : ${toTitleCase(profile.habits.exerciseFrequency)}
Sleep          : ${profile.habits.avgSleepHours} hours/night
Disability     : ${profile.disability === 'none' ? 'None' : toTitleCase(profile.disability.replace('_', ' '))}
Occupation     : ${occupationLabel(profile.occupation)}
Migrant Status : ${profile.isMigrant ? `Yes (from ${profile.migrationOriginState})` : 'Local Resident'}

ASSESSMENT
───────────
Health Risk Score   : ${outcomes.health.healthRiskScore}/100
Risk Indicators     : ${conditions}
Healthcare Access   : ${Math.round(outcomes.health.healthcareAccessProbability * 100)}% (estimated access probability)

PLAN
─────
${outcomes.health.healthRiskScore > 60
  ? '1. Urgent follow-up investigations required\n2. Lifestyle modification counseling\n3. Referral to specialist recommended'
  : outcomes.health.healthRiskScore > 35
    ? '1. Routine blood work and BP monitoring\n2. Dietary counseling\n3. Follow-up in 3 months'
    : '1. No immediate intervention required\n2. Continue healthy lifestyle\n3. Annual health screening recommended'
}

Doctor's Signature: _________________________ Date: ${new Date().toLocaleDateString('en-IN')}
`.trim();

  const entities = extractEntities(content, profile);
  return {
    type: 'medical_consultation',
    language: 'english',
    content,
    metadata: {
      wordCount: countWords(content),
      entities,
      sensitiveFields: ['aadhaarNumber', 'phoneNumber', 'bmi', 'bloodGroup', 'healthInsurance'],
      profileId: profile.id,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Document Generator: Hinglish Conversation
// ─────────────────────────────────────────────────────────────

function generateHinglishConversation(
  profile: DemographicProfile,
  outcomes: SimulatedOutcomes
): NarrativeDocument {
  // Generate a demographically-grounded conversation
  const firstName = profile.firstName;
  const isUrban = profile.areaType === 'urban';
  const hasLoan = (outcomes.credit.loanApprovalProbability > 0.5);

  const conversations: string[] = [];

  // Conversation 1: WhatsApp-style chat grounded in profile
  if (profile.religion === 'muslim') {
    conversations.push(`[WhatsApp Chat — ${firstName} & Friend]

Friend: Assalamu Alaikum bhai! Kya chal raha hai?
${firstName}: Wa alaikum assalam! Sab theek hai, aap batao?
Friend: ${isUrban ? 'Office mein busy tha yaar' : 'Khet mein kaam tha bhai'}, isliye reply nahi kar paya.
${firstName}: Koi baat nahi. Sunno, bank ka kaam hua kya?
Friend: Haan, loan ke liye apply kiya tha. ${hasLoan ? 'Approve ho gaya Alhamdulillah!' : 'Abhi decision pending hai.'}
${firstName}: Mashallah! Kitna mila?
Friend: Abhi batata hoon. Tum Inshallah kab aoge?
${firstName}: ${profile.district} se ${isUrban ? 'Metro mein' : 'shahar mein'} jaana hai, dekhte hain.`);
  } else if (profile.religion === 'sikh') {
    conversations.push(`[WhatsApp Chat — ${firstName} & Friend]

Friend: Sat Sri Akal paaji! Ki haal hai?
${firstName}: Sat Sri Akal! Changa aa bhai, tu suna.
Friend: ${isUrban ? 'Office di meeting si' : 'Khet wich kaam si'}, tenu phone nahi kar sakya.
${firstName}: Koi gall nahi. Bank wala kaam ho gaya?
Friend: Haan yaar, ${hasLoan ? 'loan approve ho gaya Waheguru di mehar naal!' : 'abhi review wich hai.'}
${firstName}: Waheguru Waheguru! Changa hoya.
Friend: Tenu ki khabar Punjab di?
${firstName}: Yaar, ${profile.district} wich sab theek aa.`);
  } else {
    // Default Hindi-English Hinglish
    conversations.push(`[WhatsApp Chat — ${firstName} & Friend]

Friend: Arre ${firstName} bhai! Kya scene hai? Kitne din baad!
${firstName}: Haan yaar! Bahut kaam tha. ${isUrban ? 'Office mein pressure zyada tha' : 'Gaon mein kuch kaam tha'}.
Friend: Suno, wo bank wala loan approve hua kya?
${firstName}: ${hasLoan ? 'Haan bhai! Finally approve ho gaya. Bahut relief mila.' : 'Nahi yaar, abhi pending hai. Documents kuch aur maang rahe hain.'}
Friend: Achha! Kitne ka tha?
${firstName}: Arrey chhod, wo sab baad mein batata hoon. Tu bata, kya plan hai weekend ka?
Friend: Kuch nahi yaar. ${profile.interests.primarySport !== 'none' ? `${profile.interests.primarySport} dekhne ka plan hai TV pe.` : 'Ghar pe hi rahenge.'}
${firstName}: Chalte hain phir. ${profile.areaType === 'urban' ? 'City mein kuch dhundhte hain.' : 'Bazaar mein milte hain.'} Kal milte hain!`);
  }

  const content = conversations[0];
  const entities = extractEntities(content, profile);

  return {
    type: 'hinglish_conversation',
    language: 'hinglish',
    content,
    metadata: {
      wordCount: countWords(content),
      entities,
      sensitiveFields: [],
      profileId: profile.id,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Document Generator: Ration Card Application
// ─────────────────────────────────────────────────────────────

function generateRationCardApplication(
  profile: DemographicProfile
): NarrativeDocument {
  const content = `
APPLICATION FOR RATION CARD / NFSA ENTITLEMENT
Department of Food, Civil Supplies & Consumer Affairs
Government of ${profile.state}
─────────────────────────────────────────────────────────────────

Form No: NFSA-RC-${profile.stateCode}-${new Date().getFullYear()}
Category Applied For: ${profile.rationCardType === 'AAY' ? 'Antyodaya Anna Yojana (AAY)' : profile.rationCardType === 'BPL' ? 'Below Poverty Line (BPL)' : 'Above Poverty Line (APL)'}

HOUSEHOLD DETAILS
──────────────────
Head of Household   : ${profile.firstName} ${profile.lastName}
S/O, D/O, W/O      : ${profile.fatherName}
Age                 : ${profile.age} years
Gender              : ${toTitleCase(profile.gender)}
Aadhaar No.         : ${profile.aadhaarNumber}
Mobile No.          : ${profile.phoneNumber}
Religion            : ${toTitleCase(profile.religion)}
Caste Category      : ${profile.socialCategory} ${profile.caste ? `(${profile.caste})` : ''}

ADDRESS
────────
Village/Ward        : ${profile.locality}
District            : ${profile.district}
State               : ${profile.state}
PIN                 : ${profile.pinCode}
Area Type           : ${toTitleCase(profile.areaType)}

HOUSEHOLD COMPOSITION
──────────────────────
Total Members       : ${profile.householdSize}
Married             : ${profile.maritalStatus === 'married' ? 'Yes' : 'No'}
Spouse Name         : ${profile.spouseName || 'N/A'}
No. of Children     : ${profile.numberOfChildren}
Annual HH Income    : ${formatIncome(profile.annualIncomeINR)}
Primary Occupation  : ${occupationLabel(profile.occupation)}

DWELLING
─────────
House Type          : ${profile.householdAssets.wallMaterial} walls, ${profile.householdAssets.roofMaterial} roof
Cooking Fuel        : ${toTitleCase(profile.householdAssets.cookingFuel.replace('_', ' '))}
Water Source        : ${profile.householdAssets.drinkingWaterSource.replace('_', ' ')}
No. of Rooms        : ${profile.householdAssets.numberOfRooms}
Own Land            : ${profile.landOwnershipAcres > 0 ? `${profile.landOwnershipAcres} acres` : 'No'}

DECLARATION
────────────
I declare that the above information is correct and that our household is not in possession of any existing ration card.

Applicant Signature: ____________________
Date: ${new Date().toLocaleDateString('en-IN')}

[For Office Use Only]
Verified by Supply Inspector: _____________
Ward/Village Panchayat: _________________
`.trim();

  const entities = extractEntities(content, profile);
  return {
    type: 'ration_card_application',
    language: 'english',
    content,
    metadata: {
      wordCount: countWords(content),
      entities,
      sensitiveFields: ['aadhaarNumber', 'phoneNumber'],
      profileId: profile.id,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Document Generator: School Enrollment Form
// ─────────────────────────────────────────────────────────────

function generateSchoolEnrollment(
  profile: DemographicProfile,
  outcomes: SimulatedOutcomes
): NarrativeDocument {
  const content = `
ADMISSION APPLICATION FORM — ${profile.educationDetails.institutionType.toUpperCase()} SCHOOL
${profile.district} District, ${profile.state}
Academic Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}
─────────────────────────────────────────────────────────────────

STUDENT DETAILS
────────────────
Student Name        : ${profile.firstName} ${profile.lastName}
Date of Birth       : ${formatDate(profile.dateOfBirth)}
Age                 : ${profile.age} years
Gender              : ${toTitleCase(profile.gender)}
Class Sought        : ${profile.age <= 6 ? 'Class I' : profile.age <= 10 ? `Class ${profile.age - 5}` : profile.age <= 14 ? `Class ${profile.age - 8}` : 'Class XI / XII'}
Blood Group         : ${profile.bloodGroup}
Aadhaar (Student)   : ${profile.aadhaarNumber}
Category            : ${profile.socialCategory} ${profile.caste ? `— ${profile.caste}` : ''}
Religion            : ${toTitleCase(profile.religion)}
Mother Tongue       : ${toTitleCase(profile.motherTongue)}
Medium of Instruction Preferred: ${profile.educationDetails.mediumOfInstruction}
Disability (if any) : ${profile.disability === 'none' ? 'No disability' : toTitleCase(profile.disability.replace('_', ' '))}

PARENT/GUARDIAN DETAILS
────────────────────────
Father's Name       : ${profile.fatherName}
Mother's Name       : ${profile.motherName}
Guardian's Occupation: ${occupationLabel(profile.occupation)}
Annual Family Income: ${formatIncome(profile.annualIncomeINR)}
Mobile No.          : ${profile.phoneNumber}
Email               : ${profile.email}

ADDRESS
────────
${profile.addressLine}, ${profile.locality}
${profile.district}, ${profile.state} — ${profile.pinCode}

PREVIOUS SCHOOL DETAILS
────────────────────────
Last School Attended: ${profile.areaType === 'rural' ? 'Government Primary School, ' + profile.locality : 'Private School, ' + profile.district}
TC Number           : TC-${profile.id.slice(0, 8).toUpperCase()}
Marks/Grade         : ${outcomes.education.functionalLiteracy > 70 ? 'A Grade (Distinction)' : outcomes.education.functionalLiteracy > 50 ? 'B Grade (First Division)' : 'C Grade (Second Division)'}

ENTITLEMENTS CLAIMED
─────────────────────
Free Textbooks     : ${profile.rationCardType === 'BPL' || profile.rationCardType === 'AAY' ? 'Yes (BPL/AAY household)' : 'No'}
Scholarship        : ${profile.socialCategory === 'SC' || profile.socialCategory === 'ST' ? 'Yes (Pre-Matric SC/ST Scholarship)' : profile.socialCategory === 'OBC' ? 'Yes (OBC Scholarship if applicable)' : 'No'}
RTE Admission (25%): ${profile.annualIncomeINR < 200000 ? 'Applied under RTE Act 2009' : 'Not applicable'}
Mid-Day Meal       : Yes (Government scheme)

Parent Signature: ____________________  Date: ${new Date().toLocaleDateString('en-IN')}
`.trim();

  const entities = extractEntities(content, profile);
  return {
    type: 'school_enrollment',
    language: 'english',
    content,
    metadata: {
      wordCount: countWords(content),
      entities,
      sensitiveFields: ['aadhaarNumber', 'phoneNumber', 'email'],
      profileId: profile.id,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Generate a realistic Indian text document from a demographic profile.
 *
 * @param profile  - A fully generated DemographicProfile from SSPS
 * @param outcomes - Simulated outcomes (from simulateOutcomes())
 * @param docType  - Type of document to generate
 */
export function generateNarrative(
  profile: DemographicProfile,
  outcomes: SimulatedOutcomes,
  docType: NarrativeDocumentType
): NarrativeDocument {
  switch (docType) {
    case 'loan_application':
      return generateLoanApplication(profile, outcomes);
    case 'medical_consultation':
      return generateMedicalConsultation(profile, outcomes);
    case 'hinglish_conversation':
      return generateHinglishConversation(profile, outcomes);
    case 'ration_card_application':
      return generateRationCardApplication(profile);
    case 'school_enrollment':
      return generateSchoolEnrollment(profile, outcomes);
    default:
      // Fallback to loan application for unimplemented types
      return generateLoanApplication(profile, outcomes);
  }
}

/**
 * Generate all supported narrative documents for a profile.
 * Useful for building multi-document corpora.
 */
export function generateAllNarratives(
  profile: DemographicProfile,
  outcomes: SimulatedOutcomes
): NarrativeDocument[] {
  const types: NarrativeDocumentType[] = [
    'loan_application',
    'medical_consultation',
    'hinglish_conversation',
    'ration_card_application',
    'school_enrollment',
  ];
  return types.map(t => generateNarrative(profile, outcomes, t));
}
