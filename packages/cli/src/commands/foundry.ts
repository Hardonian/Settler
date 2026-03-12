import { Command } from "commander";
import { execSync } from "child_process";
import {
  FoundryFileStore,
  createCoreVectorDataset,
  createFaultDataset,
  createMetamorphicDataset,
  runDataset,
} from "../lib/foundry";
import {
  exportReconciliationSuiteWithKernel,
  generateReconciliationSuite,
  validateSuiteDeterminism,
  verifyReconciliationContract,
} from "../lib/reconciliation-foundry";

function parseSeeds(raw: string): number[] {
  return raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((v) => Number.isFinite(v) && v > 0);
}

function logJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

const vectorsCommand = new Command("vectors")
  .description("Manage deterministic vector suites")
  .command("list")
  .description("List vector datasets")
  .action(() => {
    const store = new FoundryFileStore();
    logJson(store.getDatasets().filter((dataset) => dataset.dataset_type === "VECTORS"));
  }).parent!;

vectorsCommand
  .command("run")
  .description("Run vector suite")
  .option("--suite <name>", "Suite name", "core")
  .option("--seeds <seeds>", "Comma separated seeds", "1,2,3")
  .action((options: { suite: string; seeds: string }) => {
    const store = new FoundryFileStore();
    const seedList = parseSeeds(options.seeds);
    const { dataset, items } = createCoreVectorDataset(seedList);
    store.upsertDataset(dataset);
    store.replaceDatasetItems(dataset.dataset_id, items);
    const { run } = runDataset(store, dataset.dataset_id, false);
    logJson({ dataset_id: dataset.dataset_id, run_id: run.dataset_run_id, items: items.length });
  });

vectorsCommand
  .command("report")
  .description("Report recent vector runs")
  .option("--last <count>", "Number of runs", "1")
  .action((options: { last: string }) => {
    const count = Number(options.last) || 1;
    const store = new FoundryFileStore();
    const datasets = new Set(
      store
        .getDatasets()
        .filter((dataset) => dataset.dataset_type === "VECTORS")
        .map((dataset) => dataset.dataset_id)
    );
    const runs = store
      .getRuns()
      .filter((run) => datasets.has(run.dataset_id))
      .slice(-count);
    logJson(runs);
  });

export const foundryCommand = new Command("foundry").description("Test data foundry operations");

foundryCommand
  .command("generate")
  .description("Generate dataset artifacts")
  .option("--type <type>", "vectors|metamorphic|faults", "vectors")
  .option("--seeds <seeds>", "Comma separated seeds", "1,2,3")
  .option("--per <count>", "Variants per base item", "2")
  .action((options: { type: string; seeds: string; per: string }) => {
    const store = new FoundryFileStore();
    if (options.type === "vectors") {
      const { dataset, items } = createCoreVectorDataset(parseSeeds(options.seeds));
      store.upsertDataset(dataset);
      store.replaceDatasetItems(dataset.dataset_id, items);
      logJson({ generated: dataset.dataset_id, items: items.length });
      return;
    }

    if (options.type === "metamorphic") {
      const base = store
        .getItems()
        .filter((item) => item.kind === "VECTOR_RUN" || item.kind === "ROUTE_SMOKE");
      const { dataset, items } = createMetamorphicDataset(
        base,
        Number(options.per) || 2,
        parseSeeds(options.seeds)[0] ?? 1
      );
      store.upsertDataset(dataset);
      store.replaceDatasetItems(dataset.dataset_id, items);
      logJson({ generated: dataset.dataset_id, items: items.length });
      return;
    }

    if (options.type === "faults") {
      const { dataset, items } = createFaultDataset(parseSeeds(options.seeds)[0] ?? 1);
      store.upsertDataset(dataset);
      store.replaceDatasetItems(dataset.dataset_id, items);
      logJson({ generated: dataset.dataset_id, items: items.length });
      return;
    }

    throw new Error(`Unsupported dataset type: ${options.type}`);
  });

