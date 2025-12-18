/**
 * CSV Import Engine
 * Handles CSV upload, column mapping (auto-detect + manual override), and validation
 */
import { CSVColumnMapping, CSVRow, NormalizedTransactionInput } from "./types";
/**
 * Auto-detect column mapping from CSV headers
 */
export declare function autoDetectColumnMapping(headers: string[]): CSVColumnMapping;
/**
 * Parse CSV content into rows
 */
export declare function parseCSV(csvContent: string | Buffer): {
    headers: string[];
    rows: CSVRow[];
};
/**
 * Normalize CSV row to internal transaction format
 */
export declare function normalizeCSVRow(row: CSVRow, mapping: CSVColumnMapping): NormalizedTransactionInput;
/**
 * Validate CSV mapping completeness
 */
export declare function validateMapping(mapping: CSVColumnMapping | undefined): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=csv-importer.d.ts.map