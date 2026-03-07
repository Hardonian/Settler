import { Command } from "commander";
import { listChaosReports, runChaosDeterminismHarness } from "../lib/platform-extension";

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export const chaosCommand = new Command("chaos").description(
  "Chaos determinism reliability harness"
);

chaosCommand
  .command("run")
  .description("Run chaos suite with deterministic randomization")
  .option("--executions <count>", "Workflow executions", "10000")
  .option("--concurrency <count>", "Concurrent workflows", "1000")
  .option("--seed <seed>", "Deterministic seed", "42")
  .action((options: { executions: string; concurrency: string; seed: string }) => {
    const report = runChaosDeterminismHarness({
      executions: Number(options.executions),
      concurrency: Number(options.concurrency),
      seed: Number(options.seed),
    });
    printJson(report);
  });

chaosCommand
  .command("reports")
  .description("List stored chaos reports for historical comparison")
  .action(() => {
    printJson(listChaosReports());
  });
