import { Command } from "commander";
import chalk from "chalk";

type ReplayDiffEntry = {
  path: string;
  source: "connector_output" | "policy_change" | "artifact_mutation";
  original: unknown;
  replay: unknown;
};

type ReplayReport = {
  executionId: string;
  replayRunId: string;
  deterministic: boolean;
  summary: {
    totalSteps: number;
    divergedSteps: number;
    divergenceSources: Record<string, number>;
  };
  timeline: Array<{
    id: string;
    index: number;
    name: string;
    status: "ok" | "diverged";
    durationMs: number;
    divergenceSources: string[];
    originalResult: Record<string, unknown>;
    replayResult: Record<string, unknown>;
  }>;
  diff: {
    entries: ReplayDiffEntry[];
  };
  controls: {
    breakpoints: number[];
  };
};

function normalizeBaseUrl(baseUrl?: string): string {
  const resolved = baseUrl ?? process.env.SETTLER_BASE_URL ?? "http://localhost:3000";
  return resolved.endsWith("/") ? resolved.slice(0, -1) : resolved;
}

function printStepDetail(report: ReplayReport, index: number): void {
  const step = report.timeline[index];
  if (!step) {
    console.log(
      chalk.yellow(`Requested step ${index + 1} is out of range (1-${report.timeline.length})`)
    );
    return;
  }

  console.log(chalk.bold(`\nStep ${step.index + 1}: ${step.name}`));
  console.log(`status=${step.status} duration_ms=${step.durationMs}`);
  if (step.divergenceSources.length > 0) {
    console.log(`divergence_sources=${step.divergenceSources.join(",")}`);
  }
  console.log(`original_result=${JSON.stringify(step.originalResult)}`);
  console.log(`replay_result=${JSON.stringify(step.replayResult)}`);
}

export const replayCommand = new Command("replay")
  .description("Replay an execution deterministically and inspect divergence")
  .argument("<executionID>", "Execution identifier to replay")
  .option(
    "-u, --base-url <url>",
    "Settler base URL (defaults to SETTLER_BASE_URL or http://localhost:3000)"
  )
  .option("--step <index>", "Inspect a specific step (1-indexed)", "1")
  .option("--breakpoint", "Jump inspection to first replay breakpoint")
  .action(
    async (
      executionId: string,
      options: { baseUrl?: string; step: string; breakpoint?: boolean }
    ) => {
      const baseUrl = normalizeBaseUrl(options.baseUrl);
      const response = await fetch(`${baseUrl}/api/v1/runs/${executionId}/replay`, {
        method: "GET",
        headers: { "content-type": "application/json" },
      });

      if (!response.ok) {
        const body = await response.text();
        console.error(chalk.red(`Replay request failed (${response.status}): ${body}`));
        process.exit(1);
      }

      const report = (await response.json()) as ReplayReport;
      console.log(chalk.green(`Replay run created: ${report.replayRunId}`));
      console.log(`execution=${report.executionId}`);
      console.log(`deterministic=${report.deterministic}`);
      console.log(
        `steps_total=${report.summary.totalSteps} diverged=${report.summary.divergedSteps}`
      );

      const sourceSummary = Object.entries(report.summary.divergenceSources)
        .map(([source, count]) => `${source}:${count}`)
        .join(" ");
      console.log(`divergence_sources=${sourceSummary}`);

      const firstBreakpoint = report.controls.breakpoints[0] ?? 0;
      const requestedStepIndex = Math.max(0, Number.parseInt(options.step, 10) - 1);
      const stepIndex = options.breakpoint ? firstBreakpoint : requestedStepIndex;
      printStepDetail(report, stepIndex);

      if (report.diff.entries.length > 0) {
        console.log(chalk.yellow("\nDiff entries"));
        for (const entry of report.diff.entries.slice(0, 10)) {
          console.log(
            `- ${entry.path} [${entry.source}] original=${JSON.stringify(entry.original)} replay=${JSON.stringify(entry.replay)}`
          );
        }
      }
    }
  );
