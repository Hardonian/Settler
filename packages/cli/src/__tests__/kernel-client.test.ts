declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import {
  canonicalizeHashWithFallback,
  readKernelFlags,
  tsCanonicalizeHash,
} from "../lib/kernel-client";

describe("kernel client", () => {
  test("reads feature flags conservatively", () => {
    const flags = readKernelFlags({
      SETTLER_KERNEL_ENABLED: "1",
      SETTLER_KERNEL_CANONICALIZE: "0",
      SETTLER_KERNEL_SHADOW_MODE: "1",
    } as NodeJS.ProcessEnv);

    expect(flags.enabled).toBe(true);
    expect(flags.canonicalize).toBe(false);
    expect(flags.shadowMode).toBe(true);
  });

  test("ts canonicalization is stable across key order", () => {
    const a = tsCanonicalizeHash({ z: 1, a: { m: 2, b: 3 } });
    const b = tsCanonicalizeHash({ a: { b: 3, m: 2 }, z: 1 });

    expect(a.normalizedHash).toBe(b.normalizedHash);
  });

  test("falls back to ts when kernel disabled", async () => {
    process.env.SETTLER_KERNEL_ENABLED = "0";
    process.env.SETTLER_KERNEL_CANONICALIZE = "0";
    process.env.SETTLER_KERNEL_SHADOW_MODE = "0";

    const result = await canonicalizeHashWithFallback({ b: 1, a: 2 });
    expect(result.mode).toBe("ts");
    expect(result.result.normalizedHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
