import { executeOneToOneMatching } from "../../services/ingestion/reconciliation-matcher";

describe("executeOneToOneMatching", () => {
  test("prevents duplicate target assignment across sources", async () => {
    const matcher = jest.fn(async (sourceId: string) => ({
      sourceTransactionId: sourceId,
      targetTransactionId: "target-1",
      matchType: "exact" as const,
      confidence: 0.95,
    }));

    const result = await executeOneToOneMatching(["source-1", "source-2"], ["target-1"], matcher);

    expect(matcher).toHaveBeenNthCalledWith(1, "source-1", ["target-1"]);
    expect(matcher).toHaveBeenNthCalledWith(2, "source-2", []);

    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedSourceCount).toBe(1);
    expect(result.unmatchedTargetCount).toBe(0);
    expect(result.matches).toHaveLength(2);
    expect(result.matches[1]).toMatchObject({
      sourceTransactionId: "source-2",
      matchType: "unmatched",
      confidence: 0,
    });
  });

  test("tracks unmatched target count from remaining targets", async () => {
    const matcher = jest.fn(async () => ({
      sourceTransactionId: "source-1",
      targetTransactionId: "target-1",
      matchType: "fuzzy" as const,
      confidence: 0.8,
    }));

    const result = await executeOneToOneMatching(["source-1"], ["target-1", "target-2"], matcher);

    expect(result.matchedCount).toBe(1);
    expect(result.unmatchedSourceCount).toBe(0);
    expect(result.unmatchedTargetCount).toBe(1);
  });

  test("treats null matcher output as unmatched source", async () => {
    const matcher = jest.fn(async () => null);

    const result = await executeOneToOneMatching(["source-1"], ["target-1"], matcher);

    expect(result.matches).toHaveLength(0);
    expect(result.matchedCount).toBe(0);
    expect(result.unmatchedSourceCount).toBe(1);
    expect(result.unmatchedTargetCount).toBe(1);
  });
});

