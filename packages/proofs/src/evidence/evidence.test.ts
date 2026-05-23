import { describe, it, expect } from "vitest";
import { assessEvidenceCompleteness, EvidenceArtifactType } from "./index";

describe("assessEvidenceCompleteness", () => {
  it("returns a 1.0 completeness score when all required types are present", () => {
    const requiredTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot"];
    const presentTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot", "target_snapshot"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessScore).toBe(1.0);
    expect(result.missingEvidenceTypes).toHaveLength(0);
    expect(result.completenessFlags).toHaveLength(0);
    expect(result.gapAnalysis).toHaveLength(0);
  });

  it("returns a 1.0 completeness score when requiredTypes is empty", () => {
    const requiredTypes: EvidenceArtifactType[] = [];
    const presentTypes: EvidenceArtifactType[] = ["run_summary"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.completenessScore).toBe(1.0);
    expect(result.missingEvidenceTypes).toHaveLength(0);
    expect(result.completenessFlags).toHaveLength(0);
    expect(result.gapAnalysis).toHaveLength(0);
  });

  it("calculates partial completeness scores accurately", () => {
    const requiredTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot", "target_snapshot"];
    const presentTypes: EvidenceArtifactType[] = ["run_summary"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    // 1 present out of 3 required = 0.3333333333333333
    // Rounding should make it 0.3333
    expect(result.completenessScore).toBe(0.3333);
    expect(result.missingEvidenceTypes).toEqual(["source_snapshot", "target_snapshot"]);
  });

  it("identifies critical gap for missing run_summary", () => {
    const requiredTypes: EvidenceArtifactType[] = ["run_summary"];
    const presentTypes: EvidenceArtifactType[] = [];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.missingEvidenceTypes).toContain("run_summary");
    expect(result.completenessFlags).toContain("CRITICAL: Missing run summary");
    expect(result.gapAnalysis).toContainEqual(
      expect.objectContaining({
        gapType: "missing_run_summary",
        severity: "critical",
      })
    );
  });

  it("identifies high severity gap for missing match_comparison when exception_resolution is present", () => {
    const requiredTypes: EvidenceArtifactType[] = ["match_comparison"];
    const presentTypes: EvidenceArtifactType[] = ["exception_resolution"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.missingEvidenceTypes).toContain("match_comparison");
    expect(result.completenessFlags).toContain("HIGH: Missing match comparison for exceptions");
    expect(result.gapAnalysis).toContainEqual(
      expect.objectContaining({
        gapType: "missing_match_comparison",
        severity: "high",
      })
    );
  });

  it("does not identify high severity gap for missing match_comparison if exception_resolution is absent", () => {
    const requiredTypes: EvidenceArtifactType[] = ["match_comparison"];
    const presentTypes: EvidenceArtifactType[] = ["source_snapshot"];

    const result = assessEvidenceCompleteness(presentTypes, requiredTypes);

    expect(result.missingEvidenceTypes).toContain("match_comparison");
    expect(result.completenessFlags).not.toContain("HIGH: Missing match comparison for exceptions");
    expect(result.gapAnalysis).not.toContainEqual(
      expect.objectContaining({
        gapType: "missing_match_comparison",
      })
    );
  });
});
