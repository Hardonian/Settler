import { canonicalJson, stableSortStrings } from "@/lib/determinism/core";
import { createDeterministicRun } from "@/lib/determinism/runs";

describe("deterministic core", () => {
  it("produces stable canonical JSON independent of object key insertion", () => {
    const a = { z: 3, a: 1, nested: { b: 2, a: 1 } };
    const b = { nested: { a: 1, b: 2 }, a: 1, z: 3 };

    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it("sorts strings by code point without locale sensitivity", () => {
    const originalLocale = process.env.LC_ALL;
    const originalTz = process.env.TZ;
    process.env.LC_ALL = "tr_TR.UTF-8";
    process.env.TZ = "Pacific/Kiritimati";

    const sorted = stableSortStrings(["z", "a", "ä", "A"]);

    expect(sorted).toEqual(["A", "a", "z", "ä"]);

    process.env.LC_ALL = originalLocale;
    process.env.TZ = originalTz;
  });

  it("creates the same run ID and evidence pointers across locale/timezone changes", () => {
    const input = {
      tenantId: "tenant_123",
      pipeline: "daily-settlement",
      config: {
        tolerances: { amount: 0.01 },
        sources: ["bank", "processor"],
        asOf: "2026-02-24",
      },
    };

    const first = createDeterministicRun(input);
    const originalLocale = process.env.LC_ALL;
    const originalTz = process.env.TZ;

    process.env.LC_ALL = "ja_JP.UTF-8";
    process.env.TZ = "America/Los_Angeles";
    const second = createDeterministicRun(input);

    expect(second).toEqual(first);

    process.env.LC_ALL = originalLocale;
    process.env.TZ = originalTz;
  });
});
