import { describe, it, expect } from "vitest";
import { assessEvidenceCompleteness, EvidenceArtifactType, computeReliabilityScore } from "./index";

describe("assessEvidenceCompleteness", () => {
  it("returns a 1.0 completeness score when all required types are present", () => {
    const requiredTypes: EvidenceArtifactType[] = ["run_summary", "source_snapshot"];
    const presentTypes: EvidenceArtifactType[] = [
      "run_summary",
      "source_snapshot",
      "target_snapshot",
    ];

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
    const requiredTypes: EvidenceArtifactType[] = [
      "run_summary",
      "source_snapshot",
      "target_snapshot",
    ];
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

describe("computeReliabilityScore", () => {
  it("returns 0.5 when factors array is empty", () => {
    expect(computeReliabilityScore([])).toBe(0.5);
  });

  it("returns 0.5 when total weight is 0", () => {
    const factors = [
      { factor: "test1", weight: 0, value: 1.0 },
      { factor: "test2", weight: 0, value: 0.8 },
    ];
    expect(computeReliabilityScore(factors)).toBe(0.5);
  });

  it("calculates weighted sum correctly and rounds to 4 decimal places", () => {
    const factors = [
      { factor: "test1", weight: 0.3, value: 0.9 }, // 0.27
      { factor: "test2", weight: 0.7, value: 0.8 }, // 0.56
    ]; // totalWeight = 1.0, weightedSum = 0.83

    expect(computeReliabilityScore(factors)).toBe(0.83);
  });

  it("handles mixed weights and values accurately", () => {
    const factors = [
      { factor: "test1", weight: 0.25, value: 1.0 },
      { factor: "test2", weight: 0.25, value: 0.0 },
      { factor: "test3", weight: 0.5, value: 0.5 },
    ];
    // totalWeight = 1.0
    // weightedSum = 0.25*1 + 0 + 0.5*0.5 = 0.25 + 0.25 = 0.5
    expect(computeReliabilityScore(factors)).toBe(0.5);
  });

  it("handles total weights other than 1.0", () => {
    const factors = [
      { factor: "test1", weight: 2.0, value: 0.9 },
      { factor: "test2", weight: 3.0, value: 0.8 },
    ];
    // totalWeight = 5.0
    // weightedSum = 1.8 + 2.4 = 4.2
    // score = 4.2 / 5.0 = 0.84
    expect(computeReliabilityScore(factors)).toBe(0.84);
  });
});
