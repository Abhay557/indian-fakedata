"""
Education Timeline Generator (v2.0.3)

Builds a chronological education history for a profile:
school stages (primary -> middle -> secondary -> higher secondary)
followed by higher education (graduate / postgraduate / diploma / professional).

Determinism: consumes RNG draws appended AFTER all existing generator
draws, so existing profile fields for a given seed stay unchanged.
"""

from datetime import datetime

from indian_fakedata.core.sampler import (
    weighted_sample_from_record, gaussian_sample, bernoulli_sample,
    uniform_sample,
)

# Approximate age at which each education level is completed
COMPLETION_AGE = {
    'illiterate': 0,
    'literate_below_primary': 8,
    'primary': 11,
    'middle': 14,
    'secondary': 16,
    'higher_secondary': 18,
    'graduate': 22,
    'postgraduate': 24,
    'technical_diploma': 21,
    'professional_degree': 25,
}

# Higher secondary streams weighted by eventual field of study
STREAM_BY_FIELD = {
    'Engineering/Technology': 'PCM',
    'Computer Science/IT': 'PCM',
    'Science': 'PCM',
    'Medicine/Health': 'PCB',
    'Agriculture': 'PCB',
    'Commerce/Business': 'Commerce',
    'Management/MBA': 'Commerce',
    'Arts/Humanities': 'Arts',
    'Law': 'Arts',
    'Education/B.Ed': 'Arts',
}

STREAM_FALLBACK = {
    'PCM': 30, 'PCB': 15, 'Commerce': 25, 'Arts': 25, 'Vocational': 5,
}

IIT_MAP = {
    'maharashtra': 'IIT Bombay', 'delhi': 'IIT Delhi', 'tamil_nadu': 'IIT Madras',
    'karnataka': 'IIT Bengaluru', 'uttar_pradesh': 'IIT Kanpur',
    'west_bengal': 'IIT Kharagpur', 'gujarat': 'IIT Gandhinagar', 'bihar': 'IIT Patna',
    'madhya_pradesh': 'IIT Indore', 'odisha': 'IIT Bhubaneswar', 'assam': 'IIT Guwahati',
    'punjab': 'IIT Ropar', 'rajasthan': 'IIT Jodhpur', 'telangana': 'IIT Hyderabad',
    'himachal_pradesh': 'IIT Mandi', 'goa': 'IIT Goa', 'jharkhand': 'IIT (ISM) Dhanbad',
}

STATE_BOARD_MAP = {
    'uttar_pradesh': 'UP Board', 'bihar': 'Bihar School Examination Board',
    'maharashtra': 'Maharashtra State Board', 'tamil_nadu': 'Tamil Nadu State Board',
    'karnataka': 'Karnataka State Board', 'andhra_pradesh': 'AP State Board',
    'telangana': 'Telangana State Board', 'west_bengal': 'West Bengal Board of Secondary Education',
    'kerala': 'Kerala State Board', 'rajasthan': 'Rajasthan Board of Secondary Education',
    'gujarat': 'GSEB Gujarat Board', 'madhya_pradesh': 'MP Board', 'odisha': 'BSE Odisha',
    'punjab': 'PSEB Punjab Board', 'haryana': 'HBSE Haryana Board', 'assam': 'SEBA Assam',
    'jharkhand': 'JAC Jharkhand Board', 'chhattisgarh': 'CGBSE Chhattisgarh Board',
}

