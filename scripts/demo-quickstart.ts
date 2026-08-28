#!/usr/bin/env tsx
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

type CsvRow = Record<string, string>;
type MatchScenario = "exact" | "fuzzy" | "unmatched";

interface ProcessorTransaction {
  transaction_id: string;
  settled_at: string;
  description: string;
  counterparty: string;
  amount: number;
  currency: string;
  reference: string;
}

interface BankTransaction {
  transaction_id: string;
  posted_at: string;
  description: string;
  counterparty: string;
  amount: number;
  currency: string;
  reference: string;
}

interface ReconciliationMatch {
  scenario: MatchScenario;
  processor_transaction_id: string | null;
  bank_transaction_id: string | null;
  amount_delta: number | null;
  confidence: number;
  reason: string;
}

const dataDir = path.resolve("docs/demo-data");
const outputDir = path.resolve("docs/demo-output");
const amountTolerance = 0.05;

function parseCsv(contents: string): CsvRow[] {
  const lines = contents.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function toProcessor(row: CsvRow): ProcessorTransaction {
  return { ...row, amount: Number(row.amount) } as ProcessorTransaction;
}

function toBank(row: CsvRow): BankTransaction {
  return { ...row, amount: Number(row.amount) } as BankTransaction;
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function amountDelta(processor: ProcessorTransaction, bank: BankTransaction): number {
  return Number(Math.abs(processor.amount - bank.amount).toFixed(2));
}

function reconcile(
  processorTransactions: ProcessorTransaction[],
  bankTransactions: BankTransaction[]
): ReconciliationMatch[] {
  const unmatchedBank = new Map(
    bankTransactions.map((transaction) => [transaction.transaction_id, transaction])
  );
  const matches: ReconciliationMatch[] = [];

  for (const processor of processorTransactions) {
    const exact = [...unmatchedBank.values()].find(
      (bank) =>
        bank.reference.toLowerCase() === processor.reference.toLowerCase() &&
        bank.currency === processor.currency &&
        bank.amount === processor.amount
    );

    if (exact) {
      unmatchedBank.delete(exact.transaction_id);
      matches.push({
        scenario: "exact",
        processor_transaction_id: processor.transaction_id,
        bank_transaction_id: exact.transaction_id,
        amount_delta: 0,
        confidence: 1,
        reason: "Reference, currency, and amount match exactly.",
      });
      continue;
    }

    const fuzzy = [...unmatchedBank.values()].find(
      (bank) =>
        bank.reference.toLowerCase() === processor.reference.toLowerCase() &&
        bank.currency === processor.currency &&
        amountDelta(processor, bank) <= amountTolerance
    );

    if (fuzzy) {
      const delta = amountDelta(processor, fuzzy);
      unmatchedBank.delete(fuzzy.transaction_id);
      matches.push({
        scenario: "fuzzy",
        processor_transaction_id: processor.transaction_id,
        bank_transaction_id: fuzzy.transaction_id,
        amount_delta: delta,
        confidence: 0.94,
        reason: `Reference and currency match; amount delta $${delta.toFixed(2)} is within the $${amountTolerance.toFixed(2)} tolerance.`,
      });
      continue;
    }

    const outOfTolerance = [...unmatchedBank.values()].find(
      (bank) =>
        bank.reference.toLowerCase() === processor.reference.toLowerCase() &&
        bank.currency === processor.currency
    );

    if (outOfTolerance) {
      const delta = amountDelta(processor, outOfTolerance);
      unmatchedBank.delete(outOfTolerance.transaction_id);
      matches.push({
        scenario: "unmatched",
        processor_transaction_id: processor.transaction_id,
        bank_transaction_id: outOfTolerance.transaction_id,
        amount_delta: delta,
        confidence: 0.12,
        reason: `Reference and currency match, but amount delta $${delta.toFixed(2)} exceeds the $${amountTolerance.toFixed(2)} tolerance.`,
      });
      continue;
    }

    matches.push({
      scenario: "unmatched",
      processor_transaction_id: processor.transaction_id,
      bank_transaction_id: null,
      amount_delta: null,
      confidence: 0,
      reason: "No bank transaction matched within the exact or fuzzy tolerance rules.",
    });
  }

  for (const bank of unmatchedBank.values()) {
    matches.push({
      scenario: "unmatched",
      processor_transaction_id: null,
      bank_transaction_id: bank.transaction_id,
      amount_delta: null,
      confidence: 0,
      reason: "No processor transaction matched this bank-side line.",
    });
  }

  return matches;
}

function renderDashboard(matches: ReconciliationMatch[], proofpackHash: string): string {
  const counts = matches.reduce(
    (accumulator, match) => {
      accumulator[match.scenario] += 1;
      return accumulator;
    },
    { exact: 0, fuzzy: 0, unmatched: 0 } satisfies Record<MatchScenario, number>
  );
  const matched = counts.exact + counts.fuzzy;
  const rows = matches
    .map(
      (match) => `<tr>
        <td>${match.scenario}</td>
        <td>${match.processor_transaction_id ?? "—"}</td>
        <td>${match.bank_transaction_id ?? "—"}</td>
        <td>${match.amount_delta === null ? "—" : `$${match.amount_delta.toFixed(2)}`}</td>
        <td>${Math.round(match.confidence * 100)}%</td>
        <td>${match.reason}</td>
      </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Settler 5-minute reconciliation demo</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 2rem; color: #172033; background: #f8fafc; }
    .cards { display: grid; gap: 1rem; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 1.5rem 0; }
    .card { background: white; border: 1px solid #dbe3ef; border-radius: 14px; padding: 1rem; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
    .value { display: block; font-size: 2rem; font-weight: 750; margin-top: 0.35rem; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dbe3ef; border-radius: 14px; overflow: hidden; }
    th, td { padding: 0.75rem; border-bottom: 1px solid #e5edf7; text-align: left; vertical-align: top; }
    th { background: #edf4ff; color: #23314d; }
    code { background: #e9eef7; border-radius: 6px; padding: 0.15rem 0.35rem; }
  </style>
</head>
<body>
  <h1>Settler 5-minute reconciliation demo</h1>
  <p>Seed CSVs were loaded, reconciliation rules were applied, and an audit-ready proofpack was exported.</p>
  <section class="cards" aria-label="Reconciliation dashboard summary">
    <div class="card">Matched transactions<span class="value">${matched}</span></div>
    <div class="card">Exact matches<span class="value">${counts.exact}</span></div>
    <div class="card">Fuzzy matches<span class="value">${counts.fuzzy}</span></div>
    <div class="card">Unmatched exceptions<span class="value">${counts.unmatched}</span></div>
  </section>
  <p>Proofpack SHA-256: <code>${proofpackHash}</code></p>
  <table>
    <thead><tr><th>Scenario</th><th>Processor</th><th>Bank</th><th>Delta</th><th>Confidence</th><th>Reason</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

async function main(): Promise<void> {
  const [processorRaw, bankRaw, expectedRaw] = await Promise.all([
    fs.readFile(path.join(dataDir, "processor-transactions.csv"), "utf8"),
    fs.readFile(path.join(dataDir, "bank-transactions.csv"), "utf8"),
    fs.readFile(path.join(dataDir, "expected-reconciliation.csv"), "utf8"),
  ]);
  const processorTransactions = parseCsv(processorRaw).map(toProcessor);
  const bankTransactions = parseCsv(bankRaw).map(toBank);
  const expected = parseCsv(expectedRaw);
  const matches = reconcile(processorTransactions, bankTransactions);
  const summary = matches.reduce(
    (accumulator, match) => {
      accumulator[match.scenario] += 1;
      return accumulator;
    },
    { exact: 0, fuzzy: 0, unmatched: 0 } satisfies Record<MatchScenario, number>
  );
  const proofpack = {
    run_id: "self-serve-demo-2026-06",
    generated_at: new Date().toISOString(),
    source_files: [
      "docs/demo-data/processor-transactions.csv",
      "docs/demo-data/bank-transactions.csv",
      "docs/demo-data/expected-reconciliation.csv",
    ],
    rules: {
      exact: "reference + currency + amount",
      fuzzy: `reference + currency + amount delta <= ${amountTolerance}`,
      unmatched: "no exact or fuzzy candidate",
    },
    input_hashes: {
      processor: sha256(processorRaw),
      bank: sha256(bankRaw),
      expected: sha256(expectedRaw),
    },
    summary,
    expected_scenarios: expected,
    matches,
  };
  const proofpackHash = sha256(proofpack);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(
    path.join(outputDir, "reconciliation-results.json"),
    `${JSON.stringify({ summary, matches }, null, 2)}\n`
  );
  await fs.writeFile(
    path.join(outputDir, "proofpack.json"),
    `${JSON.stringify({ ...proofpack, proofpack_hash: proofpackHash }, null, 2)}\n`
  );
  await fs.writeFile(
    path.join(outputDir, "dashboard.html"),
    renderDashboard(matches, proofpackHash)
  );

  console.log("Settler self-serve demo complete");
  console.log(
    `Matched: ${summary.exact + summary.fuzzy} (${summary.exact} exact, ${summary.fuzzy} fuzzy)`
  );
  console.log(`Unmatched: ${summary.unmatched}`);
  console.log(`Dashboard: ${path.relative(process.cwd(), path.join(outputDir, "dashboard.html"))}`);
  console.log(`Proofpack: ${path.relative(process.cwd(), path.join(outputDir, "proofpack.json"))}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
