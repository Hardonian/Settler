"""Integration module for ReadyLayer readiness format.

This module provides adapters to convert Reconciliation Truth & Proof Engine
outputs into the ReadyLayer readiness format for CI/CD integration.
"""

from typing import Any, Dict, List

from reconciliation_engine.engine import (
    InvariantViolation,
    ReconciliationResult,
    Severity,
    TruthTableEntry,
)


def to_readylayer_format(result: ReconciliationResult) -> Dict[str, Any]:
    """Convert reconciliation result to ReadyLayer readiness format.

    ReadyLayer expects a standardized format for CI/CD integration:
    {
        "component": str,
        "status": "ready" | "not_ready" | "degraded",
        "checks": [...],
        "metadata": {...}
    }
    """
    # Determine overall status
    if result.has_blocker_violations:
        status = "not_ready"
    elif result.invariant_violations:
        status = "degraded"
    elif result.match_rate < 0.5:
        status = "degraded"
    else:
        status = "ready"

    # Build checks list
    checks = []

    # 1. Match rate check
    checks.append({
        "name": "reconciliation_match_rate",
        "status": "pass" if result.match_rate >= 0.9 else "warn" if result.match_rate >= 0.5 else "fail",
        "value": result.match_rate,
        "threshold": 0.9,
        "message": f"Match rate: {result.match_rate:.2%}",
    })

    # 2. Orphan check
    total_orphans = result.source_orphan_count + result.target_orphan_count
    checks.append({
        "name": "reconciliation_orphans",
        "status": "pass" if total_orphans == 0 else "warn" if total_orphans < 5 else "fail",
        "value": total_orphans,
        "threshold": 0,
        "message": f"Orphans: {result.source_orphan_count} source, {result.target_orphan_count} target",
    })

    # 3. Invariant checks
    for violation in result.invariant_violations:
        checks.append({
            "name": f"invariant_{violation.invariant_name}",
            "status": "fail" if violation.severity == Severity.BLOCKER else "warn",
            "value": violation.severity.value,
            "message": violation.message,
            "details": violation.details,
        })

    # 4. Data integrity check
    checks.append({
        "name": "reconciliation_data_integrity",
        "status": "pass" if not result.has_blocker_violations else "fail",
        "value": len(result.invariant_violations),
        "message": f"{len(result.invariant_violations)} invariant violations",
    })

    # Build metadata
    metadata = {
        "run_id": result.run_id,
        "completed_at": result.completed_at,
        "total_records": result.total_source + result.total_target,
        "match_keys": result.match_keys,
        "source_data_hash": result.source_data_hash,
        "target_data_hash": result.target_data_hash,
        "options": result.options,
    }

    return {
        "component": "reconciliation_engine",
        "status": status,
        "checks": checks,
        "metadata": metadata,
    }


def to_github_actions_output(result: ReconciliationResult) -> Dict[str, str]:
    """Convert result to GitHub Actions workflow output format.

    Returns key-value pairs that can be set as GITHUB_OUTPUT.
    """
    return {
        "recon_run_id": result.run_id,
        "recon_status": "success" if not result.has_blocker_violations else "failure",
        "recon_match_rate": str(result.match_rate),
        "recon_matched": str(result.matched_count),
        "recon_mismatched": str(result.mismatched_count),
        "recon_orphans": str(result.source_orphan_count + result.target_orphan_count),
        "recon_has_violations": str(len(result.invariant_violations) > 0).lower(),
        "recon_has_blockers": str(result.has_blocker_violations).lower(),
    }


def to_junit_xml(result: ReconciliationResult) -> str:
    """Convert result to JUnit XML format for test reporting.

    This allows reconciliation results to appear in CI test reports.
    """
    import xml.etree.ElementTree as ET

    # Create root testsuite
    testsuite = ET.Element("testsuite")
    testsuite.set("name", "ReconciliationEngine")
    testsuite.set("tests", str(len(result.truth_table)))
    testsuite.set(
        "failures",
        str(result.mismatched_count + result.source_orphan_count + result.target_orphan_count),
    )
    testsuite.set("errors", str(len(result.invariant_violations)))
    testsuite.set("timestamp", result.completed_at)

    # Add test cases for invariant violations
    for violation in result.invariant_violations:
        testcase = ET.SubElement(testsuite, "testcase")
        testcase.set("name", f"invariant_{violation.invariant_name}")
        testcase.set("classname", "ReconciliationEngine.Invariant")

        if violation.severity == Severity.BLOCKER:
            failure = ET.SubElement(testcase, "failure")
            failure.set("type", "blocker")
            failure.text = violation.message
        elif violation.severity == Severity.HIGH:
            warning = ET.SubElement(testcase, "skipped")  # Using skipped for warnings
            warning.set("message", violation.message)

    # Add summary test case
    summary = ET.SubElement(testsuite, "testcase")
    summary.set("name", "reconciliation_summary")
    summary.set("classname", "ReconciliationEngine")
    summary.set("time", "0")

    if result.has_blocker_violations:
        failure = ET.SubElement(summary, "failure")
        failure.set("type", "blocker")
        failure.text = f"BLOCKER violations detected: {len([v for v in result.invariant_violations if v.severity == Severity.BLOCKER])}"

    # Add properties with metadata
    properties = ET.SubElement(testsuite, "properties")
    for key, value in result.to_dict().items():
        if isinstance(value, (str, int, float, bool)):
            prop = ET.SubElement(properties, "property")
            prop.set("name", key)
            prop.set("value", str(value))

    return ET.tostring(testsuite, encoding="unicode")


def emit_readylayer_report(
    result: ReconciliationResult,
    output_path: str,
    formats: List[str] = None,
) -> Dict[str, str]:
    """Emit ReadyLayer-compatible reports in multiple formats.

    Args:
        result: Reconciliation result
        output_path: Base output path
        formats: List of formats to emit (readylayer, github, junit)

    Returns:
        Dict mapping format to file path
    """
    import json
    from pathlib import Path

    formats = formats or ["readylayer", "github", "junit"]
    output_dir = Path(output_path)
    output_dir.mkdir(parents=True, exist_ok=True)

    emitted = {}

    if "readylayer" in formats:
        path = output_dir / "readylayer_recon.json"
        with open(path, "w") as f:
            json.dump(to_readylayer_format(result), f, indent=2)
        emitted["readylayer"] = str(path)

    if "github" in formats:
        path = output_dir / "github_actions.env"
        with open(path, "w") as f:
            for key, value in to_github_actions_output(result).items():
                f.write(f"{key}={value}\n")
        emitted["github"] = str(path)

    if "junit" in formats:
        path = output_dir / "recon_junit.xml"
        with open(path, "w") as f:
            f.write(to_junit_xml(result))
        emitted["junit"] = str(path)

    return emitted
