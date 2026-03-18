/**
 * Matching Rules Loader Service
 *
 * Centralized service for loading and resolving matching rules
 * from templates, custom rules, and tenant configuration.
 *
 * This ensures all reconciliation paths use the same authoritative
 * matching rules configuration.
 */

import { query } from "../db";
import { logInfo, logWarn, logError } from "../utils/logger";

/**
 * Core matching rule structure
 */
export interface MatchingRuleConfig {
  id?: string;
  field: string;
  type: "exact" | "fuzzy" | "range" | "date_range";
  tolerance?: number;
  threshold?: number;
  days?: number;
  weight?: number;
  enabled?: boolean;
}

/**
 * Extended config with tolerance overrides
 */
export interface ReconciliationConfig {
  // Tolerance settings
  amountTolerance: number;
  dateToleranceDays: number;

  // Matching rules from template/custom rules
  matchingRules: MatchingRuleConfig[];

  // Config version for provenance
  configVersion: string;
  configSource: "template" | "custom" | "default";

  // Template/job context
  templateId?: string;
  jobId?: string;
  tenantId: string;
}

/**
 * Default tolerance values
 */
export const DEFAULT_TOLERANCES = {
  amount: 0.01, // $0.01 tolerance for amounts
  dateDays: 3, // 3 day window for dates
} as const;

/**
 * Get matching rules and tolerance config for a job
 *
 * Priority:
 * 1. Custom matching rules (custom_matching_rules table)
 * 2. Template matching rules (recon_templates.matching_rules)
 * 3. Default tolerances
 */
export async function getMatchingRulesForJob(
  tenantId: string,
  jobId: string,
  templateId?: string | null
): Promise<ReconciliationConfig> {
  const startTime = Date.now();

  try {
    // Load from template if available
    if (templateId) {
      const templateRules = await loadFromTemplate(templateId, tenantId);
      if (templateRules) {
        logInfo("Loaded matching rules from template", {
          tenantId,
          jobId,
          templateId,
          ruleCount: templateRules.matchingRules.length,
          durationMs: Date.now() - startTime,
        });
        return {
          ...templateRules,
          jobId,
          tenantId,
        };
      }
    }

    // Try loading custom rules for this tenant
    const customRules = await loadCustomMatchingRules(tenantId);
    if (customRules.length > 0) {
      logInfo("Using custom matching rules", {
        tenantId,
        jobId,
        ruleCount: customRules.length,
        durationMs: Date.now() - startTime,
      });
      return {
        amountTolerance: DEFAULT_TOLERANCES.amount,
        dateToleranceDays: DEFAULT_TOLERANCES.dateDays,
        matchingRules: customRules,
        configVersion: `custom-${Date.now()}`,
        configSource: "custom",
        templateId: templateId ?? undefined,
        jobId,
        tenantId,
      };
    }

    // Fall back to defaults
    logWarn("No matching rules found, using defaults", {
      tenantId,
      jobId,
      templateId,
      durationMs: Date.now() - startTime,
    });

    return getDefaultConfig(tenantId, jobId, templateId ?? undefined);
  } catch (error) {
    logError("Failed to load matching rules, using defaults", error, {
      tenantId,
      jobId,
      templateId,
      durationMs: Date.now() - startTime,
    });

    return getDefaultConfig(tenantId, jobId, templateId ?? undefined);
  }
}

/**
 * Load matching rules from template
 */
async function loadFromTemplate(
  templateId: string,
  tenantId: string
): Promise<Omit<ReconciliationConfig, "jobId" | "tenantId"> | null> {
  try {
    const result = await query<{
      id: string;
      matching_rules: string;
      metadata: string;
      amount_tolerance: number | null;
      date_tolerance_days: number | null;
      config_version: string | null;
    }>(
      `SELECT id, matching_rules, metadata, amount_tolerance, date_tolerance_days, config_version
       FROM recon_templates 
       WHERE id = $1 AND (tenant_id = $2 OR is_public = true) 
       AND deleted_at IS NULL
       LIMIT 1`,
      [templateId, tenantId]
    );

    if (!result || result.length === 0) {
      return null;
    }

    const template = result[0];
    if (!template) {
      return null;
    }

    const matchingRules = parseMatchingRules(template.matching_rules);
    const metadata =
      typeof template.metadata === "string" ? JSON.parse(template.metadata) : template.metadata;

    // Use explicit fields first, then fall back to metadata, then defaults
    const amountTolerance =
      template.amount_tolerance ?? metadata?.tolerances?.amount ?? DEFAULT_TOLERANCES.amount;
    const dateToleranceDays =
      template.date_tolerance_days ?? metadata?.tolerances?.days ?? DEFAULT_TOLERANCES.dateDays;

    return {
      amountTolerance,
      dateToleranceDays,
      matchingRules,
      configVersion: template.config_version ?? `template-${template.id}-${Date.now()}`,
      configSource: "template",
      templateId: template.id,
    };
  } catch (error) {
    logError("Failed to load from template", error, { templateId, tenantId });
    return null;
  }
}

/**
 * Load custom matching rules for tenant
 */