# Realistic Indian private school names (mission, chain, mandir, English-medium)
PRIVATE_SCHOOL_POOL = [
    # Christian mission & convent schools
    "St. Xavier's", "St. Joseph's", "St. Mary's", "St. John's", "St. Paul's",
    "St. Anne's", "St. George's", "St. Michael's", "St. Peter's", "St. Teresa's",
    "St. Anthony's", "St. Francis", "St. Patrick's", "St. Stephen's", "St. Agnes",
    "St. Aloysius", "St. Soldier", "St. Vincent", "St. Albert", "St. Bede",
    'Carmel Convent', 'Mount Carmel', 'Sacred Heart', 'Holy Cross', 'Holy Family',
    'Little Flower', 'Infant Jesus', 'Presentation Convent', 'Stella Maris', 'Loyola',
    'Bishop Cotton', 'Cathedral', 'La Martiniere', 'Campion', 'Christ the King',
    'Good Shepherd', 'Immaculate Heart', 'Mary Immaculate', 'Nirmala Convent',
    "St. Joseph's Convent", "St. Mary's Convent",
    # National chains & trust schools
    'Delhi Public School', 'DAV Public School', 'DAV Centenary Public School',
    'Ryan International', 'Kendriya Vidyalaya', 'Army Public School',
    'Navy Children School', 'Air Force School', 'Amity International',
    'Apeejay School', 'Bal Bharati Public School', 'Chinmaya Vidyalaya',
    'Bharatiya Vidya Bhavan', 'Vidya Bharati', 'Ramakrishna Mission',
    'Vivekananda Kendra Vidyalaya', 'City Montessori', 'Springdales',
    'Modern School', 'The Shri Ram School', 'Blue Bells Public School',
    'Birla Vidya Niketan', 'Gitanjali', 'Lakshmipat Singhania',
    'Seth Anandram Jaipuria', 'Presidency School', 'Shiv Nadar School',
    'Aditya Birla Public School', 'Doon Public School', 'Sanskriti School',
    'Tagore International', 'The Heritage School', "Mother's Pride",
    # Saraswati / Vidya Mandir / gurukul-style
    'Saraswati Shishu Mandir', 'Saraswati Vidya Mandir', 'Vidya Mandir',
    'Saraswati Vidyalaya', 'Shishu Niketan', 'Bal Niketan', 'Bal Vidya Mandir',
    'Gyan Bharti', 'Gyandeep Public School', 'Vidya Sagar', 'Gurukul Public School',
    'Shanti Niketan', 'Vidya Niketan', 'Navjeevan Public School',
    'Sunrise Public School', 'Sunshine Public School', 'Greenwood Public School',
    'Green Valley Public School', 'Golden Public School', 'Oxford Public School',
    'Cambridge Public School', 'Mount Litera Zee School',
    # Generic English-medium schools
    'Modern Public School', 'Holy Public School', 'Mother Teresa Public School',
    'Guru Nanak Public School', 'Sant Kabir Public School',
    'Maharaja Agrasen Public School', 'Little Angels', 'Angels Public School',
    'New Era Public School', 'National Public School', 'City Public School',
    'S.D. Public School', 'Vijay Public School', 'Krishna Public School',
    'Satyam International', 'Divine Public School', 'Evergreen Public School',
    'Alpine Public School', 'Radiance Public School', 'Sunbeam School',
    'Bharat Public School', 'Jawahar Navodaya Vidyalaya',
]

# Realistic Indian private college & university names
PRIVATE_COLLEGE_POOL = [
    'SRM Institute of Science and Technology', 'Manipal Institute of Technology',
    'Amity University', 'Christ University', 'Loyola College',
    "St. Stephen's College", 'Hansraj College', 'BITS Pilani', 'VIT Vellore',
    'Symbiosis International University', 'NMIMS University', 'ICFAI University',
    'JSS College of Arts, Science and Commerce', 'RV College of Engineering',
    'M.S. Ramaiah Institute of Technology', 'BMS College of Engineering',
    'PES University', 'Kalinga Institute of Industrial Technology',
    'Lovely Professional University', 'Thapar Institute of Engineering and Technology',
    'Sathyabama Institute of Science and Technology',
    'Saveetha Institute of Medical and Technical Sciences',
    'KLE Technological University', "St. Joseph's College", 'Madras Christian College',
    'Fergusson College', 'Elphinstone College', 'Wilson College',
    "St. Xavier's College", 'Jain University', 'Presidency College',
    'Stella Maris College', 'Mount Carmel College', 'NITTE University',
    'D Y Patil University', 'Shiv Nadar University', 'Ashoka University',
    'OP Jindal Global University', 'Ahmedabad University', 'KJ Somaiya',
    'SIES College', 'Mithibai College', 'Siksha O Anusandhan University',
]

GOVERNMENT_COLLEGE_PREFIXES = [
    'Government College', 'Government Degree College',
    'Government Science College', 'Government Arts and Science College',
    'Government Engineering College', 'Regional Engineering College',
    'Government Post Graduate College',
]


def _stage_sequence(level):
    ordered = [
        'primary', 'middle', 'secondary', 'higher_secondary',
        'graduate', 'postgraduate', 'technical_diploma', 'professional_degree',
    ]
    if level not in ordered:
        return []
    return ordered[:ordered.index(level) + 1]


def _stage_label(level):
    labels = {
        'primary': 'Primary School', 'middle': 'Middle School',
        'secondary': 'Secondary School', 'higher_secondary': 'Higher Secondary School',
        'graduate': "Bachelor's Degree", 'postgraduate': "Master's Degree",
        'technical_diploma': 'Technical Diploma', 'professional_degree': 'Professional Degree',
    }
    return labels.get(level, level.replace('_', ' '))


