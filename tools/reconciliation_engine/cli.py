"""CLI interface for the Reconciliation Truth & Proof Engine.

Usage:
    python -m reconciliation_engine.cli --source source.json --target target.json --keys external_id amount date --output ./audit
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from reconciliation_engine.engine import (
    Severity,
    reconcile,
)


def load_jsonl_or_json(filepath: str) -> List[Dict[str, Any]]:
    """Load records from JSON or JSONL file."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filepath}")

    records = []
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().strip()

    # Try JSON array first
    if content.startswith("["):
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass

    # Try JSONL (one JSON object per line)
    for line in content.split("\n"):
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"Warning: Could not parse line: {line[:100]}", file=sys.stderr)

    return records


def main():
    parser = argparse.ArgumentParser(
        description="Reconciliation Truth & Proof Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Basic reconciliation
    python -m reconciliation_engine.cli \\
        --source stripe_transactions.json \\
        --target shopify_transactions.json \\
        --keys external_id amount date

    # With options and audit output
    python -m reconciliation_engine.cli \\
        --source sources.json \\
        --target targets.json \\
        --keys external_id \\
        --tolerance 0.01 \\
        --output ./audit_output

    # With fuzzy rules
    python -m reconciliation_engine.cli \\
        --source sources.json \\
        --target targets.json \\
        --keys external_id amount \\
        --fuzzy-rules amount_within_tolerance date_within_1_day
        """,
    )

    parser.add_argument(
        "--source",
        required=True,
        help="Path to source records JSON/JSONL file",
    )
    parser.add_argument(
        "--target",
        required=True,
        help="Path to target records JSON/JSONL file",
    )
    parser.add_argument(
        "--keys",
        nargs="+",
        required=True,
        help="Match keys (e.g., external_id amount date)",
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=0.01,
        help="Amount tolerance for matching (default: 0.01)",
    )
    parser.add_argument(
        "--date-tolerance",
        type=int,
        default=0,
        help="Date tolerance in days (default: 0)",
    )
    parser.add_argument(
        "--case-sensitive",
        action="store_true",
        help="Enable case-sensitive matching",
    )
    parser.add_argument(
        "--fuzzy-rules",
        nargs="*",
        default=[],
        help="Approved fuzzy rules to apply",
    )
    parser.add_argument(
        "--output",
        "-o",
        help="Output directory for audit artifacts",
    )
    parser.add_argument(
        "--quiet",
        "-q",
        action="store_true",
        help="Minimal output (exit code only)",
    )
    parser.add_argument(
        "--ci-mode",
        action="store_true",
        help="CI mode: fail on BLOCKER violations (exit code 2)",
    )

    args = parser.parse_args()

    try:
        # Load data
        source_records = load_jsonl_or_json(args.source)
        target_records = load_jsonl_or_json(args.target)

        if not args.quiet:
            print(f"Loaded {len(source_records)} source records")
            print(f"Loaded {len(target_records)} target records")
            print(f"Match keys: {args.keys}")

        # Build options
        options = {
            "amount_tolerance": args.tolerance,
            "date_tolerance_days": args.date_tolerance,
            "case_sensitive": args.case_sensitive,
            "fuzzy_rules": args.fuzzy_rules,
        }

        # Run reconciliation
        result, artifacts = reconcile(
            source_records=source_records,
            target_records=target_records,
            match_keys=args.keys,
            options=options,
            output_dir=args.output,
        )

        if not args.quiet:
            print(f"\nReconciliation complete: {result.run_id}")
            print(f"  Match rate: {result.match_rate:.2%}")
            print(f"  Matched: {result.matched_count}")
            print(f"  Mismatched: {result.mismatched_count}")
            print(f"  Source orphans: {result.source_orphan_count}")
            print(f"  Target orphans: {result.target_orphan_count}")

            if result.invariant_violations:
                print(f"\n  Invariant violations: {len(result.invariant_violations)}")
                for v in result.invariant_violations:
                    marker = "[BLOCKER]" if v.severity == Severity.BLOCKER else "[HIGH]"
                    print(f"    {marker} {v.invariant_name}: {v.message}")

            if artifacts:
                print(f"\n  Audit artifacts:")
                for name, path in artifacts.items():
                    print(f"    - {name}: {path}")

        # Determine exit code
        if result.has_blocker_violations:
            if args.ci_mode:
                print("\nBLOCKER violations detected - failing CI", file=sys.stderr)
                sys.exit(2)
            else:
                sys.exit(1)
        elif result.invariant_violations:
            sys.exit(1)
        else:
            sys.exit(0)

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(3)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        sys.exit(4)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(5)


if __name__ == "__main__":
    main()