foundryCommand
  .command("mine")
  .description("Mine git history for candidate fixes")
  .option("--limit <limit>", "Number of commits", "25")
  .action((options: { limit: string }) => {
    const limit = Number(options.limit) || 25;
    const log = execSync(`git log --date=short --pretty=format:%H%x09%P%x09%s -n ${limit}`, {
      encoding: "utf8",
    });
    const candidates = log
      .split("\n")
      .map((line) => {
        const [commit = "", parents = "", subject = ""] = line.split("\t");
        return { commit, parent: parents.split(" ")[0] ?? "", subject };
      })
      .filter((entry) => /(fix|bug|hotfix|regression|revert|ci|build)/i.test(entry.subject))
      .sort((a, b) => a.commit.localeCompare(b.commit));

    logJson({ mined: candidates.length, candidates });
  });

foundryCommand
  .command("run")
  .description("Run a foundry dataset")
  .requiredOption("--dataset <id>", "Dataset id")
  .action((options: { dataset: string }) => {
    const store = new FoundryFileStore();
    const { run } = runDataset(store, options.dataset, false);
    logJson(run);
  });

foundryCommand
  .command("report")
  .description("Print recent dataset runs")
  .option("--last <count>", "Number of runs", "1")
  .action((options: { last: string }) => {
    const count = Number(options.last) || 1;
    const store = new FoundryFileStore();
    logJson(store.getRuns().slice(-count));
  });

foundryCommand
  .command("export")
  .description("Export dataset artifacts")
  .requiredOption("--dataset <name>", "Dataset name")
  .option("--format <format>", "json|csv", "json")
  .action((options: { dataset: string; format: string }) => {
    const store = new FoundryFileStore();
    const dataset = store.getDatasets().find((entry) => entry.name === options.dataset);
    if (!dataset) throw new Error(`Unknown dataset ${options.dataset}`);
    const items = store.getItems().filter((entry) => entry.dataset_id === dataset.dataset_id);
    if (options.format === "csv") {
      console.log("item_id,label,kind");
      for (const item of items) {
        console.log(`${item.item_id},${item.label},${item.kind}`);
      }
      return;
    }
    logJson(items);
  });

foundryCommand
  .command("bootstrap")
  .description("One-command bootstrap for core foundry datasets")
  .action(() => {
    const store = new FoundryFileStore();

    const vectors = createCoreVectorDataset([1, 2, 3]);
    store.upsertDataset(vectors.dataset);
    store.replaceDatasetItems(vectors.dataset.dataset_id, vectors.items);
    const vectorRun = runDataset(store, vectors.dataset.dataset_id, false);

    const metamorphic = createMetamorphicDataset(vectors.items, 2, 1);
    store.upsertDataset(metamorphic.dataset);
    store.replaceDatasetItems(metamorphic.dataset.dataset_id, metamorphic.items);
    const metamorphicRun = runDataset(store, metamorphic.dataset.dataset_id, false);

    const faults = createFaultDataset(1);
    store.upsertDataset(faults.dataset);
    store.replaceDatasetItems(faults.dataset.dataset_id, faults.items);
    const faultRun = runDataset(store, faults.dataset.dataset_id, false);

    logJson({
      datasets: [
        vectors.dataset.dataset_id,
        metamorphic.dataset.dataset_id,
        faults.dataset.dataset_id,
      ],
      runs: [
        vectorRun.run.dataset_run_id,
        metamorphicRun.run.dataset_run_id,
        faultRun.run.dataset_run_id,
      ],
      artifacts: store.root,
    });
  });

foundryCommand.addCommand(vectorsCommand);

