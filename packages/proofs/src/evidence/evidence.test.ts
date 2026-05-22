import { describe, it, expect } from "vitest";
import { computeReliabilityScore, EvidenceReliabilityFactor } from "./index";

describe("computeReliabilityScore", () => {
  it("returns 0.5 for an empty array of factors", () => {
    expect(computeReliabilityScore([])).toBe(0.5);
  });

  it("returns 0.5 when total weight of all factors is 0", () => {
    const factors: EvidenceReliabilityFactor[] = [
      { factor: "a", weight: 0, value: 1 },
      { factor: "b", weight: 0, value: 0.8 },
    ];
    expect(computeReliabilityScore(factors)).toBe(0.5);
  });

  it("computes the correct score for a single factor", () => {
    const factors: EvidenceReliabilityFactor[] = [
      { factor: "a", weight: 0.5, value: 0.8 },
    ];
    expect(computeReliabilityScore(factors)).toBe(0.8);
  });

  it("computes the correct weighted average for multiple factors", () => {
    const factors: EvidenceReliabilityFactor[] = [
      { factor: "a", weight: 0.5, value: 0.8 }, // 0.4
      { factor: "b", weight: 0.5, value: 0.6 }, // 0.3
    ];
    // Total weight = 1.0, weighted sum = 0.7 => 0.7
    expect(computeReliabilityScore(factors)).toBe(0.7);
  });

  it("rounds the result to 4 decimal places", () => {
    const factors: EvidenceReliabilityFactor[] = [
      { factor: "a", weight: 1, value: 1/3 }, // 0.3333333333333333
    ];
    expect(computeReliabilityScore(factors)).toBe(0.3333);
  });

  it("handles different weights correctly", () => {
    const factors: EvidenceReliabilityFactor[] = [
      { factor: "a", weight: 0.8, value: 0.9 }, // 0.72
      { factor: "b", weight: 0.2, value: 0.4 }, // 0.08
    ];
    // Total weight = 1.0, weighted sum = 0.8 => 0.8
    expect(computeReliabilityScore(factors)).toBe(0.8);
  });
});
