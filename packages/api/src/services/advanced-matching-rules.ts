/**
 * Advanced Matching Rules Service
 * Handles custom field matching, composite rules, and rule templates
 */

import { query } from "../db";
import { logError, logInfo } from "../utils/logger";

export interface CustomField {
  name: string;
  type: "string" | "number" | "date" | "boolean";
  sourcePath: string;
  targetPath: string;
}

export interface MatchingRule {
  id?: string;
  name: string;
  description?: string;
  ruleType: "exact" | "fuzzy" | "range" | "custom";
  ruleConfig: {
    fields: CustomField[];
    conditions?: Array<{
      field: string;
      operator:
        | "equals"
        | "contains"
        | "startsWith"
        | "endsWith"
        | "greaterThan"
        | "lessThan"
        | "between";
      value: unknown;
    }>;
    compositeOperator?: "AND" | "OR";
    weight?: number;
  };
  customFields?: CustomField[];
  isTemplate?: boolean;
  isActive?: boolean;
}

export interface RulePerformanceMetrics {
  ruleId: string;
  totalMatches: number;
  successfulMatches: number;
  falsePositives: number;
  falseNegatives: number;
  averageConfidence: number;
  lastEvaluatedAt: Date;
}

/**
 * Create a custom matching rule
 */
export async function createCustomMatchingRule(
  tenantId: string,
  userId: string,
  rule: MatchingRule
): Promise<string> {
  try {
    const result = await query<{ id: string }>(
      `INSERT INTO custom_matching_rules (
        tenant_id, user_id, name, description, rule_type,
        rule_config, custom_fields, is_template, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        tenantId,
        userId,
        rule.name,
        rule.description || null,
        rule.ruleType,
        JSON.stringify(rule.ruleConfig),
        JSON.stringify(rule.customFields || []),
        rule.isTemplate || false,
        rule.isActive !== undefined ? rule.isActive : true,
      ] as (string | number | boolean | null | Date)[]
    );

    const ruleId = result[0]?.id || "";
    logInfo("Custom matching rule created", { ruleId, tenantId, userId, name: rule.name });
    return ruleId;
  } catch (error) {
    logError("Failed to create custom matching rule", error, { tenantId, userId });
    throw error;
  }
}

/**
 * Get custom matching rule
 */
export async function getCustomMatchingRule(
  tenantId: string,
  ruleId: string
): Promise<MatchingRule | null> {
  try {
    const result = await query<{
      id: string;
      name: string;
      description?: string;
      rule_type: string;
      rule_config: MatchingRule["ruleConfig"];
      custom_fields: CustomField[];
      is_template: boolean;
      is_active: boolean;
      performance_metrics: RulePerformanceMetrics | null;
    }>(
      `SELECT id, name, description, rule_type, rule_config, custom_fields,
              is_template, is_active, performance_metrics
       FROM custom_matching_rules
       WHERE id = $1 AND tenant_id = $2`,
      [ruleId, tenantId]
    );

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ruleType: row.rule_type as MatchingRule["ruleType"],
      ruleConfig: row.rule_config,
      customFields: row.custom_fields,
      isTemplate: row.is_template,
      isActive: row.is_active,
    };
  } catch (error) {
    logError("Failed to get custom matching rule", error, { ruleId, tenantId });
    throw error;
  }
}

/**
 * List custom matching rules
 */
export async function listCustomMatchingRules(
  tenantId: string,
  filters: {
    isTemplate?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<MatchingRule[]> {
  try {
    const conditions: string[] = ["tenant_id = $1"];
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (filters.isTemplate !== undefined) {
      conditions.push(`is_template = $${paramIndex}`);
      params.push(filters.isTemplate);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(filters.isActive);
      paramIndex++;
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const result = await query<Record<string, unknown>>(
      `SELECT id, name, description, rule_type, rule_config, custom_fields,
              is_template, is_active, performance_metrics
       FROM custom_matching_rules
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset] as (string | number | boolean | null | Date)[]
    );

    return result.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      ruleType: row.rule_type as MatchingRule["ruleType"],
      ruleConfig: row.rule_config as MatchingRule["ruleConfig"],
      customFields: row.custom_fields as CustomField[],
      isTemplate: row.is_template as boolean,
      isActive: row.is_active as boolean,
    }));
  } catch (error) {
    logError("Failed to list custom matching rules", error, { tenantId });
    throw error;
  }
}

/**
 * Update rule performance metrics
 */
