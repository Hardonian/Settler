/**
 * Rules Engine Moat
 * 
 * Stores user mapping rules and learned patterns that improve match rate over time.
 * This creates data gravity and workflow lock-in.
 * 
 * Why this is a moat:
 * 1. Data gravity: Rules accumulate over time, making switching costly
 * 2. Learning: Rules improve with usage (success_rate increases)
 * 3. Workflow lock-in: Users build custom logic that's hard to replicate
 * 4. Compounding: More rules → better matches → more usage → more rules
 */

import { prisma } from '@/shared/db/prismaClient';

export type RuleType =
  | 'field_mapping'
  | 'vendor_normalization'
  | 'amount_tolerance'
  | 'date_tolerance'
  | 'custom_logic';

export interface ReconciliationRule {
  id: string;
  billingAccountId: string;
  tenantId?: string;
  userId?: string;
  ruleName: string;
  ruleType: RuleType;
  sourceField?: string;
  targetField?: string;
  ruleConfig: Record<string, unknown>;
  matchCount: number;
  successRate: number;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRuleInput {
  billingAccountId: string;
  tenantId?: string;
  userId?: string;
  ruleName: string;
  ruleType: RuleType;
  sourceField?: string;
  targetField?: string;
  ruleConfig: Record<string, unknown>;
}

/**
 * Create a new reconciliation rule
 */
export async function createRule(input: CreateRuleInput): Promise<ReconciliationRule> {
  const rule = await prisma.$queryRaw<Array<{
    id: string;
    billing_account_id: string;
    tenant_id: string | null;
    user_id: string | null;
    rule_name: string;
    rule_type: string;
    source_field: string | null;
    target_field: string | null;
    rule_config: unknown;
    match_count: number;
    success_rate: number;
    last_used_at: Date | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }>>`
    INSERT INTO reconciliation_rules (
      billing_account_id,
      tenant_id,
      user_id,
      rule_name,
      rule_type,
      source_field,
      target_field,
      rule_config,
      match_count,
      success_rate,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      ${input.billingAccountId}::uuid,
      ${input.tenantId || null}::uuid,
      ${input.userId || null}::uuid,
      ${input.ruleName}::varchar,
      ${input.ruleType}::varchar,
      ${input.sourceField || null}::varchar,
      ${input.targetField || null}::varchar,
      ${JSON.stringify(input.ruleConfig)}::jsonb,
      0,
      0.0,
      true,
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  return mapRuleFromDb(rule[0]);
}

/**
 * Get all active rules for a billing account
 */
export async function getActiveRules(billingAccountId: string): Promise<ReconciliationRule[]> {
  const rules = await prisma.$queryRaw<Array<{
    id: string;
    billing_account_id: string;
    tenant_id: string | null;
    user_id: string | null;
    rule_name: string;
    rule_type: string;
    source_field: string | null;
    target_field: string | null;
    rule_config: unknown;
    match_count: number;
    success_rate: number;
    last_used_at: Date | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }>>`
    SELECT *
    FROM reconciliation_rules
    WHERE billing_account_id = ${billingAccountId}::uuid
      AND is_active = true
    ORDER BY success_rate DESC, match_count DESC
  `;

  return rules.map(mapRuleFromDb);
}

/**
 * Record rule usage (for learning)
 */
export async function recordRuleUsage(
  ruleId: string,
  options: {
    reconciliationRunId?: string;
    matched: boolean;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO rule_usage_events (
      rule_id,
      reconciliation_run_id,
      matched,
      confidence,
      metadata,
      created_at
    ) VALUES (
      ${ruleId}::uuid,
      ${options.reconciliationRunId || null}::uuid,
      ${options.matched}::boolean,
      ${options.confidence || null}::decimal,
      ${JSON.stringify(options.metadata || {})}::jsonb,
      NOW()
    )
  `;
}

/**
 * Get rule statistics for a billing account
 */
export async function getRuleStatistics(billingAccountId: string): Promise<{
  totalRules: number;
  activeRules: number;
  totalMatches: number;
  averageSuccessRate: number;
  topRules: Array<{ ruleName: string; matchCount: number; successRate: number }>;
}> {
  const stats = await prisma.$queryRaw<Array<{
    total_rules: number;
    active_rules: number;
    total_matches: number;
    avg_success_rate: number;
  }>>`
    SELECT
      COUNT(*) as total_rules,
      COUNT(*) FILTER (WHERE is_active = true) as active_rules,
      SUM(match_count) as total_matches,
      AVG(success_rate) as avg_success_rate
    FROM reconciliation_rules
    WHERE billing_account_id = ${billingAccountId}::uuid
  `;

  const topRules = await prisma.$queryRaw<Array<{
    rule_name: string;
    match_count: number;
    success_rate: number;
  }>>`
    SELECT
      rule_name,
      match_count,
      success_rate
    FROM reconciliation_rules
    WHERE billing_account_id = ${billingAccountId}::uuid
      AND is_active = true
    ORDER BY match_count DESC, success_rate DESC
    LIMIT 5
  `;

  const stat = stats[0] || {
    total_rules: 0,
    active_rules: 0,
    total_matches: 0,
    avg_success_rate: 0,
  };

  return {
    totalRules: Number(stat.total_rules) || 0,
    activeRules: Number(stat.active_rules) || 0,
    totalMatches: Number(stat.total_matches) || 0,
    averageSuccessRate: Number(stat.avg_success_rate) || 0,
    topRules: topRules.map(r => ({
      ruleName: r.rule_name,
      matchCount: Number(r.match_count) || 0,
      successRate: Number(r.success_rate) || 0,
    })),
  };
}

function mapRuleFromDb(row: {
  id: string;
  billing_account_id: string;
  tenant_id: string | null;
  user_id: string | null;
  rule_name: string;
  rule_type: string;
  source_field: string | null;
  target_field: string | null;
  rule_config: unknown;
  match_count: number;
  success_rate: number;
  last_used_at: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): ReconciliationRule {
  return {
    id: row.id,
    billingAccountId: row.billing_account_id,
    tenantId: row.tenant_id || undefined,
    userId: row.user_id || undefined,
    ruleName: row.rule_name,
    ruleType: row.rule_type as RuleType,
    sourceField: row.source_field || undefined,
    targetField: row.target_field || undefined,
    ruleConfig: (row.rule_config as Record<string, unknown>) || {},
    matchCount: Number(row.match_count) || 0,
    successRate: Number(row.success_rate) || 0,
    lastUsedAt: row.last_used_at || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
