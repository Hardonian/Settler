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
  verifyReconciliationContract,
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
    expect(suite.scenarios.every((scenario) => scenario.expected_classifications.length > 0)).toBe(
      true
    );
  });

  test("emits first-class runtime semantics and stable contract", () => {
    const suite = generateReconciliationSuite({ seed: 42, profile: "chaos" });
    const contract = verifyReconciliationContract(suite);

    expect(contract.ok).toBe(true);
    expect(suite.golden.runtime_matches.length).toBe(suite.sources.PAYMENT_PROCESSOR.length);
    expect(suite.golden.runtime_matches.some((m) => m.classification === "DISPUTE_RELATED")).toBe(
      true
    );
    expect(suite.golden.runtime_matches.some((m) => m.classification === "REVERSAL_RELATED")).toBe(
      true
    );
    expect(
      suite.golden.runtime_matches
        .filter((m) => m.classification === "MANUAL_REVIEW")
        .every((m) => m.manual_review_rationale_codes.length > 0)
    ).toBe(true);
    const disputeRelated = suite.golden.runtime_matches.filter(
      (m) => m.classification === "DISPUTE_RELATED"
    );
    expect(disputeRelated.every((m) => Boolean(m.dispute_phase))).toBe(true);
    expect(disputeRelated.some((m) => m.manual_review_rationale_codes.length > 0)).toBe(true);
    expect(
      suite.golden.runtime_matches
        .filter((m) => m.classification === "REVERSAL_RELATED")
        .every((m) => m.reversal_phase)
    ).toBe(true);
    const grouped = suite.golden.runtime_matches.filter(
      (m) => m.classification === "GROUPED_MATCH"
    );
    expect(grouped.every((m) => Boolean(m.group_id))).toBe(true);
    expect(grouped.some((m) => (m.group_member_transaction_ids?.length ?? 0) > 1)).toBe(true);
  });

  test("produces stable export hash across object key insertion order", () => {
    const suite = generateReconciliationSuite({ seed: 23, profile: "smoke" });
    const reorderedSuite = {
      ...suite,
      manifest: {
        scenario_mix: suite.manifest.scenario_mix,
        workspace_id: suite.manifest.workspace_id,
        generated_at: suite.manifest.generated_at,
        complexity: suite.manifest.complexity,
        profile: suite.manifest.profile,
        seed: suite.manifest.seed,
      },
      golden: {
        expected_summary: suite.golden.expected_summary,
        runtime_matches: suite.golden.runtime_matches,
        expected_results: suite.golden.expected_results,
        per_transaction: suite.golden.per_transaction,
      },
    };

    const outA = fs.mkdtempSync(path.join(os.tmpdir(), "recon-suite-a-"));
    const outB = fs.mkdtempSync(path.join(os.tmpdir(), "recon-suite-b-"));

    const resultA = exportReconciliationSuite(suite, outA);
    const resultB = exportReconciliationSuite(reorderedSuite as any, outB);

    expect(resultA.hash).toBe(resultB.hash);
  });

  test("stable export hash handles deep nested key reordering", () => {
    const suite = generateReconciliationSuite({ seed: 33, profile: "smoke" });
    suite.golden.runtime_matches[0]!.manual_review_rationale_codes = ["AMBIGUOUS_REFERENCE"];
    (suite.sources.PAYMENT_PROCESSOR[0] as any).metadata = {
      nested: {
        z: 1,
        a: 2,
      },
      alpha: true,
    };

    const reorderedSuite = {
      ...suite,
      sources: {
        ...suite.sources,
        PAYMENT_PROCESSOR: suite.sources.PAYMENT_PROCESSOR.map((row, idx) =>
          idx === 0
            ? {
                ...row,
                metadata: {
                  alpha: true,
                  nested: {
                    a: 2,
                    z: 1,
                  },
                },
              }
            : row
        ),
      },
    };

    const outA = fs.mkdtempSync(path.join(os.tmpdir(), "recon-suite-nested-a-"));
    const outB = fs.mkdtempSync(path.join(os.tmpdir(), "recon-suite-nested-b-"));

    const resultA = exportReconciliationSuite(suite, outA);
    const resultB = exportReconciliationSuite(reorderedSuite as any, outB);

    expect(resultA.hash).toBe(resultB.hash);
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

  test("includes expanded realistic synthetic edge markers", () => {
    const suite = generateReconciliationSuite({ seed: 42, profile: "chaos" });
    const processor = suite.sources.PAYMENT_PROCESSOR;

    expect(processor.some((row) => row.metadata?.duplicate_export === true)).toBe(true);
    expect(processor.some((row) => row.metadata?.missing_reference === true)).toBe(true);
    expect(processor.some((row) => row.metadata?.delayed_posting === true)).toBe(true);
    expect(processor.some((row) => row.metadata?.partial_refund === true)).toBe(true);
    expect(processor.some((row) => row.metadata?.ambiguous_amount_collision === true)).toBe(true);
    expect(processor.some((row) => row.metadata?.group_partial_match === true)).toBe(true);
    expect(processor.some((row) => row.metadata?.dispute_reversal_pattern === true)).toBe(true);
  });
});
