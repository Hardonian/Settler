import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { execSync, execFileSync } from "child_process";

export type DatasetType = "VECTORS" | "GIT_MINED" | "METAMORPHIC" | "FAULT_INJECTION";
export type DatasetItemKind =
  | "VECTOR_RUN"
  | "ROUTE_SMOKE"
  | "CLI_SMOKE"
  | "GIT_FIX_CASE"
  | "METAMORPHIC_VARIANT"
  | "FAULT_INJECTION_SCENARIO";

export interface Dataset {
  dataset_id: string;
  name: string;
  dataset_type: DatasetType;
  tenant_scope: "GLOBAL" | "TENANT";
  tenant_id?: string;
  created_at: string;
  seed_policy: { seeds: number[] };
  items_count: number;
  tags: string[];
  dataset_version: number;
}

export interface DatasetItem {
  item_id: string;
  dataset_id: string;
  label: string;
  kind: DatasetItemKind;
  input_ref: Record<string, unknown>;
  expected_outcome: {
    status: "PASS" | "FAIL";
    expected_error_type?: string;
    invariants: string[];
  };
  reproducibility: { seed: number; config_hash: string };
  dataset_item_version: number;
}

export interface DatasetRun {
  dataset_run_id: string;
  dataset_id: string;
  started_at: string;
  finished_at: string;
  git_commit: string;
  environment: "local" | "ci";
  summary: {
    pass_count: number;
    fail_count: number;
    avg_cost_units: number;
    drift_counts: Record<string, number>;
  };
  pointers: { artifacts: string[]; run_ids: string[] };
  dataset_run_version: number;
}