async function loadCustomMatchingRules(tenantId: string): Promise<MatchingRuleConfig[]> {
  try {
    const result = await query<{
      id: string;
      rule_type: string;
      rule_config: string;
      is_active: boolean;
    }>(
      `SELECT id, rule_type, rule_config, is_active 
       FROM custom_matching_rules 
       WHERE tenant_id = $1 AND is_active = true 
       AND deleted_at IS NULL
       ORDER BY created_at ASC`,
      [tenantId]
    );

    const rules: MatchingRuleConfig[] = [];

    for (const row of result) {
      if (!row || !row.is_active) continue;

      const config =
        typeof row.rule_config === "string" ? JSON.parse(row.rule_config) : row.rule_config;

      rules.push({
        id: row.id,
        field: config?.field ?? "amount",
        type: mapRuleType(row.rule_type),
        tolerance: config?.tolerance ?? config?.weight ?? DEFAULT_TOLERANCES.amount,
        threshold: config?.threshold,
        days: config?.days,
        weight: config?.weight ?? 1,
        enabled: row.is_active,
      });
    }

    return rules;
  } catch (error) {
    logError("Failed to load custom matching rules", error, { tenantId });
    return [];
  }
}

/**
 * Get default configuration
 */
function getDefaultConfig(
  tenantId: string,
  jobId: string,
  templateId?: string
): ReconciliationConfig {
  return {
    amountTolerance: DEFAULT_TOLERANCES.amount,
    dateToleranceDays: DEFAULT_TOLERANCES.dateDays,
    matchingRules: [
      {
        field: "externalId",
        type: "exact",
        weight: 2,
        enabled: true,
      },
      {
        field: "amount",
        type: "range",
        tolerance: DEFAULT_TOLERANCES.amount,
        weight: 1,
        enabled: true,
      },
      {
        field: "occurredAt",
        type: "date_range",
        days: DEFAULT_TOLERANCES.dateDays,
        weight: 0.5,
        enabled: true,
      },
    ],
    configVersion: `default-${Date.now()}`,
    configSource: "default",
    templateId,
    jobId,
    tenantId,
  };
}

/**
 * Parse matching rules from JSON string
 */
function parseMatchingRules(rulesJson: string): MatchingRuleConfig[] {
  if (!rulesJson) return [];

  try {
    const parsed = typeof rulesJson === "string" ? JSON.parse(rulesJson) : rulesJson;

    if (!Array.isArray(parsed)) return [];

    const rules: MatchingRuleConfig[] = [];

    for (const rule of parsed) {
      if (!rule) continue;

      rules.push({
        id: rule.id as string | undefined,
        field: (rule.field as string) ?? "amount",
        type: mapRuleType((rule.type as string) ?? "exact"),
        tolerance: rule.tolerance as number | undefined,
        threshold: rule.threshold as number | undefined,
        days: rule.days as number | undefined,
        weight: (rule.weight as number) ?? 1,
        enabled: rule.enabled as boolean | undefined,
      });
    }

    return rules;
  } catch (error) {
    logWarn("Failed to parse matching rules", { error, rulesJson });
    return [];
  }
}

/**
 * Map rule type string to enum
 */
function mapRuleType(type: string): MatchingRuleConfig["type"] {
  switch (type) {
    case "exact":
      return "exact";
    case "fuzzy":
      return "fuzzy";
    case "range":
      return "range";
    case "date_range":
    case "date_tolerance":
      return "date_range";
    default:
      return "exact";
  }
}

/**
 * Validate matching rule configuration
 */
export function validateMatchingRules(rules: MatchingRuleConfig[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!rules || !Array.isArray(rules)) {
    return { valid: false, errors: ["Rules must be an array"] };
  }

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (!rule) {
      errors.push(`Rule ${i + 1}: rule is undefined`);
      continue;
    }

    if (!rule.field) {
      errors.push(`Rule ${i + 1}: field is required`);
    }

    if (!rule.type || !["exact", "fuzzy", "range", "date_range"].includes(rule.type)) {
      errors.push(`Rule ${i + 1}: invalid type "${rule.type}"`);
    }

    if (rule.type === "range" || rule.type === "date_range") {
      if (rule.tolerance !== undefined && rule.tolerance < 0) {
        errors.push(`Rule ${i + 1}: tolerance must be non-negative`);
      }
      if (rule.days !== undefined && rule.days < 0) {
        errors.push(`Rule ${i + 1}: days must be non-negative`);
      }
    }

    if (rule.type === "fuzzy") {
      if (rule.threshold !== undefined && (rule.threshold < 0 || rule.threshold > 1)) {
        errors.push(`Rule ${i + 1}: threshold must be between 0 and 1`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serialize config for storage in run results (provenance)
 */
export function serializeConfigForProvenance(
  config: ReconciliationConfig
): Record<string, unknown> {
  const ruleIds: string[] = [];

  if (config.matchingRules) {
    for (const rule of config.matchingRules) {
      if (rule && rule.id) {
        ruleIds.push(rule.id);
      }
    }
  }

  return {
    amountTolerance: config.amountTolerance,
    dateToleranceDays: config.dateToleranceDays,
    matchingRulesCount: config.matchingRules?.length ?? 0,
    configVersion: config.configVersion,
    configSource: config.configSource,
    templateId: config.templateId,
    matchingRuleIds: ruleIds,
  };
}