def _institution_name(level, institution_type, district, state_id, rng):
    is_school = level in ('primary', 'middle', 'secondary', 'higher_secondary')
    if institution_type == 'iit_nit':
        return IIT_MAP.get(state_id, 'NIT %s' % district)
    if institution_type == 'central_university':
        return 'University of %s' % district
    if is_school:
        if institution_type == 'private':
            return '%s, %s' % (uniform_sample(PRIVATE_SCHOOL_POOL, rng), district)
        if institution_type == 'aided':
            return '%s Aided Higher Secondary School' % district
        prefix = {
            'primary': 'Government Primary School', 'middle': 'Government Middle School',
            'secondary': 'Government High School',
            'higher_secondary': 'Government Higher Secondary School',
        }[level]
        return '%s, %s' % (prefix, district)
    # college level
    if institution_type == 'private':
        return '%s, %s' % (uniform_sample(PRIVATE_COLLEGE_POOL, rng), district)
    if institution_type == 'aided':
        return '%s Aided College' % district
    return '%s, %s' % (uniform_sample(GOVERNMENT_COLLEGE_PREFIXES, rng), district)


def _board_or_university(level, institution_type, state_id, rng):
    is_school = level in ('primary', 'middle', 'secondary', 'higher_secondary')
    if not is_school:
        if institution_type in ('iit_nit', 'central_university'):
            return 'University Grants Commission'
        if institution_type == 'private':
            return 'Autonomous University'
        return 'University of %s' % state_id.replace('_', ' ').title()
    if institution_type == 'private':
        return 'CBSE' if rng.next() < 0.75 else 'ICSE'
    return STATE_BOARD_MAP.get(state_id, 'State Board')


def _pick_score(institution_type, rng):
    # govt schools me average thoda kam rehta hai, private/IIT me zyada —
    # ASER report bhi yahi pattern dikhati hai
    mean = 62
    if institution_type == 'iit_nit':
        mean = 85
    elif institution_type == 'central_university':
        mean = 75
    elif institution_type == 'private':
        mean = 68
    elif institution_type == 'government':
        mean = 58
    score = round(gaussian_sample(mean, 10, rng) * 10) / 10
    # 30% se neeche aur 99.5% se upar nahi jana chahiye, clamp lagaya hai
    return '%.1f%%' % max(30, min(99.5, score))


def generate_education_timeline(
    education, age, gender, state_id, district, area_type,
    social_category, institution_type, field_of_study, rng
):
    """Generate the chronological education timeline for a profile."""
    stages = _stage_sequence(education)
    if not stages:
        return []

    current_year = datetime.now().year
    birth_year = current_year - age
    timeline = []
    previous_end = birth_year + 5  # schooling starts around age 6

    for i, level in enumerate(stages):
        completion_age = COMPLETION_AGE[level]
        end_year = birth_year + completion_age
        is_last = i == len(stages) - 1

        status = 'completed'
        if is_last and age < completion_age:
            status = 'in_progress'

        # Dropout probability for non-final stages
        if not is_last and status == 'completed':
            dropout_prob = 0.0
            if area_type == 'rural':
                dropout_prob += 0.04
            if social_category in ('SC', 'ST'):
                dropout_prob += 0.06
            if gender == 'female' and level in ('middle', 'secondary'):
                dropout_prob += 0.03
            if level == 'primary':
                dropout_prob *= 0.3
            if bernoulli_sample(min(dropout_prob, 0.15), rng):
                timeline.append({
                    'level': level,
                    'stageName': _stage_label(level),
                    'institutionName': _institution_name(level, institution_type, district, state_id, rng),
                    'institutionType': institution_type,
                    'boardOrUniversity': _board_or_university(level, institution_type, state_id, rng),
                    'startYear': previous_end,
                    'endYear': min(end_year, current_year),
                    'score': _pick_score(institution_type, rng),
                    'status': 'dropped_out',
                })
                return timeline

        start_year = previous_end

        stage = {
            'level': level,
            'stageName': _stage_label(level),
            'institutionName': _institution_name(level, institution_type, district, state_id, rng),
            'institutionType': institution_type,
            'boardOrUniversity': _board_or_university(level, institution_type, state_id, rng),
            'startYear': start_year,
            'endYear': current_year if status == 'in_progress' else end_year,
            'status': status,
        }

        if level == 'higher_secondary':
            stream = STREAM_BY_FIELD.get(field_of_study)
            if stream is None:
                key, _ = weighted_sample_from_record(STREAM_FALLBACK, rng)
                stream = key
            stage['stream'] = stream

        if level in ('graduate', 'postgraduate', 'technical_diploma', 'professional_degree'):
            stage['fieldOfStudy'] = field_of_study

        if status != 'in_progress':
            stage['score'] = _pick_score(institution_type, rng)

        timeline.append(stage)
        previous_end = end_year

    return timeline
