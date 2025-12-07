/**
 * Anomaly Detection Service
 * Detects anomalies in transaction data using ML models
 */

import Database from "better-sqlite3";
import { ModelManager } from "./ModelManager";
import { logger } from "../utils/logger";

export interface Anomaly {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  transactionData: Record<string, unknown>;
  score?: number;
}

export class AnomalyDetectionService {
  constructor(
    private db: Database.Database,
    // @ts-expect-error - Reserved for future use
    private _modelManager: ModelManager
  ) {}

  detect(data: unknown[]): Anomaly[] {
    logger.info("Detecting anomalies", { recordCount: data.length });

    const anomalies: Anomaly[] = [];

    for (const record of data) {
      if (typeof record !== "object" || record === null) continue;

      const transaction = record as Record<string, unknown>;

      // Check for duplicate transactions
      const duplicate = this.checkDuplicate(transaction);
      if (duplicate) {
        anomalies.push({
          type: "duplicate",
          severity: "medium",
          transactionData: transaction,
          score: 0.8,
        });
      }

      // Check for amount anomalies
      const amountAnomaly = this.checkAmountAnomaly(transaction);
      if (amountAnomaly) {
        anomalies.push({
          type: "amount_mismatch",
          severity: amountAnomaly.severity,
          transactionData: transaction,
          score: amountAnomaly.score,
        });
      }

      // Check for missing required fields
      const missingFields = this.checkMissingFields(transaction);
      if (missingFields.length > 0) {
        anomalies.push({
          type: "missing_fields",
          severity: missingFields.length > 2 ? "high" : "medium",
          transactionData: transaction,
          score: 0.6,
        });
      }

      // Check for pattern deviations (simplified)
      const patternDeviation = this.checkPatternDeviation(transaction);
      if (patternDeviation) {
        anomalies.push({
          type: "pattern_deviation",
          severity: "low",
          transactionData: transaction,
          score: patternDeviation.score,
        });
      }
    }

    return anomalies;
  }

  private checkDuplicate(transaction: Record<string, unknown>): boolean {
    const id = String(transaction.id || transaction.transaction_id || "");
    if (!id) return false;

    const result = this.db
      .prepare(
        `
      SELECT COUNT(*) as count 
      FROM local_anomalies 
      WHERE transaction_data LIKE ?
    `
      )
      .get(`%"${id}"%`) as { count: number };

    return (result?.count || 0) > 1;
  }

  private checkAmountAnomaly(transaction: Record<string, unknown>): {
    severity: "low" | "medium" | "high" | "critical";
    score: number;
  } | null {
    const amount = this.extractAmount(transaction);
    if (amount === null) return null;

    // Check for negative amounts (might be refunds, but flag for review)
    if (amount < 0) {
      return {
        severity: "medium",
        score: 0.7,
      };
    }

    // Check for unusually large amounts (simplified - would use statistical analysis)
    if (amount > 100000) {
      return {
        severity: "high",
        score: 0.8,
      };
    }

    // Check for zero amounts
    if (amount === 0) {
      return {
        severity: "low",
        score: 0.5,
      };
    }

    return null;
  }

  private checkMissingFields(transaction: Record<string, unknown>): string[] {
    const requiredFields = ["id", "amount", "date"];
    const missing: string[] = [];

    for (const field of requiredFields) {
      if (!(field in transaction) || transaction[field] === null || transaction[field] === "") {
        missing.push(field);
      }
    }

    return missing;
  }

  private checkPatternDeviation(transaction: Record<string, unknown>): {
    score: number;
  } | null {
    // Simplified pattern checking
    // In production, this would use ML models to detect deviations from historical patterns

    const amount = this.extractAmount(transaction);
    const date = this.extractDate(transaction);

    if (amount === null || !date) {
      return { score: 0.6 };
    }

    // Check if transaction is outside business hours (simplified)
    const hour = date.getHours();
    if (hour < 6 || hour > 22) {
      return { score: 0.4 };
    }

    return null;
  }

  private extractAmount(record: Record<string, unknown>): number | null {
    const amount = record.amount || record.total || record.value;
    if (typeof amount === "number") {
      return amount;
    }
    if (typeof amount === "string") {
      const parsed = parseFloat(amount.replace(/[^0-9.-]/g, ""));
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private extractDate(record: Record<string, unknown>): Date | null {
    const dateField = record.date || record.timestamp || record.created_at;
    if (dateField instanceof Date) {
      return dateField;
    }
    if (typeof dateField === "string") {
      const parsed = new Date(dateField);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof dateField === "number") {
      return new Date(dateField);
    }
    return null;
  }
}
