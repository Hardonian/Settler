"use strict";
/**
 * Learning Loops Service
 *
 * PHASE 5: Internal Learning & Feedback Loops
 *
 * Makes the system smarter over time:
 * - Pattern detection from past reconciliations
 * - Anomaly baselines per tenant
 * - Auto-suggestions derived from historical outcomes
 *
 * Rules: Learning is tenant-isolated, explainable improvements only
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.learningLoopsService = exports.LearningLoopsService = void 0;
const client_1 = require("../infrastructure/supabase/client");
const logger_1 = require("../utils/logger");
class LearningLoopsService {
    /**
     * Learn from reconciliation outcome
     */
    async learnFromReconciliation(tenantId, reconciliationId, outcome) {
        try {
            // Learn matching patterns
            if (outcome.matchedCount > 0) {
                await this.learnMatchingPatterns(tenantId, reconciliationId, outcome.matchingRules);
            }
            // Learn validation patterns
            await this.learnValidationPatterns(tenantId, reconciliationId, outcome.validationResults);
            // Update anomaly baselines
            await this.updateAnomalyBaselines(tenantId, {
                matchedCount: outcome.matchedCount,
                unmatchedCount: outcome.unmatchedCount,
                confidenceAvg: outcome.confidenceAvg,
            });
        }
        catch (error) {
            (0, logger_1.logError)('Error learning from reconciliation', error);
        }
    }
    /**
     * Learn matching patterns
     */
    async learnMatchingPatterns(tenantId, reconciliationId, matchingRules) {
        try {
            // Group rules by pattern
            const rulePatterns = new Map();
            matchingRules.forEach((rule) => {
                rulePatterns.set(rule, (rulePatterns.get(rule) || 0) + 1);
            });
            // Store patterns
            for (const [rule, count] of rulePatterns.entries()) {
                await this.storePattern(tenantId, 'matching', rule, {
                    rule,
                    successCount: count,
                    reconciliationId,
                }, `Rule "${rule}" successfully matched ${count} items`);
            }
        }
        catch (error) {
            (0, logger_1.logError)('Error learning matching patterns', error);
        }
    }
    /**
     * Learn validation patterns
     */
    async learnValidationPatterns(tenantId, reconciliationId, validationResults) {
        try {
            // Learn from passed validations
            const passedRules = validationResults.filter((v) => v.passed);
            passedRules.forEach((result) => {
                this.storePattern(tenantId, 'validation', result.rule, {
                    rule: result.rule,
                    passed: true,
                    reconciliationId,
                }, `Validation rule "${result.rule}" passed`);
            });
            // Learn from failed validations (for improvement)
            const failedRules = validationResults.filter((v) => !v.passed);
            failedRules.forEach((result) => {
                this.storePattern(tenantId, 'validation', result.rule, {
                    rule: result.rule,
                    passed: false,
                    reason: result.reason,
                    reconciliationId,
                }, `Validation rule "${result.rule}" failed: ${result.reason || 'unknown reason'}`);
            });
        }
        catch (error) {
            (0, logger_1.logError)('Error learning validation patterns', error);
        }
    }
    /**
     * Store pattern
     */
    async storePattern(tenantId, patternType, patternKey, patternValue, explanation) {
        try {
            // Check if pattern exists
            const { data: existing } = await client_1.supabase
                .from('usage_events')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('event_type', `pattern:${patternType}`)
                .eq('metadata->>pattern_key', patternKey)
                .limit(1)
                .single();
            if (existing) {
                // Update existing pattern
                const occurrenceCount = (existing.metadata?.occurrence_count || 0) + 1;
                const confidence = this.calculatePatternConfidence(occurrenceCount);
                await client_1.supabase
                    .from('usage_events')
                    .update({
                    metadata: {
                        ...existing.metadata,
                        pattern_value: patternValue,
                        occurrence_count: occurrenceCount,
                        confidence,
                        last_observed: new Date().toISOString(),
                        explanation,
                    },
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', existing.id);
            }
            else {
                // Create new pattern
                await client_1.supabase
                    .from('usage_events')
                    .insert({
                    tenant_id: tenantId,
                    event_type: `pattern:${patternType}`,
                    quantity: 1,
                    metadata: {
                        pattern_type: patternType,
                        pattern_key: patternKey,
                        pattern_value: patternValue,
                        occurrence_count: 1,
                        confidence: 0.5,
                        first_observed: new Date().toISOString(),
                        last_observed: new Date().toISOString(),
                        explanation,
                    },
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)('Error storing pattern', error);
        }
    }
    /**
     * Calculate pattern confidence
     */
    calculatePatternConfidence(occurrenceCount) {
        // More occurrences = higher confidence, but with diminishing returns
        return Math.min(0.5 + (occurrenceCount / 20) * 0.5, 0.95);
    }
    /**
     * Update anomaly baselines
     */
    async updateAnomalyBaselines(tenantId, metrics) {
        try {
            // Update matched count baseline
            await this.updateBaseline(tenantId, 'matched_count', metrics.matchedCount);
            // Update unmatched count baseline
            await this.updateBaseline(tenantId, 'unmatched_count', metrics.unmatchedCount);
            // Update confidence baseline
            await this.updateBaseline(tenantId, 'confidence_avg', metrics.confidenceAvg);
        }
        catch (error) {
            (0, logger_1.logError)('Error updating anomaly baselines', error);
        }
    }
    /**
     * Update baseline for a metric
     */
    async updateBaseline(tenantId, metric, value) {
        try {
            // Get existing baseline
            const { data: existing } = await client_1.supabase
                .from('usage_events')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('event_type', `baseline:${metric}`)
                .limit(1)
                .single();
            if (existing) {
                const sampleSize = (existing.metadata?.sample_size || 0) + 1;
                const currentBaseline = existing.metadata?.baseline_value || 0;
                const currentStdDev = existing.metadata?.standard_deviation || 0;
                // Update baseline using exponential moving average
                const alpha = 0.1; // Smoothing factor
                const newBaseline = currentBaseline * (1 - alpha) + value * alpha;
                // Update standard deviation (simplified)
                const variance = currentStdDev * currentStdDev;
                const newVariance = variance * (1 - alpha) + Math.pow(value - newBaseline, 2) * alpha;
                const newStdDev = Math.sqrt(newVariance);
                await client_1.supabase
                    .from('usage_events')
                    .update({
                    metadata: {
                        ...existing.metadata,
                        baseline_value: newBaseline,
                        standard_deviation: newStdDev,
                        sample_size: sampleSize,
                        last_updated: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                })
                    .eq('id', existing.id);
            }
            else {
                // Create new baseline
                await client_1.supabase
                    .from('usage_events')
                    .insert({
                    tenant_id: tenantId,
                    event_type: `baseline:${metric}`,
                    quantity: value,
                    metadata: {
                        metric,
                        baseline_value: value,
                        standard_deviation: 0,
                        sample_size: 1,
                        last_updated: new Date().toISOString(),
                    },
                });
            }
        }
        catch (error) {
            (0, logger_1.logError)('Error updating baseline', error);
        }
    }
    /**
     * Detect anomaly
     */
    async detectAnomaly(tenantId, metric, value) {
        try {
            // Get baseline
            const { data: baseline } = await client_1.supabase
                .from('usage_events')
                .select('metadata')
                .eq('tenant_id', tenantId)
                .eq('event_type', `baseline:${metric}`)
                .limit(1)
                .single();
            if (!baseline) {
                return {
                    isAnomaly: false,
                    deviation: 0,
                    explanation: 'No baseline established yet',
                };
            }
            const baselineValue = baseline.metadata?.baseline_value || 0;
            const stdDev = baseline.metadata?.standard_deviation || 0;
            // Check if value is more than 2 standard deviations from baseline
            const deviation = Math.abs(value - baselineValue);
            const isAnomaly = deviation > 2 * stdDev && stdDev > 0;
            return {
                isAnomaly,
                deviation,
                explanation: isAnomaly
                    ? `Value ${value} deviates ${deviation.toFixed(2)} from baseline ${baselineValue.toFixed(2)} (std dev: ${stdDev.toFixed(2)})`
                    : `Value ${value} is within normal range (baseline: ${baselineValue.toFixed(2)}, std dev: ${stdDev.toFixed(2)})`,
            };
        }
        catch (error) {
            (0, logger_1.logError)('Error detecting anomaly', error);
            return {
                isAnomaly: false,
                deviation: 0,
                explanation: 'Error detecting anomaly',
            };
        }
    }
    /**
     * Generate auto-suggestions
     */
    async generateAutoSuggestions(tenantId) {
        try {
            const suggestions = [];
            // Get patterns
            const { data: patterns } = await client_1.supabase
                .from('usage_events')
                .select('*')
                .eq('tenant_id', tenantId)
                .like('event_type', 'pattern:%')
                .order('metadata->>occurrence_count', { ascending: false })
                .limit(50);
            // Generate suggestions from high-confidence patterns
            patterns?.forEach((pattern) => {
                const confidence = pattern.metadata?.confidence || 0;
                const occurrenceCount = pattern.metadata?.occurrence_count || 0;
                if (confidence > 0.7 && occurrenceCount >= 5) {
                    const patternType = pattern.event_type.split(':')[1];
                    const patternKey = pattern.metadata?.pattern_key;
                    suggestions.push({
                        id: pattern.id,
                        tenantId,
                        suggestionType: this.mapPatternTypeToSuggestionType(patternType),
                        suggestion: `Use pattern "${patternKey}" (observed ${occurrenceCount} times)`,
                        rationale: `This pattern has been successful ${occurrenceCount} times with ${(confidence * 100).toFixed(0)}% confidence`,
                        confidence,
                        estimatedImpact: confidence > 0.85 ? 'high' : confidence > 0.75 ? 'medium' : 'low',
                        createdAt: new Date(pattern.created_at),
                    });
                }
            });
            return suggestions;
        }
        catch (error) {
            (0, logger_1.logError)('Error generating auto-suggestions', error);
            return [];
        }
    }
    /**
     * Map pattern type to suggestion type
     */
    mapPatternTypeToSuggestionType(patternType) {
        switch (patternType) {
            case 'matching':
                return 'matching_rule';
            case 'validation':
                return 'validation_rule';
            case 'transformation':
                return 'transformation';
            default:
                return 'optimization';
        }
    }
    /**
     * Get learning metrics
     */
    async getLearningMetrics(tenantId) {
        try {
            // Get pattern count
            const { count: patterns } = await client_1.supabase
                .from('usage_events')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .like('event_type', 'pattern:%');
            // Get baseline count
            const { count: baselines } = await client_1.supabase
                .from('usage_events')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId)
                .like('event_type', 'baseline:%');
            // Get suggestion count
            const suggestions = await this.generateAutoSuggestions(tenantId);
            // Calculate learning efficiency (based on pattern confidence)
            const { data: allPatterns } = await client_1.supabase
                .from('usage_events')
                .select('metadata')
                .eq('tenant_id', tenantId)
                .like('event_type', 'pattern:%');
            const avgConfidence = allPatterns && allPatterns.length > 0
                ? allPatterns.reduce((sum, p) => sum + (p.metadata?.confidence || 0), 0) / allPatterns.length
                : 0;
            return {
                patterns: patterns || 0,
                baselines: baselines || 0,
                suggestions: suggestions.length,
                learningEfficiency: avgConfidence,
            };
        }
        catch (error) {
            (0, logger_1.logError)('Error getting learning metrics', error);
            return {
                patterns: 0,
                baselines: 0,
                suggestions: 0,
                learningEfficiency: 0,
            };
        }
    }
}
exports.LearningLoopsService = LearningLoopsService;
exports.learningLoopsService = new LearningLoopsService();
//# sourceMappingURL=learning-loops.js.map