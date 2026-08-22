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

__version__ = "2.0.5"
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
]

# note for someone who is reading this code
# yee sab data probablity hai vho confidentail hai iske liye github par public nahi kar sakta
# kyu ki research paper bane ka hai iske liye public nahi kar sakta