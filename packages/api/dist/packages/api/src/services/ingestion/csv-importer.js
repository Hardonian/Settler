"use strict";
/**
 * CSV Import Engine
 * Handles CSV upload, column mapping (auto-detect + manual override), and validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoDetectColumnMapping = autoDetectColumnMapping;
exports.parseCSV = parseCSV;
exports.normalizeCSVRow = normalizeCSVRow;
exports.validateMapping = validateMapping;
const sync_1 = require("csv-parse/sync");
const types_1 = require("./types");
const logger_1 = require("../../utils/logger");
/**
 * Auto-detect column mapping from CSV headers
 */
function autoDetectColumnMapping(headers) {
    const mapping = {};
    // Common patterns for amount columns
    const amountPatterns = [
        /amount/i,
        /total/i,
        /value/i,
        /sum/i,
        /price/i,
        /cost/i,
    ];
    // Common patterns for date columns
    const datePatterns = [
        /date/i,
        /time/i,
        /timestamp/i,
        /created/i,
        /transaction.*date/i,
    ];
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
    const idPatterns = [
        /id/i,
        /transaction.*id/i,
        /external.*id/i,
        /reference/i,
        /ref/i,
    ];
    // Common patterns for currency columns
    const currencyPatterns = [/currency/i, /curr/i, /ccy/i];
    // Common patterns for category columns
    const categoryPatterns = [/category/i, /cat/i, /type/i, /class/i];
    // Common patterns for payment method columns
    const paymentMethodPatterns = [
        /payment.*method/i,
        /method/i,
        /payment.*type/i,
        /card/i,
    ];
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
        if (!mapping.description &&
            descriptionPatterns.some((p) => p.test(normalizedHeader))) {
            mapping.description = header;
        }
        // External ID
        if (!mapping.externalId && idPatterns.some((p) => p.test(normalizedHeader))) {
            mapping.externalId = header;
        }
        // Currency
        if (!mapping.currency &&
            currencyPatterns.some((p) => p.test(normalizedHeader))) {
            mapping.currency = header;
        }
        // Category
        if (!mapping.category &&
            categoryPatterns.some((p) => p.test(normalizedHeader))) {
            mapping.category = header;
        }
        // Payment Method
        if (!mapping.paymentMethod &&
            paymentMethodPatterns.some((p) => p.test(normalizedHeader))) {
            mapping.paymentMethod = header;
        }
    }
    return mapping;
}
/**
 * Parse CSV content into rows
 */
function parseCSV(csvContent) {
    try {
        const records = (0, sync_1.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            cast: (value, context) => {
                // Try to cast numbers
                if (context.column && typeof context.column === "string" && /amount|total|value|sum|price|cost/i.test(context.column)) {
                    const num = parseFloat(String(value));
                    if (!isNaN(num)) {
                        return num;
                    }
                }
                return value;
            },
        });
        if (records.length === 0) {
            throw new Error("CSV file is empty");
        }
        const firstRecord = records[0];
        if (!firstRecord || typeof firstRecord !== "object") {
            throw new Error("CSV file is empty or invalid");
        }
        const headers = Object.keys(firstRecord);
        const rows = records.map((record) => {
            if (!record || typeof record !== "object") {
                return {};
            }
            const row = {};
            for (const [key, value] of Object.entries(record)) {
                row[key] = value;
            }
            return row;
        });
        return { headers, rows };
    }
    catch (error) {
        (0, logger_1.logError)("Failed to parse CSV", error);
        throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Normalize CSV row to internal transaction format
 */
function normalizeCSVRow(row, mapping) {
    const normalized = {
        metadata: {},
    };
    // Extract amount
    if (mapping.amount && row[mapping.amount] !== undefined) {
        const amountValue = row[mapping.amount];
        if (typeof amountValue === "number") {
            normalized.amount = Math.abs(amountValue); // Always positive
        }
        else if (typeof amountValue === "string") {
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
        }
        else {
            normalized.currency = "USD";
        }
    }
    else {
        normalized.currency = "USD";
    }
    // Extract date
    if (mapping.date && row[mapping.date] !== undefined) {
        const dateValue = row[mapping.date];
        if (dateValue && typeof dateValue === "object" && "getTime" in dateValue) {
            normalized.date = dateValue;
        }
        else if (typeof dateValue === "string") {
            // Try multiple date formats
            const parsed = parseDate(dateValue);
            if (parsed) {
                normalized.date = parsed;
            }
            else {
                throw new Error(`Invalid date format: ${dateValue}`);
            }
        }
        else if (typeof dateValue === "number") {
            // Unix timestamp
            normalized.date = new Date(dateValue * 1000);
        }
    }
    else {
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
    return types_1.NormalizedTransactionSchema.parse(normalized);
}
/**
 * Parse date string in various formats
 */
function parseDate(dateString) {
    // Try ISO format first
    const isoDate = new Date(dateString);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }
    // Try common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
    const formats = [
        /^(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
        /^(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
        /^(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY (ambiguous, prefer MM/DD)
    ];
    for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
            if (format.source.includes("YYYY") && match[1] && match[2] && match[3]) {
                const year = parseInt(match[1], 10);
                const month = parseInt(match[2], 10) - 1;
                const day = parseInt(match[3], 10);
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
    }
    return null;
}
/**
 * Validate CSV mapping completeness
 */
function validateMapping(mapping) {
    const errors = [];
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
//# sourceMappingURL=csv-importer.js.map