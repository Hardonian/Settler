"use strict";
/**
 * Ingestion Service
 * Handles local data ingestion, schema inference, and PII detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionService = void 0;
const logger_1 = require("../utils/logger");
class IngestionService {
    _db;
    piiRedaction;
    constructor(_db, piiRedaction) {
        this._db = _db;
        this.piiRedaction = piiRedaction;
    }
    process(data, schemaHints) {
        logger_1.logger.info("Processing ingestion", { recordCount: data.length });
        // Infer schema
        const schema = this.inferSchema(data, schemaHints);
        // Detect and redact PII
        let piiDetected = false;
        const processedData = data.map((record) => {
            if (typeof record === "object" && record !== null) {
                const processed = { ...record };
                for (const field of schema.fields) {
                    if (field.piiType && processed[field.name]) {
                        piiDetected = true;
                        processed[field.name] = this.piiRedaction.redact(String(processed[field.name]), field.piiType);
                    }
                }
                return processed;
            }
            return record;
        });
        return {
            processedData,
            inferredSchema: schema,
            piiDetected,
        };
    }
    inferSchema(data, hints) {
        if (data.length === 0) {
            return { fields: [] };
        }
        const firstRecord = data[0];
        if (typeof firstRecord !== "object" || firstRecord === null) {
            return { fields: [] };
        }
        const fields = [];
        const record = firstRecord;
        for (const [key, value] of Object.entries(record)) {
            const hint = hints?.[key];
            const type = hint || this.inferType(value);
            const piiType = this.detectPII(key, value);
            const field = {
                name: key,
                type: type,
            };
            if (piiType) {
                field.piiType = piiType;
            }
            fields.push(field);
        }
        return { fields };
    }
    inferType(value) {
        if (typeof value === "number") {
            return "number";
        }
        if (typeof value === "boolean") {
            return "boolean";
        }
        if (typeof value === "string") {
            // Try to detect date
            if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
                return "date";
            }
            return "string";
        }
        return "unknown";
    }
    detectPII(fieldName, value) {
        if (typeof value !== "string") {
            return undefined;
        }
        const lowerName = fieldName.toLowerCase();
        // Email detection
        if (lowerName.includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return "email";
        }
        // Credit card detection
        if (lowerName.includes("card") ||
            /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(value.replace(/\s/g, ""))) {
            return "credit_card";
        }
        // SSN detection
        if (lowerName.includes("ssn") || /^\d{3}-\d{2}-\d{4}$/.test(value)) {
            return "ssn";
        }
        // Phone detection
        if (lowerName.includes("phone") || /^\+?[\d\s\-()]+$/.test(value)) {
            return "phone";
        }
        // Name detection
        if (lowerName.includes("name") && value.split(" ").length >= 2) {
            return "name";
        }
        return undefined;
    }
}
exports.IngestionService = IngestionService;
//# sourceMappingURL=IngestionService.js.map