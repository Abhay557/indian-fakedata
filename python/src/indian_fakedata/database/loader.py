"""
Database Loader Module

Handles loading the compiled demographic database from packaged JSON files.
Provides robust fallbacks and deep merge utilities for custom data folders.
"""

import os
import json
import copy

class DatabaseLoader:
    """
    Loads and compiles the demographic database.
    """
    def __init__(self):
        self.db_dir = os.path.dirname(os.path.abspath(__file__))

    def load_database(self, data_dir=None):
        """
        Load the complete compiled database.
        If a custom data directory is provided, attempts to load and merge
        custom JSON files with the built-in defaults.
        """
        # Load default database
        db_path = os.path.join(self.db_dir, "default_data.json")
        with open(db_path, "r", encoding="utf-8") as f:
            db = json.load(f)

        # Merge in custom directory files if provided
        if data_dir and os.path.isdir(data_dir):
            custom_db = {}
            for name in ["states", "religions", "casteMap", "firstNames", "surnames", "districts"]:
                file_path = os.path.join(data_dir, f"{name}.json")
                if os.path.exists(file_path):
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            custom_db[name] = json.load(f)
                    except Exception as e:
                        print(f"[!] Warning: Failed to load custom JSON at {file_path}: {e}")
            if custom_db:
                db = merge_database(db, custom_db)

        return db

    def load_names(self):
        """
        Load the comprehensive names database.
        """
        names_path = os.path.join(self.db_dir, "names_data.json")
        with open(names_path, "r", encoding="utf-8") as f:
            return json.load(f)

def merge_database(base, custom):
    """
    Merge custom data into the base database.
    Custom data takes priority over defaults for matching keys.
    """
    merged = copy.deepcopy(base)

    if "states" in custom:
        merged["states"].update(custom["states"])
    if "religions" in custom:
        merged["religions"].update(custom["religions"])
    if "casteMap" in custom:
        merged["casteMap"] = deep_merge(base.get("casteMap", {}), custom["casteMap"])
    if "firstNames" in custom:
        merged["firstNames"] = deep_merge(base.get("firstNames", {}), custom["firstNames"])
    if "surnames" in custom:
        merged["surnames"].update(custom["surnames"])
    if "districts" in custom:
        merged["districts"].update(custom["districts"])

    return merged

def deep_merge(base, custom):
    """Deep merge for nested dicts"""
    result = copy.deepcopy(base)
    for key, val in custom.items():
        if key in result:
            if isinstance(result[key], dict) and isinstance(val, dict):
                result[key] = deep_merge(result[key], val)
            else:
                result[key] = copy.deepcopy(val)
        else:
            result[key] = copy.deepcopy(val)
    return result
