declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import fs from "fs";
import os from "os";
import path from "path";
import { FoundryFileStore, createCoreVectorDataset } from "../lib/foundry";

describe("foundry deterministic ids", () => {
  test("core vector dataset ids are stable for same seed inputs", () => {
    const one = createCoreVectorDataset([1, 2, 3]);
    const two = createCoreVectorDataset([1, 2, 3]);
    expect(one.dataset.dataset_id).toEqual(two.dataset.dataset_id);
    expect(one.items.map((item) => item.item_id)).toEqual(two.items.map((item) => item.item_id));
  });

  test("file store round-trip is stable", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "foundry-test-"));
    const store = new FoundryFileStore(root);
    const generated = createCoreVectorDataset([1]);
    store.upsertDataset(generated.dataset);
    store.replaceDatasetItems(generated.dataset.dataset_id, generated.items);

    const datasets = store.getDatasets();
    const items = store.getItems();
    expect(datasets).toHaveLength(1);
    expect(items).toHaveLength(generated.items.length);
    expect(datasets[0]?.dataset_id).toBe(generated.dataset.dataset_id);
  });
});
