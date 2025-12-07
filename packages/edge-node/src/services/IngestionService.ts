/**
 * Ingestion Service
 * Handles local data ingestion, schema inference, and PII detection
 */

import Database from "better-sqlite3";
import { PIIRedactionService } from "./PIIRedactionService";
import { logger } from "../utils/logger";

export interface InferredSchema {
  fields: Array<{
    name: string;
    type: "string" | "number" | "date" | "boolean" | "unknown";
    piiType?: string;
  }>;
}

export interface IngestionResult {
  processedData: unknown[];
  inferredSchema: InferredSchema;
  piiDetected: boolean;
}

export class IngestionService {
  constructor(
    // @ts-expect-error - Reserved for future use
    private _db: Database.Database,
    private piiRedaction: PIIRedactionService
  ) {}

  process(data: unknown[], schemaHints?: Record<string, string>): IngestionResult {
    logger.info("Processing ingestion", { recordCount: data.length });

    // Infer schema
    const schema = this.inferSchema(data, schemaHints);

    // Detect and redact PII
    let piiDetected = false;
    const processedData = data.map((record) => {
      if (typeof record === "object" && record !== null) {
        const processed = { ...(record as Record<string, unknown>) };

        for (const field of schema.fields) {
          if (field.piiType && processed[field.name]) {
            piiDetected = true;
            processed[field.name] = this.piiRedaction.redact(
              String(processed[field.name]),
              field.piiType
            );
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

  private inferSchema(data: unknown[], hints?: Record<string, string>): InferredSchema {
    if (data.length === 0) {
      return { fields: [] };
    }

    const firstRecord = data[0];
    if (typeof firstRecord !== "object" || firstRecord === null) {
      return { fields: [] };
    }

    const fields: InferredSchema["fields"] = [];
    const record = firstRecord as Record<string, unknown>;

    for (const [key, value] of Object.entries(record)) {
      const hint = hints?.[key];
      const type = hint || this.inferType(value);
      const piiType = this.detectPII(key, value);

      const field: InferredSchema["fields"][number] = {
        name: key,
        type: type as "string" | "number" | "date" | "boolean" | "unknown",
      };

      if (piiType) {
        field.piiType = piiType;
      }

      fields.push(field);
    }

    return { fields };
  }

  private inferType(value: unknown): string {
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

  private detectPII(fieldName: string, value: unknown): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const lowerName = fieldName.toLowerCase();

    // Email detection
    if (lowerName.includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "email";
    }

    // Credit card detection
    if (
      lowerName.includes("card") ||
      /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(value.replace(/\s/g, ""))
    ) {
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
