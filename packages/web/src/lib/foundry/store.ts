import fs from "fs";
import path from "path";

export type FoundryDataset = {
  dataset_id: string;
  name: string;
  dataset_type: string;
  tenant_scope: "GLOBAL" | "TENANT";
  tenant_id?: string;
  created_at: string;
  items_count: number;
};

export type FoundryRun = {
  dataset_run_id: string;
  dataset_id: string;
  started_at: string;
  finished_at: string;
  summary: { pass_count: number; fail_count: number };
};

const foundryRoot = path.join(process.cwd(), "artifacts", "foundry");

function readArray<T>(file: string): T[] {
  const fullPath = path.join(foundryRoot, file);
  if (!fs.existsSync(fullPath)) return [];
  return JSON.parse(fs.readFileSync(fullPath, "utf8")) as T[];
}

export function getFoundryDatasets(tenantId?: string): FoundryDataset[] {
  const all = readArray<FoundryDataset>("datasets.json");
  return all.filter(
    (dataset) => dataset.tenant_scope === "GLOBAL" || dataset.tenant_id === tenantId
  );
}

export function getFoundryRuns(datasetId?: string): FoundryRun[] {
  const all = readArray<FoundryRun>("runs.json");
  return datasetId ? all.filter((run) => run.dataset_id === datasetId) : all;
}

export function getFoundryItems(datasetId: string): Array<Record<string, unknown>> {
  return readArray<Record<string, unknown>>("items.json").filter(
    (item) => item.dataset_id === datasetId
  );
}