foundryCommand
  .command("metamorphic")
  .description("Metamorphic dataset actions")
  .command("generate")
  .option("--base-suite <name>", "Base suite", "core")
  .option("--per <count>", "Variants per item", "5")
  .option("--seed <seed>", "Seed", "1")
  .action((options: { per: string; seed: string }) => {
    const store = new FoundryFileStore();
    const base = store
      .getItems()
      .filter((item) => item.kind === "VECTOR_RUN" || item.kind === "ROUTE_SMOKE");
    const { dataset, items } = createMetamorphicDataset(
      base,
      Number(options.per) || 5,
      Number(options.seed) || 1
    );
    store.upsertDataset(dataset);
    store.replaceDatasetItems(dataset.dataset_id, items);
    logJson({ dataset_id: dataset.dataset_id, items: items.length });
  })
  .parent!.command("run")
  .requiredOption("--dataset <id>", "Dataset id")
  .action((options: { dataset: string }) => {
    const store = new FoundryFileStore();
    logJson(runDataset(store, options.dataset, false).run);
  });

foundryCommand
  .command("faults")
  .description("Fault-injection dataset actions")
  .command("run")
  .requiredOption("--dataset <id>", "Dataset id")
  .action((options: { dataset: string }) => {
    if (process.env.FOUNDRY_FAULTS !== "1") {
      throw new Error("Fault suite is gated. Set FOUNDRY_FAULTS=1.");
    }
    const store = new FoundryFileStore();
    logJson(runDataset(store, options.dataset, false).run);
  });

foundryCommand
  .command("reconciliation-generate")
  .description("Generate deterministic synthetic reconciliation test data")
  .option("--seed <seed>", "Deterministic seed", "42")
  .option("--profile <profile>", "smoke|integration|load|chaos", "smoke")
  .option("--output <dir>", "Output directory", "test-data/exports/latest")
  .action(
    (options: {
      seed: string;
      profile: "smoke" | "integration" | "load" | "chaos";
      output: string;
    }) => {
      const suite = generateReconciliationSuite({
        seed: Number(options.seed) || 42,
        profile: options.profile,
      });
      return exportReconciliationSuiteWithKernel(suite, options.output).then((result) => {
        const promotionReady =
          result.execution.executionMode === "primary" &&
          result.execution.usedPrimary &&
          result.execution.health === "healthy";

        logJson({
          output: result.path,
          hash: result.hash,
          kernel_mode: result.kernelMode,
          kernel_runner_mode: result.runnerMode,
          kernel_divergence: result.divergence ?? null,
          kernel_duration_ms: result.durations.kernel ?? null,
          ts_duration_ms: result.durations.ts,
          kernel_startup_health: result.startupHealth,
          kernel_promotion_gate: {
            ready: promotionReady,
            reason: promotionReady
              ? "primary_healthy"
              : (result.execution.fallbackReason ??
                (result.execution.usedPrimary ? "health_degraded" : "kernel_not_primary")),
          },
          kernel_telemetry: result.telemetry,
          kernel_execution: result.execution,
          profile: suite.manifest.profile,
          records: Object.fromEntries(Object.entries(suite.sources).map(([k, v]) => [k, v.length])),
        });
      });
    }
  );

foundryCommand
  .command("reconciliation-verify")
  .description("Verify deterministic generation and runtime reconciliation contract")
  .option("--seed <seed>", "Deterministic seed", "42")
  .option("--profile <profile>", "smoke|integration|load|chaos", "smoke")
  .option("--strict", "Fail on any runtime contract diff", false)
  .action(
    (options: {
      seed: string;
      profile: "smoke" | "integration" | "load" | "chaos";
      strict?: boolean;
    }) => {
      const seed = Number(options.seed) || 42;
      const deterministic = validateSuiteDeterminism(seed, options.profile);
      if (!deterministic) {
        throw new Error("Determinism verification failed for reconciliation synthetic suite");
      }

      const suite = generateReconciliationSuite({ seed, profile: options.profile });
      const contract = verifyReconciliationContract(suite);
      if (options.strict && !contract.ok) {
        throw new Error(
          `Runtime reconciliation contract diff detected: ${JSON.stringify(contract, null, 2)}`
        );
      }

      logJson({
        deterministic,
        seed,
        profile: options.profile,
        strict: Boolean(options.strict),
        contract_ok: contract.ok,
        non_tolerated_diffs: contract.diffs.length + contract.summaryDiffs.length,
        diff_preview: contract.diffs.slice(0, 5),
        summary_diffs: contract.summaryDiffs,
      });
    }
  );
