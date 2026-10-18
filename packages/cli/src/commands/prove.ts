import { Command } from "commander";
import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import {
  buildProofpack,
  loadProofpackByExecutionId,
  verifyProofpack,
  writeProofpack,
} from "../lib/proof-engine";
import { buildAirGappedProofpackTarball } from "../lib/airgapped-tarball";

export const proveCommand = new Command("prove")
  .description("Generate machine-verifiable proof artifacts")
  .option("-e, --execution-id <executionId>", "Execution id", `exec-${Date.now()}`)
  .action(async (options: { executionId: string }) => {
    const pack = buildProofpack(options.executionId);
    const out = await writeProofpack(pack);
    console.log(chalk.green("PASS"));
    console.log(`execution_id=${pack.execution_id}`);
    console.log(`state_hash=${pack.state_hash}`);
    console.log(`replay_equivalence=${pack.replay_equivalence}`);
    console.log(`proofpack=${out}`);
  });

proveCommand
  .command("export-airgapped")
  .description("Export self-contained air-gapped proofpackage tarball (.tar.gz)")
  .option("-e, --execution-id <executionId>", "Execution id", `exec-${Date.now()}`)
  .option("-o, --output <output>", "Output file path")
  .action(async (options: { executionId: string; output?: string }) => {
    const pack = buildProofpack(options.executionId);
    const { tarball, rootHash } = buildAirGappedProofpackTarball(pack);
    const defaultFile = `proofpack-${options.executionId}.tar.gz`;
    const outFile = options.output || path.join(process.cwd(), "proofpacks", defaultFile);
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, tarball);

    console.log(chalk.green("✓ Air-Gapped Proofpack Exported Successfully"));
    console.log(`execution_id=${pack.execution_id}`);
    console.log(`merkle_root=${rootHash}`);
    console.log(`tarball_size=${tarball.length} bytes`);
    console.log(`tarball_path=${outFile}`);
  });

export const verifyCommand = new Command("verify")
  .description("Verify a proofpack receipt")
  .argument("<proofpack>", "Path to proofpack.json")
  .action(async (proofpackPath: string) => {
    const raw = await fs.readFile(proofpackPath, "utf8");
    const pack = JSON.parse(raw);
    const result = verifyProofpack(pack);
    if (!result.valid) {
      console.log(chalk.red("INVALID"));
      console.log(`reason=${result.reason}`);
      process.exit(1);
    }
    console.log(chalk.green("VALID"));
    console.log(`execution_id=${pack.execution_id}`);
  });

export const replayExecutionCommand = new Command("replay")
  .description("Deterministically reconstruct a prior execution from proofpacks")
  .argument("<execution_id>", "Execution id")
  .option("--step", "Print state transitions")
  .option("--trace", "Print full trace JSON")
  .option("--explain", "Print replay explanation")
  .action(
    async (
      executionId: string,
      options: { step?: boolean; trace?: boolean; explain?: boolean }
    ) => {
      const pack = await loadProofpackByExecutionId(executionId);
      const result = verifyProofpack(pack);
      if (!result.valid) {
        console.error(chalk.red(`Replay validation failed: ${result.reason}`));
        process.exit(1);
      }
      console.log(chalk.green("Replay deterministic"));
      console.log(`state_hash=${pack.state_hash}`);
      if (options.step) {
        for (const step of pack.trace)
          console.log(`${step.stepId} ${step.transition} ${step.stateHash}`);
      }
      if (options.trace) console.log(JSON.stringify(pack.trace, null, 2));
      if (options.explain)
        console.log(
          "Replay reused recorded input/policy/tool outputs and recomputed workflow hash over transition state hashes."
        );
    }
  );
