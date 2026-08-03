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

# Utility Exports
from indian_fakedata.core.sampler import create_rng, weighted_sample, weighted_sample_from_record
from indian_fakedata.database.loader import DatabaseLoader
_db_loader = DatabaseLoader()
load_database = _db_loader.load_database
from indian_fakedata.utils.exporter import format_profiles, save_profiles

__version__ = "1.0.1"
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
    # Utilities
    "create_rng",
    "weighted_sample",
    "weighted_sample_from_record",
    "load_database",
    "format_profiles",
    "save_profiles",
]
