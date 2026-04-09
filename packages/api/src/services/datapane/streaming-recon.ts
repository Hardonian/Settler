/**
 * Streaming Reconciliation
 *
 * Incremental file ingestion, streaming schema diffs, real-time validation
 * Part 10: Next-Gen Data Plane & Processing Layers
 */

import { EventEmitter } from "events";
import { logInfo } from "../../utils/logger";

export interface StreamingReconConfig {
  batchSize: number;
  flushInterval: number; // milliseconds
  enableSchemaDiff: boolean;
  enableRealTimeValidation: boolean;
}

export interface StreamingUpdate {
  type: "ingestion" | "schema_diff" | "validation" | "recon";
  data: Record<string, unknown>;
  timestamp: Date;
}

export interface BufferedItem {
  data: Record<string, unknown>;
  sourceId: string;
  timestamp: Date;
}

export interface SchemaDefinition {
  fields: Array<{
    name: string;
    type: string;
    nullable?: boolean;
  }>;
  [key: string]: unknown;
}

export class StreamingRecon extends EventEmitter {
  private config: StreamingReconConfig;
  private buffer: BufferedItem[] = [];
  private schemaCache: Map<string, SchemaDefinition> = new Map();

  constructor(config: StreamingReconConfig) {
    super();
    this.config = config;

    // Set up flush interval
    if (this.config.flushInterval > 0) {
      setInterval(() => this.flush(), this.config.flushInterval);
    }
  }

