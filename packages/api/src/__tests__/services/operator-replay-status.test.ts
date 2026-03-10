import fs from "node:fs";
import path from "node:path";
import { getOperatorReplayStatus } from "../../services/operator-mode/replay-status";

describe("getOperatorReplayStatus", () => {
  const artifactDir = path.resolve("artifacts", "replay-verification");
  const runId = "run-test-replay-status";
  const reportPath = path.join(artifactDir, `${runId}.json`);

  afterEach(() => {
    if (fs.existsSync(reportPath)) {
      fs.unlinkSync(reportPath);
    }
  });

  test("returns not_found when report does not exist", () => {
    const status = getOperatorReplayStatus("missing-run", "tenant-a");
    expect(status.replay_status).toBe("not_found");
    expect(status.hash_match).toBe(false);
  });

  test("returns report when tenant matches", () => {
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify({
        run_id: runId,
        tenant_id: "tenant-a",
        replay_status: "matched",
        divergence: null,
        execution_time_ms: 9,
        hash_match: true,
      })
    );

    const status = getOperatorReplayStatus(runId, "tenant-a");
    expect(status.replay_status).toBe("matched");
    expect(status.hash_match).toBe(true);
    expect(status.execution_time).toBe(9);
  });

  test("hides report from mismatched tenant", () => {
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(
      reportPath,
      JSON.stringify({
        run_id: runId,
        tenant_id: "tenant-a",
        replay_status: "diverged",
        divergence: { field_differences: ["$.x"] },
        execution_time_ms: 3,
        hash_match: false,
      })
    );

    const status = getOperatorReplayStatus(runId, "tenant-b");
    expect(status.replay_status).toBe("not_found");
    expect(status.hash_match).toBe(false);
  });
});
