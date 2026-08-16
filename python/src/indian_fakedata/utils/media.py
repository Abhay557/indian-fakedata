"""
Movie & Anime Preference Generator (v2.0.3)

Generates film viewing preferences correlated with age, gender, area,
education, income, and state (regional cinema is state-driven).

Determinism: consumes RNG draws appended AFTER all existing generator
draws, so existing profile fields for a given seed stay unchanged.
"""

from indian_fakedata.core.sampler import (
    weighted_sample_from_record, bernoulli_sample,
)

# Regional cinema languages by state
STATE_CINEMA_LANGUAGE = {
    'tamil_nadu': 'Tamil', 'kerala': 'Malayalam', 'karnataka': 'Kannada',
    'andhra_pradesh': 'Telugu', 'telangana': 'Telugu', 'west_bengal': 'Bengali',
    'maharashtra': 'Marathi', 'gujarat': 'Gujarati', 'odisha': 'Odia',
    'punjab': 'Punjabi', 'assam': 'Assamese', 'bihar': 'Bhojpuri',
    'uttar_pradesh': 'Bhojpuri', 'jharkhand': 'Bhojpuri', 'goa': 'Konkani',
    'himachal_pradesh': 'Hindi', 'delhi': 'Hindi', 'haryana': 'Hindi',
    'rajasthan': 'Hindi', 'madhya_pradesh': 'Hindi', 'chhattisgarh': 'Hindi',
    'uttarakhand': 'Hindi', 'jammu_kashmir': 'Kashmiri',
}

ANIME_TITLES = [
    'Naruto', 'Dragon Ball Z', 'One Piece', 'Attack on Titan', 'Demon Slayer',
    'Death Note', 'Jujutsu Kaisen', 'Pokémon', 'Haikyuu!!', 'Spy x Family',
    'Chainsaw Man', 'My Hero Academia', 'Tokyo Revengers', 'Bleach',
    'Your Name', 'Spirited Away', 'Weathering With You', 'Suzume',
]

ANIME_GENRES = [
    'Shonen action', 'Slice of life', 'Sports', 'Romance',
    'Supernatural horror', 'Fantasy adventure', 'Mecha', 'Comedy',
]


def _draw_unique(pool, count, rng):
    """Draw `count` unique items from a list, then return the drawn list."""
    drawn = []
    remaining = list(pool)
    for _ in range(count):
        if not remaining:
            break
        idx = int(rng.next() * len(remaining))
        drawn.append(remaining.pop(min(idx, len(remaining) - 1)))
    return drawn


def generate_movie_preferences(
    gender, age, education, area_type, state_id,
    mother_tongue, has_smartphone, income, rng
):
    """Generate movie/anime viewing preferences for a profile."""
    is_youth = age <= 30

    # ── Primary platform ──
    if is_youth and area_type == 'urban' and has_smartphone:
        platform_dist = {'ott': 45, 'youtube': 25, 'theatre': 15, 'television': 10, 'none': 5}
    elif area_type == 'rural':
        platform_dist = {'television': 45, 'youtube': 15, 'theatre': 10, 'ott': 8, 'none': 22}
    else:
        platform_dist = {'television': 30, 'ott': 30, 'youtube': 15, 'theatre': 10, 'none': 15}
    if income < 100000:
        platform_dist['ott'] *= 0.4
    primary_platform, _ = weighted_sample_from_record(platform_dist, rng)

    # ── Watch frequency ──
    freq_dist = {
        'daily': 30 if is_youth else 15,
        'weekly': 40,
        'occasional': 20 if area_type == 'rural' else 25,
        'rare': 15 if area_type == 'rural' else 10,
    }
    watch_frequency, _ = weighted_sample_from_record(freq_dist, rng)

    # ── Favorite languages ──
    languages = []
    regional = STATE_CINEMA_LANGUAGE.get(state_id, mother_tongue)
    if regional and regional not in ('Hindi', 'English') and regional not in languages:
        languages.append(regional)
    if mother_tongue and mother_tongue not in languages:
        languages.append(mother_tongue)
    if area_type == 'urban' and education in ('graduate', 'postgraduate'):
        if rng.next() < 0.8:
            languages.append('English')
        if rng.next() < 0.6:
            languages.append('Hindi')
    elif len(languages) < 2:
        # Hindi reaches almost everywhere through cinema
        if (not languages or languages[0] != 'Hindi') and rng.next() < 0.7:
            languages.append('Hindi')
    if not languages:
        languages.append('Hindi')

    # ── Genres ──
    genre_weights = {
        'Action': 30 if gender == 'male' else 12,
        'Comedy': 22,
        'Romance': 25 if gender == 'female' else 10,
        'Drama': 15,
        'Thriller': 10,
        'Horror': 8 if is_youth else 3,
        'Sci-Fi': 12 if (is_youth and area_type == 'urban') else 4,
        'Historical/Biopic': 15 if age > 40 else 6,
        'Crime': 6,
        'Musical/Dance': 10 if (gender == 'female' and area_type == 'urban') else 3,
        'Animation/Family': 12 if (age > 35 or age < 13) else 4,
    }
    genres = []
    genre_count = 2 + int(rng.next() * 3)  # 2-4 genres
    for _ in range(genre_count):
        if not genre_weights:
            break
        genre, _ = weighted_sample_from_record(genre_weights, rng)
        genres.append(genre)
        del genre_weights[genre]

    # ── Anime ──
    # Anime fandom is concentrated among urban youth with internet access
    anime_base = 0.02
    if is_youth:
        anime_base += 0.10
    if area_type == 'urban':
        anime_base += 0.06
    if has_smartphone:
        anime_base += 0.06
    if education in ('graduate', 'postgraduate'):
        anime_base += 0.03
    if gender == 'male':
        anime_base += 0.02
    anime = bernoulli_sample(min(anime_base, 0.35), rng)

    anime_preferences = None
    favorite_anime_titles = None
    if anime:
        pref_count = 1 + int(rng.next() * 3)
        anime_preferences = _draw_unique(ANIME_GENRES, pref_count, rng)
        title_count = 2 + int(rng.next() * 3)
        favorite_anime_titles = _draw_unique(ANIME_TITLES, title_count, rng)

    return {
        'genres': genres,
        'favoriteLanguages': languages[:3],
        'anime': anime,
        'animePreferences': anime_preferences,
        'favoriteAnimeTitles': favorite_anime_titles,
        'primaryPlatform': primary_platform,
        'watchFrequency': watch_frequency,
    }