"""
Cultural Profile Generator

Generates community-level cultural traits based on well-documented
sociological patterns in Indian society. These are NOT stereotypes
applied to individuals — they are community-level statistical tendencies
that influence (but don't determine) individual profiles.

Sources:
- MSME Census 2015-16, Timberg "The Marwaris", Falzon "Cosmopolitan Connections"
- Indian Army records, AISHE, Census 2011 D-series, RBI remittance data
"""

from indian_fakedata.core.sampler import weighted_sample_from_record, gaussian_sample


# Trait index mapping
TRAIT_IDX = {
    'entrepreneurial': 0, 'academic': 1, 'artistic': 2, 'military': 3,
    'agricultural': 4, 'artisan':5, 'bureaucratic': 6, 'socialActivism': 7,
    'communityBonding': 8, 'migrationTendency': 9, 'savingsOrientation': 10,
    'riskAppetite': 11,
}

# Community trait profiles: [entrepreneurial, academic, artistic, military, agricultural,
#                             artisan, bureaucratic, socialActivism, communityBonding,
#                             migrationTendency, savingsOrientation, riskAppetite]
COMMUNITY_TRAITS = {
    'brahmin': [35,85,60,20,15,15,70,40,55,45,55,30], 'brahmin_rj': [40,80,55,20,15,15,65,35,55,40,60,30],
    'brahmin_hr': [35,80,50,25,20,15,70,35,55,40,55,30], 'brahmin_mp': [30,75,55,20,20,15,65,35,55,35,50,25],
    'brahmin_od': [30,80,60,15,20,15,70,40,55,40,50,25], 'brahmin_ap': [35,80,55,15,15,10,65,35,55,45,55,30],
    'brahmin_tg': [35,80,55,15,15,10,65,35,55,45,55,30], 'brahmin_cg': [30,75,50,15,25,15,60,35,50,30,50,25],
    'brahmin_uk': [30,80,55,30,25,15,70,35,60,40,50,25], 'brahmin_dl': [45,80,55,15,10,10,70,35,50,35,55,35],
    'brahmin_jh': [30,75,50,15,20,15,65,35,55,35,50,25], 'brahmin_br': [35,82,55,15,20,10,75,35,55,40,55,25],
    'brahmin_as': [30,78,60,15,20,10,65,35,55,35,50,25], 'brahmin_bengali': [30,88,80,10,10,15,65,50,60,40,45,25],
    'brahmin_deshastha': [35,78,55,25,20,15,65,40,55,35,55,30], 'brahmin_chitpavan': [50,85,55,30,15,10,70,50,55,45,60,40],
    'brahmin_saraswat': [50,82,60,15,10,10,65,35,55,50,60,40], 'brahmin_gj': [55,78,50,15,15,10,60,30,55,40,65,40],
    'brahmin_havyaka': [40,80,55,15,25,15,60,30,60,35,55,30], 'brahmin_smartha': [35,82,60,15,15,10,65,35,55,40,55,30],
    'brahmin_madhwa': [40,80,55,15,15,10,65,35,55,40,55,30], 'bhumihar': [30,72,40,35,45,10,60,30,60,30,50,25],
    'bhumihar_br': [30,72,40,35,50,10,60,30,60,25,50,25],
    'iyer': [35,92,65,10,10,10,70,35,55,55,55,25], 'iyengar': [35,90,65,10,10,10,70,35,55,55,55,25],
    'namboodiri': [25,85,70,10,20,10,60,30,65,25,50,20],
    'rajput': [25,45,40,85,40,10,40,25,65,30,35,30], 'rajput_thakur': [25,45,40,85,40,10,40,25,65,30,35,30],
    'rajput_rj': [25,40,45,90,35,10,35,20,70,25,35,25], 'rajput_hr': [25,45,35,85,40,10,40,25,65,30,35,30],
    'rajput_mp': [25,42,40,82,40,10,40,25,65,30,35,28], 'rajput_br': [25,45,35,80,45,10,45,25,65,30,35,25],
    'rajput_dl': [30,50,35,75,20,10,50,25,55,35,40,30], 'rajput_jh': [25,42,35,78,45,10,40,25,65,30,35,25],
    'rajput_cg': [25,40,35,78,50,10,40,25,65,25,35,25], 'rajput_uk': [25,50,40,85,35,10,45,25,65,35,35,25],
    'darbar': [30,45,40,80,35,10,40,25,65,30,40,30],
    'vaishya': [85,55,30,10,10,20,35,20,70,55,85,70], 'vaishya_baniya': [88,55,30,10,10,20,35,20,70,55,88,72],
    'vaishya_hr': [85,55,30,10,10,20,40,20,70,50,85,70], 'baniya_dl': [90,60,30,10,5,15,40,20,65,50,90,75],
    'bania_gj': [92,55,30,10,10,20,30,15,75,60,90,75], 'mahajan': [90,55,35,10,10,15,35,20,70,55,88,72],
    'kayastha': [40,82,70,15,10,10,80,40,50,45,55,35], 'kayastha_wb': [35,85,80,10,10,10,75,50,55,40,50,30],
    'kayastha_br': [40,80,65,15,10,10,80,40,55,45,55,30],
    'maratha': [35,50,40,75,55,15,45,45,65,30,40,35], 'ckp': [40,75,55,25,10,10,70,40,50,45,55,35],
    'patel': [80,55,30,15,55,15,30,25,75,60,80,65],
    'nair': [40,78,60,45,20,10,65,40,55,45,55,35], 'menon': [40,80,60,40,15,10,70,40,55,50,55,35],
    'khatri': [75,60,35,30,15,15,50,25,60,55,70,60], 'arora': [78,55,35,25,10,20,45,20,60,60,75,65],
    'bunt': [45,60,40,35,45,10,40,30,60,35,50,40], 'mudaliar': [40,65,40,25,35,10,50,35,55,40,50,35],
    'vokkaliga': [40,55,40,30,60,15,45,35,65,25,50,35], 'lingayat': [50,60,45,25,50,20,50,35,70,30,55,40],
    'reddy': [55,55,35,25,60,10,55,40,65,35,55,45], 'reddy_tg': [55,55,35,25,55,10,60,40,65,35,55,45],
    'kamma': [60,60,35,20,55,10,45,35,60,40,60,50], 'kamma_tg': [60,60,35,20,50,10,50,35,60,40,60,50],
    'velama': [40,55,35,30,55,10,50,35,60,30,50,35], 'velama_tg': [40,55,35,30,55,10,50,35,60,30,50,35],
    'kapu': [35,45,30,25,65,10,35,35,60,30,40,30], 'ezhava': [55,60,50,20,35,25,30,55,65,45,50,40],
    'khandayat': [30,50,40,50,55,10,45,30,60,25,40,30],
    'baidya': [35,85,60,10,10,10,60,45,55,40,50,30], 'mahishya': [30,55,45,15,55,15,35,35,60,30,40,25],
    'yadav': [25,35,25,40,75,15,25,40,70,40,30,20], 'yadav_br': [25,35,25,35,80,15,30,45,70,45,30,20],
    'yadav_mp': [25,35,25,35,75,15,25,35,65,35,30,20], 'yadav_dl': [30,40,25,30,40,15,35,40,60,30,35,25],
    'yadav_ap': [25,35,25,30,70,15,25,35,65,30,30,20], 'yadav_jh': [25,35,25,35,75,15,25,35,65,40,30,20],
    'jat': [35,40,25,70,80,10,30,35,70,30,40,30], 'jat_rj': [30,35,25,65,85,10,25,30,75,25,40,25],
    'jat_hr': [35,40,25,75,85,10,30,35,75,25,40,30], 'jat_pb': [35,40,25,70,80,10,30,30,70,30,40,30],
    'jat_dl': [40,45,25,60,50,10,40,35,60,30,45,35],
    'gujjar': [25,30,20,55,70,10,20,30,70,25,30,20], 'gujjar_rj': [25,28,20,55,75,10,20,30,70,25,30,20],
    'gujjar_dl': [30,35,20,50,50,10,25,30,65,30,35,25], 'gujjar_jk': [25,30,20,55,70,10,20,25,75,25,30,20],
    'kurmi': [30,35,25,20,75,10,25,30,60,30,35,25], 'kurmi_br': [30,35,25,20,80,10,25,30,60,35,35,20],
    'kurmi_mp': [25,30,25,20,75,10,25,25,60,25,35,20], 'kurmi_jh': [25,30,25,20,75,10,25,30,60,30,35,20],
    'kurmi_cg': [25,30,25,20,75,10,25,25,60,25,35,20],
    'kushwaha': [30,35,25,25,70,15,30,35,60,35,35,25], 'koeri_br': [30,35,25,20,75,15,30,35,60,35,35,25],
    'lodh': [25,30,25,20,70,10,25,25,55,25,30,20], 'lodhi_mp': [25,30,25,20,70,10,25,25,55,25,30,20],
    'koli': [30,30,25,30,65,20,20,30,60,40,30,25],
    'chettiar': [80,55,30,10,15,15,30,30,65,50,80,65], 'nadar': [75,60,35,15,20,20,35,45,70,45,75,60],
    'gounder': [55,50,30,20,60,20,30,30,65,30,60,45], 'thevar': [30,40,35,65,50,10,30,40,70,25,35,30],
    'vanniyar': [30,40,30,40,55,15,30,40,65,30,35,25], 'pillai': [45,60,45,25,40,15,50,35,55,40,50,35],
    'kunbi': [30,35,30,25,70,15,25,30,60,25,35,25], 'mali': [30,35,30,15,65,25,20,30,55,25,35,25],
    'mali_rj': [30,35,30,15,65,25,20,25,55,25,35,25], 'dhangar': [20,30,25,20,70,15,15,25,65,20,30,20],
    'teli': [40,30,25,10,30,35,20,25,55,30,45,30], 'teli_mp': [35,30,25,10,35,35,20,25,55,25,40,25],
    'teli_od': [35,30,25,10,35,35,20,25,55,25,40,25], 'teli_jh': [35,30,25,10,35,35,20,25,55,30,40,25],
    'teli_cg': [35,30,25,10,35,35,20,25,55,25,40,25],
    'agri': [25,30,25,20,65,15,15,25,55,20,30,20], 'rabari': [30,25,30,20,60,20,10,20,75,25,35,25],
    'ahir': [25,30,25,25,70,15,20,25,60,30,30,20], 'saini': [30,40,25,35,60,15,25,25,55,25,35,25],
    'saini_hr': [30,40,25,35,60,15,25,25,55,25,35,25], 'labana': [35,35,25,30,50,20,20,25,55,35,40,30],
    'ror': [30,40,25,40,65,10,30,25,55,25,35,25], 'kumhar': [25,25,45,10,35,70,10,25,60,25,30,20],
    'vishwakarma': [30,30,40,10,15,80,10,25,60,30,35,25], 'sahu': [40,35,30,15,55,25,20,25,55,30,45,30],
    'khas': [25,40,30,30,55,15,25,25,55,30,35,25],
    'koch_rajbongshi': [25,35,40,30,60,15,25,30,65,20,30,20], 'ahom': [25,45,50,40,50,15,35,35,65,20,35,25],
    'kalita': [30,55,45,20,50,10,40,30,55,25,40,25],
    'mudiraj': [30,35,30,30,55,20,25,30,60,25,35,25], 'munnuru_kapu': [35,40,30,20,60,15,30,30,60,30,40,30],
    'padmashali': [40,35,35,10,20,70,15,25,65,30,45,30], 'balija': [45,40,30,15,30,30,25,30,55,35,45,35],
    'chasa': [25,30,25,15,75,10,15,25,55,20,30,20], 'karana': [35,70,50,15,15,10,75,35,50,35,50,30],
    'sadgop': [30,40,35,15,65,15,25,30,55,25,35,25],
    'kuruba': [25,30,25,20,65,15,15,25,60,20,30,20], 'billava': [30,40,35,20,50,25,20,35,60,30,35,25],
    'idiga': [30,30,25,15,50,30,15,25,55,25,30,25],
    # SC castes
    'chamar': [20,30,30,15,30,50,15,60,65,50,25,15], 'chamar_mp': [20,28,25,15,35,50,15,55,65,45,25,15],
    'chamar_hr': [20,30,25,15,30,50,15,60,65,45,25,15], 'chamar_rj': [20,28,25,15,35,50,15,55,60,40,25,15],
    'chamar_br': [20,30,25,15,30,50,15,60,65,50,25,15], 'chamar_dl': [25,35,25,15,15,45,20,65,60,35,30,20],
    'chamar_jh': [20,28,25,15,35,50,15,55,60,45,25,15], 'chamar_cg': [20,25,25,15,40,50,15,50,60,35,25,15],
    'dhobi': [20,25,20,10,20,55,10,45,60,40,20,15], 'dhobi_m': [20,25,20,10,15,55,10,40,60,40,20,15],
    'pasi': [20,28,25,15,35,35,10,50,60,45,20,15], 'balmiki': [15,25,20,10,15,30,10,55,65,45,20,10],
    'balmiki_pb': [15,25,20,10,15,30,10,55,65,40,20,10], 'balmiki_hr': [15,25,20,10,15,30,10,55,65,40,20,10],
    'balmiki_mp': [15,25,20,10,15,30,10,50,65,35,20,10], 'kori': [20,25,25,10,25,50,10,45,60,40,20,15],
    'mahar': [25,40,35,15,30,30,20,75,65,40,25,20], 'matang': [20,30,30,10,25,35,10,60,65,35,20,15],
    'chambhar': [25,30,30,10,20,60,10,55,60,35,25,15],
    'paraiyar': [20,30,30,10,35,30,10,65,65,35,20,15], 'pallar': [20,35,30,15,40,25,10,65,65,30,25,15],
    'arunthathiyar': [15,25,25,10,35,35,10,55,65,30,20,10],
    'pulaya': [20,35,35,10,40,25,10,60,65,35,20,15], 'cheruman': [15,25,25,10,45,20,10,50,65,30,20,10],
    'paravan': [20,30,30,10,35,30,10,55,60,35,20,15],
    'pod': [20,30,25,10,35,30,10,45,55,35,20,15], 'rajbanshi': [20,30,25,15,55,15,10,40,60,35,20,15],
    'namasudra': [20,35,30,10,50,20,10,55,65,40,20,15], 'namasudra_as': [20,35,30,10,50,20,10,50,60,35,20,15],
    'bagdi': [20,25,25,10,45,25,10,40,55,35,20,15],
    'madiga': [20,30,30,10,35,40,10,60,65,35,20,15], 'madiga_ap': [20,30,30,10,35,40,10,60,65,35,20,15],
    'madiga_tg': [20,30,30,10,35,40,10,60,65,35,20,15], 'holeya': [20,30,30,10,35,35,10,55,65,30,20,15],
    'mala': [20,35,35,10,35,30,10,60,65,35,25,15], 'mala_tg': [20,35,35,10,35,30,10,60,65,35,25,15],
    'pana': [20,25,25,10,40,30,10,50,60,30,20,15], 'dhoba': [20,25,25,10,30,45,10,45,55,30,20,15],
    'kaibarta': [20,30,25,10,50,30,10,40,55,30,20,15],
    'meghwal': [20,30,25,10,30,55,10,55,65,35,25,15], 'bairwa': [20,25,25,10,40,30,10,50,60,30,20,15],
    'dhanak': [20,25,20,10,30,45,10,50,60,35,20,15], 'musahar': [15,20,20,10,50,20,10,45,65,45,15,10],
    'dusadh': [20,30,25,15,40,25,10,55,65,45,20,15], 'dusadh_jh': [20,28,25,15,45,25,10,50,60,40,20,15],
    'dom': [15,20,30,10,20,40,10,45,60,40,15,10], 'dom_uk': [15,25,25,10,25,40,10,45,60,35,15,10],
    'ad_dharmi': [20,30,25,15,30,35,10,60,65,40,20,15], 'mazbi': [20,25,20,40,25,30,10,50,65,35,20,15],
    'ramdasia': [25,35,30,15,25,45,15,55,65,35,25,15], 'dalit_gj': [25,30,25,10,30,45,15,55,60,40,25,15],
    # ST castes
    'bhil': [15,20,35,30,60,25,10,30,80,20,15,10], 'bhil_rj': [15,20,35,30,60,25,10,30,80,20,15,10],
    'bhil_mh': [15,20,35,25,60,25,10,30,80,25,15,10], 'bhil_mp': [15,20,35,25,60,25,10,30,80,20,15,10],
    'bhil_gj': [15,20,35,25,60,25,10,30,80,25,15,10],
    'gond': [15,20,35,25,65,30,10,35,80,15,15,10], 'gond_mp': [15,20,35,25,65,30,10,35,80,15,15,10],
    'gond_mh': [15,20,35,25,65,30,10,35,80,20,15,10], 'gond_cg': [15,20,35,25,65,30,10,35,80,15,15,10],
    'gond_od': [15,20,35,25,65,30,10,35,80,15,15,10], 'gond_tg': [15,20,35,25,65,30,10,35,80,15,15,10],
    'mina': [20,30,30,35,55,20,20,30,75,20,20,15], 'meena_rj': [20,35,30,35,55,20,25,30,75,20,25,15],
    'santhal': [15,20,40,20,60,30,10,40,85,30,15,10], 'santhal_wb': [15,22,40,20,60,30,10,40,85,30,15,10],
    'santhal_od': [15,20,40,20,60,30,10,40,85,25,15,10], 'santhal_br': [15,20,40,20,60,30,10,35,85,30,15,10],
    'santhal_jh': [15,22,40,20,60,30,10,40,85,30,15,10],
    'oraon': [15,25,35,20,55,25,10,40,80,30,15,10], 'oraon_wb': [15,25,35,20,55,25,10,40,80,30,15,10],
    'oraon_jh': [15,25,35,20,55,25,10,40,80,30,15,10], 'oraon_cg': [15,25,35,20,55,25,10,40,80,25,15,10],
    'munda_wb': [15,25,35,25,55,25,10,40,80,30,15,10], 'munda_jh': [15,25,35,25,55,25,10,40,80,30,15,10],
    'ho': [15,22,35,20,55,25,10,35,80,25,15,10], 'kharia': [15,20,35,20,55,25,10,35,80,25,15,10],
    'warli': [15,18,45,15,55,35,10,30,85,20,15,10], 'kokna': [15,18,35,15,60,25,10,25,80,20,15,10],
    'irular': [15,18,30,10,55,20,10,30,80,20,15,10], 'toda': [10,20,45,10,55,35,5,25,85,10,10,10],
    'soliga': [10,18,35,10,60,25,5,25,85,15,10,10], 'yerava': [10,18,30,10,60,25,5,25,85,15,10,10],
    'paniya': [10,15,30,10,60,20,5,25,85,15,10,10], 'kurichiya': [15,25,35,25,55,20,10,30,80,15,15,10],
    'bodo': [15,30,40,30,50,20,10,45,80,20,15,10], 'miri': [15,25,35,20,55,20,10,30,80,20,15,10],
    'karbi': [15,25,35,20,55,20,10,30,80,15,15,10], 'dimasa': [15,25,35,20,55,20,10,30,80,15,15,10],
    'tharu': [15,20,30,15,65,20,10,25,75,20,15,10], 'tharu_br': [15,20,30,15,65,20,10,25,75,25,15,10],
    'tharu_uk': [15,20,30,15,65,20,10,25,75,20,15,10], 'bhotia': [20,30,40,20,40,35,10,25,75,20,20,15],
    'kandha': [15,20,35,20,60,25,10,35,80,20,15,10], 'sabar': [10,15,30,15,60,20,5,30,85,15,10,10],
    'lambadi': [25,25,40,20,45,30,10,35,75,50,25,20], 'lambadi_tg': [25,25,40,20,45,30,10,35,75,45,25,20],
    'yerukala': [20,20,35,15,40,30,10,30,70,40,20,15], 'garasia': [15,18,30,15,60,25,5,25,80,15,15,10],
    'rathwa': [15,18,30,15,60,25,10,25,80,20,15,10], 'dhodia': [15,20,30,15,60,25,10,25,80,20,15,10],
    'baiga': [10,15,40,10,55,20,5,25,85,10,10,10], 'saharia': [10,15,30,10,55,20,5,30,80,15,10,10],
    'kanwar': [15,20,30,20,60,25,10,25,80,15,15,10], 'halba': [15,20,30,15,60,25,10,25,80,15,15,10],
    # Muslim communities
    'syed': [30,70,55,30,15,10,55,35,75,35,45,30], 'syed_wb': [30,70,60,25,15,10,55,40,75,30,45,25],
    'syed_jk': [25,65,55,30,20,10,50,40,80,25,40,25], 'sheikh': [50,40,35,20,25,30,25,25,70,40,45,35],
    'sheikh_wb': [40,35,35,15,40,25,20,30,70,35,35,25], 'sheikh_kl': [45,45,35,15,20,25,25,30,70,40,45,30],
    'sheikh_jk': [40,50,50,20,25,30,30,35,80,20,40,25], 'pathan': [35,35,30,70,25,15,30,25,75,35,35,30],
    'pathan_wb': [30,35,30,60,30,15,25,25,70,35,35,25], 'mughal': [45,50,55,40,15,15,45,25,65,35,45,35],
    'ansari': [35,25,35,10,15,80,10,30,70,40,35,25], 'ansari_wb': [30,25,35,10,20,75,10,30,70,35,30,20],
    'qureshi': [40,25,25,15,15,55,10,25,70,40,40,30], 'qureshi_wb': [35,25,25,10,20,55,10,25,70,35,35,25],
    'mansuri': [40,25,30,10,15,65,10,25,65,35,40,30], 'idrisi': [35,30,25,10,15,50,15,25,60,30,35,25],
    'saifi': [35,25,25,10,15,60,10,25,65,35,35,25], 'faqir': [15,20,30,10,30,25,10,35,75,30,15,10],
    'julaha': [30,25,35,10,15,75,10,30,70,35,30,20], 'halalkhor': [15,20,20,10,20,30,10,40,70,35,15,10],
    'mappila': [50,45,40,20,25,25,20,35,75,55,50,40], 'thangal': [30,65,45,15,15,10,45,35,80,30,45,25],
    'rawther': [45,40,35,20,25,30,20,30,70,45,45,35], 'ossain': [30,25,25,10,30,45,10,25,65,30,30,20],
    'mir': [30,50,55,25,25,30,35,35,80,20,35,25], 'bhat': [25,55,50,20,20,25,40,30,80,20,35,20],
    'dar': [30,45,45,20,30,30,30,35,80,20,35,25], 'lone': [25,35,35,25,40,25,20,30,80,20,30,20],
    'wani': [50,40,35,10,20,25,20,25,75,25,55,40], 'bakerwal': [15,15,25,25,55,20,5,20,80,25,15,10],
    # Christian communities
    'roman_catholic': [35,55,50,15,25,15,35,40,65,45,40,30], 'protestant': [30,55,45,15,30,15,30,45,60,40,35,25],
    'syro_malabar': [45,65,45,10,20,10,40,35,70,55,50,35], 'syro_malabar_kl': [50,68,50,10,20,10,40,35,70,55,55,40],
    'malankara': [40,65,50,10,20,10,40,35,70,50,50,35], 'malankara_kl': [45,68,50,10,20,10,40,35,70,50,55,40],
    'csi': [30,55,45,15,30,15,35,45,60,40,35,25], 'csi_kl': [35,60,50,15,25,15,35,45,65,45,40,30],
    'dalit_christian': [20,35,30,10,35,25,15,55,65,40,20,15], 'dalit_chr_kl': [25,40,35,10,30,25,15,55,65,45,25,20],
    'tribal_christian': [15,25,40,20,50,25,10,40,80,25,15,10], 'jacobite': [40,60,50,10,20,10,35,35,70,50,45,35],
    'latin_catholic': [30,45,45,15,35,20,25,40,65,45,30,25], 'marthomite': [40,65,45,10,15,10,45,40,65,50,50,35],
    'pentecostal_kl': [30,40,35,10,25,15,20,50,70,40,30,20], 'roman_catholic_goa': [35,55,60,10,20,15,35,35,60,45,40,30],
    'protestant_goa': [30,55,50,10,25,15,30,40,55,40,35,25], 'bahujan_chr': [20,35,35,10,35,25,15,50,60,35,20,15],
    # Sikh communities
    'jat_sikh': [40,40,30,75,70,10,25,30,75,40,40,35], 'ramgarhia': [50,40,30,30,20,55,20,30,70,50,50,40],
    'khatri_sikh': [70,60,35,30,15,15,45,25,65,55,65,55],
    # Jain communities
    'jain_shwetambar': [92,55,40,5,5,10,25,30,85,60,92,75], 'jain_digambar': [88,60,40,5,10,10,25,30,85,55,90,70],
    # Buddhist communities
    'neo_buddhist': [25,45,35,15,25,30,20,80,70,35,25,15],
    # NE India Tribal
    'naga': [20,35,45,50,50,30,15,40,85,15,15,10], 'mizo': [20,40,50,35,40,25,15,35,85,20,20,10],
    'khasi': [25,45,50,25,45,30,15,40,85,20,20,15], 'garo': [20,35,45,25,50,30,10,35,85,20,15,10],
    # Newly mapped regional communities
    'ghirath': [30,40,25,35,75,15,20,25,65,25,40,25], 'rai_sk': [20,30,40,60,60,25,15,30,80,20,25,15],
    'limbu_sk': [20,30,40,60,60,25,15,30,80,20,25,15], 'tamang_sk': [20,30,40,60,60,25,15,30,80,20,25,15],
    'newar_sk': [65,55,50,15,20,30,35,30,70,35,60,45], 'bhandari': [50,45,30,20,40,20,25,30,65,35,45,35],
    'pandit_jk': [35,90,60,15,10,15,75,35,60,60,60,30],
}

