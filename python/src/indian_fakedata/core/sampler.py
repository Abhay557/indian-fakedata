"""
Core Sampler Module

Provides seeded PRNG, weighted random sampling, and
statistical distribution generators (Box-Muller, LogNormal).
All operations use FP32-level precision.
"""

import math
import time
import random

def normalize_seed(seed):
    """
    Converts a numeric or string seed into a stable 32-bit uint32.
    String seeds (e.g. "011") are hashed with FNV-1a so the same
    string always reproduces the same person/family.
    """
    if seed is None:
        return (int(time.time() * 1000) ^ random.randint(0, 0xFFFFFFFF)) & 0xFFFFFFFF
    if isinstance(seed, (int, float)):
        return int(seed) & 0xFFFFFFFF
    # FNV-1a 32-bit hash for strings
    hash_val = 0x811C9DC5
    for ch in str(seed):
        hash_val ^= ord(ch)
        hash_val = (hash_val * 0x01000193) & 0xFFFFFFFF
    return hash_val & 0xFFFFFFFF

def create_rng(initial_seed=None):
    """
    Creates a seeded PRNG using the Mulberry32 algorithm.
    Produces high-quality 32-bit pseudo-random numbers.
    Accepts numeric or string seeds ("011" is hashed deterministically).
    """
    if initial_seed is None:
        initial_seed = (int(time.time() * 1000) ^ random.randint(0, 0xFFFFFFFF)) & 0xFFFFFFFF

    state = normalize_seed(initial_seed)
    original_seed = state
    
    def to_s32(val):
        val = val & 0xFFFFFFFF
        if val & 0x80000000:
            return val - 0x100000000
        return val

    def imul(a, b):
        res = (to_s32(a) * to_s32(b)) & 0xFFFFFFFF
        if res & 0x80000000:
            return res - 0x100000000
        return res

    def next_val():
        # ye TS wale mulberry32 ka exact Python port hai.
        # CRITICAL: JS me `>>>` unsigned shift hota hai aur `|0` se numbers
        # signed 32-bit me rehte hain — Python ka `>>` arithmetic shift hai
        # (negative numbers pe sign extend karta hai). isliye har value ko
        # pehle & 0xFFFFFFFF karke UNSIGNED rakhna zaroori hai. purane port
        # me signed >> use ho raha tha jisse MSB kabhi set nahi hota tha aur
        # next() kabhi 0.5 se upar nahi jata tha — poora library silently
        # skewed tha (v2.0.6 tak). ab fixed: proper unsigned mulberry32.
        nonlocal state
        state = (state + 0x6D2B79F5) & 0xFFFFFFFF

        t = (state ^ (state >> 15))
        t = (t * (1 | state)) & 0xFFFFFFFF
        t = (t + ((t ^ (t >> 7)) * (61 | t) & 0xFFFFFFFF)) & 0xFFFFFFFF
        res = (t ^ (t >> 14)) & 0xFFFFFFFF
        return res / 4294967296.0

    class SeededRNG:
        def next(self):
            return next_val()
            
        @property
        def seed(self):
            return original_seed
            
        def reset(self, new_seed):
            nonlocal state
            state = new_seed & 0xFFFFFFFF
            
    return SeededRNG()

def weighted_sample(items, rng):
    """
    Picks one item from a weighted list using the inverse CDF method.
    Returns both the selected item and its normalized probability.
    
    :param items: List of dicts/objects with a 'weight' key/property
    :param rng: SeededRNG instance
    :returns: tuple of (item, probability)
    """
    if len(items) == 0:
        raise ValueError("weighted_sample: cannot sample from empty array")
    if len(items) == 1:
        return items[0], 1.0

    # Handle if items are dicts or objects with attribute 'weight'
    weights = []
    for item in items:
        if isinstance(item, dict):
            weights.append(item.get("weight", 0))
        else:
            weights.append(getattr(item, "weight", 0))
            
    total_weight = sum(weights)
    if total_weight <= 0:
        raise ValueError("weighted_sample: total weight must be positive")

    r = rng.next() * total_weight
    cumulative = 0.0 # yee duniya ki sabse badi galti hai

    for idx, item in enumerate(items):
        cumulative += weights[idx]
        if r < cumulative:
            return item, weights[idx] / total_weight

    # Floating-point edge case
    last_item = items[-1]
    return last_item, weights[-1] / total_weight

