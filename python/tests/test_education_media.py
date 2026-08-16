"""
Tests for the v2.0.3 enrichment layer:
education timeline, personality traits, movie/anime preferences,
and the full persona prompt.

Run with:  python -m pytest python/tests -q
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from indian_fakedata import generate, generate_persona

PLATFORMS = ['ott', 'youtube', 'theatre', 'television', 'none']
FREQUENCIES = ['daily', 'weekly', 'occasional', 'rare']
STAGE_ORDER = [
    'primary', 'middle', 'secondary', 'higher_secondary',
    'graduate', 'postgraduate', 'technical_diploma', 'professional_degree',
]


def test_timeline_is_chronological_and_contiguous():
    user = generate(seed=42, constraints={'education': 'graduate'})[0]
    timeline = user['educationTimeline']
    assert len(timeline) > 0
    for i, stage in enumerate(timeline):
        assert stage['startYear'] <= stage['endYear']
        if i > 0:
            assert stage['startYear'] == timeline[i - 1]['endYear']
            assert STAGE_ORDER.index(stage['level']) > STAGE_ORDER.index(timeline[i - 1]['level'])


def test_final_stage_in_progress_for_young_user():
    young = generate(seed=42, constraints={'education': 'primary', 'ageRange': {'min': 5, 'max': 8}})[0]
    last = young['educationTimeline'][-1]
    assert last['status'] == 'in_progress'
    assert last.get('score') is None


def test_completed_stages_have_scores():
    user = generate(seed=7, constraints={'education': 'postgraduate'})[0]
    for stage in user['educationTimeline']:
        if stage['status'] == 'completed':
            assert stage['score'] and stage['score'].endswith('%')


def test_timeline_is_deterministic():
    a = generate(seed='011')[0]['educationTimeline']
    b = generate(seed='011')[0]['educationTimeline']
    assert a == b


def test_personality_traits_shape_and_determinism():
    a = generate(seed='011')[0]
    b = generate(seed='011')[0]
    traits = a['personalityTraits']
    assert len(traits['traitLabels']) == 5
    assert len(traits['strengths']) == 3
    assert len(traits['weaknesses']) == 3
    assert len(traits['summary']) > 20
    assert traits['socialBehavior'] in ('outgoing', 'introverted', 'ambivert')
    assert traits == b['personalityTraits']


def test_movie_preferences_shape():
    user = generate(seed=42)[0]
    movies = user['moviePreferences']
    assert 2 <= len(movies['genres']) <= 4
    assert len(movies['favoriteLanguages']) > 0
    assert movies['primaryPlatform'] in PLATFORMS
    assert movies['watchFrequency'] in FREQUENCIES


def test_regional_cinema_language():
    user = generate(seed=7, constraints={'state': 'Kerala'})[0]
    assert 'Malayalam' in user['moviePreferences']['favoriteLanguages']


def test_anime_fields_only_when_fan():
    user = generate(seed=42)[0]
    movies = user['moviePreferences']
    if movies['anime']:
        assert movies['animePreferences']
        assert movies['favoriteAnimeTitles']
    else:
        assert movies['animePreferences'] is None
        assert movies['favoriteAnimeTitles'] is None


def test_movie_preferences_deterministic():
    a = generate(seed='011')[0]['moviePreferences']
    b = generate(seed='011')[0]['moviePreferences']
    assert a == b


def test_full_prompt_contains_sections_and_identity():
    out = generate_persona(seed=42)
    user = out['user']
    prompt = out['persona']['fullPrompt']
    assert len(prompt) > 1000
    for section in ('IDENTITY', 'EDUCATION', 'PERSONALITY',
                    'INTERESTS & PREFERENCES', 'HOW TO SPEAK & BEHAVE'):
        assert section in prompt
    assert f"{user['firstName']} {user['lastName']}" in prompt
    assert user['state'] in prompt
    assert user['district'] in prompt


def test_full_prompt_deterministic():
    a = generate_persona(seed='011')['persona']['fullPrompt']
    b = generate_persona(seed='011')['persona']['fullPrompt']
    assert a == b