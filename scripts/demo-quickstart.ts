#!/usr/bin/env tsx
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import {
  createDemoProofpack,
  formatMinorUnits,
  reconcileSettlementRecords,
  sha256,
  verifyDemoProofpack,
  type DemoProofpack,
  type SettlementDecision,
  type SettlementRecordInput,
  type SettlementRecordKind,
  type SettlementRuleSet,
} from "../packages/reconciliation-core/src/settlement-reconciliation.js";

type CsvRow = Record<string, string>;

const dataDir = path.resolve("docs/demo-data");
const outputDir = path.resolve("docs/demo-output");
const maxInputBytes = 1_000_000;
const tenantId = "demo-tenant";
const accountId = "demo-operating-usd";
const rules: SettlementRuleSet = {
  version: "stripe-bank-settlement/1.0.0",
  amountToleranceMinor: "1",
  dateWindowDays: 3,
  requireReference: true,
};

function parseCsv(contents: string, filename: string): { headers: string[]; rows: CsvRow[] } {
  if (Buffer.byteLength(contents, "utf8") > maxInputBytes) {
    throw new Error(`${filename} exceeds the ${maxInputBytes} byte demo limit`);
  }
  const records = parse(contents, {
    bom: true,
    columns: false,
    relax_column_count: false,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];
  if (records.length < 2) throw new Error(`${filename} must contain a header and at least one row`);
  const headers = records[0] ?? [];
  const normalizedHeaders = headers.map((header) => header.toLocaleLowerCase("en-US"));
  const duplicate = normalizedHeaders.find(
    (header, index) => normalizedHeaders.indexOf(header) !== index
  );
  if (duplicate) throw new Error(`${filename} contains duplicate header: ${duplicate}`);
  if (headers.some((header) => !header)) throw new Error(`${filename} contains an empty header`);
  return {
    headers,
    rows: records
      .slice(1)
      .map((values) =>
        Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
      ),
  };
}

function required(row: CsvRow, column: string, rowNumber: number, filename: string): string {
  const value = row[column]?.trim();
  if (!value) throw new Error(`${filename} row ${rowNumber}: ${column} is required`);
  return value;
}

function settlementKind(value: string, rowNumber: number, filename: string): SettlementRecordKind {
  if (["payout", "fee", "refund", "dispute", "adjustment"].includes(value)) {
    return value as SettlementRecordKind;
  }
  throw new Error(`${filename} row ${rowNumber}: unsupported record_kind ${value}`);
}

function toRecords(
  rows: CsvRow[],
  side: "processor_csv" | "bank_csv",
  filename: string
): SettlementRecordInput[] {
  const dateColumn = side === "processor_csv" ? "settled_at" : "posted_at";
  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const id = required(row, "transaction_id", rowNumber, filename);
    return {
      id,
      tenantId,
      accountId,
      amount: required(row, "amount", rowNumber, filename),
      currency: required(row, "currency", rowNumber, filename),
      date: required(row, dateColumn, rowNumber, filename),
      reference: required(row, "reference", rowNumber, filename),
      description: row.description?.trim(),
      kind: settlementKind(required(row, "record_kind", rowNumber, filename), rowNumber, filename),
      provenance: { source: side, sourceRecordId: id },
    };
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderDashboard(proofpack: DemoProofpack): string {
  const { run } = proofpack.payload;
  const rows = run.results
    .map((result) => {
      const source = run.sourceRecords.find((record) => record.id === result.sourceRecordId);
      const delta =
        result.amountDeltaMinor === null || !source
          ? "—"
          : `${source.currency} ${formatMinorUnits(result.amountDeltaMinor, source.currencyExponent)}`;
      return `<tr>
        <td>${escapeHtml(result.decision)}</td>
        <td>${escapeHtml(result.sourceRecordId ?? "—")}</td>
        <td>${escapeHtml(result.targetRecordId ?? (result.candidateTargetIds.join(", ") || "—"))}</td>
        <td>${escapeHtml(delta)}</td>
        <td>${escapeHtml(result.reason)}</td>
      </tr>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Settler verified settlement reconciliation</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; margin: 2rem; color: #172033; background: #f8fafc; }
    .cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr)); margin: 1.5rem 0; }
    .card { background: white; border: 1px solid #dbe3ef; border-radius: 14px; padding: 1rem; }
    .value { display: block; font-size: 2rem; font-weight: 750; margin-top: 0.35rem; }
    .table-wrap { overflow-x: auto; } table { width: 100%; border-collapse: collapse; background: white; }
    th, td { padding: 0.75rem; border: 1px solid #e5edf7; text-align: left; vertical-align: top; }
    th { background: #edf4ff; } code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <h1>Stripe settlement-to-bank reconciliation</h1>
  <p>This fixture reconciles processor settlement ledger lines—not individual card charges—against bank postings using the canonical engine.</p>
  <section class="cards" aria-label="Reconciliation summary">
    ${Object.entries(run.summary)
      .map(
        ([decision, count]) =>
          `<div class="card">${escapeHtml(decision)}<span class="value">${count}</span></div>`
      )
      .join("\n")}
  </section>
  <p>Rule: <code>${escapeHtml(run.ruleVersion)}</code></p>
  <p>Semantic commitment: <code>${proofpack.integrity.commitment}</code></p>
  <div class="table-wrap"><table>
    <thead><tr><th>Decision</th><th>Processor record</th><th>Bank record/candidates</th><th>Delta</th><th>Rule explanation</th></tr></thead>
    <tbody>${rows}</tbody>
  </table></div>
</body>
</html>`;
}

function assertExpected(
  expectedRows: CsvRow[],
  results: DemoProofpack["payload"]["run"]["results"]
): void {
  for (const [index, row] of expectedRows.entries()) {
    const expectedDecision = required(
      row,
      "expected_decision",
      index + 2,
      "expected-reconciliation.csv"
    ) as SettlementDecision;
    const sourceId = row.processor_transaction_id || null;
    const targetId = row.bank_transaction_id || null;
    const actual = results.find(
      (result) =>
        result.decision === expectedDecision &&
        result.sourceRecordId === sourceId &&
        (targetId === null ||
          result.targetRecordId === targetId ||
          result.candidateTargetIds.includes(targetId))
    );
    if (!actual) {
      throw new Error(
        `Expected decision not produced at expected-reconciliation.csv row ${index + 2}`
      );
    }
  }
  if (expectedRows.length !== results.length) {
    throw new Error(
      `Expected ${expectedRows.length} decisions but engine produced ${results.length}`
    );
  }
}

async function main(): Promise<void> {
  const processorPath = path.join(dataDir, "processor-transactions.csv");
  const bankPath = path.join(dataDir, "bank-transactions.csv");
  const expectedPath = path.join(dataDir, "expected-reconciliation.csv");
  const [processorRaw, bankRaw, expectedRaw] = await Promise.all([
    fs.readFile(processorPath, "utf8"),
    fs.readFile(bankPath, "utf8"),
    fs.readFile(expectedPath, "utf8"),
  ]);
  const processorCsv = parseCsv(processorRaw, "processor-transactions.csv");
  const bankCsv = parseCsv(bankRaw, "bank-transactions.csv");
  const expectedCsv = parseCsv(expectedRaw, "expected-reconciliation.csv");
  const run = reconcileSettlementRecords({
    sourceRecords: toRecords(processorCsv.rows, "processor_csv", "processor-transactions.csv"),
    targetRecords: toRecords(bankCsv.rows, "bank_csv", "bank-transactions.csv"),
    rules,
  });
  const proofpack = createDemoProofpack(
    run,
    {
      "bank-transactions.csv": sha256(bankRaw),
      "processor-transactions.csv": sha256(processorRaw),
    },
    process.env.SETTLER_DEMO_GENERATED_AT
  );
  assertExpected(expectedCsv.rows, run.results);
  const verification = verifyDemoProofpack(proofpack);
  if (!verification.valid || !verification.replayed) {
    throw new Error(`Generated proofpack failed verification: ${verification.errors.join("; ")}`);
  }
  const tampered = structuredClone(proofpack);
  tampered.payload.run.sourceRecords[0]!.amountMinor = "999999";
  const tamperVerification = verifyDemoProofpack(tampered);
  if (tamperVerification.valid) throw new Error("Tampered proofpack unexpectedly verified");

  const mappingPreview = {
    schemaVersion: "import-mapping-preview/1.0.0",
    limitBytes: maxInputBytes,
    processor: { headers: processorCsv.headers, rowCount: processorCsv.rows.length },
    bank: { headers: bankCsv.headers, rowCount: bankCsv.rows.length },
    mappings: {
      processor: {
        id: "transaction_id",
        date: "settled_at",
        amount: "amount",
        currency: "currency",
        reference: "reference",
        kind: "record_kind",
      },
      bank: {
        id: "transaction_id",
        date: "posted_at",
        amount: "amount",
        currency: "currency",
        reference: "reference",
        kind: "record_kind",
      },
    },
    validationErrors: [],
  };
  await fs.mkdir(outputDir, { recursive: true });
  await Promise.all([
    fs.writeFile(
      path.join(outputDir, "mapping-preview.json"),
      `${JSON.stringify(mappingPreview, null, 2)}\n`
    ),
    fs.writeFile(
      path.join(outputDir, "reconciliation-results.json"),
      `${JSON.stringify(run, null, 2)}\n`
    ),
    fs.writeFile(path.join(outputDir, "proofpack.json"), `${JSON.stringify(proofpack, null, 2)}\n`),
    fs.writeFile(
      path.join(outputDir, "proofpack.tampered.json"),
      `${JSON.stringify(tampered, null, 2)}\n`
    ),
    fs.writeFile(path.join(outputDir, "dashboard.html"), renderDashboard(proofpack)),
  ]);

  console.log("Settler canonical settlement demo verified");
  console.log(`Run: ${proofpack.payload.runId}`);
  console.log(`Commitment: ${proofpack.integrity.commitment}`);
  console.log(`Decisions: ${JSON.stringify(run.summary)}`);
  console.log("Replay: PASS");
  console.log(`Tamper check: PASS (${tamperVerification.errors.join("; ")})`);
  console.log(`Artifacts: ${path.relative(process.cwd(), outputDir)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