def uniform_sample(items, rng):
    """
    Picks one item from a list with uniform probability.
    """
    if len(items) == 0:
        raise ValueError("uniform_sample: cannot sample from empty array")
    idx = int(math.floor(rng.next() * len(items)))
    return items[min(idx, len(items) - 1)]

def weighted_sample_from_record(dist, rng):
    """
    Picks one key from a dict where values are weights.
    Returns the key and its normalized probability.
    """
    entries = list(dist.items())
    if len(entries) == 0:
        raise ValueError("weighted_sample_from_record: empty distribution")

    items = [{"id": k, "weight": w} for k, w in entries]
    item, probability = weighted_sample(items, rng)
    return item["id"], probability

def gaussian_sample(mean, stddev, rng):
    """
    Box-Muller transform: generates a normally distributed random value.
    """
    u1 = rng.next()
    u2 = rng.next()
    safe_u1 = max(u1, 1e-10)
    z = math.sqrt(-2 * math.log(safe_u1)) * math.cos(2 * math.pi * u2)
    return mean + stddev * z

def log_normal_sample(mu, sigma, rng):
    """
    Log-normal distribution sampler.
    """
    # income ke liye lognormal hi sahi hai — thode log bahut kamate hain,
    # zyada tar log kam. uniform lene se sab ek jaise dikhne lagte hain.
    normal_val = gaussian_sample(mu, sigma, rng)
    return math.exp(normal_val)

def age_sample(rng, min_age=0, max_age=100):
    """
    Generates an age following a realistic demographic age distribution.
    """
    r = rng.next()
    if r < 0.26:
        age = abs(gaussian_sample(7, 4, rng))
        age = min(age, 14)
    elif r < 0.93:
        age = gaussian_sample(32, 12, rng)
        age = max(15, min(age, 64))
    else:
        age = gaussian_sample(72, 6, rng)
        age = max(65, min(age, max_age))

    age = int(round(max(min_age, min(max_age, age))))
    return age

def household_size_sample(rng, area_type):
    """
    Generates a household size following India's typical distribution.
    """
    mean = 4.3 if area_type == "urban" else 5.2
    sigma = 1.5
    raw = log_normal_sample(math.log(mean) - (sigma * sigma) / 2.0, sigma * 0.3, rng)
    return max(1, min(12, int(round(raw))))

def income_sample(rng, params):
    """
    Generates annual income in INR following a log-normal distribution.
    """
    area_type = params.get("areaType", "rural")
    education = params.get("education", "middle")
    occupation = params.get("occupation", "other_worker")
    state = params.get("state", "Uttar Pradesh")
    
    base_mu = 11.8 if area_type == "urban" else 11.2
    sigma = 0.8

    edu_multipliers = {
        'illiterate': -0.6,
        'literate_below_primary': -0.4,
        'primary': -0.2,
        'middle': 0.0,
        'secondary': 0.2,
        'higher_secondary': 0.4,
        'graduate': 0.8,
        'postgraduate': 1.1,
        'technical_diploma': 0.9,
        'professional_degree': 1.3
    }
    base_mu += edu_multipliers.get(education, 0.0)

    occ_multipliers = {
        'cultivator': -0.3,
        'agricultural_labourer': -0.5,
        'household_industry': -0.1,
        'other_worker': 0.2,
        'non_worker': -0.7
    }
    base_mu += occ_multipliers.get(occupation, 0.0)

    high_income_states = ['maharashtra', 'delhi', 'karnataka', 'tamil_nadu', 'gujarat', 'haryana', 'goa', 'nct_of_delhi']
    low_income_states = ['bihar', 'jharkhand', 'uttar_pradesh', 'madhya_pradesh', 'odisha', 'chhattisgarh']
    state_key = state.lower().replace(" ", "_")
    
    if state_key in high_income_states:
        base_mu += 0.3
    elif state_key in low_income_states:
        base_mu -= 0.2

    income = log_normal_sample(base_mu, sigma, rng)
    return max(10000, int(round(income / 1000.0) * 1000))

def bernoulli_sample(probability, rng):
    """
    Generates a boolean value based on a probability.
    """
    return rng.next() < probability

def sample_name(names, rng):
    """
    Samples a name from NameEntry array, returns name and probability.
    """
    if len(names) == 0:
        return "Unknown", 0.0
    item, probability = weighted_sample(names, rng)
    # Check if item is dict or object
    name_str = item.get("name", "Unknown") if isinstance(item, dict) else getattr(item, "name", "Unknown")
    return name_str, probability