# Religion-level defaults
RELIGION_DEFAULTS = {
    'hindu': [35,50,40,25,45,25,35,30,55,35,40,30],
    'muslim': [40,35,35,20,25,40,20,30,70,40,40,30],
    'christian': [30,50,45,15,30,15,30,40,60,45,35,25],
    'sikh': [50,45,30,65,55,20,25,30,75,40,45,35],
    'buddhist': [25,45,35,15,25,30,20,75,65,35,25,15],
    'jain': [90,55,35,5,5,10,25,30,85,55,90,70],
}


def _get_baseline(caste_id, religion_id, state_id):
    """Get community trait baseline with cascading fallback."""
    if caste_id in COMMUNITY_TRAITS:
        return list(COMMUNITY_TRAITS[caste_id])

    if '_' in caste_id:
        base = caste_id.split('_')[0]
        if base in COMMUNITY_TRAITS:
            return list(COMMUNITY_TRAITS[base])

    base = list(RELIGION_DEFAULTS.get(religion_id, [40,40,40,25,40,25,30,30,55,35,40,30]))

    if state_id == 'gujarat':
        base[TRAIT_IDX['entrepreneurial']] += 15; base[TRAIT_IDX['savingsOrientation']] += 10; base[TRAIT_IDX['riskAppetite']] += 10
    if state_id in ('bihar', 'uttar_pradesh'):
        base[TRAIT_IDX['migrationTendency']] += 15
    if state_id == 'kerala':
        base[TRAIT_IDX['academic']] += 10; base[TRAIT_IDX['migrationTendency']] += 15
    if state_id in ('punjab', 'haryana'):
        base[TRAIT_IDX['military']] += 15; base[TRAIT_IDX['agricultural']] += 10
    if state_id == 'west_bengal':
        base[TRAIT_IDX['artistic']] += 15; base[TRAIT_IDX['academic']] += 10
    if state_id == 'rajasthan':
        base[TRAIT_IDX['entrepreneurial']] += 10; base[TRAIT_IDX['military']] += 10; base[TRAIT_IDX['migrationTendency']] += 10

    return base


