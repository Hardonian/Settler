export type RawImportRow = Record<string, string>;

export type ValidationIssue = {
  row: number;
  field: string;
  reason: string;
};

export type NormalizedTransaction = {
  externalId: string;
  amountMinor: number;
  currency: string;
  occurredAt: string;
  type: "payment" | "refund" | "settlement";
};

export function parseCsv(input: string): RawImportRow[] {
  const lines = input.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: RawImportRow = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? "";
    });
    return row;
  });
}

export function validateImportRows(rows: RawImportRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (!row.external_id) issues.push({ row: rowNumber, field: "external_id", reason: "missing" });
    if (!row.amount || Number.isNaN(Number(row.amount))) {
      issues.push({ row: rowNumber, field: "amount", reason: "must be numeric" });
    }
    if (!row.currency || row.currency.length !== 3) {
      issues.push({ row: rowNumber, field: "currency", reason: "must be ISO-4217" });
    }
    if (!row.occurred_at || Number.isNaN(Date.parse(row.occurred_at))) {
      issues.push({ row: rowNumber, field: "occurred_at", reason: "must be ISO timestamp" });
    }
    if (!["payment", "refund", "settlement"].includes(row.type ?? "")) {
      issues.push({ row: rowNumber, field: "type", reason: "unsupported transaction type" });
    }
  });

  return issues;
}

export function previewImport(rows: RawImportRow[]): {
  totalRows: number;
  byType: Record<string, number>;
  currencies: string[];
} {
  const byType: Record<string, number> = {};
  const currencies = new Set<string>();

  rows.forEach((row) => {
    const type = row.type ?? "unknown";
    byType[type] = (byType[type] ?? 0) + 1;
    if (row.currency) currencies.add(row.currency.toUpperCase());
  });

  return {
    totalRows: rows.length,
    byType,
    currencies: [...currencies].sort(),
  };
}

export function normalizeImport(rows: RawImportRow[]): NormalizedTransaction[] {
  return rows.map((row) => ({
    externalId: row.external_id,
    amountMinor: Math.round(Number(row.amount) * 100),
    currency: row.currency.toUpperCase(),
    occurredAt: new Date(row.occurred_at).toISOString(),
    type: row.type as NormalizedTransaction["type"],
  }));
}
