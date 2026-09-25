"""
Indian Fake Data Generator — Python Edition

@author Abhay Mourya <https://github.com/abhay557>
@license MIT

A generator for realistic Indian demographic data based on Census 2011 statistics.

Enrichment layers:
  - Layer 2: Outcome Simulation (credit, health, education, employment)
  - Layer 3: Narrative Text Generation (loan apps, medical notes, Hinglish chat)
  - Layer 4: Agent Persona Schema (LLM-ready system prompts and belief models)
"""

# Core Generation API
from indian_fakedata.utils.generator import (
    generate,
    generate_stream,
    get_distribution_summary,
    generate_enriched,
    generate_enriched_stream,
)

# Enrichment API
from indian_fakedata.utils.outcomes import simulate_outcomes
from indian_fakedata.utils.narrative import generate_narrative, generate_all_narratives
from indian_fakedata.utils.agent import generate_agent_persona

# User / Family / Persona API
from indian_fakedata.utils.user import generate_user, generate_users, generate_persona
from indian_fakedata.utils.family import generate_family

# Utility Exports
from indian_fakedata.core.sampler import create_rng, weighted_sample, weighted_sample_from_record
from indian_fakedata.database.loader import DatabaseLoader
_db_loader = DatabaseLoader()
load_database = _db_loader.load_database
from indian_fakedata.utils.exporter import format_profiles, save_profiles
from indian_fakedata.utils.appearance import generate_appearance, get_region
from indian_fakedata.utils.employment import generate_employment_timeline
from indian_fakedata.utils.skills import generate_skills
from indian_fakedata.utils.transliterate import (
    transliterate, script_for_language, contains_indic,
)
from indian_fakedata.utils.geo import generate_geo, state_geo_bounds, state_geo_anchor
from indian_fakedata.utils.life_events import generate_life_events
from indian_fakedata.utils.economy import generate_household_economy, emi_for
from indian_fakedata.utils.schema import get_profile_schema, validate_profile
from indian_fakedata.utils.privacy import strip_pii, PII_FIELDS

from indian_fakedata._version import __version__
__author__ = "Abhay Mourya"

__all__ = [
    # Generation
    "generate",
    "generate_stream",
    "get_distribution_summary",
    "generate_enriched",
    "generate_enriched_stream",
    # Enrichment
    "simulate_outcomes",
    "generate_narrative",
    "generate_all_narratives",
    "generate_agent_persona",
    # User / Family / Persona
    "generate_user",
    "generate_users",
    "generate_persona",
    "generate_family",
    # Utilities
    "create_rng",
    "weighted_sample",
    "weighted_sample_from_record",
    "load_database",
    "format_profiles",
    "save_profiles",
    "generate_appearance",
    "get_region",
    "generate_employment_timeline",
    "generate_skills",
    "transliterate",
    "script_for_language",
    "contains_indic",
    "generate_geo",
    "state_geo_bounds",
    "state_geo_anchor",
    "generate_life_events",
    "generate_household_economy",
    "emi_for",
    "get_profile_schema",
    "validate_profile",
    "strip_pii",
    "PII_FIELDS",
]

# note for someone who is reading this code
# yee sab data probablity hai vho confidentail hai iske liye github par public nahi kar sakta
# kyu ki research paper bane ka hai iske liye public nahi kar sakta