def _determine_career_preference(traits, education, gender, rng):
    """Determine career preference from trait scores."""
    dist = {
        'business_trade': traits[0],
        'government_service': traits[6] + (15 if education in ('graduate', 'postgraduate') else 0),
        'professional': traits[1] * 0.5 + (30 if education == 'professional_degree' else 0),
        'agriculture': traits[4],
        'military_police': traits[3] + (5 if gender == 'male' else 0),
        'artisan_craft': traits[5],
        'tech_it': traits[1] * 0.3 + (20 if education in ('graduate', 'postgraduate', 'technical_diploma') else 0),
        'medicine': (15 if education == 'professional_degree' else 0) + traits[1] * 0.2,
        'teaching': traits[1] * 0.3 + (10 if gender == 'female' else 0),
        'labor': max(10, 60 - traits[0] - traits[1] * 0.5),
    }
    key, _ = weighted_sample_from_record(dist, rng)
    return key


def _determine_family_structure(religion_id, state_id, area_type, income, rng):
    """Determine family structure."""
    dist = {'joint_family': 30, 'nuclear_family': 50, 'extended_family': 20}

    if area_type == 'rural': dist['joint_family'] += 15
    north = ['uttar_pradesh', 'bihar', 'rajasthan', 'haryana', 'punjab', 'madhya_pradesh', 'gujarat']
    if state_id in north: dist['joint_family'] += 10
    south = ['kerala', 'tamil_nadu', 'karnataka']
    if state_id in south: dist['nuclear_family'] += 15
    if religion_id in ('muslim', 'jain'): dist['joint_family'] += 10
    if income > 500000: dist['joint_family'] += 5

    key, _ = weighted_sample_from_record(dist, rng)
    return key


