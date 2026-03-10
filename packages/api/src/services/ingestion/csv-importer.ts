/**
 * CSV Import Engine
 * Handles CSV upload, column mapping (auto-detect + manual override), and validation
 */

import { parse } from "csv-parse/sync";
import {
  CSVColumnMapping,
  CSVRow,
  ImportWorkbenchPreview,
  IngestionDiagnostic,
  IngestionQualityGate,
  ImportSourceProfile,
  NormalizedTransactionInput,
  NormalizedTransactionSchema,
} from "./types";
import { logError } from "../../utils/logger";

class CSVParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CSVParserError";
  }
}

const REQUIRED_MAPPING_FIELDS: Array<keyof CSVColumnMapping> = ["amount", "date"];


const IMPORT_WORKBENCH_CONTRACT = {
  schemaUri: "contracts/ingestion/import-workbench.schema.json",
  version: "1.0.0",
} as const;

const DIAGNOSTIC_REMEDIATION: Record<
  string,
  {
    action: string;
    hint: string;
  }
> = {
  duplicate_headers: {
    action: "Rename duplicate columns in source file",
    hint: "Ensure each header is unique and retry preview",
  },
  required_mapping_missing: {
    action: "Provide explicit column mapping",
    hint: "Map required canonical fields (amount, date) before upload",
  },
  invalid_amount: {
    action: "Fix amount formatting",
    hint: "Use numeric values without text and consistent decimal separators",
  },
  ambiguous_date: {
    action: "Normalize date format",
    hint: "Use YYYY-MM-DD or unambiguous day/month values",
  },
  invalid_date: {
    action: "Correct date values",
    hint: "Provide parseable dates and verify mapped date column",
  },
  schema_drift_detected: {
    action: "Review schema changes against previous import",
    hint: "Compare added/removed headers and update mapping/profile as needed",
  },
};

const PROFILE_GATE_CONFIG: Record<
  ImportSourceProfile,
  {
    normalizationThreshold: number;
    duplicateRowThreshold: number;
    currencySeverity: "warning" | "blocking";
  }
> = {
  csv_generic: { normalizationThreshold: 0.8, duplicateRowThreshold: 0.25, currencySeverity: "warning" },
  bank_statement: { normalizationThreshold: 0.9, duplicateRowThreshold: 0.15, currencySeverity: "warning" },
  processor_export: { normalizationThreshold: 0.95, duplicateRowThreshold: 0.1, currencySeverity: "blocking" },
};

function withRemediation(diagnostic: IngestionDiagnostic): IngestionDiagnostic {
  const remediation = DIAGNOSTIC_REMEDIATION[diagnostic.code];
  return remediation ? { ...diagnostic, remediation } : diagnostic;
}


/**
 * Auto-detect column mapping from CSV headers
 */
export function autoDetectColumnMapping(headers: string[]): CSVColumnMapping {
  const mapping: CSVColumnMapping = {};

  // Common patterns for amount columns
  const amountPatterns = [/amount/i, /total/i, /value/i, /sum/i, /price/i, /cost/i];

  // Common patterns for date columns
  const datePatterns = [/date/i, /time/i, /timestamp/i, /created/i, /transaction.*date/i];

  // Common patterns for description columns
  const descriptionPatterns = [
    /description/i,
    /desc/i,
    /memo/i,
    /note/i,
    /details/i,
    /narration/i,
    /reference/i,
  ];

  // Common patterns for external ID columns
  const idPatterns = [/id/i, /transaction.*id/i, /external.*id/i, /reference/i, /ref/i];

  // Common patterns for currency columns
  const currencyPatterns = [/currency/i, /curr/i, /ccy/i];

  // Common patterns for category columns
  const categoryPatterns = [/category/i, /cat/i, /type/i, /class/i];

  // Common patterns for payment method columns
  const paymentMethodPatterns = [/payment.*method/i, /method/i, /payment.*type/i, /card/i];

  for (const header of headers) {
    const normalizedHeader = header.trim().toLowerCase();

    // Amount
    if (!mapping.amount && amountPatterns.some((p) => p.test(normalizedHeader))) {
      mapping.amount = header;
    }

    // Date
    if (!mapping.date && datePatterns.some((p) => p.test(normalizedHeader))) {
      mapping.date = header;
    }

    // Description
    if (!mapping.description && descriptionPatterns.some((p) => p.test(normalizedHeader))) {
      mapping.description = header;
    }

    // External ID
    if (!mapping.externalId && idPatterns.some((p) => p.test(normalizedHeader))) {
      mapping.externalId = header;
    }

    // Currency
    if (!mapping.currency && currencyPatterns.some((p) => p.test(normalizedHeader))) {
      mapping.currency = header;
    }

    // Category
    if (!mapping.category && categoryPatterns.some((p) => p.test(normalizedHeader))) {
      mapping.category = header;
    }

    // Payment Method
    if (!mapping.paymentMethod && paymentMethodPatterns.some((p) => p.test(normalizedHeader))) {
      mapping.paymentMethod = header;
    }
  }

  return mapping;
}

