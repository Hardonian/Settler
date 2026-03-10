declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import {
  buildReplayBundle,
  runReplayVerification,
  type ReplayBundle,
} from "../lib/replay-verification";

describe("replay verification", () => {
  test("replays 10 historical runs with identical outputs", async () => {
    const reports = await Promise.all(
      Array.from({ length: 10 }, async (_, index) => {
        const seed = index + 1;
        const bundle = await buildReplayBundle(seed, `historical-${seed}`);
        return runReplayVerification(bundle);
      })
    );

    expect(reports.every((report) => report.hash_match)).toBe(true);
    expect(reports.every((report) => report.replay_status === "matched")).toBe(true);
  });

  test("replays 50 random simulation runs with identical outputs", async () => {
    let rng = 1337;
    const nextSeed = () => {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      return (rng % 100000) + 100;
    };

    const reports = await Promise.all(
      Array.from({ length: 50 }, async () => {
        const seed = nextSeed();
        const bundle = await buildReplayBundle(seed, `random-${seed}`);
        return runReplayVerification(bundle);
      })
    );

    expect(reports.every((report) => report.hash_match)).toBe(true);
    expect(reports.every((report) => report.replay_status === "matched")).toBe(true);
  });

  test("detects divergence and emits detailed report", async () => {
    const bundle = await buildReplayBundle(42, "divergence-case");
    const tampered: ReplayBundle = {
      ...bundle,
      original_output: {
        ...bundle.original_output,
        policy_evaluations: {
          ...bundle.original_output.policy_evaluations,
          EXACT_MATCH: (bundle.original_output.policy_evaluations.EXACT_MATCH ?? 0) + 1,
        },
      },
    };

    const report = await runReplayVerification(tampered);
    expect(report.hash_match).toBe(false);
    expect(report.replay_status).toBe("diverged");
    expect(report.divergence?.field_differences.length).toBeGreaterThan(0);
    expect(report.divergence?.policy_path_differences.length).toBeGreaterThan(0);
    expect(report.divergence?.timing_differences.length).toBeGreaterThan(0);
  });
});
