/**
 * Default Demographic Database
 * 
 * A comprehensive, built-in demographic database for India based on 
 * Census 2011 data. This serves as the fallback when no custom data
 * directory is provided, and as the base layer that compiled census
 * data merges into.
 * 
 * Coverage: All 36 States/UTs, 6 major religions, 355 caste entries,
 * ~4600 first names, 48 surnames.
 *
 * Accuracy notes:
 * - State populations, sex ratios, literacy and SC/ST proportions are
 *   from Census 2011.
 * - Religion national proportions are from Census 2011 (Table C-01).
 * - Per-state religion conditionals are hand-calibrated approximations
 *   (they do not sum to 1.0 and are NOT a census table).
 * - Education/occupation distributions are hand-calibrated
 *   approximations for realistic-looking output.
 * - Districts are real district names but only a representative subset
 *   per state (not exhaustive).
 */

import type {
  CompiledDatabase,
  StateCensusData,
  ReligionCensusData,
  CasteEntry,
  NameEntry,
  Gender,
  AreaType,
  EducationLevel,
  OccupationalSector
} from '../types.js';
import { compiledNames } from './namesData.js';

// ═════════════════════════════════════════════════════════════
// RELIGION DATA
// nationalProportion: Census 2011 - Table C-01
// stateConditionals: hand-calibrated approximations (not census)
// ═════════════════════════════════════════════════════════════

const religions: Record<string, ReligionCensusData> = {
  hindu: {
    id: 'hindu',
    label: 'Hindu',
    nationalProportion: 0.7980,
    stateConditionals: {
      uttar_pradesh: 0.1267, maharashtra: 0.0924, bihar: 0.0785, west_bengal: 0.0672,
      madhya_pradesh: 0.0618, rajasthan: 0.0578, tamil_nadu: 0.0547, karnataka: 0.0455,
      gujarat: 0.0447, andhra_pradesh: 0.0421, odisha: 0.0367, jharkhand: 0.0242,
      kerala: 0.0194, chhattisgarh: 0.0219, telangana: 0.0321, assam: 0.0194,
      punjab: 0.0121, haryana: 0.0182, uttarakhand: 0.0086, himachal_pradesh: 0.0058,
      delhi: 0.0133, jammu_kashmir: 0.0035, goa: 0.0009, tripura: 0.0027,
      meghalaya: 0.0003, manipur: 0.0012, nagaland: 0.0001, mizoram: 0.00003,
      arunachal_pradesh: 0.0003, sikkim: 0.0002, puducherry: 0.0010,
      chandigarh: 0.0008, andaman_nicobar: 0.0003, dadra_nagar_haveli: 0.0003,
      daman_diu: 0.0002, lakshadweep: 0.00001
    }
  },
  muslim: {
    id: 'muslim',
    label: 'Muslim',
    nationalProportion: 0.1435,
    stateConditionals: {
      uttar_pradesh: 0.2614, west_bengal: 0.1503, bihar: 0.1155, maharashtra: 0.0705,
      kerala: 0.0531, assam: 0.0704, jammu_kashmir: 0.0587, karnataka: 0.0495,
      rajasthan: 0.0371, andhra_pradesh: 0.0277, telangana: 0.0370, jharkhand: 0.0242,
      tamil_nadu: 0.0244, gujarat: 0.0374, delhi: 0.0155, madhya_pradesh: 0.0255,
      uttarakhand: 0.0081, haryana: 0.0073, chhattisgarh: 0.0014, odisha: 0.0049,
      punjab: 0.0022, manipur: 0.0009, tripura: 0.0005, meghalaya: 0.0003,
      goa: 0.0003, himachal_pradesh: 0.0003, puducherry: 0.0004,
      lakshadweep: 0.0006, andaman_nicobar: 0.0001, chandigarh: 0.0001,
      dadra_nagar_haveli: 0.00005, daman_diu: 0.00005, nagaland: 0.00003,
      mizoram: 0.00002, arunachal_pradesh: 0.00002, sikkim: 0.00001
    }
  },
  christian: {
    id: 'christian',
    label: 'Christian',
    nationalProportion: 0.0230,
    stateConditionals: {
      kerala: 0.2356, tamil_nadu: 0.1226, meghalaya: 0.0857, nagaland: 0.0645,
      mizoram: 0.0384, goa: 0.0314, andhra_pradesh: 0.0446, karnataka: 0.0464,
      maharashtra: 0.0440, manipur: 0.0339, jharkhand: 0.0316, arunachal_pradesh: 0.0154,
      west_bengal: 0.0150, assam: 0.0113, chhattisgarh: 0.0089, odisha: 0.0128,
      tripura: 0.0078, delhi: 0.0068, rajasthan: 0.0029, madhya_pradesh: 0.0028,
      uttar_pradesh: 0.0035, punjab: 0.0050, telangana: 0.0066, gujarat: 0.0046,
      sikkim: 0.0028, uttarakhand: 0.0009, bihar: 0.0006, haryana: 0.0005,
      himachal_pradesh: 0.0004, puducherry: 0.0024, andaman_nicobar: 0.0085,
      chandigarh: 0.0004, jammu_kashmir: 0.0003, dadra_nagar_haveli: 0.0002,
      daman_diu: 0.0001, lakshadweep: 0.00003
    }
  },
  sikh: {
    id: 'sikh',
    label: 'Sikh',
    nationalProportion: 0.0172,
    stateConditionals: {
      punjab: 0.7683, haryana: 0.0633, rajasthan: 0.0124, delhi: 0.0443,
      uttar_pradesh: 0.0179, uttarakhand: 0.0117, maharashtra: 0.0067,
      madhya_pradesh: 0.0024, west_bengal: 0.0011, jammu_kashmir: 0.0141,
      chandigarh: 0.0078, himachal_pradesh: 0.0021, karnataka: 0.0010,
      bihar: 0.0009, jharkhand: 0.0006, gujarat: 0.0005, tamil_nadu: 0.0005,
      andhra_pradesh: 0.0003, telangana: 0.0003, assam: 0.0003, chhattisgarh: 0.0002,
      odisha: 0.0002, kerala: 0.0002, goa: 0.0001, tripura: 0.0001,
      meghalaya: 0.00005, manipur: 0.00005, nagaland: 0.00002, mizoram: 0.00001,
      arunachal_pradesh: 0.00005, sikkim: 0.00005, puducherry: 0.00005,
      andaman_nicobar: 0.00005, dadra_nagar_haveli: 0.00002, daman_diu: 0.00002,
      lakshadweep: 0.00001
    }
  },
  buddhist: {
    id: 'buddhist',
    label: 'Buddhist',
    nationalProportion: 0.0077,
    stateConditionals: {
      maharashtra: 0.7316, uttar_pradesh: 0.0227, madhya_pradesh: 0.0323,
      karnataka: 0.0178, rajasthan: 0.0079, west_bengal: 0.0069, gujarat: 0.0049,
      jharkhand: 0.0034, andhra_pradesh: 0.0028, telangana: 0.0025, tamil_nadu: 0.0021,
      delhi: 0.0021, punjab: 0.0015, bihar: 0.0012, haryana: 0.0011,
      sikkim: 0.0170, arunachal_pradesh: 0.0175, mizoram: 0.0102, tripura: 0.0055,
      himachal_pradesh: 0.0072, uttarakhand: 0.0020, jammu_kashmir: 0.0090,
      assam: 0.0010, chhattisgarh: 0.0008, odisha: 0.0005, kerala: 0.0004,
      nagaland: 0.0003, manipur: 0.0005, meghalaya: 0.0002, goa: 0.0001,
      chandigarh: 0.0006, puducherry: 0.0001, andaman_nicobar: 0.0001,
      dadra_nagar_haveli: 0.0002, daman_diu: 0.0001, lakshadweep: 0.00001
    }
  },
  jain: {
    id: 'jain',
    label: 'Jain',
    nationalProportion: 0.0040,
    stateConditionals: {
      maharashtra: 0.2884, rajasthan: 0.2419, gujarat: 0.1398, madhya_pradesh: 0.0856,
      karnataka: 0.0875, delhi: 0.0317, uttar_pradesh: 0.0335, tamil_nadu: 0.0078,
      haryana: 0.0052, west_bengal: 0.0035, andhra_pradesh: 0.0024, telangana: 0.0027,
      chhattisgarh: 0.0015, jharkhand: 0.0012, punjab: 0.0009, bihar: 0.0008,
      uttarakhand: 0.0006, kerala: 0.0004, goa: 0.0004, chandigarh: 0.0010,
      odisha: 0.0002, assam: 0.0001, himachal_pradesh: 0.0001, jammu_kashmir: 0.0001,
      puducherry: 0.0001, andaman_nicobar: 0.00005, dadra_nagar_haveli: 0.0001,
      daman_diu: 0.0001, tripura: 0.00002, meghalaya: 0.00002, manipur: 0.00001,
      nagaland: 0.00001, mizoram: 0.00001, arunachal_pradesh: 0.00001,
      sikkim: 0.00001, lakshadweep: 0.00001
    }
  }
};

// ═════════════════════════════════════════════════════════════
// STATE DATA (Census 2011 - Primary Census Abstract + C-01)
// ═════════════════════════════════════════════════════════════

function makeEduDist(
  urbanIllit: number, urbanPrim: number, urbanMid: number, urbanSec: number, urbanGrad: number,
  ruralIllit: number, ruralPrim: number, ruralMid: number, ruralSec: number, ruralGrad: number
): Record<AreaType, Record<EducationLevel, number>> {
  return {
    urban: {
      illiterate: urbanIllit, literate_below_primary: 0.04, primary: urbanPrim,
      middle: urbanMid, secondary: urbanSec, higher_secondary: urbanSec * 0.7,
      graduate: urbanGrad, postgraduate: urbanGrad * 0.3, technical_diploma: 0.03,
      professional_degree: urbanGrad * 0.15
    },
    rural: {
      illiterate: ruralIllit, literate_below_primary: 0.07, primary: ruralPrim,
      middle: ruralMid, secondary: ruralSec, higher_secondary: ruralSec * 0.6,
      graduate: ruralGrad, postgraduate: ruralGrad * 0.2, technical_diploma: 0.02,
      professional_degree: ruralGrad * 0.1
    }
  };
}

function makeOccDist(
  mCult: number, mAgLab: number, mOtherW: number,
  fCult: number, fAgLab: number, fOtherW: number
): Record<Gender, Record<OccupationalSector, number>> {
  return {
    male: { cultivator: mCult, agricultural_labourer: mAgLab, household_industry: 0.04, other_worker: mOtherW, non_worker: Math.max(0, 1 - mCult - mAgLab - 0.04 - mOtherW) },
    female: { cultivator: fCult, agricultural_labourer: fAgLab, household_industry: 0.06, other_worker: fOtherW, non_worker: Math.max(0, 1 - fCult - fAgLab - 0.06 - fOtherW) },
    other: { cultivator: (mCult + fCult) / 2, agricultural_labourer: (mAgLab + fAgLab) / 2, household_industry: 0.05, other_worker: (mOtherW + fOtherW) / 2, non_worker: 0.30 }
  };
}

