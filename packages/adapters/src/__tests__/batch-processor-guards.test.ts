import { chunk, processInBatches } from "../performance/batch-processor";

describe("batch-processor guards", () => {
  it("chunk rejects invalid size", () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow(/chunk size/);
    expect(() => chunk([1, 2, 3], -1)).toThrow(/chunk size/);
    expect(() => chunk([1, 2, 3], 1.5)).toThrow(/chunk size/);
  });

  it("processInBatches rejects invalid batchSize", async () => {
    await expect(processInBatches([1], async (b) => b, { batchSize: 0 })).rejects.toThrow(
      /batchSize/
    );
  });

  it("processInBatches rejects invalid maxConcurrency", async () => {
    await expect(processInBatches([1], async (b) => b, { maxConcurrency: 0 })).rejects.toThrow(
      /maxConcurrency/
    );
  });
});