  /**
   * Ingest data incrementally
   */
  async ingestIncremental(data: Record<string, unknown>, sourceId: string): Promise<void> {
    this.buffer.push({ data, sourceId, timestamp: new Date() });

    // Emit ingestion event
    this.emit("ingestion", {
      type: "ingestion",
      data,
      timestamp: new Date(),
    } as StreamingUpdate);

    // Flush if buffer is full
    if (this.buffer.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * Process streaming schema diff
   */
  async processSchemaDiff(schema: SchemaDefinition, sourceId: string): Promise<void> {
    const previousSchema = this.schemaCache.get(sourceId);

    if (previousSchema) {
      const diff = this.computeSchemaDiff(previousSchema, schema);

      if (diff.changes.length > 0) {
        this.emit("schema_diff", {
          type: "schema_diff",
          data: diff,
          timestamp: new Date(),
        } as StreamingUpdate);
      }
    }

    this.schemaCache.set(sourceId, schema);
  }

  /**
   * Real-time validation
   */
  async validateRealTime(
    data: Record<string, unknown>,
    rules: Array<Record<string, unknown>>
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    for (const rule of rules) {
      const result = await this.applyValidationRule(data, rule);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    const valid = errors.length === 0;

    if (this.config.enableRealTimeValidation) {
      this.emit("validation", {
        type: "validation",
        data: { valid, errors },
        timestamp: new Date(),
      } as StreamingUpdate);
    }

    return { valid, errors };
  }

  /**
   * Progressive recon update
   */
  async progressiveRecon(
    sourceData: Record<string, unknown>[],
    targetData: Record<string, unknown>[]
  ): Promise<{
    matched: number;
    unmatched: number;
    progress: number; // 0-1
  }> {
    // Process data in chunks and emit progress updates
    const total = Math.max(sourceData.length, targetData.length);
    let matched = 0;
    let unmatched = 0;
    let processed = 0;

    for (let i = 0; i < Math.min(sourceData.length, targetData.length); i++) {
      // Match logic
      const sourceItem = sourceData[i];
      const targetItem = targetData[i];
      if (sourceItem && targetItem && this.match(sourceItem, targetItem)) {
        matched++;
      } else {
        unmatched++;
      }
      processed++;

      // Emit progress
      const progress = processed / total;
      this.emit("recon", {
        type: "recon",
        data: { matched, unmatched, progress },
        timestamp: new Date(),
      } as StreamingUpdate);
    }

    return { matched, unmatched, progress: 1.0 };
  }

  /**
   * Flush buffer
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const batch = this.buffer.splice(0, this.config.batchSize);
    logInfo("Flushing streaming buffer", { batchSize: batch.length });

    // Process batch
    await this.processBatch(batch);
  }

  /**
   * Process a batch of records
   */
  private async processBatch(batch: StreamingRecord[]): Promise<void> {
    logInfo(`Processing batch of ${batch.length} records`);

    try {
      // Group by tenant for efficient processing
      const byTenant = batch.reduce((acc, record) => {
        if (!acc[record.tenantId]) acc[record.tenantId] = [];
        acc[record.tenantId].push(record);
        return acc;
      }, {} as Record<string, StreamingRecord[]>);

      // Process each tenant's records
      for (const [tenantId, records] of Object.entries(byTenant)) {
        // Validate records
        const validationResults = await Promise.all(
          records.map(r => this.validateRecord(r.data, r.schema))
        );

        // Transform records
        const transformedRecords = records.map((r, i) => ({
          ...r,
          data: validationResults[i].valid ? r.data : null,
          validationErrors: validationResults[i].errors,
        })).filter(r => r.data !== null);

        // Store in database
        if (transformedRecords.length > 0) {
          await this.prisma.streamingRecord.createMany({
            data: transformedRecords.map(r => ({
              tenantId: r.tenantId,
              data: r.data as Prisma.InputJsonValue,
              schema: r.schema as Prisma.InputJsonValue,
              processedAt: new Date(),
            })),
            skipDuplicates: true,
          });
        }

        // Emit progress
        this.emit("batch_processed", {
          type: "batch_processed",
          data: {
            tenantId,
            processed: records.length,
            valid: transformedRecords.length,
            invalid: records.length - transformedRecords.length,
          },
          timestamp: new Date(),
        } as StreamingUpdate);
      }
    } catch (error) {
      logError("Batch processing failed", error);
      throw error;
    }

  /**
   * Compute schema diff
   */
  private computeSchemaDiff(
    oldSchema: SchemaDefinition,
    newSchema: SchemaDefinition
  ): {
    changes: Array<{
      type: "added" | "removed" | "modified";
      field: string;
      oldValue?: unknown;
      newValue?: unknown;
    }>;
  } {
    const changes: Array<{
      type: "added" | "removed" | "modified";
      field: string;
      oldValue?: unknown;
      newValue?: unknown;
    }> = [];

    const oldFieldsMap = new Map((oldSchema.fields || []).map((f) => [f.name, f]));
    const newFieldsMap = new Map((newSchema.fields || []).map((f) => [f.name, f]));

    const oldFields = new Set(oldFieldsMap.keys());
    const newFields = new Set(newFieldsMap.keys());

    // Find added fields
    for (const field of newFields) {
      if (!oldFields.has(field)) {
        const fieldDef = newFieldsMap.get(field);
        changes.push({
          type: "added",
          field,
          newValue: fieldDef,
        });
      }
    }

    // Find removed fields
    for (const field of oldFields) {
      if (!newFields.has(field)) {
        const fieldDef = oldFieldsMap.get(field);
        changes.push({
          type: "removed",
          field,
          oldValue: fieldDef,
        });
      }
    }

    // Find modified fields
    for (const field of oldFields) {
      if (newFields.has(field)) {
        const oldValue = oldFieldsMap.get(field);
        const newValue = newFieldsMap.get(field);
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            type: "modified",
            field,
            oldValue,
            newValue,
          });
        }
      }
    }

    return { changes };
  }

  /**
   * Apply validation rule
   */
  private async applyValidationRule(
    data: Record<string, unknown>,
    rule: Record<string, unknown>
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const { field, type, required, pattern, min, max } = rule;

    const value = data[field as string];

    // Required check
    if (required && (value === undefined || value === null || value === "")) {
      errors.push(`${field} is required`);
    }

    if (value !== undefined && value !== null) {
      // Type validation
      switch (type) {
        case "string":
          if (typeof value !== "string") errors.push(`${field} must be a string`);
          break;
        case "number":
          if (typeof value !== "number" || isNaN(value)) errors.push(`${field} must be a number`);
          break;
        case "date":
          if (isNaN(Date.parse(String(value)))) errors.push(`${field} must be a valid date`);
          break;
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
            errors.push(`${field} must be a valid email`);
          }
          break;
      }

      // Pattern validation
      if (pattern && !new RegExp(pattern as string).test(String(value))) {
        errors.push(`${field} does not match required pattern`);
      }

      // Range validation for numbers
      if (type === "number" && typeof value === "number") {
        if (min !== undefined && value < (min as number)) {
          errors.push(`${field} must be >= ${min}`);
        }
        if (max !== undefined && value > (max as number)) {
          errors.push(`${field} must be <= ${max}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Match two records using configurable matching rules
   */
  private match(source: Record<string, unknown>, target: Record<string, unknown>): boolean {
    // Get match keys from config or use defaults
    const matchKeys = this.config.matchKeys || ["id", "externalId", "reference"];

    // Try exact match on primary keys
    for (const key of matchKeys) {
      const sourceVal = source[key];
      const targetVal = target[key];

      if (sourceVal !== undefined && targetVal !== undefined) {
        if (sourceVal === targetVal) return true;

        // Try fuzzy match for strings
        if (typeof sourceVal === "string" && typeof targetVal === "string") {
          const normalizedSource = sourceVal.toLowerCase().trim();
          const normalizedTarget = targetVal.toLowerCase().trim();
          if (normalizedSource === normalizedTarget) return true;

          // Try substring match
          if (normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource)) {
            return true;
          }
        }
      }
    }

    // Try amount + date matching for financial records
    const sourceAmount = source["amount"] || source["total"];
    const targetAmount = target["amount"] || target["total"];
    const sourceDate = source["date"] || source["createdAt"];
    const targetDate = target["date"] || target["createdAt"];

    if (sourceAmount !== undefined && targetAmount !== undefined &&
        sourceDate !== undefined && targetDate !== undefined) {
      const amountMatch = Math.abs(Number(sourceAmount) - Number(targetAmount)) < 0.01;
      const sourceDateObj = new Date(sourceDate as string);
      const targetDateObj = new Date(targetDate as string);
      const dateMatch = Math.abs(sourceDateObj.getTime() - targetDateObj.getTime()) < 24 * 60 * 60 * 1000; // 1 day tolerance

      if (amountMatch && dateMatch) return true;
    }

    return false;
  }
}