def generate_cultural_profile(caste_id, religion_id, state_id, social_category, education, area_type, gender, age, income, rng):
    """Generate a complete cultural profile based on community identity."""
    # COMMUNITY_TRAITS me har caste ka 12-dim baseline vector hai (haath se
    # tune kiya hai). yaha baseline pe context ke hisab se nudge karte hain —
    # education, urban/rural, gender sab effect dalte hain.
    baseline = _get_baseline(caste_id, religion_id, state_id)
    stddev = 12
    high_edu = ['graduate', 'postgraduate', 'professional_degree']

    raw = []
    for idx, mean in enumerate(baseline):
        adjusted = mean

        if education in high_edu:
            if idx == TRAIT_IDX['academic']: adjusted += 8
            if idx == TRAIT_IDX['bureaucratic']: adjusted += 5
            if idx == TRAIT_IDX['agricultural']: adjusted -= 5
            if idx == TRAIT_IDX['savingsOrientation']: adjusted += 5
        if education == 'illiterate':
            if idx == TRAIT_IDX['academic']: adjusted -= 10
            if idx == TRAIT_IDX['entrepreneurial']: adjusted -= 5

        if area_type == 'urban':
            if idx == TRAIT_IDX['entrepreneurial']: adjusted += 8
            if idx == TRAIT_IDX['agricultural']: adjusted -= 15
            if idx == TRAIT_IDX['migrationTendency']: adjusted += 5

        if income > 500000:
            if idx == TRAIT_IDX['entrepreneurial']: adjusted += 5
            if idx == TRAIT_IDX['savingsOrientation']: adjusted += 8
            if idx == TRAIT_IDX['riskAppetite']: adjusted += 5

        if age < 30:
            if idx == TRAIT_IDX['riskAppetite']: adjusted += 5
            if idx == TRAIT_IDX['migrationTendency']: adjusted += 5
        elif age > 50:
            if idx == TRAIT_IDX['communityBonding']: adjusted += 5
            if idx == TRAIT_IDX['riskAppetite']: adjusted -= 5

        if gender == 'female' and social_category in ('SC', 'ST'):
            if idx == TRAIT_IDX['socialActivism']: adjusted += 5

        raw.append(round(max(1, min(100, gaussian_sample(adjusted, stddev, rng)))))

    career_preference = _determine_career_preference(raw, education, gender, rng)
    family_structure = _determine_family_structure(religion_id, state_id, area_type, income, rng)

    return {
        "entrepreneurialScore": raw[0],
        "academicOrientation": raw[1],
        "artisticInclination": raw[2],
        "militaryTradition": raw[3],
        "agriculturalRootedness": raw[4],
        "artisanTradition": raw[5],
        "bureaucraticOrientation": raw[6],
        "socialActivism": raw[7],
        "communityBonding": raw[8],
        "migrationTendency": raw[9],
        "careerPreference": career_preference,
        "familyStructure": family_structure,
        "savingsOrientation": raw[10],
        "riskAppetite": raw[11],
    }
