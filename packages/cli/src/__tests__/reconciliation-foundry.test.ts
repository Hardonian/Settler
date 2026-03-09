declare const describe: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => Promise<void> | void) => void;
declare const expect: any;

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  exportReconciliationSuite,
  generateReconciliationSuite,
  validateSuiteDeterminism,
} from "../lib/reconciliation-foundry";

describe("reconciliation synthetic foundry", () => {
  test("is deterministic for same seed/profile", () => {
    expect(validateSuiteDeterminism(42, "smoke")).toBe(true);
  });

  test("produces required scenario coverage categories", () => {
    const suite = generateReconciliationSuite({ seed: 7, profile: "smoke" });
    const categories = new Set(suite.scenarios.map((scenario) => scenario.category));
    expect(categories.size).toBe(11);
    expect(suite.sources.BANK_STATEMENT.length).toBe(100);
  });

  test("exports JSON, CSV, expectation matrix, malformed input", () => {
    const suite = generateReconciliationSuite({ seed: 9, profile: "smoke" });
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "recon-suite-"));
    const result = exportReconciliationSuite(suite, out);

    expect(fs.existsSync(path.join(result.path, "manifest.json"))).toBe(true);
    expect(fs.existsSync(path.join(result.path, "golden.json"))).toBe(true);
    expect(fs.existsSync(path.join(result.path, "expected_results.json"))).toBe(true);
    expect(fs.existsSync(path.join(result.path, "bank_statement.csv"))).toBe(true);
    expect(fs.existsSync(path.join(result.path, "malformed_processor_row.csv"))).toBe(true);
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
