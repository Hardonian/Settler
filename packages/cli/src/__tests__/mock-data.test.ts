declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import { generateMockDataset, DeterministicRng } from "../commands/mock-data";

describe("Deterministic Mock Data Generator", () => {
  it("generates identical outputs for identical seeds", () => {
    const run1 = generateMockDataset("tenant_sim", 50, 42);
    const run2 = generateMockDataset("tenant_sim", 50, 42);

    expect(run1).toEqual(run2);
  });

  it("generates distinct outputs for different seeds", () => {
    const runA = generateMockDataset("tenant_sim", 20, 100);
    const runB = generateMockDataset("tenant_sim", 20, 200);

    expect(runA[0]!.amountCents).not.toEqual(runB[0]!.amountCents);
  });

  it("enforces strict integer cents arithmetic and positive fees", () => {
    const dataset = generateMockDataset("tenant_sim", 100, 9999);

    for (const tx of dataset) {
      expect(Number.isInteger(tx.amountCents)).toBe(true);
      expect(Number.isInteger(tx.feeCents)).toBe(true);
      expect(tx.amountCents).toBeGreaterThan(0);
      expect(tx.feeCents).toBeGreaterThan(0);
      expect(tx.tenantId).toBe("tenant_sim");
    }
  });

  it("DeterministicRng produces uniform bounded values", () => {
    const rng = new DeterministicRng(1234);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(20);
    }
  });
});