/**
 * Parse CSV content into rows
 */
export function parseCSV(csvContent: string | Buffer): { headers: string[]; rows: CSVRow[] } {
  try {
    const raw = Buffer.isBuffer(csvContent) ? csvContent.toString("utf8") : csvContent;
    if (!raw.trim()) {
      throw new CSVParserError("CSV file is empty");
    }

    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false,
      cast: (value, context) => {
        // Try to cast numbers
        if (
          context.column &&
          typeof context.column === "string" &&
          /amount|total|value|sum|price|cost/i.test(context.column)
        ) {
          const num = parseFloat(String(value));
          if (!isNaN(num)) {
            return num;
          }
        }
        return value;
      },
    }) as Record<string, unknown>[];

    if (records.length === 0) {
      throw new CSVParserError("CSV file is empty");
    }

    const firstRecord = records[0];
    if (!firstRecord || typeof firstRecord !== "object") {
      throw new CSVParserError("CSV file is empty or invalid");
    }
    const headers = Object.keys(firstRecord).map((header) => header.trim());

    if (headers.some((header) => !header)) {
      throw new CSVParserError("CSV contains empty header names");
    }

    const normalizedHeaders = headers.map((header) => header.toLowerCase());
    const duplicates = normalizedHeaders.filter(
      (header, index) => normalizedHeaders.indexOf(header) !== index
    );
    if (duplicates.length > 0) {
      throw new CSVParserError(
        `CSV contains duplicate headers: ${[...new Set(duplicates)].join(", ")}`
      );
    }

    const rows: CSVRow[] = records.map((record) => {
      if (!record || typeof record !== "object") {
        return {};
      }
      const row: CSVRow = {};
      for (const [key, value] of Object.entries(record)) {
        row[key] = value as string | number | null | undefined;
      }
      return row;
    });

    return { headers, rows };
  } catch (error) {
    logError("Failed to parse CSV", error);
    throw new Error(
      `CSV parsing failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function normalizeAmountWithReason(rawValue: unknown): { amount: number | null; reason?: string } {
  if (typeof rawValue === "number") {
    return Number.isFinite(rawValue)
      ? { amount: Math.abs(rawValue) }
      : { amount: null, reason: "non_finite_number" };
  }

  if (typeof rawValue === "string") {
    const cleaned = rawValue.replace(/[^\d.,()\-]/g, "").trim();
    if (!cleaned) {
      return { amount: null, reason: "empty_string" };
    }

    let candidate = cleaned;
    if (candidate.includes("(") && candidate.includes(")")) {
      candidate = `-${candidate.replace(/[()]/g, "")}`;
    }

    if (candidate.includes(",") && candidate.includes(".")) {
      if (candidate.lastIndexOf(",") > candidate.lastIndexOf(".")) {
        candidate = candidate.replace(/\./g, "").replace(/,/g, ".");
      } else {
        candidate = candidate.replace(/,/g, "");
      }
    } else if (candidate.includes(",")) {
      const parts = candidate.split(",");
      candidate =
        parts.length === 2 && (parts[1]?.length ?? 0) <= 2
          ? candidate.replace(",", ".")
          : candidate.replace(/,/g, "");
    }

    const parsed = parseFloat(candidate);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return { amount: Math.abs(parsed) };
    }

    return { amount: null, reason: "parse_failed" };
  }

  return { amount: null, reason: "unsupported_type" };
}

function parseDateWithReason(rawValue: unknown): {
  date: Date | null;
  reason?: string;
  ambiguous?: boolean;
} {
  if (rawValue === undefined || rawValue === null) {
    return { date: null, reason: "missing" };
  }

  if (rawValue instanceof Date) {
    return Number.isNaN(rawValue.getTime())
      ? { date: null, reason: "invalid_date_object" }
      : { date: rawValue };
  }

  if (typeof rawValue === "number") {
    const parsed = new Date(rawValue * 1000);
    return Number.isNaN(parsed.getTime())
      ? { date: null, reason: "invalid_unix_timestamp" }
      : { date: parsed };
  }

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return { date: null, reason: "empty_string" };
    }

    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch && slashMatch[1] && slashMatch[2]) {
      const left = Number.parseInt(slashMatch[1], 10);
      const right = Number.parseInt(slashMatch[2], 10);
      if (left <= 12 && right <= 12) {
        return { date: null, reason: "ambiguous_date_format", ambiguous: true };
      }
    }

    const parsed = parseDate(trimmed);
    if (parsed) {
      return { date: parsed };
    }

    return { date: null, reason: "parse_failed" };
  }

  return { date: null, reason: "unsupported_type" };
}

/**
 * Normalize CSV row to internal transaction format
 */
export function normalizeCSVRow(
  row: CSVRow,
  mapping: CSVColumnMapping
): NormalizedTransactionInput {
  const normalized: Partial<NormalizedTransactionInput> = {
    metadata: {},
  };

  // Extract amount
  if (mapping.amount && row[mapping.amount] !== undefined) {
    const amountNormalization = normalizeAmountWithReason(row[mapping.amount]);
    normalized.amount = amountNormalization.amount ?? undefined;
  }

  if (!normalized.amount || normalized.amount <= 0) {
    throw new Error(`Invalid or missing amount in row`);
  }

  // Extract currency (default to USD)
  if (mapping.currency && row[mapping.currency] !== undefined) {
    const currencyValue = String(row[mapping.currency]).trim().toUpperCase();
    if (currencyValue.length === 3) {
      normalized.currency = currencyValue;
    } else {
      normalized.currency = "USD";
    }
  } else {
    normalized.currency = "USD";
  }

  // Extract date
  if (mapping.date && row[mapping.date] !== undefined) {
    const dateValue = row[mapping.date];
    if (dateValue && typeof dateValue === "object" && "getTime" in dateValue) {
      normalized.date = dateValue as Date;
    } else if (typeof dateValue === "string") {
      const parsed = parseDate(dateValue);
      if (parsed) {
        normalized.date = parsed;
      } else {
        throw new Error(`Invalid date format: ${dateValue}`);
      }
    } else if (typeof dateValue === "number") {
      normalized.date = new Date(dateValue * 1000);
    }
  } else {
    throw new Error("Date column is required");
  }

  // Extract description
  if (mapping.description && row[mapping.description]) {
    normalized.description = String(row[mapping.description]).trim() || undefined;
  }

  // Extract external ID
  if (mapping.externalId && row[mapping.externalId]) {
    normalized.externalId = String(row[mapping.externalId]).trim() || undefined;
  }

  // Extract category
  if (mapping.category && row[mapping.category]) {
    normalized.category = String(row[mapping.category]).trim() || undefined;
  }

  // Extract payment method
  if (mapping.paymentMethod && row[mapping.paymentMethod]) {
    normalized.paymentMethod = String(row[mapping.paymentMethod]).trim() || undefined;
  }

  // Extract reference
  if (mapping.reference && row[mapping.reference]) {
    normalized.reference = String(row[mapping.reference]).trim() || undefined;
  }

  // Store all original row data in metadata
  normalized.metadata = { ...row };

  // Validate using zod schema
  return NormalizedTransactionSchema.parse(normalized);
}

export function buildImportWorkbenchPreview(params: {
  fileName?: string;
  fileSizeBytes: number;
  headers: string[];
  rows: CSVRow[];
  providedMapping?: CSVColumnMapping;
  sourceProfile?: ImportSourceProfile;
  schemaDriftBaseline?: {
    ingestionId: string;
    capturedAt: string;
    headers: string[];
  };
  schemaDriftHistory?: Array<{
    headers: string[];
    hasDrift: boolean;
  }>;
}): ImportWorkbenchPreview {
  const { fileName, fileSizeBytes, headers, rows, providedMapping, sourceProfile } = params;
  const detectedMapping = autoDetectColumnMapping(headers);
  const effectiveMapping = { ...detectedMapping, ...(providedMapping || {}) };

  const diagnostics: IngestionDiagnostic[] = [];
  const resolvedSourceProfile: ImportSourceProfile =
    sourceProfile ||
    (headers.some((h) => /account|statement|balance/i.test(h)) ? "bank_statement" : "csv_generic");
  const profileGates = PROFILE_GATE_CONFIG[resolvedSourceProfile];

  const normalizedHeaders = headers.map((h) => h.toLowerCase());
  const duplicateHeaders = [
    ...new Set(normalizedHeaders.filter((h, i) => normalizedHeaders.indexOf(h) !== i)),
  ];
  if (duplicateHeaders.length > 0) {
    diagnostics.push(withRemediation({
      severity: "blocking",
      stage: "parse",
      code: "duplicate_headers",
      message: `Duplicate headers detected: ${duplicateHeaders.join(", ")}`,
      details: { duplicateHeaders },
    }));
  }

  const baseline = params.schemaDriftBaseline;
  let schemaDrift: ImportWorkbenchPreview["schemaDrift"];
  if (baseline) {
    const current = new Set(headers.map((header) => header.toLowerCase()));
    const prior = new Set(baseline.headers.map((header) => header.toLowerCase()));
    const addedHeaders = [...current].filter((header) => !prior.has(header));
    const removedHeaders = [...prior].filter((header) => !current.has(header));
    const hasDrift = addedHeaders.length > 0 || removedHeaders.length > 0;
    schemaDrift = {
      hasDrift,
      baselineIngestionId: baseline.ingestionId,
      baselineCapturedAt: baseline.capturedAt,
      addedHeaders,
      removedHeaders,
      severity: hasDrift ? "warning" : "info",
    };

    if (hasDrift) {
      diagnostics.push(withRemediation({
        severity: "warning",
        stage: "mapping",
        code: "schema_drift_detected",
        message: "Schema drift detected against baseline ingestion",
        details: {
          baselineIngestionId: baseline.ingestionId,
          addedHeaders,
          removedHeaders,
        },
      }));
    }
  }

  if (schemaDrift && params.schemaDriftHistory && params.schemaDriftHistory.length > 0) {
    const driftedRuns = params.schemaDriftHistory.filter((item) => item.hasDrift).length + (schemaDrift.hasDrift ? 1 : 0);
    const historyWindow = params.schemaDriftHistory.length + 1;
    const churnRate = driftedRuns / historyWindow;
    schemaDrift.trend = {
      historyWindow,
      driftedRuns,
      churnRate,
      escalationThreshold: 0.5,
    };

    if (schemaDrift.hasDrift && churnRate >= 0.5) {
      schemaDrift.severity = "blocking";
      diagnostics.push(
        withRemediation({
          severity: "blocking",
          stage: "mapping",
          code: "schema_drift_detected",
          message: "Schema drift trend exceeded escalation threshold",
          details: { churnRate, historyWindow, driftedRuns },
        })
      );
    }
  }

  const requiredMissing = REQUIRED_MAPPING_FIELDS.filter((field) => !effectiveMapping[field]);
  for (const missing of requiredMissing) {
    diagnostics.push(withRemediation({
      severity: "blocking",
      stage: "mapping",
      code: "required_mapping_missing",
      message: `Required mapping missing for ${missing}`,
      field: missing,
    }));
  }

  let normalizedRows = 0;
  let failedRows = 0;
  const defaultedFieldCounts: Record<string, number> = {};
  const sampleNormalizedRecords: NormalizedTransactionInput[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    if (!row) {
      failedRows += 1;
      diagnostics.push(withRemediation({
        severity: "warning",
        stage: "parse",
        code: "empty_row_object",
        message: "Encountered empty row object",
        rowNumber: index + 1,
      }));
      continue;
    }

    if (!effectiveMapping.amount || !effectiveMapping.date) {
      failedRows += 1;
      continue;
    }

    const amountRaw = row[effectiveMapping.amount];
    const amountNormalization = normalizeAmountWithReason(amountRaw);
    if (amountNormalization.amount === null || amountNormalization.amount <= 0) {
      failedRows += 1;
      diagnostics.push(withRemediation({
        severity: "blocking",
        stage: "normalize",
        code: "invalid_amount",
        message: `Amount could not be normalized`,
        rowNumber: index + 1,
        field: effectiveMapping.amount,
        details: { raw: amountRaw, reason: amountNormalization.reason },
      }));
      continue;
    }

    const dateRaw = row[effectiveMapping.date];
    const dateNormalization = parseDateWithReason(dateRaw);
    if (!dateNormalization.date) {
      failedRows += 1;
      diagnostics.push(withRemediation({
        severity: dateNormalization.ambiguous ? "warning" : "blocking",
        stage: "normalize",
        code: dateNormalization.ambiguous ? "ambiguous_date" : "invalid_date",
        message: dateNormalization.ambiguous
          ? "Date format is ambiguous; use YYYY-MM-DD or unambiguous slash format"
          : "Date could not be parsed",
        rowNumber: index + 1,
        field: effectiveMapping.date,
        details: { raw: dateRaw, reason: dateNormalization.reason },
      }));
      continue;
    }

    const currencyColumn = effectiveMapping.currency;
    let currency = "USD";
    if (currencyColumn && row[currencyColumn] !== undefined) {
      const parsedCurrency = String(row[currencyColumn] ?? "")
        .trim()
        .toUpperCase();
      if (parsedCurrency.length === 3) {
        currency = parsedCurrency;
      } else {
        defaultedFieldCounts.currency = (defaultedFieldCounts.currency ?? 0) + 1;
        diagnostics.push(withRemediation({
          severity: "info",
          stage: "normalize",
          code: "currency_defaulted",
          message: "Currency defaulted to USD due to malformed value",
          rowNumber: index + 1,
          field: currencyColumn,
          details: { raw: row[currencyColumn] },
        }));
      }
    } else {
      defaultedFieldCounts.currency = (defaultedFieldCounts.currency ?? 0) + 1;
      diagnostics.push(withRemediation({
        severity: "info",
        stage: "normalize",
        code: "currency_defaulted",
        message: "Currency defaulted to USD due to missing mapping/value",
        rowNumber: index + 1,
      }));
    }

    const normalized = NormalizedTransactionSchema.parse({
      amount: amountNormalization.amount,
      currency,
      date: dateNormalization.date,
      description: effectiveMapping.description
        ? String(row[effectiveMapping.description] ?? "").trim() || undefined
        : undefined,
      externalId: effectiveMapping.externalId
        ? String(row[effectiveMapping.externalId] ?? "").trim() || undefined
        : undefined,
      category: effectiveMapping.category
        ? String(row[effectiveMapping.category] ?? "").trim() || undefined
        : undefined,
      paymentMethod: effectiveMapping.paymentMethod
        ? String(row[effectiveMapping.paymentMethod] ?? "").trim() || undefined
        : undefined,
      reference: effectiveMapping.reference
        ? String(row[effectiveMapping.reference] ?? "").trim() || undefined
        : undefined,
      metadata: { ...row },
    });

    normalizedRows += 1;
    if (sampleNormalizedRecords.length < 10) {
      sampleNormalizedRecords.push(normalized);
    }

    const mappedColumns = new Set(Object.values(effectiveMapping).filter(Boolean));
    const droppedFields = Object.keys(row).filter((key) => !mappedColumns.has(key));
    if (droppedFields.length > 0) {
      diagnostics.push(withRemediation({
        severity: "info",
        stage: "mapping",
        code: "unmapped_fields_present",
        message: "Row contains unmapped source fields",
        rowNumber: index + 1,
        details: { droppedFields },
      }));
    }
  }

  const attemptedRows = rows.length;
  const droppedRows = failedRows;

  const fingerprintCounts = new Map<string, number>();
  for (const row of rows) {
    const fingerprint = JSON.stringify(row);
    fingerprintCounts.set(fingerprint, (fingerprintCounts.get(fingerprint) ?? 0) + 1);
  }
  const duplicateRowCount = [...fingerprintCounts.values()].filter((count) => count > 1).length;

  const currencyValues = sampleNormalizedRecords.map((record) => record.currency);
  const invalidCurrencyCount = currencyValues.filter((currency) => currency.length !== 3).length;

  const qualityGates: IngestionQualityGate[] = [
    {
      gate: "required_mapping_present",
      severity: "blocking",
      passed: requiredMissing.length === 0,
      message:
        requiredMissing.length === 0
          ? "Required mapping fields are present"
          : `Missing required mappings: ${requiredMissing.join(", ")}`,
      metric: { requiredMissingCount: requiredMissing.length },
    },
    {
      gate: "non_empty_import",
      severity: "blocking",
      passed: attemptedRows > 0,
      message: attemptedRows > 0 ? "Import has at least one row" : "Import is empty",
      metric: { attemptedRows },
    },
    {
      gate: "normalization_success_ratio",
      severity: "warning",
      passed:
        attemptedRows === 0 ? false : normalizedRows / attemptedRows >= profileGates.normalizationThreshold,
      message:
        attemptedRows === 0
          ? "No rows to normalize"
          : `Normalization success ratio ${(normalizedRows / attemptedRows).toFixed(2)} (threshold ${profileGates.normalizationThreshold.toFixed(2)})`,
      metric: { normalizedRows, attemptedRows, threshold: profileGates.normalizationThreshold },
    },
    {
      gate: "duplicate_row_ratio",
      severity: "warning",
      passed:
        attemptedRows === 0
          ? true
          : duplicateRowCount / attemptedRows <= profileGates.duplicateRowThreshold,
      message:
        attemptedRows === 0
          ? "No rows available for duplicate analysis"
          : `Duplicate row ratio ${(duplicateRowCount / attemptedRows).toFixed(2)} (threshold ${profileGates.duplicateRowThreshold.toFixed(2)})`,
      metric: { duplicateRowCount, attemptedRows, threshold: profileGates.duplicateRowThreshold },
    },
    {
      gate: "currency_format_distribution",
      severity: profileGates.currencySeverity,
      passed: invalidCurrencyCount === 0,
      message:
        invalidCurrencyCount === 0
          ? "All sampled normalized currencies are 3-char codes"
          : `${invalidCurrencyCount} sampled normalized rows have invalid currency format`,
      metric: { invalidCurrencyCount, sampledRows: currencyValues.length },
    },
  ];

  if (attemptedRows > 0 && failedRows / attemptedRows > 0.2) {
    diagnostics.push(withRemediation({
      severity: "warning",
      stage: "quality_gate",
      code: "high_dropped_row_ratio",
      message: "Dropped-row ratio exceeds 20%",
      details: { failedRows, attemptedRows, ratio: failedRows / attemptedRows },
    }));
  }

  const hasBlocking =
    diagnostics.some((d) => d.severity === "blocking") ||
    qualityGates.some((g) => !g.passed && g.severity === "blocking");

  return {
    sourceSummary: {
      fileName,
      sizeBytes: fileSizeBytes,
      totalRows: rows.length,
      headers,
      duplicateHeaders,
    },
    mapping: {
      provided: providedMapping || null,
      detected: detectedMapping,
      effective: effectiveMapping,
      requiredMissing,
    },
    normalization: {
      attemptedRows,
      normalizedRows,
      failedRows,
      droppedRows,
      defaultedFieldCounts,
      sampleNormalizedRecords,
    },
    diagnostics,
    qualityGates,
    schemaDrift,
    sourceProfile: resolvedSourceProfile,
    canProceed: !hasBlocking,
    contract: IMPORT_WORKBENCH_CONTRACT,
  };
}

/**
 * Parse date string in various formats
 */
function parseDate(dateString: string): Date | null {
  const trimmed = dateString.trim();
  if (!trimmed) {
    return null;
  }

  const ambiguousSlashFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const ambiguousMatch = trimmed.match(ambiguousSlashFormat);
  if (ambiguousMatch) {
    const left = Number.parseInt(ambiguousMatch[1] ?? "", 10);
    const right = Number.parseInt(ambiguousMatch[2] ?? "", 10);
    if (left <= 12 && right <= 12) {
      return null;
    }
  }

  // Try ISO format first
  const isoDate = new Date(trimmed);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try common formats: YYYY-MM-DD and unambiguous slash formats
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const year = Number.parseInt(isoMatch[1], 10);
    const month = Number.parseInt(isoMatch[2], 10);
    const day = Number.parseInt(isoMatch[3], 10);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    ) {
      return date;
    }
  }

  if (ambiguousMatch && ambiguousMatch[1] && ambiguousMatch[2] && ambiguousMatch[3]) {
    const left = Number.parseInt(ambiguousMatch[1], 10);
    const right = Number.parseInt(ambiguousMatch[2], 10);
    const year = Number.parseInt(ambiguousMatch[3], 10);

    let month = left;
    let day = right;
    if (left > 12 && right <= 12) {
      day = left;
      month = right;
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    ) {
      return date;
    }
  }

  return null;
}

/**
 * Validate CSV mapping completeness
 */
export function validateMapping(mapping: CSVColumnMapping | undefined): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!mapping) {
    errors.push("Column mapping is required");
    return { valid: false, errors };
  }

  if (!mapping.amount) {
    errors.push("Amount column mapping is required");
  }

  if (!mapping.date) {
    errors.push("Date column mapping is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