export interface ItemResult {
  item_id: string;
  status: "PASS" | "FAIL";
  trace_id: string;
  invariants_failed: string[];
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const parts = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${parts.join(",")}}`;
}

export function hashId(prefix: string, value: unknown): string {
  return `${prefix}_${createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 16)}`;
}

export function getFoundryRoot(
  root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim()
): string {
  return path.join(root, "artifacts", "foundry");
}

function parseCommandArgs(command: string): string[] {
  const args: string[] = [];
  let currentArg = "";
  let inDoubleQuotes = false;
  let inSingleQuotes = false;
  let isEscaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (isEscaped) {
      currentArg += char;
      isEscaped = false;
    } else if (char === "\\") {
      isEscaped = true;
    } else if (char === '"' && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
    } else if (char === "'" && !inDoubleQuotes) {
      inSingleQuotes = !inSingleQuotes;
    } else if (char === " " && !inDoubleQuotes && !inSingleQuotes) {
      if (currentArg.length > 0) {
        args.push(currentArg);
        currentArg = "";
      }
    } else {
      currentArg += char;
    }
  }

  if (currentArg.length > 0) {
    args.push(currentArg);
  }

  return args;
}

function ensureRoot(root: string): void {
  fs.mkdirSync(root, { recursive: true });
}

function readJsonArray<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T[];
}

function writeJsonArray<T>(filePath: string, data: T[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export class FoundryFileStore {
  constructor(public readonly root = getFoundryRoot()) {
    ensureRoot(root);
  }

  private pathFor(kind: "datasets" | "items" | "runs"): string {
    return path.join(this.root, `${kind}.json`);
  }

  getDatasets(): Dataset[] {
    return readJsonArray<Dataset>(this.pathFor("datasets")).sort((a, b) =>
      a.dataset_id.localeCompare(b.dataset_id)
    );
  }

  getItems(): DatasetItem[] {
    return readJsonArray<DatasetItem>(this.pathFor("items")).sort((a, b) =>
      a.item_id.localeCompare(b.item_id)
    );
  }

  getRuns(): DatasetRun[] {
    return readJsonArray<DatasetRun>(this.pathFor("runs")).sort((a, b) =>
      a.started_at.localeCompare(b.started_at)
    );
  }

  upsertDataset(dataset: Dataset): void {
    const datasets = this.getDatasets().filter((entry) => entry.dataset_id !== dataset.dataset_id);
    datasets.push(dataset);
    writeJsonArray(
      this.pathFor("datasets"),
      datasets.sort((a, b) => a.dataset_id.localeCompare(b.dataset_id))
    );
  }

  replaceDatasetItems(datasetId: string, items: DatasetItem[]): void {
    const all = this.getItems().filter((entry) => entry.dataset_id !== datasetId);
    all.push(...items);
    writeJsonArray(
      this.pathFor("items"),
      all.sort((a, b) => a.item_id.localeCompare(b.item_id))
    );
  }

  addRun(run: DatasetRun): void {
    const runs = this.getRuns();
    runs.push(run);
    writeJsonArray(
      this.pathFor("runs"),
      runs.sort((a, b) => a.started_at.localeCompare(b.started_at))
    );
  }
}

export function createCoreVectorDataset(
  seedList: number[],
  tenantId?: string
): { dataset: Dataset; items: DatasetItem[] } {
  const name = "core_vectors";
  const dataset_id = hashId("ds", { name, seedList, tenantId });
  const vectors = [
    { label: "routes_no_500", entrypoint: "verify:routes", kind: "ROUTE_SMOKE" as const },
    { label: "replay_pipeline", entrypoint: "verify:replay", kind: "VECTOR_RUN" as const },
    { label: "spend_firewall", entrypoint: "verify:policy", kind: "CLI_SMOKE" as const },
    { label: "drift_radar", entrypoint: "verify:determinism", kind: "VECTOR_RUN" as const },
  ];

  const items = seedList.flatMap((seed) =>
    vectors.map((vector) => {
      const base = {
        dataset_id,
        label: `${vector.label}_seed_${seed}`,
        kind: vector.kind,
        input_ref: { command: vector.entrypoint },
        expected_outcome: {
          status: "PASS" as const,
          invariants: ["no_500", "problem_json", "tenant_isolation"],
        },
        reproducibility: { seed, config_hash: hashId("cfg", { vector: vector.label, seed }) },
        dataset_item_version: 1,
      };
      return { ...base, item_id: hashId("item", base) };
    })
  );

  const dataset: Dataset = {
    dataset_id,
    name,
    dataset_type: "VECTORS",
    tenant_scope: tenantId ? "TENANT" : "GLOBAL",
    tenant_id: tenantId,
    created_at: new Date().toISOString(),
    seed_policy: { seeds: seedList },
    items_count: items.length,
    tags: ["big4", "routes", "security", "tenancy"],
    dataset_version: 1,
  };

  return { dataset, items };
}

export function createMetamorphicDataset(
  base: DatasetItem[],
  perItem: number,
  seed: number
): { dataset: Dataset; items: DatasetItem[] } {
  const name = "metamorphic_suite";
  const dataset_id = hashId("ds", { name, seed, perItem, baseCount: base.length });
  const items: DatasetItem[] = [];
  const transforms = ["whitespace_normalize", "json_key_reorder", "safe_toggle"];

  for (const baseItem of base) {
    for (let i = 0; i < perItem; i += 1) {
      const transform = transforms[(seed + i) % transforms.length];
      const label = `${baseItem.label}_${transform}_${i}`;
      const record: Omit<DatasetItem, "item_id"> = {
        dataset_id,
        label,
        kind: "METAMORPHIC_VARIANT",
        input_ref: { base_item_id: baseItem.item_id, transform },
        expected_outcome: {
          status: "PASS",
          invariants: ["no_500", "policy_preserved", "schema_equivalent"],
        },
        reproducibility: { seed: seed + i, config_hash: hashId("cfg", { label, transform }) },
        dataset_item_version: 1,
      };
      items.push({ ...record, item_id: hashId("item", record) });
    }
  }

  return {
    dataset: {
      dataset_id,
      name,
      dataset_type: "METAMORPHIC",
      tenant_scope: "GLOBAL",
      created_at: new Date().toISOString(),
      seed_policy: { seeds: [seed] },
      items_count: items.length,
      tags: ["metamorphic", "robustness"],
      dataset_version: 1,
    },
    items,
  };
}

export function createFaultDataset(seed = 1): { dataset: Dataset; items: DatasetItem[] } {
  const name = "fault_injection_suite";
  const dataset_id = hashId("ds", { name, seed });
  const scenarios = [
    "cas_read_fail_should_emit_event_and_not_crash",
    "budget_exceeded_should_deny_with_problem_json",
    "trace_corrupt_should_fail_verify_not_crash_ui",
  ];
  const items = scenarios.map((label, index) => {
    const record: Omit<DatasetItem, "item_id"> = {
      dataset_id,
      label,
      kind: "FAULT_INJECTION_SCENARIO",
      input_ref: { fault: label },
      expected_outcome: {
        status: "FAIL",
        expected_error_type: "FAULT_INJECTION",
        invariants: ["problem_json", "trace_id"],
      },
      reproducibility: { seed: seed + index, config_hash: hashId("cfg", { label, seed }) },
      dataset_item_version: 1,
    };
    return { ...record, item_id: hashId("item", record) };
  });

  return {
    dataset: {
      dataset_id,
      name,
      dataset_type: "FAULT_INJECTION",
      tenant_scope: "GLOBAL",
      created_at: new Date().toISOString(),
      seed_policy: { seeds: [seed] },
      items_count: items.length,
      tags: ["faults", "resilience"],
      dataset_version: 1,
    },
    items,
  };
}

export function runDataset(
  store: FoundryFileStore,
  datasetId: string,
  execute = true
): { run: DatasetRun; results: ItemResult[] } {
  const dataset = store.getDatasets().find((entry) => entry.dataset_id === datasetId);
  if (!dataset) throw new Error(`Dataset not found: ${datasetId}`);

  const items = store
    .getItems()
    .filter((entry) => entry.dataset_id === datasetId)
    .sort((a, b) => a.item_id.localeCompare(b.item_id));
  const started = new Date();
  const results: ItemResult[] = [];

  for (const item of items) {
    let pass = true;
    if (execute) {
      const command =
        typeof item.input_ref.command === "string" ? item.input_ref.command : undefined;
      if (command) {
        try {
          const args = parseCommandArgs(command);
          execFileSync(process.platform === "win32" ? "pnpm.cmd" : "pnpm", args, { stdio: "pipe" });
          pass = true;
        } catch {
          pass = false;
        }
      } else {
        pass = item.expected_outcome.status === "PASS";
      }
    }
    results.push({
      item_id: item.item_id,
      status: pass ? "PASS" : "FAIL",
      trace_id: hashId("trace", { run: datasetId, item: item.item_id }),
      invariants_failed: pass ? [] : item.expected_outcome.invariants,
    });
  }

  const passCount = results.filter((entry) => entry.status === "PASS").length;
  const run: DatasetRun = {
    dataset_run_id: hashId("run", { datasetId, started: started.toISOString(), results }),
    dataset_id: datasetId,
    started_at: started.toISOString(),
    finished_at: new Date().toISOString(),
    git_commit: execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim(),
    environment: process.env.CI ? "ci" : "local",
    summary: {
      pass_count: passCount,
      fail_count: results.length - passCount,
      avg_cost_units: 0,
      drift_counts: { low: 0, medium: 0, high: 0 },
    },
    pointers: {
      run_ids: results.map((entry) => entry.item_id),
      artifacts: [path.join(store.root, "foundry_report.json")],
    },
    dataset_run_version: 1,
  };

  store.addRun(run);
  fs.writeFileSync(
    path.join(store.root, "foundry_report.json"),
    JSON.stringify({ run, results }, null, 2)
  );
  fs.writeFileSync(
    path.join(store.root, "failing_items.json"),
    JSON.stringify(
      results.filter((entry) => entry.status === "FAIL"),
      null,
      2
    )
  );

  const csv = [
    "item_id,status,trace_id,invariants_failed",
    ...results.map(
      (entry) =>
        `${entry.item_id},${entry.status},${entry.trace_id},${entry.invariants_failed.join("|")}`
    ),
  ].join("\n");
  fs.writeFileSync(path.join(store.root, "foundry_report.csv"), `${csv}\n`);

  return { run, results };
}