export async function updateRulePerformanceMetrics(
  tenantId: string,
  ruleId: string,
  metrics: Partial<RulePerformanceMetrics>
): Promise<void> {
  try {
    // Get existing metrics
    const existingResult = await query<{ performance_metrics: RulePerformanceMetrics | null }>(
      `SELECT performance_metrics FROM custom_matching_rules
       WHERE id = $1 AND tenant_id = $2`,
      [ruleId, tenantId]
    );

    if (existingResult.length === 0) {
      throw new Error("Rule not found");
    }

    const existingMetrics = existingResult[0]?.performance_metrics || {
      ruleId,
      totalMatches: 0,
      successfulMatches: 0,
      falsePositives: 0,
      falseNegatives: 0,
      averageConfidence: 0,
      lastEvaluatedAt: new Date(),
    };

    const updatedMetrics: RulePerformanceMetrics = {
      ...existingMetrics,
      ...metrics,
      ruleId,
      lastEvaluatedAt: new Date(),
    };

    await query(
      `UPDATE custom_matching_rules
       SET performance_metrics = $1, updated_at = now()
       WHERE id = $2 AND tenant_id = $3`,
      [JSON.stringify(updatedMetrics), ruleId, tenantId] as (
        | string
        | number
        | boolean
        | null
        | Date
      )[]
    );

    logInfo("Rule performance metrics updated", { ruleId, tenantId });
  } catch (error) {
    logError("Failed to update rule performance metrics", error, { ruleId, tenantId });
    throw error;
  }
}

/**
 * Test a matching rule
 */
export async function testMatchingRule(
  rule: MatchingRule,
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown>
): Promise<{
  matches: boolean;
  confidence: number;
  matchDetails: Array<{ field: string; matched: boolean; confidence: number }>;
}> {
  try {
    const matchDetails: Array<{ field: string; matched: boolean; confidence: number }> = [];
    let totalConfidence = 0;
    let matchedFields = 0;

    // Test each field in the rule
    for (const field of rule.ruleConfig.fields) {
      const sourceValue = getNestedValue(sourceData, field.sourcePath);
      const targetValue = getNestedValue(targetData, field.targetPath);

      let matched = false;
      let confidence = 0;

      switch (rule.ruleType) {
        case "exact":
          matched = String(sourceValue) === String(targetValue);
          confidence = matched ? 1.0 : 0;
          break;

        case "fuzzy":
          if (typeof sourceValue === "string" && typeof targetValue === "string") {
            confidence = stringSimilarity(sourceValue, targetValue);
            matched = confidence >= 0.8;
          }
          break;

        case "range":
          if (typeof sourceValue === "number" && typeof targetValue === "number") {
            const tolerance =
              typeof rule.ruleConfig.weight === "number" ? rule.ruleConfig.weight : 0.01;
            const diff = Math.abs(sourceValue - targetValue);
            matched = diff <= tolerance;
            confidence = matched ? Math.max(0, 1.0 - diff / tolerance) : 0;
          }
          break;

        case "custom":
          // Custom logic would go here based on ruleConfig.conditions
          if (rule.ruleConfig.conditions) {
            matched = evaluateCustomConditions(rule.ruleConfig.conditions, sourceData, targetData);
            confidence = matched ? 0.9 : 0;
          }
          break;
      }

      matchDetails.push({
        field: field.name,
        matched,
        confidence,
      });

      if (matched) {
        matchedFields++;
        totalConfidence += confidence;
      }
    }

    const overallConfidence = matchDetails.length > 0 ? totalConfidence / matchDetails.length : 0;
    const matches =
      rule.ruleConfig.compositeOperator === "OR"
        ? matchedFields > 0
        : matchedFields === matchDetails.length;

    return {
      matches,
      confidence: overallConfidence,
      matchDetails,
    };
  } catch (error) {
    logError("Failed to test matching rule", error);
    throw error;
  }
}

/**
 * Helper: Get nested value from object
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current, key) => {
    return current && typeof current === "object"
      ? (current as Record<string, unknown>)[key]
      : undefined;
  }, obj as unknown);
}

/**
 * Helper: String similarity (Jaccard-like)
 */
function stringSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Helper: Evaluate custom conditions
 */
function evaluateCustomConditions(
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>,
  sourceData: Record<string, unknown>,
  targetData: Record<string, unknown>
): boolean {
  for (const condition of conditions) {
    const sourceValue = getNestedValue(sourceData, condition.field);
    const targetValue = getNestedValue(targetData, condition.field);
    const conditionValue = condition.value;

    let result = false;
    switch (condition.operator) {
      case "equals":
        result = sourceValue === conditionValue && targetValue === conditionValue;
        break;
      case "contains":
        if (typeof sourceValue === "string" && typeof conditionValue === "string") {
          result = sourceValue.includes(conditionValue) && targetValue === sourceValue;
        }
        break;
      case "greaterThan":
        if (typeof sourceValue === "number" && typeof conditionValue === "number") {
          result =
            sourceValue > conditionValue &&
            typeof targetValue === "number" &&
            targetValue > conditionValue;
        }
        break;
      // Add more operators as needed
    }

    if (!result) {
      return false;
    }
  }

  return true;
}
