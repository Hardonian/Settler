import { describe, it, expect } from "vitest";
import {
  assessEvidenceCompleteness,
  EvidenceArtifactType,
  matchComparisonReliabilityFactors,
} from "./index";

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

describe("matchComparisonReliabilityFactors", () => {
  it("returns correct factors for perfect confidence and reliability", () => {
    const result = matchComparisonReliabilityFactors(1.0, 1.0, 1.0);
    expect(result).toHaveLength(4);
    expect(result).toEqual([
      {
        factor: "match_confidence",
        weight: 0.35,
        value: 1.0,
        notes: "Match confidence: 100.0%",
      },
      {
        factor: "source_reliability",
        weight: 0.25,
        value: 1.0,
        notes: "Source data reliability: 100.0%",
      },
      {
        factor: "target_reliability",
        weight: 0.25,
        value: 1.0,
        notes: "Target data reliability: 100.0%",
      },
      {
        factor: "comparison_method",
        weight: 0.15,
        value: 0.95,
        notes: "Deterministic field comparison",
      },
    ]);
  });

  it("returns correct factors for varied confidence and reliability", () => {
    const result = matchComparisonReliabilityFactors(0.8, 0.9, 0.75);
    expect(result).toHaveLength(4);
    expect(result).toEqual([
      {
        factor: "match_confidence",
        weight: 0.35,
        value: 0.8,
        notes: "Match confidence: 80.0%",
      },
      {
        factor: "source_reliability",
        weight: 0.25,
        value: 0.9,
        notes: "Source data reliability: 90.0%",
      },
      {
        factor: "target_reliability",
        weight: 0.25,
        value: 0.75,
        notes: "Target data reliability: 75.0%",
      },
      {
        factor: "comparison_method",
        weight: 0.15,
        value: 0.95,
        notes: "Deterministic field comparison",
      },
    ]);
  });

  it("returns correct factors for zero confidence and reliability", () => {
    const result = matchComparisonReliabilityFactors(0, 0, 0);
    expect(result).toHaveLength(4);
    expect(result).toEqual([
      {
        factor: "match_confidence",
        weight: 0.35,
        value: 0,
        notes: "Match confidence: 0.0%",
      },
      {
        factor: "source_reliability",
        weight: 0.25,
        value: 0,
        notes: "Source data reliability: 0.0%",
      },
      {
        factor: "target_reliability",
        weight: 0.25,
        value: 0,
        notes: "Target data reliability: 0.0%",
      },
      {
        factor: "comparison_method",
        weight: 0.15,
        value: 0.95,
        notes: "Deterministic field comparison",
      },
    ]);
  });
});
