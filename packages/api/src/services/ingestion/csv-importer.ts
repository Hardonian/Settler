/**
 * CSV Import Engine
 * Handles CSV upload, column mapping (auto-detect + manual override), and validation
 */

import { parse } from "csv-parse/sync";
import {
  CSVColumnMapping,
  CSVRow,
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
    const amountValue = row[mapping.amount];
    if (typeof amountValue === "number") {
      normalized.amount = Math.abs(amountValue); // Always positive
    } else if (typeof amountValue === "string") {
      // Remove currency symbols and whitespace
      const cleaned = amountValue.replace(/[^\d.-]/g, "");
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        normalized.amount = Math.abs(parsed);
      }
    }
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
      // Try multiple date formats
      const parsed = parseDate(dateValue);
      if (parsed) {
        normalized.date = parsed;
      } else {
        throw new Error(`Invalid date format: ${dateValue}`);
      }
    } else if (typeof dateValue === "number") {
      // Unix timestamp
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
