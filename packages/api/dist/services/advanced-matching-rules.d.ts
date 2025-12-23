/**
 * Advanced Matching Rules Service
 * Handles custom field matching, composite rules, and rule templates
 */
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
            operator: "equals" | "contains" | "startsWith" | "endsWith" | "greaterThan" | "lessThan" | "between";
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
export declare function createCustomMatchingRule(tenantId: string, userId: string, rule: MatchingRule): Promise<string>;
/**
 * Get custom matching rule
 */
export declare function getCustomMatchingRule(tenantId: string, ruleId: string): Promise<MatchingRule | null>;
/**
 * List custom matching rules
 */
export declare function listCustomMatchingRules(tenantId: string, filters?: {
    isTemplate?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}): Promise<MatchingRule[]>;
/**
 * Update rule performance metrics
 */
export declare function updateRulePerformanceMetrics(tenantId: string, ruleId: string, metrics: Partial<RulePerformanceMetrics>): Promise<void>;
/**
 * Test a matching rule
 */
export declare function testMatchingRule(rule: MatchingRule, sourceData: Record<string, unknown>, targetData: Record<string, unknown>): Promise<{
    matches: boolean;
    confidence: number;
    matchDetails: Array<{
        field: string;
        matched: boolean;
        confidence: number;
    }>;
}>;
//# sourceMappingURL=advanced-matching-rules.d.ts.map