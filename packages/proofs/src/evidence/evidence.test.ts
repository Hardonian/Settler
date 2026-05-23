import { describe, it, expect } from "vitest";
import { assessEvidenceCompleteness, EvidenceArtifactType } from "./index";

describe("assessEvidenceCompleteness", () => {
  it("returns 1.0 completeness when no required evidence types are specified", () => {
    const presentTypes: EvidenceArtifactType[] = ["run_summary"];
    const requiredTypes: EvidenceArtifactType[] = [];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessScore).toBe(1.0);
    expect(result.missingEvidenceTypes.length).toBe(0);
    expect(result.completenessFlags.length).toBe(0);
    expect(result.gapAnalysis.length).toBe(0);
  });

  it("returns 1.0 completeness when all required types are present", () => {
    const presentTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot"];
    const requiredTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessScore).toBe(1.0);
    expect(result.missingEvidenceTypes.length).toBe(0);
    expect(result.completenessFlags.length).toBe(0);
    expect(result.gapAnalysis.length).toBe(0);
  });

  it("returns partial completeness when some required types are missing", () => {
    const presentTypes: EvidenceArtifactType[] = ["run_summary"];
    const requiredTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessScore).toBe(0.5);
    expect(result.missingEvidenceTypes).toContain("source_snapshot");
  });

  it("triggers CRITICAL flag and gap analysis when run_summary is missing", () => {
    const presentTypes: EvidenceArtifactType[] = ["source_snapshot"];
    const requiredTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessFlags).toContain("CRITICAL: Missing run summary");
    expect(result.gapAnalysis).toContainEqual({
      gapType: "missing_run_summary",
      description: "Run summary evidence is required for proof completeness",
      severity: "critical",
      suggestedRemediation: "Ensure run summary is captured after reconciliation completes",
    });
  });

  it("triggers HIGH flag and gap analysis when match_comparison is missing and exception_resolution is present", () => {
    const presentTypes: EvidenceArtifactType[] = ["exception_resolution", "run_summary"];
    const requiredTypes: EvidenceArtifactType[] = [
      "run_summary",
      "match_comparison",
      "exception_resolution",
    ];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessFlags).toContain("HIGH: Missing match comparison for exceptions");
    expect(result.gapAnalysis).toContainEqual({
      gapType: "missing_match_comparison",
      description: "Match comparison evidence should accompany exception resolutions",
      severity: "high",
    });
  });

  it("does not artificially inflate completeness score beyond 1.0 when extra unrequired types are present", () => {
    const presentTypes: EvidenceArtifactType[] = [
      "run_summary",
      "source_snapshot",
      "target_snapshot",
    ];
    const requiredTypes: EvidenceArtifactType[] = ["run_summary"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessScore).toBe(1.0);
  });
});
