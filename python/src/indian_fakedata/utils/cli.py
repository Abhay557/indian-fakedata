"""
Indian Synthetic Population Simulator — CLI Entry Point

Generates culturally accurate, statistically consistent Indian demographic profiles
backed by Census 2011 data using attention-like context masking.
"""

import sys
import argparse
import json
from datetime import datetime

from indian_fakedata.utils.generator import generate_stream, generate_enriched_stream
from indian_fakedata.utils.exporter import _flatten_enriched, _escape_csv_value, _flatten_object

C = {
    "reset": "\033[0m",
    "bold": "\033[1m",
    "cyan": "\033[36m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "red": "\033[31m",
    "dim": "\033[2m",
    "magenta": "\033[35m",
}

def print_help():
    help_text = f"""
  {C["bold"]}{C["cyan"]}Indian Synthetic Population Simulator CLI{C["reset"]}
  Generates culturally accurate, statistically consistent Indian demographic profiles
  backed by Census 2011 data using attention-like context masking.

  {C["bold"]}USAGE:{C["reset"]}
    indian-fakedata [options]

  {C["bold"]}CORE OPTIONS:{C["reset"]}
    -c, --count <n>        Number of profiles to generate {C["dim"]}(default: 100){C["reset"]}
    -o, --output <path>    File path to save output {C["dim"]}(default: stdout){C["reset"]}
    -f, --format <fmt>     Output format: json, jsonl, csv {C["dim"]}(default: json){C["reset"]}
    -s, --seed <number>    Reproducibility seed for RNG
    --no-metrics           Exclude probability metrics from output
    -h, --help             Show this help screen

  {C["bold"]}DEMOGRAPHIC CONSTRAINTS:{C["reset"]}
    --religion <string>        Fix religion {C["dim"]}(Hindu, Muslim, Christian, Sikh, Buddhist, Jain){C["reset"]}
    --state <string>           Fix state {C["dim"]}(e.g., Maharashtra, Tamil Nadu, Punjab){C["reset"]}
    --gender <gender>          Fix gender: male, female, other
    --caste <string>           Fix caste/community {C["dim"]}(e.g., Brahmin, Maratha, Jat){C["reset"]}
    --socialCategory <cat>     Fix social category: SC, ST, OBC, General
    --areaType <type>          Fix area type: urban, rural
    --minAge <number>          Minimum age constraint {C["dim"]}(0-100){C["reset"]}
    --maxAge <number>          Maximum age constraint {C["dim"]}(0-100){C["reset"]}
    --education <level>        Fix education {C["dim"]}(illiterate, primary, secondary, graduate...){C["reset"]}
    --occupation <sector>      Fix occupation {C["dim"]}(cultivator, other_worker, non_worker...){C["reset"]}
    --maritalStatus <status>   Fix marital status {C["dim"]}(never_married, married, widowed...){C["reset"]}

  {C["bold"]}{C["magenta"]}ENRICHMENT LAYERS:{C["reset"]}
    --enrich               Enable ALL enrichment layers (outcomes + narrative:all + persona)
    --outcomes             {C["dim"]}[Layer 2]{C["reset"]} Add credit score, health risk, employment outcome,
                           education attainment. Outputs in {C["cyan"]}enriched.outcomes{C["reset"]} field.
    --bias <0-1>           Bias dial for outcome simulation.
                           {C["dim"]}0.0 = pure meritocracy, 1.0 = max historical discrimination{C["reset"]}
                           {C["dim"]}Default: 0.3 (calibrated to CMIE/CIBIL observed gaps){C["reset"]}
    --narrative <type>     {C["dim"]}[Layer 3]{C["reset"]} Generate realistic Indian text document.
                           Types: {C["dim"]}loan_application, medical_consultation, school_enrollment,
                                  ration_card_application, hinglish_conversation, all{C["reset"]}
                            Can be repeated for multiple types.
    --persona              {C["dim"]}[Layer 4]{C["reset"]} Generate LLM-ready agent persona (system prompt,
                           beliefs, memory seeds, behavioral rules).

  {C["bold"]}EXAMPLES:{C["reset"]}
    {C["dim"]}# Basic generation{C["reset"]}
    indian-fakedata -c 1000 -o profiles.csv -f csv

    {C["dim"]}# 50K profiles, Hindu, Maharashtra, JSONL{C["reset"]}
    indian-fakedata -c 50000 -f jsonl -o bigdata.jsonl --state Maharashtra --religion Hindu

    {C["dim"]}# All enrichment layers, moderate bias{C["reset"]}
    indian-fakedata -c 100 --enrich --bias 0.3 -f jsonl -o enriched.jsonl
    """
    print(help_text)

def main():
    if len(sys.argv) < 2:
        print_help()
        sys.exit(0)

    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("-h", "--help", action="store_true")
    parser.add_argument("-c", "--count", type=int, default=100)
    parser.add_argument("-o", "--output", type=str, default=None)
    parser.add_argument("-f", "--format", type=str, default="json", choices=["json", "jsonl", "csv"])
    parser.add_argument("-s", "--seed", type=int, default=None)
    parser.add_argument("--no-metrics", action="store_true")

    # Constraints
    parser.add_argument("--religion", type=str, default=None)
    parser.add_argument("--state", type=str, default=None)
    parser.add_argument("--gender", type=str, default=None)
    parser.add_argument("--caste", type=str, default=None)
    parser.add_argument("--socialCategory", type=str, default=None)
    parser.add_argument("--areaType", type=str, default=None)
    parser.add_argument("--minAge", type=int, default=None)
    parser.add_argument("--maxAge", type=int, default=None)
    parser.add_argument("--education", type=str, default=None)
    parser.add_argument("--occupation", type=str, default=None)
    parser.add_argument("--maritalStatus", type=str, default=None)

    # Enrichment
    parser.add_argument("--enrich", action="store_true")
    parser.add_argument("--outcomes", action="store_true")
    parser.add_argument("--bias", type=float, default=0.3)
    parser.add_argument("--narrative", action="append", default=None)
    parser.add_argument("--persona", action="store_true")

    # Parse only known args
    args, unknown = parser.parse_known_args()

    if args.help:
        print_help()
        sys.exit(0)

    # Compile constraints
    constraints = {}
    if args.religion: constraints["religion"] = args.religion
    if args.state: constraints["state"] = args.state
    if args.gender: constraints["gender"] = args.gender
    if args.caste: constraints["caste"] = args.caste
    if args.socialCategory: constraints["socialCategory"] = args.socialCategory
    if args.areaType: constraints["areaType"] = args.areaType
    if args.education: constraints["education"] = args.education
    if args.occupation: constraints["occupation"] = args.occupation
    if args.maritalStatus: constraints["maritalStatus"] = args.maritalStatus
    if args.minAge is not None or args.maxAge is not None:
        constraints["ageRange"] = {"min": args.minAge or 0, "max": args.maxAge or 100}

    include_probability_metrics = not args.no_metrics

    # Enrichment options
    include_outcomes = args.outcomes or args.enrich
    include_agent_persona = args.persona or args.enrich
    bias_level = args.bias

    narrative_types = []
    if args.enrich:
        narrative_types = ["all"]
    elif args.narrative:
        narrative_types = args.narrative

    is_enriched = include_outcomes or len(narrative_types) > 0 or include_agent_persona

    # Setup output stream
    if args.output:
        out_file = open(args.output, "w", encoding="utf-8")
    else:
        out_file = sys.stdout

    # Choose correct generator stream
    if is_enriched:
        stream = generate_enriched_stream(
            count=args.count,
            seed=args.seed,
            constraints=constraints,
            include_probability_metrics=include_probability_metrics,
            include_outcomes=include_outcomes,
            bias_level=bias_level,
            narrative_types=narrative_types,
            include_agent_persona=include_agent_persona
        )
    else:
        stream = generate_stream(
            count=args.count,
            seed=args.seed,
            constraints=constraints,
            include_probability_metrics=include_probability_metrics
        )

    try:
        if args.format == "json":
            out_file.write("[\n")
            is_first = True
            for i, p in enumerate(stream):
                if not is_first:
                    out_file.write(",\n")
                if args.count <= 100:
                    out_file.write(json.dumps(p, indent=2, ensure_ascii=False))
                else:
                    out_file.write(json.dumps(p, ensure_ascii=False))
                is_first = False
            out_file.write("\n]\n")

        elif args.format == "jsonl":
            for p in stream:
                out_file.write(json.dumps(p, ensure_ascii=False) + "\n")

        elif args.format == "csv":
            is_first = True
            headers = []
            for record in stream:
                flat = _flatten_enriched(record) if is_enriched else _flatten_object(record)
                if is_first:
                    headers = list(flat.keys())
                    out_file.write(",".join(_escape_csv_value(h) for h in headers) + "\n")
                    is_first = False
                out_file.write(",".join(_escape_csv_value(flat.get(h)) for h in headers) + "\n")

    finally:
        if args.output:
            out_file.close()

if __name__ == "__main__":
    main()
