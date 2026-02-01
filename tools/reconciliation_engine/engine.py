"""Reconciliation Truth & Proof Engine for Settler.

A deterministic, explainable, and auditable reconciliation system that:
- Produces deterministic reconciliation results
- Explains WHY records matched or did not
- Emits audit-grade artifacts
- Integrates with existing invariants and CI gates

Author: Data Systems Engineer
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union


class MatchStatus(Enum):
    """Status of a reconciliation match attempt."""

    MATCHED = "matched"
    MISMATCHED = "mismatched"
    SOURCE_ORPHAN = "source_orphan"
    TARGET_ORPHAN = "target_orphan"
    EXCLUDED = "excluded"


class Severity(Enum):
    """Severity level for invariant violations."""

    BLOCKER = "blocker"  # Must fail CI
    HIGH = "high"  # Warning, requires review
    MEDIUM = "medium"  # Advisory
    LOW = "low"  # Informational


@dataclass(frozen=True)
class MatchRule:
    """An explainable, approved fuzzy matching rule.

    Attributes:
        name: Unique rule identifier
        description: Human-readable explanation
        applies_to: List of field names this rule can match on
        predicate: Callable that determines if rule applies
    """

    name: str
    description: str
    applies_to: Tuple[str, ...]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "applies_to": list(self.applies_to),
        }


# Approved fuzzy rules registry
APPROVED_FUZZY_RULES: Dict[str, MatchRule] = {
    "exact_key_match": MatchRule(
        name="exact_key_match",
        description="All match keys are identical after normalization",
        applies_to=("external_id", "amount", "date", "reference"),
    ),
    "amount_within_tolerance": MatchRule(
        name="amount_within_tolerance",
        description="Amount difference is within configured tolerance (e.g., $0.01 for rounding)",
        applies_to=("amount",),
    ),
    "date_within_1_day": MatchRule(
        name="date_within_1_day",
        description="Dates differ by at most 1 calendar day (timezone handling)",
        applies_to=("date",),
    ),
    "reference_fuzzy_match": MatchRule(
        name="reference_fuzzy_match",
        description="Reference numbers match after removing whitespace and case normalization",
        applies_to=("reference",),
    ),
    "external_id_case_insensitive": MatchRule(
        name="external_id_case_insensitive",
        description="External ID matches ignoring case differences",
        applies_to=("external_id",),
    ),
}


@dataclass
class TruthTableEntry:
    """A single row in the reconciliation truth table.

    This is the core audit artifact showing exactly what was compared
    and why a particular decision was made.
    """

    # Input record identifiers
    source_record_id: Optional[str]
    target_record_id: Optional[str]

    # Match result
    match_status: MatchStatus
    rule_applied: str
    confidence: float  # 0.0 - 1.0

    # Explanation
    explanation: str

    # Compared values (for audit)
    source_values: Dict[str, Any] = field(default_factory=dict)
    target_values: Dict[str, Any] = field(default_factory=dict)
    differences: Dict[str, Any] = field(default_factory=dict)

    # Metadata
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_record_id": self.source_record_id,
            "target_record_id": self.target_record_id,
            "match_status": self.match_status.value,
            "rule_applied": self.rule_applied,
            "confidence": self.confidence,
            "explanation": self.explanation,
            "source_values": self.source_values,
            "target_values": self.target_values,
            "differences": self.differences,
            "timestamp": self.timestamp,
        }


@dataclass
class InvariantViolation:
    """A violation of a reconciliation invariant.

    Invariants are hard rules that must hold for reconciliation to be valid.
    """

    invariant_name: str
    severity: Severity
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    remediation: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "invariant_name": self.invariant_name,
            "severity": self.severity.value,
            "message": self.message,
            "details": self.details,
            "remediation": self.remediation,
        }


@dataclass
class ReconciliationResult:
    """Complete result of a reconciliation run."""

    # Identifiers
    run_id: str
    started_at: str
    completed_at: str

    # Input summary
    total_source: int
    total_target: int
    match_keys: List[str]

    # Results
    truth_table: List[TruthTableEntry] = field(default_factory=list)
    invariant_violations: List[InvariantViolation] = field(default_factory=list)

    # Aggregates
    matched_count: int = 0
    mismatched_count: int = 0
    source_orphan_count: int = 0
    target_orphan_count: int = 0

    # Source data hashes (for reproducibility)
    source_data_hash: str = ""
    target_data_hash: str = ""

    # Metadata
    options: Dict[str, Any] = field(default_factory=dict)

    @property
    def match_rate(self) -> float:
        total = self.total_source + self.total_target
        if total == 0:
            return 0.0
        return (self.matched_count * 2) / total

    @property
    def has_blocker_violations(self) -> bool:
        return any(
            v.severity == Severity.BLOCKER for v in self.invariant_violations
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "started_at": self.started_at,
            "completed_at": self.completed_at,
            "total_source": self.total_source,
            "total_target": self.total_target,
            "match_keys": self.match_keys,
            "matched_count": self.matched_count,
            "mismatched_count": self.mismatched_count,
            "source_orphan_count": self.source_orphan_count,
            "target_orphan_count": self.target_orphan_count,
            "match_rate": self.match_rate,
            "source_data_hash": self.source_data_hash,
            "target_data_hash": self.target_data_hash,
            "invariant_violations": [v.to_dict() for v in self.invariant_violations],
            "has_blocker_violations": self.has_blocker_violations,
            "options": self.options,
        }


class InvariantChecker:
    """Checks reconciliation invariants and reports violations."""

    def __init__(self, tolerance: Decimal = Decimal("0.01")):
        self.tolerance = tolerance
        self.violations: List[InvariantViolation] = []

    def check_totals_balance(
        self,
        source_records: List[Dict[str, Any]],
        target_records: List[Dict[str, Any]],
    ) -> bool:
        """Check that total source amounts equal total target amounts."""
        source_total = sum(
            Decimal(str(r.get("amount", 0))) for r in source_records
        )
        target_total = sum(
            Decimal(str(r.get("amount", 0))) for r in target_records
        )

        diff = abs(source_total - target_total)

        if diff > self.tolerance:
            self.violations.append(
                InvariantViolation(
                    invariant_name="totals_must_balance",
                    severity=Severity.BLOCKER,
                    message=f"Source total ({source_total}) does not match target total ({target_total})",
                    details={
                        "source_total": float(source_total),
                        "target_total": float(target_total),
                        "difference": float(diff),
                        "tolerance": float(self.tolerance),
                    },
                    remediation="Review unmatched transactions or adjust tolerance if appropriate",
                )
            )
            return False
        return True

    def check_currency_consistency(
        self, all_records: List[Dict[str, Any]]
    ) -> bool:
        """Check that all records use the same currency."""
        currencies = set()
        for record in all_records:
            currency = record.get("currency", "USD")
            if currency:
                currencies.add(currency)

        if len(currencies) > 1:
            self.violations.append(
                InvariantViolation(
                    invariant_name="currency_consistency",
                    severity=Severity.BLOCKER,
                    message=f"Multiple currencies detected: {sorted(currencies)}",
                    details={"currencies_found": sorted(currencies)},
                    remediation="Split reconciliation by currency or convert amounts",
                )
            )
            return False
        return True

    def check_no_duplicate_settlement(
        self, truth_table: List[TruthTableEntry]
    ) -> bool:
        """Check that no transaction is matched more than once."""
        source_matches: Dict[str, int] = {}
        target_matches: Dict[str, int] = {}

        for entry in truth_table:
            if entry.match_status == MatchStatus.MATCHED:
                if entry.source_record_id:
                    source_matches[entry.source_record_id] = (
                        source_matches.get(entry.source_record_id, 0) + 1
                    )
                if entry.target_record_id:
                    target_matches[entry.target_record_id] = (
                        target_matches.get(entry.target_record_id, 0) + 1
                    )

        duplicates = []
        for sid, count in source_matches.items():
            if count > 1:
                duplicates.append(f"source:{sid} ({count} matches)")
        for tid, count in target_matches.items():
            if count > 1:
                duplicates.append(f"target:{tid} ({count} matches)")

        if duplicates:
            self.violations.append(
                InvariantViolation(
                    invariant_name="no_duplicate_settlement",
                    severity=Severity.BLOCKER,
                    message=f"Transactions matched multiple times: {', '.join(duplicates)}",
                    details={"duplicates": duplicates},
                    remediation="Review match logic to ensure 1:1 matching",
                )
            )
            return False
        return True

    def check_no_orphaned_transactions(
        self,
        source_records: List[Dict[str, Any]],
        target_records: List[Dict[str, Any]],
        truth_table: List[TruthTableEntry],
    ) -> bool:
        """Check that every transaction has at least one match candidate."""
        matched_sources = set()
        matched_targets = set()

        for entry in truth_table:
            if entry.match_status == MatchStatus.MATCHED:
                if entry.source_record_id:
                    matched_sources.add(entry.source_record_id)
                if entry.target_record_id:
                    matched_targets.add(entry.target_record_id)

        orphaned_sources = [
            r.get("id", "unknown")
            for r in source_records
            if r.get("id") not in matched_sources
        ]
        orphaned_targets = [
            r.get("id", "unknown")
            for r in target_records
            if r.get("id") not in matched_targets
        ]

        if orphaned_sources or orphaned_targets:
            # This is HIGH not BLOCKER because orphans may be legitimate
            self.violations.append(
                InvariantViolation(
                    invariant_name="no_orphaned_transactions",
                    severity=Severity.HIGH,
                    message=f"Found {len(orphaned_sources)} source orphans and {len(orphaned_targets)} target orphans",
                    details={
                        "orphaned_sources": orphaned_sources[:10],  # Limit
                        "orphaned_targets": orphaned_targets[:10],
                    },
                    remediation="Review unmatched transactions for data quality issues",
                )
            )
            return False
        return True

    def get_violations(self) -> List[InvariantViolation]:
        return self.violations


class ReconciliationEngine:
    """Deterministic reconciliation engine with full audit trail."""

    def __init__(
        self,
        source_records: List[Dict[str, Any]],
        target_records: List[Dict[str, Any]],
        match_keys: List[str],
        options: Optional[Dict[str, Any]] = None,
    ):
        self.source_records = source_records
        self.target_records = target_records
        self.match_keys = match_keys
        self.options = options or {}

        # Configuration
        self.amount_tolerance = Decimal(
            str(self.options.get("amount_tolerance", 0.01))
        )
        self.case_sensitive = self.options.get("case_sensitive", False)
        self.fuzzy_rules = self.options.get("fuzzy_rules", [])
        self.date_tolerance_days = self.options.get("date_tolerance_days", 0)

        # State
        self.truth_table: List[TruthTableEntry] = []
        self.matched_targets: set = set()

    def _compute_data_hash(self, records: List[Dict[str, Any]]) -> str:
        """Compute deterministic hash of input data."""
        # Sort records by ID for determinism
        sorted_records = sorted(records, key=lambda r: str(r.get("id", "")))
        data_str = json.dumps(sorted_records, sort_keys=True, default=str)
        return hashlib.sha256(data_str.encode()).hexdigest()[:16]

    def _build_match_key(
        self, record: Dict[str, Any], keys: List[str]
    ) -> str:
        """Build normalized match key from record."""
        parts = []
        for key in keys:
            val = record.get(key, "")
            if val is None:
                val = ""
            val_str = str(val).strip()
            if not self.case_sensitive:
                val_str = val_str.lower()
            parts.append(val_str)
        return "|".join(parts)

    def _normalize_amount(self, value: Any) -> Decimal:
        """Normalize amount to Decimal for comparison."""
        if value is None:
            return Decimal("0")
        try:
            return Decimal(str(value))
        except (ValueError, TypeError):
            return Decimal("0")

    def _amounts_match(
        self, source: Dict[str, Any], target: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """Check if amounts match within tolerance."""
        src_amt = self._normalize_amount(source.get("amount"))
        tgt_amt = self._normalize_amount(target.get("amount"))

        diff = abs(src_amt - tgt_amt)

        if diff <= self.amount_tolerance:
            if diff == 0:
                return True, "exact_amount_match"
            else:
                return True, f"amount_within_tolerance (diff: {diff})"
        else:
            return False, f"amount_mismatch (diff: {diff}, tolerance: {self.amount_tolerance})"

    def _dates_match(
        self, source: Dict[str, Any], target: Dict[str, Any]
    ) -> Tuple[bool, str]:
        """Check if dates match, with optional tolerance."""
        src_date = str(source.get("date", ""))
        tgt_date = str(target.get("date", ""))

        if src_date == tgt_date:
            return True, "exact_date_match"

        if self.date_tolerance_days > 0 and src_date and tgt_date:
            try:
                from datetime import datetime

                src_dt = datetime.strptime(src_date[:10], "%Y-%m-%d")
                tgt_dt = datetime.strptime(tgt_date[:10], "%Y-%m-%d")
                diff_days = abs((src_dt - tgt_dt).days)

                if diff_days <= self.date_tolerance_days:
                    return True, f"date_within_{diff_days}_days"
            except ValueError:
                pass

        return False, f"date_mismatch ({src_date} vs {tgt_date})"

    def _records_match(
        self, source: Dict[str, Any], target: Dict[str, Any]
    ) -> Tuple[bool, str, float, Dict[str, Any]]:
        """Determine if two records match and explain why.

        Returns:
            Tuple of (matched: bool, rule: str, confidence: float, differences: dict)
        """
        differences = {}
        rules_applied = []

        # Check match keys
        for key in self.match_keys:
            src_val = source.get(key)
            tgt_val = target.get(key)

            # Normalize for comparison
            if isinstance(src_val, str) and isinstance(tgt_val, str):
                if not self.case_sensitive:
                    src_val = src_val.lower()
                    tgt_val = tgt_val.lower()

            if src_val != tgt_val:
                # Special handling for amount and date
                if key == "amount":
                    amt_match, amt_rule = self._amounts_match(source, target)
                    if amt_match:
                        rules_applied.append(amt_rule)
                        continue
                    else:
                        differences[key] = f"{src_val} vs {tgt_val}"
                        return False, "amount_mismatch", 0.0, differences

                elif key == "date":
                    date_match, date_rule = self._dates_match(source, target)
                    if date_match:
                        rules_applied.append(date_rule)
                        continue
                    else:
                        differences[key] = f"{src_val} vs {tgt_val}"
                        return False, "date_mismatch", 0.0, differences

                else:
                    differences[key] = f"{src_val} vs {tgt_val}"
                    return False, f"{key}_mismatch", 0.0, differences
            else:
                rules_applied.append(f"{key}_exact_match")

        # All match keys passed
        if rules_applied:
            confidence = 1.0
            if len(rules_applied) > 1:
                rule_str = " + ".join(rules_applied)
            else:
                rule_str = rules_applied[0]
            return True, rule_str, confidence, differences

        return False, "no_match_rules_applied", 0.0, differences

    def reconcile(self) -> ReconciliationResult:
        """Execute deterministic reconciliation and build truth table."""
        run_id = f"recon_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{os.urandom(4).hex()}"
        started_at = datetime.utcnow().isoformat()

        # Compute input hashes for reproducibility
        source_hash = self._compute_data_hash(self.source_records)
        target_hash = self._compute_data_hash(self.target_records)

        # Build indices
        source_index: Dict[str, List[Dict]] = {}
        for record in self.source_records:
            key = self._build_match_key(record, self.match_keys)
            if key not in source_index:
                source_index[key] = []
            source_index[key].append(record)

        target_index: Dict[str, List[Dict]] = {}
        for record in self.target_records:
            key = self._build_match_key(record, self.match_keys)
            if key not in target_index:
                target_index[key] = []
            target_index[key].append(record)

        truth_table: List[TruthTableEntry] = []
        matched_count = 0
        mismatched_count = 0
        source_orphan_count = 0
        target_orphan_count = 0
        matched_target_ids: set = set()

        # Process source records
        for key, source_batch in source_index.items():
            target_batch = target_index.get(key, [])

            if not target_batch:
                # Source orphans - no matching key in target
                for src in source_batch:
                    entry = TruthTableEntry(
                        source_record_id=src.get("id"),
                        target_record_id=None,
                        match_status=MatchStatus.SOURCE_ORPHAN,
                        rule_applied="none",
                        confidence=0.0,
                        explanation=f"No target records found with key: {key}",
                        source_values={
                            k: src.get(k) for k in self.match_keys + ["amount", "currency"]
                        },
                        target_values={},
                        differences={},
                    )
                    truth_table.append(entry)
                    source_orphan_count += 1
            else:
                # Attempt matching within batches
                available_targets = target_batch.copy()

                for src in source_batch:
                    match_found = False

                    for tgt in available_targets:
                        matched, rule, confidence, differences = self._records_match(
                            src, tgt
                        )

                        if matched:
                            entry = TruthTableEntry(
                                source_record_id=src.get("id"),
                                target_record_id=tgt.get("id"),
                                match_status=MatchStatus.MATCHED,
                                rule_applied=rule,
                                confidence=confidence,
                                explanation=f"Records matched using rule: {rule}",
                                source_values={
                                    k: src.get(k)
                                    for k in self.match_keys + ["amount", "currency"]
                                },
                                target_values={
                                    k: tgt.get(k)
                                    for k in self.match_keys + ["amount", "currency"]
                                },
                                differences=differences,
                            )
                            truth_table.append(entry)
                            matched_count += 1
                            matched_target_ids.add(tgt.get("id"))
                            available_targets.remove(tgt)
                            match_found = True
                            break

                    if not match_found:
                        # Mismatched - key matched but values differ
                        best_target = target_batch[0] if target_batch else None
                        entry = TruthTableEntry(
                            source_record_id=src.get("id"),
                            target_record_id=best_target.get("id") if best_target else None,
                            match_status=MatchStatus.MISMATCHED,
                            rule_applied="value_mismatch",
                            confidence=0.0,
                            explanation=f"Key matched ({key}) but values differ",
                            source_values={
                                k: src.get(k)
                                for k in self.match_keys + ["amount", "currency"]
                            },
                            target_values={
                                k: best_target.get(k)
                                for k in self.match_keys + ["amount", "currency"]
                            } if best_target else {},
                            differences={},
                        )
                        truth_table.append(entry)
                        mismatched_count += 1

        # Find target orphans
        for key, batch in target_index.items():
            for tgt in batch:
                if tgt.get("id") not in matched_target_ids:
                    entry = TruthTableEntry(
                        source_record_id=None,
                        target_record_id=tgt.get("id"),
                        match_status=MatchStatus.TARGET_ORPHAN,
                        rule_applied="none",
                        confidence=0.0,
                        explanation=f"No source records found with key: {key}",
                        source_values={},
                        target_values={
                            k: tgt.get(k) for k in self.match_keys + ["amount", "currency"]
                        },
                        differences={},
                    )
                    truth_table.append(entry)
                    target_orphan_count += 1

        completed_at = datetime.utcnow().isoformat()

        # Run invariant checks
        checker = InvariantChecker(tolerance=self.amount_tolerance)
        checker.check_totals_balance(self.source_records, self.target_records)
        checker.check_currency_consistency(
            self.source_records + self.target_records
        )
        checker.check_no_duplicate_settlement(truth_table)
        checker.check_no_orphaned_transactions(
            self.source_records, self.target_records, truth_table
        )

        result = ReconciliationResult(
            run_id=run_id,
            started_at=started_at,
            completed_at=completed_at,
            total_source=len(self.source_records),
            total_target=len(self.target_records),
            match_keys=self.match_keys,
            truth_table=truth_table,
            invariant_violations=checker.get_violations(),
            matched_count=matched_count,
            mismatched_count=mismatched_count,
            source_orphan_count=source_orphan_count,
            target_orphan_count=target_orphan_count,
            source_data_hash=source_hash,
            target_data_hash=target_hash,
            options=self.options,
        )

        return result

    def emit_audit_bundle(
        self, result: ReconciliationResult, output_dir: str
    ) -> Dict[str, str]:
        """Emit all audit artifacts to output directory.

        Returns:
            Dict mapping artifact name to file path
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        artifacts = {}

        # 1. recon_run.json - Complete run record
        run_file = output_path / "recon_run.json"
        run_data = result.to_dict()
        run_data["truth_table"] = [e.to_dict() for e in result.truth_table]

        with open(run_file, "w", encoding="utf-8") as f:
            json.dump(run_data, f, indent=2, default=str)
        artifacts["recon_run"] = str(run_file)

        # 2. recon_truth_table.csv - Row-by-row truth table
        truth_file = output_path / "recon_truth_table.csv"
        with open(truth_file, "w", newline="", encoding="utf-8") as f:
            if result.truth_table:
                writer = csv.writer(f)
                writer.writerow([
                    "source_record_id",
                    "target_record_id",
                    "match_status",
                    "rule_applied",
                    "confidence",
                    "explanation",
                    "source_values",
                    "target_values",
                    "differences",
                    "timestamp",
                ])
                for entry in result.truth_table:
                    writer.writerow([
                        entry.source_record_id,
                        entry.target_record_id,
                        entry.match_status.value,
                        entry.rule_applied,
                        entry.confidence,
                        entry.explanation,
                        json.dumps(entry.source_values),
                        json.dumps(entry.target_values),
                        json.dumps(entry.differences),
                        entry.timestamp,
                    ])
        artifacts["truth_table"] = str(truth_file)

        # 3. recon_exceptions.md - Human-readable exceptions
        exc_file = output_path / "recon_exceptions.md"
        with open(exc_file, "w", encoding="utf-8") as f:
            f.write(f"# Reconciliation Exceptions Report\n\n")
            f.write(f"**Run ID:** {result.run_id}\n")
            f.write(f"**Completed:** {result.completed_at}\n")
            f.write(f"**Match Rate:** {result.match_rate:.2%}\n\n")

            # Summary
            f.write("## Summary\n\n")
            f.write(f"- Total Source Records: {result.total_source}\n")
            f.write(f"- Total Target Records: {result.total_target}\n")
            f.write(f"- Matched: {result.matched_count}\n")
            f.write(f"- Mismatched: {result.mismatched_count}\n")
            f.write(f"- Source Orphans: {result.source_orphan_count}\n")
            f.write(f"- Target Orphans: {result.target_orphan_count}\n\n")

            # Invariant violations
            if result.invariant_violations:
                f.write("## Invariant Violations\n\n")
                for v in result.invariant_violations:
                    emoji = "🔴" if v.severity == Severity.BLOCKER else "🟡"
                    f.write(f"### {emoji} {v.invariant_name} ({v.severity.value})\n\n")
                    f.write(f"**Message:** {v.message}\n\n")
                    if v.details:
                        f.write(f"**Details:**\n```json\n{json.dumps(v.details, indent=2)}\n```\n\n")
                    if v.remediation:
                        f.write(f"**Remediation:** {v.remediation}\n\n")

            # Exceptions by type
            f.write("## Detailed Exceptions\n\n")

            mismatches = [e for e in result.truth_table if e.match_status == MatchStatus.MISMATCHED]
            if mismatches:
                f.write("### Mismatched Records\n\n")
                f.write("| Source ID | Target ID | Rule | Explanation |\n")
                f.write("|-----------|-----------|------|-------------|\n")
                for e in mismatches[:50]:  # Limit to 50
                    f.write(f"| {e.source_record_id} | {e.target_record_id} | {e.rule_applied} | {e.explanation} |\n")
                f.write("\n")

            source_orphans = [e for e in result.truth_table if e.match_status == MatchStatus.SOURCE_ORPHAN]
            if source_orphans:
                f.write("### Source Orphans\n\n")
                f.write("These source records had no matching target:\n\n")
                for e in source_orphans[:20]:  # Limit to 20
                    f.write(f"- `{e.source_record_id}`: {e.explanation}\n")
                f.write("\n")

            target_orphans = [e for e in result.truth_table if e.match_status == MatchStatus.TARGET_ORPHAN]
            if target_orphans:
                f.write("### Target Orphans\n\n")
                f.write("These target records had no matching source:\n\n")
                for e in target_orphans[:20]:  # Limit to 20
                    f.write(f"- `{e.target_record_id}`: {e.explanation}\n")
                f.write("\n")

        artifacts["exceptions"] = str(exc_file)

        # 4. policy_violations.json - Structured invariant violations
        if result.invariant_violations:
            viol_file = output_path / "policy_violations.json"
            with open(viol_file, "w", encoding="utf-8") as f:
                json.dump(
                    [v.to_dict() for v in result.invariant_violations],
                    f,
                    indent=2,
                    default=str,
                )
            artifacts["policy_violations"] = str(viol_file)

        return artifacts


def reconcile(
    source_records: List[Dict[str, Any]],
    target_records: List[Dict[str, Any]],
    match_keys: List[str],
    options: Optional[Dict[str, Any]] = None,
    output_dir: Optional[str] = None,
) -> Tuple[ReconciliationResult, Optional[Dict[str, str]]]:
    """Convenience function to run reconciliation and optionally emit artifacts.

    Returns:
        Tuple of (result, artifacts_dict or None)
    """
    engine = ReconciliationEngine(
        source_records=source_records,
        target_records=target_records,
        match_keys=match_keys,
        options=options,
    )

    result = engine.reconcile()

    artifacts = None
    if output_dir:
        artifacts = engine.emit_audit_bundle(result, output_dir)

    return result, artifacts