const states: Record<string, StateCensusData> = {
  andhra_pradesh: {
    stateCode: 'AP', stateName: 'Andhra Pradesh', totalPopulation: 49386799,
    urbanPopulation: 14610410, ruralPopulation: 34776389, sexRatio: 993, literacyRate: 67.02,
    religionDistribution: { hindu: 0.8874, muslim: 0.0926, christian: 0.0139, buddhist: 0.0003, jain: 0.0003, sikh: 0.0001 },
    scProportion: 0.1641, stProportion: 0.0531,
    educationDistribution: makeEduDist(0.14, 0.11, 0.13, 0.18, 0.14, 0.38, 0.13, 0.13, 0.12, 0.05),
    occupationDistribution: makeOccDist(0.22, 0.22, 0.30, 0.18, 0.28, 0.10),
    languageDistribution: { telugu: 0.84, urdu: 0.08, hindi: 0.03, tamil: 0.01 },
    assetDistribution: { urban: {}, rural: {} }
  },
  arunachal_pradesh: {
    stateCode: 'AR', stateName: 'Arunachal Pradesh', totalPopulation: 1383727,
    urbanPopulation: 313446, ruralPopulation: 1070281, sexRatio: 938, literacyRate: 65.38,
    religionDistribution: { hindu: 0.2910, christian: 0.3057, buddhist: 0.1189, muslim: 0.0164, other: 0.2630 },
    scProportion: 0.0000, stProportion: 0.6889,
    educationDistribution: makeEduDist(0.14, 0.10, 0.14, 0.18, 0.12, 0.40, 0.12, 0.12, 0.10, 0.04),
    occupationDistribution: makeOccDist(0.32, 0.05, 0.25, 0.30, 0.06, 0.08),
    languageDistribution: { nyishi: 0.20, adi: 0.14, hindi: 0.30, bengali: 0.07 },
    assetDistribution: { urban: {}, rural: {} }
  },
  assam: {
    stateCode: 'AS', stateName: 'Assam', totalPopulation: 31205576,
    urbanPopulation: 4389997, ruralPopulation: 26815579, sexRatio: 958, literacyRate: 72.19,
    religionDistribution: { hindu: 0.6130, muslim: 0.3418, christian: 0.0388, buddhist: 0.0009, jain: 0.0001, sikh: 0.0001 },
    scProportion: 0.0712, stProportion: 0.1247,
    educationDistribution: makeEduDist(0.10, 0.10, 0.15, 0.20, 0.15, 0.30, 0.12, 0.16, 0.15, 0.06),
    occupationDistribution: makeOccDist(0.25, 0.12, 0.28, 0.15, 0.15, 0.08),
    languageDistribution: { assamese: 0.48, bengali: 0.28, hindi: 0.06, bodo: 0.05 },
    assetDistribution: { urban: {}, rural: {} }
  },
  bihar: {
    stateCode: 'BR', stateName: 'Bihar', totalPopulation: 104099452,
    urbanPopulation: 11758016, ruralPopulation: 92341436, sexRatio: 918, literacyRate: 61.80,
    religionDistribution: { hindu: 0.8274, muslim: 0.1687, christian: 0.0012, sikh: 0.0002, buddhist: 0.0001, jain: 0.0002 },
    scProportion: 0.1558, stProportion: 0.0127,
    educationDistribution: makeEduDist(0.18, 0.11, 0.13, 0.17, 0.11, 0.45, 0.12, 0.12, 0.10, 0.04),
    occupationDistribution: makeOccDist(0.25, 0.28, 0.22, 0.10, 0.20, 0.06),
    languageDistribution: { hindi: 0.53, maithili: 0.14, bhojpuri: 0.20, magahi: 0.06, urdu: 0.05 },
    assetDistribution: { urban: {}, rural: {} }
  },
  chhattisgarh: {
    stateCode: 'CG', stateName: 'Chhattisgarh', totalPopulation: 25545198,
    urbanPopulation: 5937237, ruralPopulation: 19607961, sexRatio: 991, literacyRate: 70.28,
    religionDistribution: { hindu: 0.9327, muslim: 0.0204, christian: 0.0195, buddhist: 0.0005, jain: 0.0020, sikh: 0.0003 },
    scProportion: 0.1253, stProportion: 0.3062,
    educationDistribution: makeEduDist(0.14, 0.11, 0.14, 0.18, 0.12, 0.38, 0.13, 0.14, 0.11, 0.04),
    occupationDistribution: makeOccDist(0.30, 0.25, 0.22, 0.20, 0.28, 0.06),
    languageDistribution: { hindi: 0.79, chhattisgarhi: 0.10, gondi: 0.04 },
    assetDistribution: { urban: {}, rural: {} }
  },
  goa: {
    stateCode: 'GA', stateName: 'Goa', totalPopulation: 1458545,
    urbanPopulation: 906309, ruralPopulation: 552236, sexRatio: 973, literacyRate: 88.70,
    religionDistribution: { hindu: 0.6568, christian: 0.2516, muslim: 0.0856, sikh: 0.0010, buddhist: 0.0010, jain: 0.0011 },
    scProportion: 0.0186, stProportion: 0.1014,
    educationDistribution: makeEduDist(0.06, 0.08, 0.12, 0.22, 0.22, 0.15, 0.12, 0.16, 0.18, 0.12),
    occupationDistribution: makeOccDist(0.05, 0.04, 0.50, 0.03, 0.04, 0.20),
    languageDistribution: { konkani: 0.60, marathi: 0.19, hindi: 0.08, kannada: 0.04 },
    assetDistribution: { urban: {}, rural: {} }
  },
  gujarat: {
    stateCode: 'GJ', stateName: 'Gujarat', totalPopulation: 60439692,
    urbanPopulation: 25745083, ruralPopulation: 34694609, sexRatio: 919, literacyRate: 78.03,
    religionDistribution: { hindu: 0.8869, muslim: 0.0967, jain: 0.0087, christian: 0.0028, sikh: 0.0004, buddhist: 0.0006 },
    scProportion: 0.0674, stProportion: 0.1484,
    educationDistribution: makeEduDist(0.10, 0.10, 0.14, 0.20, 0.16, 0.30, 0.13, 0.15, 0.14, 0.06),
    occupationDistribution: makeOccDist(0.18, 0.15, 0.38, 0.10, 0.12, 0.12),
    languageDistribution: { gujarati: 0.86, hindi: 0.05, sindhi: 0.02, marathi: 0.02, urdu: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  haryana: {
    stateCode: 'HR', stateName: 'Haryana', totalPopulation: 25351462,
    urbanPopulation: 8822038, ruralPopulation: 16529424, sexRatio: 879, literacyRate: 75.55,
    religionDistribution: { hindu: 0.8746, muslim: 0.0703, sikh: 0.0488, jain: 0.0019, christian: 0.0016, buddhist: 0.0003 },
    scProportion: 0.2017, stProportion: 0.0000,
    educationDistribution: makeEduDist(0.12, 0.10, 0.14, 0.20, 0.15, 0.32, 0.12, 0.15, 0.14, 0.06),
    occupationDistribution: makeOccDist(0.22, 0.12, 0.38, 0.08, 0.10, 0.08),
    languageDistribution: { hindi: 0.87, punjabi: 0.07, urdu: 0.03 },
    assetDistribution: { urban: {}, rural: {} }
  },
  himachal_pradesh: {
    stateCode: 'HP', stateName: 'Himachal Pradesh', totalPopulation: 6864602,
    urbanPopulation: 688552, ruralPopulation: 6176050, sexRatio: 972, literacyRate: 82.80,
    religionDistribution: { hindu: 0.9551, muslim: 0.0218, buddhist: 0.0123, sikh: 0.0072, christian: 0.0016, jain: 0.0005 },
    scProportion: 0.2517, stProportion: 0.0564,
    educationDistribution: makeEduDist(0.08, 0.08, 0.13, 0.22, 0.20, 0.22, 0.12, 0.16, 0.18, 0.08),
    occupationDistribution: makeOccDist(0.38, 0.05, 0.28, 0.30, 0.04, 0.10),
    languageDistribution: { hindi: 0.86, pahari: 0.06, punjabi: 0.03, kinnauri: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  jammu_kashmir: {
    stateCode: 'JK', stateName: 'Jammu & Kashmir', totalPopulation: 12541302,
    urbanPopulation: 3414106, ruralPopulation: 9127196, sexRatio: 889, literacyRate: 67.16,
    religionDistribution: { muslim: 0.6831, hindu: 0.2816, sikh: 0.0189, buddhist: 0.0107, christian: 0.0028, jain: 0.0002 },
    scProportion: 0.0772, stProportion: 0.1127,
    educationDistribution: makeEduDist(0.14, 0.10, 0.14, 0.20, 0.14, 0.40, 0.12, 0.14, 0.12, 0.05),
    occupationDistribution: makeOccDist(0.20, 0.08, 0.35, 0.08, 0.05, 0.10),
    languageDistribution: { kashmiri: 0.53, dogri: 0.21, hindi: 0.10, urdu: 0.04, ladakhi: 0.03 },
    assetDistribution: { urban: {}, rural: {} }
  },
  jharkhand: {
    stateCode: 'JH', stateName: 'Jharkhand', totalPopulation: 32988134,
    urbanPopulation: 7933061, ruralPopulation: 25055073, sexRatio: 948, literacyRate: 66.41,
    religionDistribution: { hindu: 0.6762, muslim: 0.1474, christian: 0.0416, sikh: 0.0004, buddhist: 0.0002, jain: 0.0004, other: 0.1308 },
    scProportion: 0.1192, stProportion: 0.2625,
    educationDistribution: makeEduDist(0.16, 0.11, 0.14, 0.18, 0.12, 0.42, 0.13, 0.13, 0.10, 0.04),
    occupationDistribution: makeOccDist(0.25, 0.22, 0.25, 0.12, 0.22, 0.06),
    languageDistribution: { hindi: 0.62, santali: 0.10, bengali: 0.07, urdu: 0.06, mundari: 0.04 },
    assetDistribution: { urban: {}, rural: {} }
  },
  karnataka: {
    stateCode: 'KA', stateName: 'Karnataka', totalPopulation: 61095297,
    urbanPopulation: 23578175, ruralPopulation: 37517122, sexRatio: 973, literacyRate: 75.36,
    religionDistribution: { hindu: 0.8400, muslim: 0.1268, christian: 0.0184, jain: 0.0073, buddhist: 0.0016, sikh: 0.0003 },
    scProportion: 0.1712, stProportion: 0.0694,
    educationDistribution: makeEduDist(0.10, 0.10, 0.13, 0.20, 0.17, 0.32, 0.13, 0.15, 0.13, 0.06),
    occupationDistribution: makeOccDist(0.20, 0.15, 0.35, 0.12, 0.18, 0.10),
    languageDistribution: { kannada: 0.66, urdu: 0.11, telugu: 0.07, tamil: 0.04, marathi: 0.04, tulu: 0.03 },
    assetDistribution: { urban: {}, rural: {} }
  },
  kerala: {
    stateCode: 'KL', stateName: 'Kerala', totalPopulation: 33406061,
    urbanPopulation: 15932171, ruralPopulation: 17473890, sexRatio: 1084, literacyRate: 94.00,
    religionDistribution: { hindu: 0.5485, muslim: 0.2656, christian: 0.1812, buddhist: 0.0003, jain: 0.0002, sikh: 0.0001 },
    scProportion: 0.0949, stProportion: 0.0145,
    educationDistribution: makeEduDist(0.04, 0.06, 0.10, 0.22, 0.24, 0.08, 0.10, 0.14, 0.22, 0.14),
    occupationDistribution: makeOccDist(0.08, 0.08, 0.45, 0.05, 0.06, 0.15),
    languageDistribution: { malayalam: 0.97, tamil: 0.01, kannada: 0.01 },
    assetDistribution: { urban: {}, rural: {} }
  },
  madhya_pradesh: {
    stateCode: 'MP', stateName: 'Madhya Pradesh', totalPopulation: 72626809,
    urbanPopulation: 20059666, ruralPopulation: 52567143, sexRatio: 931, literacyRate: 69.32,
    religionDistribution: { hindu: 0.9058, muslim: 0.0668, jain: 0.0082, christian: 0.0029, sikh: 0.0008, buddhist: 0.0036 },
    scProportion: 0.1562, stProportion: 0.2116,
    educationDistribution: makeEduDist(0.14, 0.11, 0.14, 0.18, 0.13, 0.40, 0.13, 0.14, 0.11, 0.04),
    occupationDistribution: makeOccDist(0.28, 0.22, 0.24, 0.18, 0.25, 0.06),
    languageDistribution: { hindi: 0.87, bhili: 0.04, urdu: 0.03, gondi: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  maharashtra: {
    stateCode: 'MH', stateName: 'Maharashtra', totalPopulation: 112374333,
    urbanPopulation: 50827531, ruralPopulation: 61546802, sexRatio: 929, literacyRate: 82.34,
    religionDistribution: { hindu: 0.7960, muslim: 0.1145, buddhist: 0.0592, christian: 0.0098, jain: 0.0124, sikh: 0.0009 },
    scProportion: 0.1175, stProportion: 0.0927,
    educationDistribution: makeEduDist(0.08, 0.09, 0.13, 0.22, 0.18, 0.24, 0.12, 0.16, 0.16, 0.08),
    occupationDistribution: makeOccDist(0.18, 0.15, 0.40, 0.12, 0.18, 0.10),
    languageDistribution: { marathi: 0.68, hindi: 0.11, urdu: 0.07, gujarati: 0.03, kannada: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  manipur: {
    stateCode: 'MN', stateName: 'Manipur', totalPopulation: 2855794,
    urbanPopulation: 832642, ruralPopulation: 2023152, sexRatio: 985, literacyRate: 79.85,
    religionDistribution: { hindu: 0.4116, christian: 0.4140, muslim: 0.0839, other: 0.0866 },
    scProportion: 0.0379, stProportion: 0.4083,
    educationDistribution: makeEduDist(0.10, 0.10, 0.14, 0.22, 0.16, 0.28, 0.12, 0.16, 0.15, 0.06),
    occupationDistribution: makeOccDist(0.22, 0.08, 0.30, 0.15, 0.10, 0.10),
    languageDistribution: { meitei: 0.55, thado: 0.08, tangkhul: 0.06, hindi: 0.05 },
    assetDistribution: { urban: {}, rural: {} }
  },
  meghalaya: {
    stateCode: 'ML', stateName: 'Meghalaya', totalPopulation: 2966889,
    urbanPopulation: 595036, ruralPopulation: 2371853, sexRatio: 989, literacyRate: 74.43,
    religionDistribution: { christian: 0.7481, hindu: 0.1148, muslim: 0.0440, other: 0.0886 },
    scProportion: 0.0073, stProportion: 0.8631,
    educationDistribution: makeEduDist(0.10, 0.10, 0.14, 0.22, 0.16, 0.30, 0.12, 0.16, 0.14, 0.05),
    occupationDistribution: makeOccDist(0.30, 0.06, 0.25, 0.25, 0.08, 0.08),
    languageDistribution: { khasi: 0.47, garo: 0.31, bengali: 0.08, english: 0.05 },
    assetDistribution: { urban: {}, rural: {} }
  },
  mizoram: {
    stateCode: 'MZ', stateName: 'Mizoram', totalPopulation: 1097206,
    urbanPopulation: 571771, ruralPopulation: 525435, sexRatio: 976, literacyRate: 91.33,
    religionDistribution: { christian: 0.8710, buddhist: 0.0790, hindu: 0.0280, muslim: 0.0140 },
    scProportion: 0.0003, stProportion: 0.9434,
    educationDistribution: makeEduDist(0.04, 0.08, 0.12, 0.24, 0.22, 0.10, 0.10, 0.16, 0.20, 0.10),
    occupationDistribution: makeOccDist(0.28, 0.04, 0.30, 0.25, 0.04, 0.10),
    languageDistribution: { mizo: 0.73, chakma: 0.04, mara: 0.03, hindi: 0.03 },
    assetDistribution: { urban: {}, rural: {} }
  },
  nagaland: {
    stateCode: 'NL', stateName: 'Nagaland', totalPopulation: 1978502,
    urbanPopulation: 574132, ruralPopulation: 1404370, sexRatio: 931, literacyRate: 79.55,
    religionDistribution: { christian: 0.8774, hindu: 0.0826, muslim: 0.0237, other: 0.0102 },
    scProportion: 0.0000, stProportion: 0.8676,
    educationDistribution: makeEduDist(0.08, 0.10, 0.14, 0.22, 0.18, 0.24, 0.12, 0.16, 0.16, 0.07),
    occupationDistribution: makeOccDist(0.32, 0.05, 0.28, 0.28, 0.05, 0.10),
    languageDistribution: { ao: 0.14, konyak: 0.12, lotha: 0.07, angami: 0.07, sema: 0.07, nagamese: 0.20, hindi: 0.06, english: 0.05 },
    assetDistribution: { urban: {}, rural: {} }
  },
  odisha: {
    stateCode: 'OD', stateName: 'Odisha', totalPopulation: 41974218,
    urbanPopulation: 7003656, ruralPopulation: 34970562, sexRatio: 979, literacyRate: 72.87,
    religionDistribution: { hindu: 0.9365, christian: 0.0279, muslim: 0.0207, other: 0.0089, buddhist: 0.0003, sikh: 0.0002, jain: 0.0001 },
    scProportion: 0.1708, stProportion: 0.2282,
    educationDistribution: makeEduDist(0.12, 0.10, 0.14, 0.20, 0.14, 0.35, 0.13, 0.15, 0.13, 0.05),
    occupationDistribution: makeOccDist(0.22, 0.22, 0.25, 0.12, 0.28, 0.06),
    languageDistribution: { odia: 0.83, hindi: 0.03, telugu: 0.03, santali: 0.03 },
    assetDistribution: { urban: {}, rural: {} }
  },
  punjab: {
    stateCode: 'PB', stateName: 'Punjab', totalPopulation: 27743338,
    urbanPopulation: 10387436, ruralPopulation: 17355902, sexRatio: 895, literacyRate: 75.84,
    religionDistribution: { sikh: 0.5769, hindu: 0.3867, muslim: 0.0191, christian: 0.0117, buddhist: 0.0012, jain: 0.0005 },
    scProportion: 0.3179, stProportion: 0.0000,
    educationDistribution: makeEduDist(0.10, 0.10, 0.14, 0.20, 0.16, 0.28, 0.12, 0.16, 0.15, 0.07),
    occupationDistribution: makeOccDist(0.18, 0.18, 0.35, 0.04, 0.10, 0.08),
    languageDistribution: { punjabi: 0.92, hindi: 0.05, urdu: 0.01 },
    assetDistribution: { urban: {}, rural: {} }
  },
  rajasthan: {
    stateCode: 'RJ', stateName: 'Rajasthan', totalPopulation: 68548437,
    urbanPopulation: 17080776, ruralPopulation: 51467661, sexRatio: 928, literacyRate: 66.11,
    religionDistribution: { hindu: 0.8838, muslim: 0.0907, sikh: 0.0146, jain: 0.0057, christian: 0.0012, buddhist: 0.0002 },
    scProportion: 0.1785, stProportion: 0.1338,
    educationDistribution: makeEduDist(0.16, 0.11, 0.13, 0.18, 0.12, 0.44, 0.12, 0.13, 0.10, 0.04),
    occupationDistribution: makeOccDist(0.28, 0.12, 0.30, 0.20, 0.12, 0.06),
    languageDistribution: { hindi: 0.89, rajasthani: 0.03, urdu: 0.03, punjabi: 0.02, bhili: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  sikkim: {
    stateCode: 'SK', stateName: 'Sikkim', totalPopulation: 610577,
    urbanPopulation: 153578, ruralPopulation: 456999, sexRatio: 890, literacyRate: 81.42,
    religionDistribution: { hindu: 0.5767, buddhist: 0.2725, christian: 0.0988, muslim: 0.0140, other: 0.0303 },
    scProportion: 0.0469, stProportion: 0.3360,
    educationDistribution: makeEduDist(0.08, 0.10, 0.14, 0.22, 0.18, 0.22, 0.12, 0.16, 0.17, 0.07),
    occupationDistribution: makeOccDist(0.30, 0.05, 0.30, 0.22, 0.05, 0.10),
    languageDistribution: { nepali: 0.62, bhutia: 0.08, lepcha: 0.07, limbu: 0.06, hindi: 0.06 },
    assetDistribution: { urban: {}, rural: {} }
  },
  tamil_nadu: {
    stateCode: 'TN', stateName: 'Tamil Nadu', totalPopulation: 72147030,
    urbanPopulation: 34949729, ruralPopulation: 37197301, sexRatio: 996, literacyRate: 80.09,
    religionDistribution: { hindu: 0.8762, christian: 0.0594, muslim: 0.0564, jain: 0.0012, buddhist: 0.0005, sikh: 0.0002 },
    scProportion: 0.2011, stProportion: 0.0109,
    educationDistribution: makeEduDist(0.08, 0.09, 0.12, 0.22, 0.20, 0.22, 0.12, 0.15, 0.16, 0.08),
    occupationDistribution: makeOccDist(0.14, 0.15, 0.40, 0.08, 0.15, 0.12),
    languageDistribution: { tamil: 0.89, telugu: 0.06, kannada: 0.02, urdu: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  telangana: {
    stateCode: 'TG', stateName: 'Telangana', totalPopulation: 35003674,
    urbanPopulation: 13600843, ruralPopulation: 21402831, sexRatio: 988, literacyRate: 66.46,
    religionDistribution: { hindu: 0.8529, muslim: 0.1283, christian: 0.0110, buddhist: 0.0010, jain: 0.0008, sikh: 0.0002 },
    scProportion: 0.1570, stProportion: 0.0901,
    educationDistribution: makeEduDist(0.14, 0.11, 0.13, 0.18, 0.14, 0.38, 0.13, 0.13, 0.12, 0.05),
    occupationDistribution: makeOccDist(0.20, 0.22, 0.32, 0.14, 0.25, 0.08),
    languageDistribution: { telugu: 0.76, urdu: 0.12, hindi: 0.04, marathi: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  tripura: {
    stateCode: 'TR', stateName: 'Tripura', totalPopulation: 3673917,
    urbanPopulation: 960981, ruralPopulation: 2712936, sexRatio: 960, literacyRate: 87.22,
    religionDistribution: { hindu: 0.8360, muslim: 0.0880, christian: 0.0462, buddhist: 0.0257 },
    scProportion: 0.1757, stProportion: 0.3168,
    educationDistribution: makeEduDist(0.08, 0.09, 0.14, 0.22, 0.18, 0.18, 0.12, 0.16, 0.18, 0.08),
    occupationDistribution: makeOccDist(0.22, 0.12, 0.30, 0.12, 0.15, 0.08),
    languageDistribution: { bengali: 0.67, kokborok: 0.24, hindi: 0.04 },
    assetDistribution: { urban: {}, rural: {} }
  },
  uttar_pradesh: {
    stateCode: 'UP', stateName: 'Uttar Pradesh', totalPopulation: 199812341,
    urbanPopulation: 44495063, ruralPopulation: 155317278, sexRatio: 912, literacyRate: 67.68,
    religionDistribution: { hindu: 0.7969, muslim: 0.1935, sikh: 0.0032, christian: 0.0015, buddhist: 0.0009, jain: 0.0014 },
    scProportion: 0.2072, stProportion: 0.0057,
    educationDistribution: makeEduDist(0.16, 0.11, 0.13, 0.18, 0.12, 0.42, 0.12, 0.13, 0.11, 0.04),
    occupationDistribution: makeOccDist(0.28, 0.18, 0.28, 0.12, 0.18, 0.06),
    languageDistribution: { hindi: 0.81, urdu: 0.11, bhojpuri: 0.04, awadhi: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  uttarakhand: {
    stateCode: 'UK', stateName: 'Uttarakhand', totalPopulation: 10086292,
    urbanPopulation: 3091169, ruralPopulation: 6995123, sexRatio: 963, literacyRate: 78.82,
    religionDistribution: { hindu: 0.8299, muslim: 0.1401, sikh: 0.0233, christian: 0.0032, buddhist: 0.0020, jain: 0.0008 },
    scProportion: 0.1890, stProportion: 0.0291,
    educationDistribution: makeEduDist(0.10, 0.10, 0.14, 0.20, 0.16, 0.28, 0.12, 0.16, 0.15, 0.06),
    occupationDistribution: makeOccDist(0.24, 0.08, 0.35, 0.15, 0.06, 0.10),
    languageDistribution: { hindi: 0.83, garhwali: 0.06, kumaoni: 0.05, urdu: 0.03 },
    assetDistribution: { urban: {}, rural: {} }
  },
  west_bengal: {
    stateCode: 'WB', stateName: 'West Bengal', totalPopulation: 91276115,
    urbanPopulation: 29134060, ruralPopulation: 62142055, sexRatio: 950, literacyRate: 76.26,
    religionDistribution: { hindu: 0.7057, muslim: 0.2707, christian: 0.0043, buddhist: 0.0004, sikh: 0.0002, jain: 0.0001 },
    scProportion: 0.2349, stProportion: 0.0586,
    educationDistribution: makeEduDist(0.10, 0.10, 0.14, 0.22, 0.16, 0.28, 0.12, 0.16, 0.15, 0.06),
    occupationDistribution: makeOccDist(0.16, 0.18, 0.35, 0.06, 0.18, 0.08),
    languageDistribution: { bengali: 0.86, hindi: 0.07, santali: 0.03, urdu: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  delhi: {
    stateCode: 'DL', stateName: 'Delhi', totalPopulation: 16787941,
    urbanPopulation: 16333916, ruralPopulation: 454025, sexRatio: 868, literacyRate: 86.21,
    religionDistribution: { hindu: 0.8117, muslim: 0.1286, sikh: 0.0401, jain: 0.0097, christian: 0.0087, buddhist: 0.0008 },
    scProportion: 0.1664, stProportion: 0.0000,
    educationDistribution: makeEduDist(0.08, 0.08, 0.12, 0.22, 0.22, 0.14, 0.10, 0.14, 0.18, 0.12),
    occupationDistribution: makeOccDist(0.02, 0.02, 0.55, 0.01, 0.01, 0.15),
    languageDistribution: { hindi: 0.81, punjabi: 0.05, urdu: 0.06, bengali: 0.02, maithili: 0.01 },
    assetDistribution: { urban: {}, rural: {} }
  },
  chandigarh: {
    stateCode: 'CH', stateName: 'Chandigarh', totalPopulation: 1055450,
    urbanPopulation: 1026459, ruralPopulation: 28991, sexRatio: 818, literacyRate: 86.05,
    religionDistribution: { hindu: 0.8019, sikh: 0.1337, muslim: 0.0453, christian: 0.0079, jain: 0.0055, buddhist: 0.0040 },
    scProportion: 0.1940, stProportion: 0.0000,
    educationDistribution: makeEduDist(0.06, 0.08, 0.12, 0.22, 0.24, 0.12, 0.10, 0.14, 0.20, 0.12),
    occupationDistribution: makeOccDist(0.01, 0.01, 0.60, 0.01, 0.01, 0.18),
    languageDistribution: { hindi: 0.73, punjabi: 0.20, english: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  puducherry: {
    stateCode: 'PY', stateName: 'Puducherry', totalPopulation: 1247953,
    urbanPopulation: 850123, ruralPopulation: 397830, sexRatio: 1037, literacyRate: 85.85,
    religionDistribution: { hindu: 0.8721, christian: 0.0649, muslim: 0.0603, jain: 0.0003, buddhist: 0.0002, sikh: 0.0001 },
    scProportion: 0.1587, stProportion: 0.0000,
    educationDistribution: makeEduDist(0.06, 0.08, 0.12, 0.22, 0.22, 0.14, 0.12, 0.15, 0.18, 0.10),
    occupationDistribution: makeOccDist(0.06, 0.10, 0.45, 0.04, 0.08, 0.14),
    languageDistribution: { tamil: 0.89, telugu: 0.06, malayalam: 0.02 },
    assetDistribution: { urban: {}, rural: {} }
  },
  andaman_nicobar: {
    stateCode: 'AN', stateName: 'Andaman & Nicobar Islands', totalPopulation: 380581,
    urbanPopulation: 135539, ruralPopulation: 245042, sexRatio: 876, literacyRate: 86.27,
    religionDistribution: { hindu: 0.6940, christian: 0.2146, muslim: 0.0845, sikh: 0.0016, buddhist: 0.0006, jain: 0.0001 },
    scProportion: 0.0000, stProportion: 0.0745,
    educationDistribution: makeEduDist(0.06, 0.08, 0.12, 0.22, 0.22, 0.14, 0.10, 0.14, 0.18, 0.10),
    occupationDistribution: makeOccDist(0.08, 0.06, 0.42, 0.05, 0.06, 0.14),
    languageDistribution: { bengali: 0.28, hindi: 0.18, tamil: 0.16, telugu: 0.13, malayalam: 0.10, nicobarese: 0.06 },
    assetDistribution: { urban: {}, rural: {} }
  },
  dadra_nagar_haveli: {
    stateCode: 'DN', stateName: 'Dadra & Nagar Haveli', totalPopulation: 343709,
    urbanPopulation: 130986, ruralPopulation: 212723, sexRatio: 774, literacyRate: 76.24,
    religionDistribution: { hindu: 0.9317, muslim: 0.0327, christian: 0.0146, buddhist: 0.0080, jain: 0.0013, sikh: 0.0002 },
    scProportion: 0.0183, stProportion: 0.5192,
    educationDistribution: makeEduDist(0.12, 0.10, 0.14, 0.20, 0.14, 0.32, 0.12, 0.15, 0.14, 0.05),
    occupationDistribution: makeOccDist(0.12, 0.12, 0.42, 0.08, 0.10, 0.10),
    languageDistribution: { bhili: 0.40, gujarati: 0.25, hindi: 0.22, marathi: 0.08 },
    assetDistribution: { urban: {}, rural: {} }
  },
  daman_diu: {
    stateCode: 'DD', stateName: 'Daman & Diu', totalPopulation: 243247,
    urbanPopulation: 181785, ruralPopulation: 61462, sexRatio: 618, literacyRate: 87.07,
    religionDistribution: { hindu: 0.9335, muslim: 0.0344, christian: 0.0125, buddhist: 0.0022, jain: 0.0021, sikh: 0.0003 },
    scProportion: 0.0353, stProportion: 0.0689,
    educationDistribution: makeEduDist(0.08, 0.09, 0.13, 0.22, 0.18, 0.22, 0.12, 0.16, 0.16, 0.08),
    occupationDistribution: makeOccDist(0.05, 0.05, 0.55, 0.03, 0.04, 0.12),
    languageDistribution: { gujarati: 0.55, hindi: 0.30, marathi: 0.05 },
    assetDistribution: { urban: {}, rural: {} }
  },
  lakshadweep: {
    stateCode: 'LD', stateName: 'Lakshadweep', totalPopulation: 64473,
    urbanPopulation: 50332, ruralPopulation: 14141, sexRatio: 946, literacyRate: 91.85,
    religionDistribution: { muslim: 0.9651, hindu: 0.0265, christian: 0.0076, buddhist: 0.0001 },
    scProportion: 0.0000, stProportion: 0.9453,
    educationDistribution: makeEduDist(0.04, 0.06, 0.10, 0.24, 0.24, 0.08, 0.10, 0.14, 0.22, 0.12),
    occupationDistribution: makeOccDist(0.02, 0.02, 0.50, 0.02, 0.02, 0.14),
    languageDistribution: { malayalam: 0.85, english: 0.08, hindi: 0.04 },
    assetDistribution: { urban: {}, rural: {} }
  }
};

// ═════════════════════════════════════════════════════════════
// CASTE / COMMUNITY DATA
// ═════════════════════════════════════════════════════════════

// Comprehensive caste mapping: religionId → stateId → CasteEntry[]
// Based on Census 2011 SC/ST lists and OBC Central Lists

const casteMap: Record<string, Record<string, CasteEntry[]>> = {
  hindu: {
    default: [
      { id: 'brahmin', label: 'Brahmin', weight: 5.0, socialCategory: 'General' },
      { id: 'rajput', label: 'Rajput', weight: 6.0, socialCategory: 'General' },
      { id: 'vaishya', label: 'Vaishya/Baniya', weight: 5.0, socialCategory: 'General' },
      { id: 'kayastha', label: 'Kayastha', weight: 2.0, socialCategory: 'General' },
      { id: 'jat', label: 'Jat', weight: 3.0, socialCategory: 'OBC' },
      { id: 'yadav', label: 'Yadav', weight: 8.0, socialCategory: 'OBC' },
      { id: 'kurmi', label: 'Kurmi', weight: 4.0, socialCategory: 'OBC' },
      { id: 'gujjar', label: 'Gujjar', weight: 2.0, socialCategory: 'OBC' },
      { id: 'chamar', label: 'Chamar', weight: 8.0, socialCategory: 'SC' },
      { id: 'dhobi', label: 'Dhobi', weight: 3.0, socialCategory: 'SC' },
      { id: 'pasi', label: 'Pasi', weight: 2.0, socialCategory: 'SC' },
      { id: 'balmiki', label: 'Balmiki/Valmiki', weight: 2.5, socialCategory: 'SC' },
      { id: 'kori', label: 'Kori', weight: 1.5, socialCategory: 'SC' },
      { id: 'bhil', label: 'Bhil', weight: 3.0, socialCategory: 'ST' },
      { id: 'gond', label: 'Gond', weight: 3.0, socialCategory: 'ST' },
      { id: 'mina', label: 'Mina/Meena', weight: 3.0, socialCategory: 'ST' },
      { id: 'oraon', label: 'Oraon', weight: 1.5, socialCategory: 'ST' },
      { id: 'santhal', label: 'Santhal', weight: 2.0, socialCategory: 'ST' }
    ],
    uttar_pradesh: [
      { id: 'brahmin', label: 'Brahmin', weight: 9.0, socialCategory: 'General' },
      { id: 'rajput_thakur', label: 'Rajput/Thakur', weight: 8.0, socialCategory: 'General' },
      { id: 'vaishya_baniya', label: 'Vaishya/Baniya', weight: 5.0, socialCategory: 'General' },
      { id: 'kayastha', label: 'Kayastha', weight: 3.0, socialCategory: 'General' },
      { id: 'tyagi', label: 'Tyagi', weight: 1.5, socialCategory: 'General' },
      { id: 'bhumihar', label: 'Bhumihar', weight: 2.0, socialCategory: 'General' },
      { id: 'yadav', label: 'Yadav', weight: 12.0, socialCategory: 'OBC' },
      { id: 'kurmi', label: 'Kurmi', weight: 6.0, socialCategory: 'OBC' },
      { id: 'jat', label: 'Jat', weight: 4.0, socialCategory: 'OBC' },
      { id: 'gujjar', label: 'Gujjar', weight: 2.0, socialCategory: 'OBC' },
      { id: 'lodh', label: 'Lodh/Lodhi', weight: 3.0, socialCategory: 'OBC' },
      { id: 'kushwaha', label: 'Kushwaha/Koeri', weight: 4.0, socialCategory: 'OBC' },
      { id: 'patel', label: 'Patel/Kurmi', weight: 2.5, socialCategory: 'OBC' },
      { id: 'chamar', label: 'Chamar/Jatav', weight: 12.0, socialCategory: 'SC' },
      { id: 'pasi', label: 'Pasi', weight: 3.0, socialCategory: 'SC' },
      { id: 'dhobi', label: 'Dhobi', weight: 2.5, socialCategory: 'SC' },
      { id: 'balmiki', label: 'Balmiki/Valmiki', weight: 2.5, socialCategory: 'SC' },
      { id: 'kori', label: 'Kori', weight: 1.5, socialCategory: 'SC' },
      { id: 'tharu', label: 'Tharu', weight: 0.5, socialCategory: 'ST' }
    ],
    maharashtra: [
      { id: 'brahmin_deshastha', label: 'Deshastha Brahmin', weight: 3.0, socialCategory: 'General' },
      { id: 'brahmin_chitpavan', label: 'Chitpavan Brahmin', weight: 2.0, socialCategory: 'General' },
      { id: 'brahmin_saraswat', label: 'Saraswat Brahmin', weight: 1.0, socialCategory: 'General' },
      { id: 'maratha', label: 'Maratha', weight: 18.0, socialCategory: 'General' },
      { id: 'ckp', label: 'CKP (Chandraseniya Kayastha Prabhu)', weight: 1.0, socialCategory: 'General' },
      { id: 'kunbi', label: 'Kunbi', weight: 8.0, socialCategory: 'OBC' },
      { id: 'mali', label: 'Mali', weight: 5.0, socialCategory: 'OBC' },
      { id: 'dhangar', label: 'Dhangar', weight: 4.0, socialCategory: 'OBC' },
      { id: 'teli', label: 'Teli', weight: 3.0, socialCategory: 'OBC' },
      { id: 'agri', label: 'Agri', weight: 2.0, socialCategory: 'OBC' },
      { id: 'mahar', label: 'Mahar', weight: 8.0, socialCategory: 'SC' },
      { id: 'matang', label: 'Matang/Mang', weight: 4.0, socialCategory: 'SC' },
      { id: 'chambhar', label: 'Chambhar', weight: 2.0, socialCategory: 'SC' },
      { id: 'bhil_mh', label: 'Bhil', weight: 4.0, socialCategory: 'ST' },
      { id: 'warli', label: 'Warli', weight: 2.5, socialCategory: 'ST' },
      { id: 'kokna', label: 'Kokna', weight: 1.5, socialCategory: 'ST' },
      { id: 'gond_mh', label: 'Gond', weight: 2.0, socialCategory: 'ST' }
    ],
    tamil_nadu: [
      { id: 'iyer', label: 'Iyer', weight: 3.0, socialCategory: 'General' },
      { id: 'iyengar', label: 'Iyengar', weight: 2.0, socialCategory: 'General' },
      { id: 'mudaliar', label: 'Mudaliar', weight: 4.0, socialCategory: 'General' },
      { id: 'chettiar', label: 'Chettiar/Nadar', weight: 5.0, socialCategory: 'OBC' },
      { id: 'gounder', label: 'Gounder/Kongu Vellalar', weight: 8.0, socialCategory: 'OBC' },
      { id: 'thevar', label: 'Thevar/Mukkulathor', weight: 7.0, socialCategory: 'OBC' },
      { id: 'vanniyar', label: 'Vanniyar', weight: 8.0, socialCategory: 'OBC' },
      { id: 'nadar', label: 'Nadar', weight: 6.0, socialCategory: 'OBC' },
      { id: 'pillai', label: 'Pillai/Vellalar', weight: 5.0, socialCategory: 'OBC' },
      { id: 'paraiyar', label: 'Paraiyar', weight: 6.0, socialCategory: 'SC' },
      { id: 'pallar', label: 'Pallar/Devendra Kula Vellalar', weight: 5.0, socialCategory: 'SC' },
      { id: 'arunthathiyar', label: 'Arunthathiyar', weight: 3.0, socialCategory: 'SC' },
      { id: 'irular', label: 'Irular', weight: 0.5, socialCategory: 'ST' },
      { id: 'toda', label: 'Toda', weight: 0.1, socialCategory: 'ST' }
    ],
    karnataka: [
      { id: 'brahmin_havyaka', label: 'Havyaka Brahmin', weight: 1.5, socialCategory: 'General' },
      { id: 'brahmin_smartha', label: 'Smartha Brahmin', weight: 1.5, socialCategory: 'General' },
      { id: 'brahmin_madhwa', label: 'Madhwa Brahmin', weight: 2.0, socialCategory: 'General' },
      { id: 'vokkaliga', label: 'Vokkaliga', weight: 12.0, socialCategory: 'General' },
      { id: 'lingayat', label: 'Lingayat/Veerashaiva', weight: 15.0, socialCategory: 'General' },
      { id: 'kuruba', label: 'Kuruba', weight: 6.0, socialCategory: 'OBC' },
      { id: 'billava', label: 'Billava', weight: 4.0, socialCategory: 'OBC' },
      { id: 'idiga', label: 'Idiga', weight: 2.0, socialCategory: 'OBC' },
      { id: 'bunt', label: 'Bunt', weight: 3.0, socialCategory: 'General' },
      { id: 'madiga', label: 'Madiga', weight: 5.0, socialCategory: 'SC' },
      { id: 'holeya', label: 'Holeya', weight: 4.0, socialCategory: 'SC' },
      { id: 'soliga', label: 'Soliga', weight: 1.0, socialCategory: 'ST' },
      { id: 'yerava', label: 'Yerava', weight: 0.5, socialCategory: 'ST' }
    ],
    kerala: [
      { id: 'namboodiri', label: 'Namboodiri', weight: 1.5, socialCategory: 'General' },
      { id: 'nair', label: 'Nair', weight: 14.0, socialCategory: 'General' },
      { id: 'menon', label: 'Menon', weight: 3.0, socialCategory: 'General' },
      { id: 'ezhava', label: 'Ezhava/Thiyya', weight: 20.0, socialCategory: 'OBC' },
      { id: 'vishwakarma', label: 'Vishwakarma', weight: 3.0, socialCategory: 'OBC' },
      { id: 'pulaya', label: 'Pulaya', weight: 4.0, socialCategory: 'SC' },
      { id: 'cheruman', label: 'Cheruman', weight: 1.5, socialCategory: 'SC' },
      { id: 'paravan', label: 'Paravan', weight: 2.0, socialCategory: 'SC' },
      { id: 'paniya', label: 'Paniya', weight: 0.5, socialCategory: 'ST' },
      { id: 'kurichiya', label: 'Kurichiya', weight: 0.3, socialCategory: 'ST' }
    ],
    west_bengal: [
      { id: 'brahmin_bengali', label: 'Bengali Brahmin', weight: 5.0, socialCategory: 'General' },
      { id: 'kayastha_wb', label: 'Kayastha', weight: 5.0, socialCategory: 'General' },
      { id: 'baidya', label: 'Baidya', weight: 2.0, socialCategory: 'General' },
      { id: 'mahishya', label: 'Mahishya', weight: 6.0, socialCategory: 'General' },
      { id: 'sadgop', label: 'Sadgop', weight: 4.0, socialCategory: 'OBC' },
      { id: 'tili', label: 'Tili', weight: 3.0, socialCategory: 'OBC' },
      { id: 'pod', label: 'Pod', weight: 2.0, socialCategory: 'SC' },
      { id: 'rajbanshi', label: 'Rajbanshi', weight: 6.0, socialCategory: 'SC' },
      { id: 'namasudra', label: 'Namasudra', weight: 8.0, socialCategory: 'SC' },
      { id: 'bagdi', label: 'Bagdi/Duley', weight: 4.0, socialCategory: 'SC' },
      { id: 'santhal_wb', label: 'Santhal', weight: 3.0, socialCategory: 'ST' },
      { id: 'oraon_wb', label: 'Oraon', weight: 1.0, socialCategory: 'ST' },
      { id: 'munda_wb', label: 'Munda', weight: 0.8, socialCategory: 'ST' }
    ],
    rajasthan: [
      { id: 'rajput_rj', label: 'Rajput', weight: 8.0, socialCategory: 'General' },
      { id: 'brahmin_rj', label: 'Brahmin', weight: 6.0, socialCategory: 'General' },
      { id: 'mahajan', label: 'Mahajan/Baniya', weight: 6.0, socialCategory: 'General' },
      { id: 'jat_rj', label: 'Jat', weight: 10.0, socialCategory: 'OBC' },
      { id: 'gujjar_rj', label: 'Gujjar', weight: 5.0, socialCategory: 'OBC' },
      { id: 'mali_rj', label: 'Mali', weight: 4.0, socialCategory: 'OBC' },
      { id: 'kumhar', label: 'Kumhar', weight: 2.5, socialCategory: 'OBC' },
      { id: 'meghwal', label: 'Meghwal', weight: 5.0, socialCategory: 'SC' },
      { id: 'bairwa', label: 'Bairwa', weight: 3.0, socialCategory: 'SC' },
      { id: 'chamar_rj', label: 'Chamar/Jatav', weight: 4.0, socialCategory: 'SC' },
      { id: 'meena_rj', label: 'Meena', weight: 8.0, socialCategory: 'ST' },
      { id: 'bhil_rj', label: 'Bhil', weight: 5.0, socialCategory: 'ST' },
      { id: 'garasia', label: 'Garasia', weight: 1.5, socialCategory: 'ST' }
    ],
    gujarat: [
      { id: 'brahmin_gj', label: 'Brahmin', weight: 4.0, socialCategory: 'General' },
      { id: 'patel', label: 'Patel/Patidar', weight: 14.0, socialCategory: 'General' },
      { id: 'bania_gj', label: 'Bania/Vanik', weight: 5.0, socialCategory: 'General' },
      { id: 'koli', label: 'Koli', weight: 10.0, socialCategory: 'OBC' },
      { id: 'darbar', label: 'Darbar/Rajput', weight: 4.0, socialCategory: 'General' },
      { id: 'rabari', label: 'Rabari', weight: 3.0, socialCategory: 'OBC' },
      { id: 'ahir', label: 'Ahir', weight: 3.0, socialCategory: 'OBC' },
      { id: 'dalit_gj', label: 'Dalit/Vankar', weight: 6.0, socialCategory: 'SC' },
      { id: 'bhil_gj', label: 'Bhil', weight: 6.0, socialCategory: 'ST' },
      { id: 'dhodia', label: 'Dhodia', weight: 2.0, socialCategory: 'ST' },
      { id: 'rathwa', label: 'Rathwa', weight: 1.5, socialCategory: 'ST' }
    ],
    bihar: [
      { id: 'brahmin_br', label: 'Brahmin (Maithil/Bhumihar)', weight: 6.0, socialCategory: 'General' },
      { id: 'bhumihar_br', label: 'Bhumihar', weight: 4.0, socialCategory: 'General' },
      { id: 'rajput_br', label: 'Rajput', weight: 5.0, socialCategory: 'General' },
      { id: 'kayastha_br', label: 'Kayastha', weight: 2.0, socialCategory: 'General' },
      { id: 'yadav_br', label: 'Yadav', weight: 14.0, socialCategory: 'OBC' },
      { id: 'kurmi_br', label: 'Kurmi', weight: 5.0, socialCategory: 'OBC' },
      { id: 'koeri_br', label: 'Koeri/Kushwaha', weight: 5.0, socialCategory: 'OBC' },
      { id: 'musahar', label: 'Musahar', weight: 4.0, socialCategory: 'SC' },
      { id: 'dusadh', label: 'Dusadh/Paswan', weight: 5.0, socialCategory: 'SC' },
      { id: 'chamar_br', label: 'Chamar', weight: 5.0, socialCategory: 'SC' },
      { id: 'dom', label: 'Dom', weight: 2.0, socialCategory: 'SC' },
      { id: 'tharu_br', label: 'Tharu', weight: 0.8, socialCategory: 'ST' },
      { id: 'santhal_br', label: 'Santhal', weight: 0.5, socialCategory: 'ST' }
    ],
    punjab: [
      { id: 'khatri', label: 'Khatri', weight: 5.0, socialCategory: 'General' },
      { id: 'arora', label: 'Arora', weight: 5.0, socialCategory: 'General' },
      { id: 'saini', label: 'Saini', weight: 3.0, socialCategory: 'OBC' },
      { id: 'jat_pb', label: 'Jat', weight: 8.0, socialCategory: 'OBC' },
      { id: 'labana', label: 'Labana', weight: 2.0, socialCategory: 'OBC' },
      { id: 'ramdasia', label: 'Ramdasia', weight: 5.0, socialCategory: 'SC' },
      { id: 'ad_dharmi', label: 'Ad Dharmi', weight: 5.0, socialCategory: 'SC' },
      { id: 'mazbi', label: 'Mazbi Sikh', weight: 8.0, socialCategory: 'SC' },
      { id: 'balmiki_pb', label: 'Balmiki', weight: 6.0, socialCategory: 'SC' }
    ],
    madhya_pradesh: [
      { id: 'brahmin_mp', label: 'Brahmin', weight: 5.0, socialCategory: 'General' },
      { id: 'rajput_mp', label: 'Rajput', weight: 6.0, socialCategory: 'General' },
      { id: 'lodhi_mp', label: 'Lodhi', weight: 5.0, socialCategory: 'OBC' },
      { id: 'yadav_mp', label: 'Yadav', weight: 6.0, socialCategory: 'OBC' },
      { id: 'kurmi_mp', label: 'Kurmi', weight: 4.0, socialCategory: 'OBC' },
      { id: 'teli_mp', label: 'Teli', weight: 3.0, socialCategory: 'OBC' },
      { id: 'chamar_mp', label: 'Chamar', weight: 6.0, socialCategory: 'SC' },
      { id: 'balmiki_mp', label: 'Balmiki', weight: 3.0, socialCategory: 'SC' },
      { id: 'gond_mp', label: 'Gond', weight: 8.0, socialCategory: 'ST' },
      { id: 'bhil_mp', label: 'Bhil', weight: 6.0, socialCategory: 'ST' },
      { id: 'baiga', label: 'Baiga', weight: 1.5, socialCategory: 'ST' },
      { id: 'saharia', label: 'Saharia', weight: 1.5, socialCategory: 'ST' }
    ],
    andhra_pradesh: [
      { id: 'brahmin_ap', label: 'Brahmin', weight: 3.0, socialCategory: 'General' },
      { id: 'reddy', label: 'Reddy', weight: 12.0, socialCategory: 'General' },
      { id: 'kamma', label: 'Kamma', weight: 8.0, socialCategory: 'General' },
      { id: 'velama', label: 'Velama', weight: 3.0, socialCategory: 'General' },
      { id: 'kapu', label: 'Kapu', weight: 10.0, socialCategory: 'OBC' },
      { id: 'balija', label: 'Balija', weight: 4.0, socialCategory: 'OBC' },
      { id: 'yadav_ap', label: 'Yadav/Golla', weight: 4.0, socialCategory: 'OBC' },
      { id: 'mala', label: 'Mala', weight: 6.0, socialCategory: 'SC' },
      { id: 'madiga_ap', label: 'Madiga', weight: 6.0, socialCategory: 'SC' },
      { id: 'lambadi', label: 'Lambadi/Banjara', weight: 3.0, socialCategory: 'ST' },
      { id: 'yerukala', label: 'Yerukala', weight: 1.5, socialCategory: 'ST' }
    ],
    telangana: [
      { id: 'brahmin_tg', label: 'Brahmin', weight: 3.0, socialCategory: 'General' },
      { id: 'reddy_tg', label: 'Reddy', weight: 12.0, socialCategory: 'General' },
      { id: 'velama_tg', label: 'Velama', weight: 5.0, socialCategory: 'General' },
      { id: 'kamma_tg', label: 'Kamma', weight: 4.0, socialCategory: 'General' },
      { id: 'mudiraj', label: 'Mudiraj', weight: 6.0, socialCategory: 'OBC' },
      { id: 'munnuru_kapu', label: 'Munnuru Kapu', weight: 5.0, socialCategory: 'OBC' },
      { id: 'padmashali', label: 'Padmashali', weight: 4.0, socialCategory: 'OBC' },
      { id: 'mala_tg', label: 'Mala', weight: 6.0, socialCategory: 'SC' },
      { id: 'madiga_tg', label: 'Madiga', weight: 6.0, socialCategory: 'SC' },
      { id: 'lambadi_tg', label: 'Lambadi', weight: 4.0, socialCategory: 'ST' },
      { id: 'gond_tg', label: 'Gond', weight: 3.0, socialCategory: 'ST' }
    ],
    odisha: [
      { id: 'brahmin_od', label: 'Brahmin', weight: 3.0, socialCategory: 'General' },
      { id: 'khandayat', label: 'Khandayat', weight: 12.0, socialCategory: 'General' },
      { id: 'karana', label: 'Karana', weight: 3.0, socialCategory: 'General' },
      { id: 'chasa', label: 'Chasa', weight: 6.0, socialCategory: 'OBC' },
      { id: 'teli_od', label: 'Teli', weight: 4.0, socialCategory: 'OBC' },
      { id: 'pana', label: 'Pana', weight: 5.0, socialCategory: 'SC' },
      { id: 'dhoba', label: 'Dhoba', weight: 3.0, socialCategory: 'SC' },
      { id: 'kandha', label: 'Kandha/Kondh', weight: 6.0, socialCategory: 'ST' },
      { id: 'gond_od', label: 'Gond', weight: 4.0, socialCategory: 'ST' },
      { id: 'santhal_od', label: 'Santhal', weight: 3.0, socialCategory: 'ST' },
      { id: 'sabar', label: 'Sabar/Saora', weight: 2.0, socialCategory: 'ST' }
    ],
    haryana: [
      { id: 'jat_hr', label: 'Jat', weight: 25.0, socialCategory: 'OBC' },
      { id: 'brahmin_hr', label: 'Brahmin', weight: 8.0, socialCategory: 'General' },
      { id: 'rajput_hr', label: 'Rajput', weight: 5.0, socialCategory: 'General' },
      { id: 'vaishya_hr', label: 'Vaishya/Agarwal', weight: 4.0, socialCategory: 'General' },
      { id: 'ror', label: 'Ror', weight: 2.0, socialCategory: 'OBC' },
      { id: 'saini_hr', label: 'Saini', weight: 3.0, socialCategory: 'OBC' },
      { id: 'chamar_hr', label: 'Chamar', weight: 10.0, socialCategory: 'SC' },
      { id: 'balmiki_hr', label: 'Balmiki', weight: 5.0, socialCategory: 'SC' },
      { id: 'dhanak', label: 'Dhanak', weight: 3.0, socialCategory: 'SC' }
    ],
    jharkhand: [
      { id: 'brahmin_jh', label: 'Brahmin', weight: 3.0, socialCategory: 'General' },
      { id: 'rajput_jh', label: 'Rajput', weight: 3.0, socialCategory: 'General' },
      { id: 'yadav_jh', label: 'Yadav', weight: 5.0, socialCategory: 'OBC' },
      { id: 'kurmi_jh', label: 'Kurmi', weight: 4.0, socialCategory: 'OBC' },
      { id: 'teli_jh', label: 'Teli', weight: 2.0, socialCategory: 'OBC' },
      { id: 'chamar_jh', label: 'Chamar', weight: 4.0, socialCategory: 'SC' },
      { id: 'dusadh_jh', label: 'Dusadh', weight: 3.0, socialCategory: 'SC' },
      { id: 'santhal_jh', label: 'Santhal', weight: 10.0, socialCategory: 'ST' },
      { id: 'oraon_jh', label: 'Oraon', weight: 6.0, socialCategory: 'ST' },
      { id: 'munda_jh', label: 'Munda', weight: 5.0, socialCategory: 'ST' },
      { id: 'ho', label: 'Ho', weight: 3.0, socialCategory: 'ST' },
      { id: 'kharia', label: 'Kharia', weight: 2.0, socialCategory: 'ST' }
    ],
    delhi: [
      { id: 'brahmin_dl', label: 'Brahmin', weight: 6.0, socialCategory: 'General' },
      { id: 'rajput_dl', label: 'Rajput', weight: 5.0, socialCategory: 'General' },
      { id: 'baniya_dl', label: 'Baniya/Agarwal', weight: 8.0, socialCategory: 'General' },
      { id: 'jat_dl', label: 'Jat', weight: 6.0, socialCategory: 'OBC' },
      { id: 'yadav_dl', label: 'Yadav', weight: 6.0, socialCategory: 'OBC' },
      { id: 'gujjar_dl', label: 'Gujjar', weight: 3.0, socialCategory: 'OBC' },
      { id: 'chamar_dl', label: 'Chamar/Jatav', weight: 8.0, socialCategory: 'SC' },
      { id: 'balmiki_dl', label: 'Balmiki', weight: 5.0, socialCategory: 'SC' }
    ],
    assam: [
      { id: 'brahmin_as', label: 'Brahmin', weight: 3.0, socialCategory: 'General' },
      { id: 'kalita', label: 'Kalita', weight: 8.0, socialCategory: 'General' },
      { id: 'koch_rajbongshi', label: 'Koch-Rajbongshi', weight: 7.0, socialCategory: 'OBC' },
      { id: 'ahom', label: 'Ahom', weight: 6.0, socialCategory: 'OBC' },
      { id: 'kaibarta', label: 'Kaibarta', weight: 4.0, socialCategory: 'SC' },
      { id: 'namasudra_as', label: 'Namasudra', weight: 3.0, socialCategory: 'SC' },
      { id: 'bodo', label: 'Bodo', weight: 5.0, socialCategory: 'ST' },
      { id: 'miri', label: 'Miri/Mishing', weight: 2.0, socialCategory: 'ST' },
      { id: 'karbi', label: 'Karbi', weight: 2.0, socialCategory: 'ST' },
      { id: 'dimasa', label: 'Dimasa', weight: 1.0, socialCategory: 'ST' }
    ],
    chhattisgarh: [
      { id: 'brahmin_cg', label: 'Brahmin', weight: 3.0, socialCategory: 'General' },
      { id: 'rajput_cg', label: 'Rajput', weight: 4.0, socialCategory: 'General' },
      { id: 'teli_cg', label: 'Teli', weight: 5.0, socialCategory: 'OBC' },
      { id: 'kurmi_cg', label: 'Kurmi', weight: 5.0, socialCategory: 'OBC' },
      { id: 'sahu', label: 'Sahu', weight: 4.0, socialCategory: 'OBC' },
      { id: 'chamar_cg', label: 'Chamar', weight: 5.0, socialCategory: 'SC' },
      { id: 'gond_cg', label: 'Gond', weight: 12.0, socialCategory: 'ST' },
      { id: 'kanwar', label: 'Kanwar', weight: 3.0, socialCategory: 'ST' },
      { id: 'halba', label: 'Halba', weight: 2.0, socialCategory: 'ST' },
      { id: 'oraon_cg', label: 'Oraon', weight: 3.0, socialCategory: 'ST' }
    ],
    uttarakhand: [
      { id: 'brahmin_uk', label: 'Brahmin (Garhwali/Kumaoni)', weight: 12.0, socialCategory: 'General' },
      { id: 'rajput_uk', label: 'Rajput (Garhwali/Kumaoni)', weight: 10.0, socialCategory: 'General' },
      { id: 'bhotia', label: 'Bhotia', weight: 2.0, socialCategory: 'ST' },
      { id: 'tharu_uk', label: 'Tharu', weight: 1.5, socialCategory: 'ST' },
      { id: 'dom_uk', label: 'Dom', weight: 5.0, socialCategory: 'SC' },
      { id: 'khas', label: 'Khas', weight: 3.0, socialCategory: 'OBC' }
    ],
    goa: [
      { id: 'brahmin_saraswat', label: 'Saraswat Brahmin', weight: 4.0, socialCategory: 'General' },
      { id: 'maratha', label: 'Maratha/Kshatriya', weight: 5.0, socialCategory: 'General' },
      { id: 'kunbi', label: 'Kunbi', weight: 6.0, socialCategory: 'OBC' },
      { id: 'bhandari', label: 'Bhandari', weight: 6.0, socialCategory: 'OBC' },
      { id: 'dalit_goa', label: 'Mahar', weight: 3.0, socialCategory: 'SC' }
    ],
    jammu_kashmir: [
      { id: 'brahmin_jk', label: 'Dogra Brahmin', weight: 6.0, socialCategory: 'General' },
      { id: 'rajput_jk', label: 'Dogra Rajput', weight: 8.0, socialCategory: 'General' },
      { id: 'pandit_jk', label: 'Kashmiri Pandit', weight: 4.0, socialCategory: 'General' },
      { id: 'chamar_jk', label: 'Chamar', weight: 5.0, socialCategory: 'SC' },
      { id: 'balmiki_jk', label: 'Balmiki', weight: 3.0, socialCategory: 'SC' }
    ],
    himachal_pradesh: [
      { id: 'brahmin_hp', label: 'Pahari Brahmin', weight: 10.0, socialCategory: 'General' },
      { id: 'rajput_hp', label: 'Pahari Rajput/Thakur', weight: 15.0, socialCategory: 'General' },
      { id: 'ghirath', label: 'Ghirath/Chaudhary', weight: 5.0, socialCategory: 'OBC' },
      { id: 'chamar_hp', label: 'Chamar', weight: 6.0, socialCategory: 'SC' },
      { id: 'koli_hp', label: 'Koli', weight: 8.0, socialCategory: 'SC' }
    ],
    sikkim: [
      { id: 'brahmin_sk', label: 'Bahun (Brahmin)', weight: 6.0, socialCategory: 'General' },
      { id: 'rajput_sk', label: 'Chhetri', weight: 8.0, socialCategory: 'General' },
      { id: 'newar_sk', label: 'Newar', weight: 4.0, socialCategory: 'OBC' },
      { id: 'rai_sk', label: 'Rai', weight: 6.0, socialCategory: 'ST' },
      { id: 'limbu_sk', label: 'Limbu', weight: 4.0, socialCategory: 'ST' },
      { id: 'tamang_sk', label: 'Tamang', weight: 4.0, socialCategory: 'ST' },
      { id: 'kami_sk', label: 'Kami (SC)', weight: 2.0, socialCategory: 'SC' }
    ]
  },
  muslim: {
    default: [
      { id: 'syed', label: 'Syed/Sayyid', weight: 6.0, socialCategory: 'General' },
      { id: 'sheikh', label: 'Sheikh', weight: 15.0, socialCategory: 'General' },
      { id: 'pathan', label: 'Pathan', weight: 8.0, socialCategory: 'General' },
      { id: 'mughal', label: 'Mughal', weight: 2.0, socialCategory: 'General' },
      { id: 'ansari', label: 'Ansari', weight: 10.0, socialCategory: 'OBC' },
      { id: 'qureshi', label: 'Qureshi', weight: 6.0, socialCategory: 'OBC' },
      { id: 'mansuri', label: 'Mansuri', weight: 4.0, socialCategory: 'OBC' },
      { id: 'idrisi', label: 'Idrisi', weight: 2.0, socialCategory: 'OBC' },
      { id: 'saifi', label: 'Saifi', weight: 3.0, socialCategory: 'OBC' },
      { id: 'faqir', label: 'Faqir', weight: 2.0, socialCategory: 'OBC' },
      { id: 'julaha', label: 'Julaha/Momin', weight: 5.0, socialCategory: 'OBC' },
      { id: 'dhobi_m', label: 'Dhobi (Muslim)', weight: 2.0, socialCategory: 'OBC' },
      { id: 'halalkhor', label: 'Halalkhor', weight: 1.0, socialCategory: 'OBC' }
    ],
    kerala: [
      { id: 'mappila', label: 'Mappila', weight: 35.0, socialCategory: 'OBC' },
      { id: 'thangal', label: 'Thangal', weight: 3.0, socialCategory: 'General' },
      { id: 'rawther', label: 'Rawther', weight: 8.0, socialCategory: 'OBC' },
      { id: 'sheikh_kl', label: 'Sheikh', weight: 5.0, socialCategory: 'General' },
      { id: 'ossain', label: 'Ossain/Ossan', weight: 2.0, socialCategory: 'OBC' }
    ],
    west_bengal: [
      { id: 'sheikh_wb', label: 'Sheikh', weight: 40.0, socialCategory: 'General' },
      { id: 'syed_wb', label: 'Syed', weight: 3.0, socialCategory: 'General' },
      { id: 'pathan_wb', label: 'Pathan', weight: 5.0, socialCategory: 'General' },
      { id: 'ansari_wb', label: 'Ansari (Julaha)', weight: 8.0, socialCategory: 'OBC' },
      { id: 'qureshi_wb', label: 'Qureshi', weight: 4.0, socialCategory: 'OBC' }
    ],
    jammu_kashmir: [
      { id: 'syed_jk', label: 'Syed', weight: 8.0, socialCategory: 'General' },
      { id: 'mir', label: 'Mir', weight: 10.0, socialCategory: 'General' },
      { id: 'sheikh_jk', label: 'Sheikh', weight: 12.0, socialCategory: 'General' },
      { id: 'bhat', label: 'Bhat', weight: 8.0, socialCategory: 'General' },
      { id: 'dar', label: 'Dar', weight: 6.0, socialCategory: 'General' },
      { id: 'lone', label: 'Lone', weight: 5.0, socialCategory: 'General' },
      { id: 'wani', label: 'Wani', weight: 5.0, socialCategory: 'General' },
      { id: 'gujjar_jk', label: 'Gujjar', weight: 10.0, socialCategory: 'OBC' },
      { id: 'bakerwal', label: 'Bakerwal', weight: 4.0, socialCategory: 'ST' }
    ]
  },
  christian: {
    default: [
      { id: 'roman_catholic', label: 'Roman Catholic', weight: 35.0, socialCategory: 'General' },
      { id: 'protestant', label: 'Protestant', weight: 25.0, socialCategory: 'General' },
      { id: 'syro_malabar', label: 'Syro-Malabar Catholic', weight: 10.0, socialCategory: 'General' },
      { id: 'malankara', label: 'Malankara Orthodox', weight: 8.0, socialCategory: 'General' },
      { id: 'csi', label: 'CSI (Church of South India)', weight: 8.0, socialCategory: 'General' },
      { id: 'dalit_christian', label: 'Dalit Christian', weight: 12.0, socialCategory: 'OBC' },
      { id: 'tribal_christian', label: 'Tribal Christian', weight: 10.0, socialCategory: 'ST' }
    ],
    kerala: [
      { id: 'syro_malabar_kl', label: 'Syro-Malabar Catholic', weight: 25.0, socialCategory: 'General' },
      { id: 'malankara_kl', label: 'Malankara Orthodox', weight: 15.0, socialCategory: 'General' },
      { id: 'jacobite', label: 'Jacobite Syrian', weight: 10.0, socialCategory: 'General' },
      { id: 'csi_kl', label: 'CSI', weight: 8.0, socialCategory: 'General' },
      { id: 'latin_catholic', label: 'Latin Catholic', weight: 12.0, socialCategory: 'General' },
      { id: 'marthomite', label: 'Marthomite', weight: 8.0, socialCategory: 'General' },
      { id: 'pentecostal_kl', label: 'Pentecostal', weight: 5.0, socialCategory: 'General' },
      { id: 'dalit_chr_kl', label: 'Dalit Christian', weight: 8.0, socialCategory: 'OBC' }
    ],
    goa: [
      { id: 'roman_catholic_goa', label: 'Roman Catholic (Goan)', weight: 70.0, socialCategory: 'General' },
      { id: 'protestant_goa', label: 'Protestant', weight: 10.0, socialCategory: 'General' },
      { id: 'bahujan_chr', label: 'Bahujan Christian', weight: 15.0, socialCategory: 'OBC' }
    ],
    meghalaya: [
      { id: 'presbyterian', label: 'Presbyterian', weight: 30.0, socialCategory: 'ST' },
      { id: 'roman_catholic_ml', label: 'Roman Catholic', weight: 25.0, socialCategory: 'ST' },
      { id: 'baptist_ml', label: 'Baptist', weight: 15.0, socialCategory: 'ST' },
      { id: 'coi', label: 'Church of India', weight: 10.0, socialCategory: 'ST' }
    ],
    nagaland: [
      { id: 'baptist_nl', label: 'Baptist', weight: 60.0, socialCategory: 'ST' },
      { id: 'roman_catholic_nl', label: 'Roman Catholic', weight: 20.0, socialCategory: 'ST' },
      { id: 'revival_nl', label: 'Revival Church', weight: 10.0, socialCategory: 'ST' }
    ],
    mizoram: [
      { id: 'presbyterian_mz', label: 'Presbyterian', weight: 40.0, socialCategory: 'ST' },
      { id: 'baptist_mz', label: 'Baptist', weight: 25.0, socialCategory: 'ST' },
      { id: 'salvation_army', label: 'Salvation Army', weight: 10.0, socialCategory: 'ST' },
      { id: 'roman_catholic_mz', label: 'Roman Catholic', weight: 10.0, socialCategory: 'ST' }
    ]
  },
  sikh: {
    default: [
      { id: 'jat_sikh', label: 'Jat Sikh', weight: 30.0, socialCategory: 'General' },
      { id: 'khatri_sikh', label: 'Khatri Sikh', weight: 10.0, socialCategory: 'General' },
      { id: 'arora_sikh', label: 'Arora Sikh', weight: 8.0, socialCategory: 'General' },
      { id: 'ramgarhia', label: 'Ramgarhia', weight: 8.0, socialCategory: 'OBC' },
      { id: 'saini_sikh', label: 'Saini Sikh', weight: 4.0, socialCategory: 'OBC' },
      { id: 'mazbi_sikh', label: 'Mazbi Sikh', weight: 12.0, socialCategory: 'SC' },
      { id: 'ramdasia_sikh', label: 'Ramdasia Sikh', weight: 8.0, socialCategory: 'SC' },
      { id: 'ravidasia', label: 'Ravidasia', weight: 6.0, socialCategory: 'SC' },
      { id: 'bhatia_sikh', label: 'Bhatia', weight: 3.0, socialCategory: 'General' }
    ]
  },
  buddhist: {
    default: [
      { id: 'navayana', label: 'Navayana/Ambedkarite Buddhist', weight: 60.0, socialCategory: 'SC' },
      { id: 'theravada', label: 'Theravada Buddhist', weight: 15.0, socialCategory: 'ST' },
      { id: 'mahayana', label: 'Mahayana Buddhist', weight: 10.0, socialCategory: 'ST' },
      { id: 'vajrayana', label: 'Vajrayana/Tibetan Buddhist', weight: 10.0, socialCategory: 'ST' },
      { id: 'general_buddhist', label: 'Buddhist (General)', weight: 5.0, socialCategory: 'General' }
    ],
    maharashtra: [
      { id: 'navayana_mh', label: 'Navayana Buddhist (Mahar)', weight: 75.0, socialCategory: 'SC' },
      { id: 'matang_buddhist', label: 'Buddhist (Matang)', weight: 10.0, socialCategory: 'SC' },
      { id: 'general_buddhist', label: 'Buddhist (General)', weight: 10.0, socialCategory: 'General' }
    ]
  },
  jain: {
    default: [
      { id: 'digambar', label: 'Digambar', weight: 35.0, socialCategory: 'General' },
      { id: 'shwetambar', label: 'Shwetambar', weight: 35.0, socialCategory: 'General' },
      { id: 'sthanakvasi', label: 'Sthanakvasi', weight: 15.0, socialCategory: 'General' },
      { id: 'terapanthi', label: 'Terapanthi', weight: 10.0, socialCategory: 'General' },
      { id: 'deravasi', label: 'Deravasi/Murti Pujak', weight: 5.0, socialCategory: 'General' }
    ]
  }
};

// ═════════════════════════════════════════════════════════════
// FIRST NAMES DATABASE
// ═════════════════════════════════════════════════════════════

// First names organized by: religionId → stateId/region → gender → NameEntry[]
const firstNames = compiledNames;

// ═════════════════════════════════════════════════════════════
// SURNAMES DATABASE
// ═════════════════════════════════════════════════════════════

// Surnames organized by: casteId → NameEntry[]
const surnames: Record<string, NameEntry[]> = {
  "brahmin": [
    {
      "name": "Sharma",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Shukla",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Mishra",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Trivedi",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Dwivedi",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Tiwari",
      "weight": 7,
      "gender": "unisex"
    },
    {
      "name": "Pandey",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Upadhyay",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Joshi",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Dubey",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Dikshit",
      "weight": 3,
      "gender": "unisex"
    },
    {
      "name": "Chaturvedi",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Bhatt",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dixit",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Agnihotri",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bharadwaj",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Pathak",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ojha",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Vajpayee",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "rajput": [
    {
      "name": "Singh",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Chauhan",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Rathore",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Sisodia",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Shekhawat",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Tomar",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Rana",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Panwar",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Parmar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Solanki",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chandel",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Baghel",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Gohil",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bhati",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Jadeja",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kachhwaha",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Vaghela",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Devda",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "vaishya": [
    {
      "name": "Agarwal",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Gupta",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Goel",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Mittal",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Bansal",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Jain",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Singhal",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Rastogi",
      "weight": 3,
      "gender": "unisex"
    },
    {
      "name": "Agrawal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Goyal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Jindal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Tayal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kansal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Singla",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Maheshwari",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "kayastha": [
    {
      "name": "Srivastava",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Mathur",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Saxena",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Nigam",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Bhatnagar",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Verma",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Asthana",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kulshrestha",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sinha",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "yadav": [
    {
      "name": "Yadav",
      "weight": 50,
      "gender": "unisex"
    },
    {
      "name": "Ahir",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Gowala",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Rao",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Jadav",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Gope",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Gwala",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Yaduvanshi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Krishnaut",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Phulwariya",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "jat": [
    {
      "name": "Malik",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dahiya",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Hooda",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Sangwan",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Jakhar",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Chaudhary",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Duhan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Deswal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Nain",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sheoran",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dalal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kadian",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Panghal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sahrawat",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "kurmi": [
    {
      "name": "Patel",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Kushwaha",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Kurmi",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Lodhi",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Verma",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kanaujia",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Awadhia",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chandravanshi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mahato",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Singh",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "chamar": [
    {
      "name": "Jatav",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Raidas",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Ram",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Gautam",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Ambedkar",
      "weight": 3,
      "gender": "unisex"
    },
    {
      "name": "Bharti",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Ahirwar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Valmiki",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Balmiki",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kureel",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Saroj",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Lal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Prasad",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kumar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "maratha": [
    {
      "name": "Patil",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Deshmukh",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Jadhav",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Pawar",
      "weight": 7,
      "gender": "unisex"
    },
    {
      "name": "Chavan",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "More",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Shinde",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Bhosale",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Gaikwad",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Nimbalkar",
      "weight": 3,
      "gender": "unisex"
    },
    {
      "name": "Salunkhe",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kadam",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Wagh",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Nikam",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kale",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Thorat",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Jagtap",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "iyer": [
    {
      "name": "Iyer",
      "weight": 40,
      "gender": "unisex"
    },
    {
      "name": "Aiyer",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Subramanian",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Krishnamurthy",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Venkataraman",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Sastri",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sastrigal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Vadhyar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Somayaji",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ganapadi",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "iyengar": [
    {
      "name": "Iyengar",
      "weight": 40,
      "gender": "unisex"
    },
    {
      "name": "Srinivasan",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Ranganathan",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Sampath",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Parthasarathy",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Varadhan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Alwar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "reddy": [
    {
      "name": "Reddy",
      "weight": 60,
      "gender": "unisex"
    },
    {
      "name": "Goud",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Chowdary",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Rao",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Naidu",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Varma",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sarma",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "kamma": [
    {
      "name": "Rao",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Naidu",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Chowdary",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Rayudu",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chaudary",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "nair": [
    {
      "name": "Nair",
      "weight": 40,
      "gender": "unisex"
    },
    {
      "name": "Pillai",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Menon",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kurup",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Panicker",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kartha",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Nambiar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "ezhava": [
    {
      "name": "Ezhuthachan",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Thiyyar",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Panicker",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Tharakan",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Channar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Thankappan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Vaidyan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ashari",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chekavar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "patel": [
    {
      "name": "Patel",
      "weight": 50,
      "gender": "unisex"
    },
    {
      "name": "Desai",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Patidar",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Chaudhary",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Chaudhari",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Amin",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Rana",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chauhan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Solanki",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Vaghela",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Parikh",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "lingayat": [
    {
      "name": "Patil",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Gowda",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Hiremath",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Gudaguntla",
      "weight": 3,
      "gender": "unisex"
    },
    {
      "name": "Gouda",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Shetty",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Naik",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Pujar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Angadi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Banakar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "vokkaliga": [
    {
      "name": "Gowda",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Shetty",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Reddy",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Naidu",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Rao",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Hallikar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "brahmin_bengali": [
    {
      "name": "Mukherjee",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Banerjee",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chatterjee",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bhattacharya",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Chakraborty",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Ganguly",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Bose",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Ghosh",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Goswami",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sanyal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bagchi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mitra",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ghoshal",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "kayastha_wb": [
    {
      "name": "Mitra",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Dutta",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Sen",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Guha",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Das",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Saha",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Bose",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ghosh",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Pal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Roy",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sengupta",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "syed": [
    {
      "name": "Rizvi",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Naqvi",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Zaidi",
      "weight": 7,
      "gender": "unisex"
    },
    {
      "name": "Kazmi",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Husaini",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Bukhari",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Siddiqui",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Farooqi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Gilani",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Hussaini",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "sheikh": [
    {
      "name": "Sheikh",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Khan",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Ahmed",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Alam",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Ansari",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Qureshi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Siddiqui",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Usmani",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Farooqui",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Haque",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ahmad",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ilyasi",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "pathan": [
    {
      "name": "Khan",
      "weight": 40,
      "gender": "unisex"
    },
    {
      "name": "Pathan",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Afridi",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Yusufzai",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Sherwani",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Lodhi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bangash",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Yousufzai",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Waziri",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Durrani",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "ansari": [
    {
      "name": "Ansari",
      "weight": 50,
      "gender": "unisex"
    },
    {
      "name": "Ansar",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Sheikh",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Siddiqui",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Momin",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Idrisi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mansoori",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Saifi",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "qureshi": [
    {
      "name": "Qureshi",
      "weight": 50,
      "gender": "unisex"
    },
    {
      "name": "Qureishi",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Quraishi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Shaikh",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Abbasi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Faridi",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "mappila": [
    {
      "name": "Kutti",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Haji",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Koya",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Thangal",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Musaliyar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Keyi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ali",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "mir": [
    {
      "name": "Mir",
      "weight": 40,
      "gender": "unisex"
    },
    {
      "name": "Qadri",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Baig",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mirza",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Beigh",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Shah",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Andrabi",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "bhat": [
    {
      "name": "Bhat",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Bhatt",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Dar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Lone",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Rather",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Wani",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "dar": [
    {
      "name": "Dar",
      "weight": 40,
      "gender": "unisex"
    },
    {
      "name": "Dhar",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Magrey",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kachru",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Raina",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Zargar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "jat_sikh": [
    {
      "name": "Singh",
      "weight": 30,
      "gender": "male"
    },
    {
      "name": "Kaur",
      "weight": 30,
      "gender": "female"
    },
    {
      "name": "Sidhu",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Gill",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Dhillon",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Sandhu",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Brar",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Grewal",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Bajwa",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Mann",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Virka",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Randhawa",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bains",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bhullar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "khatri_sikh": [
    {
      "name": "Kohli",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Kapoor",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Malhotra",
      "weight": 7,
      "gender": "unisex"
    },
    {
      "name": "Khanna",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Chopra",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Bedi",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Oberoi",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Anand",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Sethi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chadha",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sabharwal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dhawan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chugh",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Grover",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "arora_sikh": [
    {
      "name": "Arora",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Ahuja",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Luthra",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Suri",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Juneja",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Batra",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mehra",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Taneja",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chhabra",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kalra",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Wadhwa",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "roman_catholic": [
    {
      "name": "Fernandes",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "D'Souza",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Pereira",
      "weight": 7,
      "gender": "unisex"
    },
    {
      "name": "Rodrigues",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Lobo",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Pinto",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Dias",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Almeida",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Dsouza",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Costa",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sequeira",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Noronha",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Vaz",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "syro_malabar_kl": [
    {
      "name": "Kuriakose",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Varghese",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Chacko",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Mathew",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Thomas",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Abraham",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Kurian",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Paily",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "malankara_kl": [
    {
      "name": "Kurien",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Philip",
      "weight": 7,
      "gender": "unisex"
    },
    {
      "name": "George",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "John",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Thomas",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Abraham",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Zachariah",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Oommen",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "digambar": [
    {
      "name": "Jain",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Badjatya",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Kasliwal",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Golecha",
      "weight": 4,
      "gender": "unisex"
    },
    {
      "name": "Shah",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Oswal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Surana",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bhandari",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bagdia",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Patni",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sancheti",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Badjatia",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dosi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Nahata",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "shwetambar": [
    {
      "name": "Shah",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Mehta",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Doshi",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Sanghvi",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Parekh",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Zaveri",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Jhaveri",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Parikh",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bhansali",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Kothari",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sheth",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Gandhi",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "navayana": [
    {
      "name": "Ambedkar",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Kamble",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Gaikwad",
      "weight": 8,
      "gender": "unisex"
    },
    {
      "name": "Sonawane",
      "weight": 6,
      "gender": "unisex"
    },
    {
      "name": "Wagh",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "More",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Meshram",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Wankhede",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sapkale",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Waghmare",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Nikalje",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ahire",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dhede",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ghole",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Jadhav",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chavan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Shinde",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "ghirath": [
    {
      "name": "Chaudhary",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Ghirath",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Rana",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Thakur",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Verma",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "brahmin_sk": [
    {
      "name": "Sharma",
      "weight": 25,
      "gender": "unisex"
    },
    {
      "name": "Bahun",
      "weight": 10,
      "gender": "unisex"
    },
    {
      "name": "Pokhrel",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Acharya",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Adhikari",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bhattarai",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dulal",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Neopane",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Regmi",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "rajput_sk": [
    {
      "name": "Chhetri",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Rajput",
      "weight": 5,
      "gender": "unisex"
    },
    {
      "name": "Thapa",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Rana",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Shahi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Chand",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bam",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Rawat",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "newar_sk": [
    {
      "name": "Pradhan",
      "weight": 25,
      "gender": "unisex"
    },
    {
      "name": "Newar",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Shrestha",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Maharjan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Tuladhar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bajracharya",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Shakya",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "rai_sk": [
    {
      "name": "Rai",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Subba",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Limbu",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mukhia",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Dewan",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "limbu_sk": [
    {
      "name": "Subba",
      "weight": 25,
      "gender": "unisex"
    },
    {
      "name": "Limbu",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Yakthung",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mabuhang",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Tumbapo",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Angbuhang",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "tamang_sk": [
    {
      "name": "Tamang",
      "weight": 30,
      "gender": "unisex"
    },
    {
      "name": "Moktan",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Yolmo",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ghising",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Bomzan",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "kami_sk": [
    {
      "name": "Kami",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Biswakarma",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Viswakarma",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Sunuwar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mijar",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "bhandari": [
    {
      "name": "Bhandari",
      "weight": 25,
      "gender": "unisex"
    },
    {
      "name": "Naik",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Shetty",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Suvarna",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Mestri",
      "weight": 12,
      "gender": "unisex"
    }
  ],
  "pandit_jk": [
    {
      "name": "Bhat",
      "weight": 20,
      "gender": "unisex"
    },
    {
      "name": "Kaul",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Dhar",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Raina",
      "weight": 15,
      "gender": "unisex"
    },
    {
      "name": "Pandit",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Koul",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Munshi",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Saproo",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Haksar",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Tickoo",
      "weight": 12,
      "gender": "unisex"
    },
    {
      "name": "Ganjoo",
      "weight": 12,
      "gender": "unisex"
    }
  ]
};

// ═════════════════════════════════════════════════════════════
// DISTRICTS DATABASE
// ═════════════════════════════════════════════════════════════

const districts: Record<string, string[]> = {
  "uttar_pradesh": [
    "Agra",
    "Aligarh",
    "Ambedkar Nagar",
    "Amethi",
    "Amroha",
    "Auraiya",
    "Ayodhya",
    "Azamgarh",
    "Baghpat",
    "Bahraich",
    "Ballia",
    "Balrampur",
    "Banda",
    "Barabanki",
    "Bareilly",
    "Basti",
    "Bhadohi",
    "Bijnor",
    "Budaun",
    "Bulandshahr",
    "Chandauli",
    "Chitrakoot",
    "Deoria",
    "Etah",
    "Etawah",
    "Farrukhabad",
    "Fatehpur",
    "Firozabad",
    "Gautam Buddha Nagar",
    "Ghaziabad",
    "Ghazipur",
    "Gonda",
    "Gorakhpur",
    "Hamirpur",
    "Hapur",
    "Hardoi",
    "Hathras",
    "Jalaun",
    "Jaunpur",
    "Jhansi",
    "Kannauj",
    "Kanpur Dehat",
    "Kanpur Nagar",
    "Kasganj",
    "Kaushambi",
    "Kushinagar",
    "Lakhimpur Kheri",
    "Lalitpur",
    "Lucknow",
    "Maharajganj",
    "Mahoba",
    "Mainpuri",
    "Mathura",
    "Mau",
    "Meerut",
    "Mirzapur",
    "Moradabad",
    "Muzaffarnagar",
    "Pilibhit",
    "Pratapgarh",
    "Prayagraj",
    "Raebareli",
    "Rampur",
    "Saharanpur",
    "Sambhal",
    "Sant Kabir Nagar",
    "Shahjahanpur",
    "Shamli",
    "Shravasti",
    "Siddharthnagar",
    "Sitapur",
    "Sonbhadra",
    "Sultanpur",
    "Unnao",
    "Varanasi"
  ],
  "maharashtra": [
    "Mumbai City",
    "Mumbai Suburban",
    "Thane",
    "Palghar",
    "Raigad",
    "Ratnagiri",
    "Sindhudurg",
    "Pune",
    "Satara",
    "Sangli",
    "Solapur",
    "Kolhapur",
    "Nashik",
    "Dhule",
    "Nandurbar",
    "Jalgaon",
    "Ahmednagar",
    "Beed",
    "Latur",
    "Dharashiv",
    "Nanded",
    "Parbhani",
    "Hingoli",
    "Chhatrapati Sambhajinagar",
    "Jalna",
    "Buldana",
    "Akola",
    "Washim",
    "Amravati",
    "Yavatmal",
    "Wardha",
    "Nagpur",
    "Bhandara",
    "Gondia",
    "Gadchiroli",
    "Chandrapur"
  ],
  "tamil_nadu": [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kancheepuram",
    "Kanyakumari",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar"
  ],
  "rajasthan": [
    "Ajmer",
    "Alwar",
    "Banswara",
    "Baran",
    "Barmer",
    "Bharatpur",
    "Bhilwara",
    "Bikaner",
    "Bundi",
    "Chittorgarh",
    "Churu",
    "Dausa",
    "Dholpur",
    "Dungarpur",
    "Hanumangarh",
    "Jaipur",
    "Jaisalmer",
    "Jalore",
    "Jhalawar",
    "Jhunjhunu",
    "Jodhpur",
    "Karauli",
    "Kota",
    "Nagaur",
    "Pali",
    "Pratapgarh",
    "Rajsamand",
    "Sawai Madhopur",
    "Sikar",
    "Sirohi",
    "Sri Ganganagar",
    "Tonk",
    "Udaipur"
  ],
  "bihar": [
    "Araria",
    "Arwal",
    "Aurangabad",
    "Banka",
    "Begusarai",
    "Bhagalpur",
    "Bhojpur",
    "Buxar",
    "Darbhanga",
    "East Champaran",
    "Gaya",
    "Gopalganj",
    "Jamui",
    "Jehanabad",
    "Kaimur",
    "Katihar",
    "Khagaria",
    "Kishanganj",
    "Lakhisarai",
    "Madhepura",
    "Madhubani",
    "Munger",
    "Muzaffarpur",
    "Nalanda",
    "Nawada",
    "Patna",
    "Purnia",
    "Rohtas",
    "Saharsa",
    "Samastipur",
    "Saran",
    "Sheikhpura",
    "Sheohar",
    "Sitamarhi",
    "Siwan",
    "Supaul",
    "Vaishali",
    "West Champaran"
  ],
  "madhya_pradesh": [
    "Agar Malwa",
    "Alirajpur",
    "Anuppur",
    "Ashoknagar",
    "Balaghat",
    "Barwani",
    "Betul",
    "Bhind",
    "Bhopal",
    "Burhanpur",
    "Chhatarpur",
    "Chhindwara",
    "Damoh",
    "Datia",
    "Dewas",
    "Dhar",
    "Dindori",
    "Guna",
    "Gwalior",
    "Harda",
    "Indore",
    "Jabalpur",
    "Jhabua",
    "Katni",
    "Khandwa",
    "Khargone",
    "Maihar",
    "Mandla",
    "Mandsaur",
    "Morena",
    "Narsinghpur",
    "Neemuch",
    "Niwari",
    "Panna",
    "Raisen",
    "Rajgarh",
    "Ratlam",
    "Rewa",
    "Sagar",
    "Satna",
    "Sehore",
    "Seoni",
    "Shahdol",
    "Shajapur",
    "Sheopur",
    "Shivpuri",
    "Sidhi",
    "Singrauli",
    "Tikamgarh",
    "Ujjain",
    "Umaria",
    "Vidisha"
  ],
  "karnataka": [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapur",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada",
    "Davangere",
    "Dharwad",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi",
    "Kodagu",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Uttara Kannada",
    "Vijayanagara",
    "Vijayapura",
    "Yadgir"
  ],
  "gujarat": [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Aravalli",
    "Banaskantha",
    "Bharuch",
    "Bhavnagar",
    "Botad",
    "Chhota Udaipur",
    "Dahod",
    "Dang",
    "Devbhoomi Dwarka",
    "Gandhinagar",
    "Gir Somnath",
    "Jamnagar",
    "Junagadh",
    "Kheda",
    "Kutch",
    "Mahisagar",
    "Mehsana",
    "Morbi",
    "Narmada",
    "Navsari",
    "Panchmahal",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Sabarkantha",
    "Surat",
    "Surendranagar",
    "Tapi",
    "Vadodara",
    "Valsad"
  ],
  "west_bengal": [
    "Alipurduar",
    "Bankura",
    "Birbhum",
    "Cooch Behar",
    "Dakshin Dinajpur",
    "Darjeeling",
    "Hooghly",
    "Howrah",
    "Jalpaiguri",
    "Jhargram",
    "Kalimpong",
    "Kolkata",
    "Malda",
    "Murshidabad",
    "Nadia",
    "North 24 Parganas",
    "Paschim Bardhaman",
    "Paschim Medinipur",
    "Purba Bardhaman",
    "Purba Medinipur",
    "Purulia",
    "South 24 Parganas",
    "Uttar Dinajpur"
  ],
  "andhra_pradesh": [
    "Alluri Sitharama Raju",
    "Anakapalli",
    "Ananthapuramu",
    "Annamayya",
    "Bapatla",
    "Chittoor",
    "Dr. B.R. Ambedkar Konaseema",
    "East Godavari",
    "Eluru",
    "Guntur",
    "Kakinada",
    "Krishna",
    "Kurnool",
    "Nandyal",
    "NTR",
    "Palnadu",
    "Parvathipuram Manyam",
    "Prakasam",
    "Sri Potti Sriramulu Nellore",
    "Sri Sathya Sai",
    "Srikakulam",
    "Tirupati",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari",
    "YSR Kadapa"
  ],
  "telangana": [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hanumakonda",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar Bhupalpally",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Komaram Bheem Asifabad",
    "Mahabubabad",
    "Mahabubnagar",
    "Mancherial",
    "Medak",
    "Medchal-Malkajgiri",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal",
    "Yadadri Bhuvanagiri"
  ],
  "kerala": [
    "Alappuzha",
    "Ernakulam",
    "Idukki",
    "Kannur",
    "Kasaragod",
    "Kollam",
    "Kottayam",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Pathanamthitta",
    "Thiruvananthapuram",
    "Thrissur",
    "Wayanad"
  ],
  "punjab": [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Malerkotla",
    "Mansa",
    "Moga",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sahibzada Ajit Singh Nagar",
    "Sangrur",
    "Shahid Bhagat Singh Nagar",
    "Sri Muktsar Sahib",
    "Tarn Taran"
  ],
  "haryana": [
    "Ambala",
    "Bhiwani",
    "Charkhi Dadri",
    "Faridabad",
    "Fatehabad",
    "Gurugram",
    "Hisar",
    "Jhajjar",
    "Jind",
    "Kaithal",
    "Karnal",
    "Kurukshetra",
    "Mahendragarh",
    "Nuh",
    "Palwal",
    "Panchkula",
    "Panipat",
    "Rewari",
    "Rohtak",
    "Sirsa",
    "Sonipat",
    "Yamunanagar"
  ],
  "odisha": [
    "Angul",
    "Balangir",
    "Balasore",
    "Bargarh",
    "Bhadrak",
    "Boudh",
    "Cuttack",
    "Deogarh",
    "Dhenkanal",
    "Gajapati",
    "Ganjam",
    "Jagatsinghpur",
    "Jajpur",
    "Jharsuguda",
    "Kalahandi",
    "Kandhamal",
    "Kendrapara",
    "Kendujhar",
    "Khordha",
    "Koraput",
    "Malkangiri",
    "Mayurbhanj",
    "Nabarangpur",
    "Nayagarh",
    "Nuapada",
    "Puri",
    "Rayagada",
    "Sambalpur",
    "Subarnapur",
    "Sundargarh"
  ],
  "assam": [
    "Bajali",
    "Baksa",
    "Barpeta",
    "Biswanath",
    "Bongaigaon",
    "Cachar",
    "Charaideo",
    "Chirang",
    "Darrang",
    "Dhemaji",
    "Dhubri",
    "Dibrugarh",
    "Dima Hasao",
    "Goalpara",
    "Golaghat",
    "Hailakandi",
    "Hojai",
    "Jorhat",
    "Kamrup Metropolitan",
    "Kamrup Rural",
    "Karbi Anglong",
    "Karimganj",
    "Kokrajhar",
    "Lakhimpur",
    "Majuli",
    "Morigaon",
    "Nagaon",
    "Nalbari",
    "Sivasagar",
    "Sonitpur",
    "South Salmara-Mankachar",
    "Tamulpur",
    "Tinsukia",
    "Udalguri",
    "West Karbi Anglong"
  ],
  "jharkhand": [
    "Bokaro",
    "Chatra",
    "Deoghar",
    "Dhanbad",
    "Dumka",
    "East Singhbhum",
    "Garhwa",
    "Giridih",
    "Godda",
    "Gumla",
    "Hazaribagh",
    "Jamtara",
    "Khunti",
    "Koderma",
    "Latehar",
    "Lohardaga",
    "Pakur",
    "Palamu",
    "Ramgarh",
    "Ranchi",
    "Sahibganj",
    "Seraikela-Kharsawan",
    "Simdega",
    "West Singhbhum"
  ],
  "chhattisgarh": [
    "Balod",
    "Baloda Bazar",
    "Balrampur-Ramanujganj",
    "Bastar",
    "Bemetara",
    "Bijapur",
    "Bilaspur",
    "Dantewada",
    "Dhamtari",
    "Durg",
    "Gariaband",
    "Janjgir-Champa",
    "Jashpur",
    "Kabirdham",
    "Kanker",
    "Khairagarh-Chhuikhadan-Gandai",
    "Kondagaon",
    "Korba",
    "Korea",
    "Mahasamund",
    "Mohla-Manpur-Ambagarh Chowki",
    "Mungeli",
    "Narayanpur",
    "Raigarh",
    "Raipur",
    "Rajnandgaon",
    "Sakti",
    "Sarangarh-Bilaigarh",
    "Sukma",
    "Surajpur",
    "Surguja"
  ],
  "uttarakhand": [
    "Almora",
    "Bageshwar",
    "Chamoli",
    "Champawat",
    "Dehradun",
    "Haridwar",
    "Nainital",
    "Pauri Garhwal",
    "Pithoragarh",
    "Rudraprayag",
    "Tehri Garhwal",
    "Udham Singh Nagar",
    "Uttarkashi"
  ],
  "himachal_pradesh": [
    "Bilaspur",
    "Chamba",
    "Hamirpur",
    "Kangra",
    "Kinnaur",
    "Kullu",
    "Lahaul and Spiti",
    "Mandi",
    "Shimla",
    "Sirmaur",
    "Solan",
    "Una"
  ],
  "delhi": [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi"
  ],
  "goa": [
    "North Goa",
    "South Goa"
  ],
  "jammu_kashmir": [
    "Anantnag",
    "Bandipora",
    "Baramulla",
    "Budgam",
    "Doda",
    "Ganderbal",
    "Jammu",
    "Kathua",
    "Kishtwar",
    "Kulgam",
    "Kupwara",
    "Poonch",
    "Pulwama",
    "Rajouri",
    "Ramban",
    "Reasi",
    "Samba",
    "Shopian",
    "Srinagar",
    "Udhampur"
  ],
  "andaman_nicobar": [
    "Nicobar",
    "North and Middle Andaman",
    "South Andaman"
  ],
  "puducherry": [
    "Karaikal",
    "Mahe",
    "Puducherry",
    "Yanam"
  ],
  "manipur": [
    "Bishnupur",
    "Chandel",
    "Churachandpur",
    "Imphal East",
    "Imphal West",
    "Jiribam",
    "Kakching",
    "Kamjong",
    "Kangpokpi",
    "Noney",
    "Pherzawl",
    "Senapati",
    "Tamenglong",
    "Tengnoupal",
    "Thoubal",
    "Ukhrul"
  ],
  "meghalaya": [
    "East Garo Hills",
    "East Jaintia Hills",
    "East Khasi Hills",
    "North Garo Hills",
    "Ri-Bhoi",
    "South Garo Hills",
    "South West Garo Hills",
    "South West Khasi Hills",
    "West Garo Hills",
    "West Jaintia Hills",
    "West Khasi Hills"
  ],
  "mizoram": [
    "Aizawl",
    "Champhai",
    "Hnahthial",
    "Khawzawl",
    "Kolasib",
    "Lawngtlai",
    "Lunglei",
    "Mamit",
    "Saitual",
    "Serchhip",
    "Siaha"
  ],
  "nagaland": [
    "Chumoukedima",
    "Dimapur",
    "Kiphire",
    "Kohima",
    "Longleng",
    "Mokokchung",
    "Mon",
    "Niuland",
    "Noklak",
    "Peren",
    "Phek",
    "Shamator",
    "Tseminyu",
    "Tuensang",
    "Wokha",
    "Zunheboto"
  ],
  "sikkim": [
    "Gangtok",
    "Gyalshing",
    "Mangan",
    "Namchi",
    "Pakyong",
    "Soreng"
  ],
  "tripura": [
    "Dhalai",
    "Gomati",
    "Khowai",
    "North Tripura",
    "Sepahijala",
    "South Tripura",
    "Unakoti",
    "West Tripura"
  ],
  "chandigarh": [
    "Chandigarh"
  ],
  "lakshadweep": [
    "Lakshadweep"
  ],
  "dadra_nagar_haveli": [
    "Dadra and Nagar Haveli"
  ],
  "daman_diu": [
    "Daman",
    "Diu"
  ],
  "arunachal_pradesh": [
    "Anjaw",
    "Changlang",
    "Dibang Valley",
    "East Kameng",
    "East Siang",
    "Kamle",
    "Kradaadi",
    "Kurung Kumey",
    "Lepa Rada",
    "Lohit",
    "Longding",
    "Lower Dibang Valley",
    "Lower Siang",
    "Lower Subansiri",
    "Namsai",
    "Pakke Kessang",
    "Papum Pare",
    "Shi Yomi",
    "Siang",
    "Tawang",
    "Tirap",
    "Upper Siang",
    "Upper Subansiri",
    "West Kameng",
    "West Siang"
  ]
};

// ═════════════════════════════════════════════════════════════
// DATABASE EXPORT
// ═════════════════════════════════════════════════════════════

/** Build and return the complete default database */
export function getDefaultDatabase(): CompiledDatabase {
  return {
    states,
    religions,
    casteMap,
    firstNames,
    surnames,
    districts
  };
}
