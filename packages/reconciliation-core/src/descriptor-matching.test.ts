import {
  computeLevenshteinDistance,
  computeJaroBps,
  computeJaroWinklerBps,
  normalizeDescriptor,
  matchDescriptorToCandidates,
} from "./descriptor-matching";

describe("Fuzzy Descriptor Matching", () => {
  const tenantId = "tenant_descriptor_test";

  it("normalizes banking descriptors by stripping noise tokens", () => {
    const raw = "ACH DIR DEP STRIPE PAYMENTS INC DES:SETTLER CO ID:98765";
    const cleaned = normalizeDescriptor(raw);
    expect(cleaned).toBe("stripe settler 98765");
  });

  it("calculates Levenshtein distance accurately", () => {
    expect(computeLevenshteinDistance("kitten", "sitting")).toBe(3);
    expect(computeLevenshteinDistance("settler", "settler")).toBe(0);
    expect(computeLevenshteinDistance("", "stripe")).toBe(6);
  });

  it("calculates Jaro and Jaro-Winkler similarity in exact integer basis points", () => {
    // Identical = 10000 bps
    expect(computeJaroBps("stripe", "stripe")).toBe(10000);
    expect(computeJaroWinklerBps("stripe", "stripe")).toBe(10000);

    // Empty = 0 bps
    expect(computeJaroBps("", "stripe")).toBe(0);

    // Common prefix bonus: "dwayne" vs "duane"
    const jaro = computeJaroBps("dwayne", "duane");
    const jaroWinkler = computeJaroWinklerBps("dwayne", "duane");
    expect(jaroWinkler).toBeGreaterThan(jaro);
    expect(jaroWinkler).toBeGreaterThan(8000);
  });

  it("matches noisy statement narrative to merchant candidates", () => {
    const rawNarrative = "EDI PYMNTS SPOTIFY USA CORP POS DEBIT";
    const candidates = ["Apple Inc", "Spotify Technology", "Netflix Streaming", "Amazon Retail"];

    const matches = matchDescriptorToCandidates(tenantId, rawNarrative, candidates, 8000);

    expect(matches[0]!.candidate).toBe("Spotify Technology");
    expect(matches[0]!.isMatch).toBe(true);
    expect(matches[0]!.similarityBps).toBeGreaterThan(8000);

    // Other non-matching candidates should be below threshold
    expect(matches[1]!.isMatch).toBe(false);
  });

  it("fails fast if tenantId invariant is violated", () => {
    expect(() => matchDescriptorToCandidates("", "TEST", ["TEST"])).toThrow(
      /Tenant isolation invariant violation/
    );
  });
});
