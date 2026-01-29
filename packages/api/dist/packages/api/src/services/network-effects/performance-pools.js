"use strict";
/**
 * Performance Tuning Pools
 *
 * Aggregates performance data across all customers to improve matching algorithms.
 * Customers benefit from collective tuning.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceTuningPools = exports.PerformanceTuningPools = void 0;
const events_1 = require("events");
class PerformanceTuningPools extends events_1.EventEmitter {
    metrics = [];
    optInCustomers = new Set();
    maxMetrics = 100000; // Keep last 100k metrics
    /**
     * Opt-in a customer to share performance metrics
     */
    optIn(customerId) {
        this.optInCustomers.add(customerId);
        this.emit('customer_opted_in', customerId);
    }
    /**
     * Opt-out a customer
     */
    optOut(customerId) {
        this.optInCustomers.delete(customerId);
        // Remove customer's metrics
        this.metrics = this.metrics.filter(m => m.customerId !== customerId);
        this.emit('customer_opted_out', customerId);
    }
    /**
     * Submit performance metrics
     */
    submitMetrics(customerId, metrics) {
        if (!this.optInCustomers.has(customerId)) {
            return; // Silently ignore if not opted in
        }
        const metric = {
            ...metrics,
            customerId,
            timestamp: new Date(),
        };
        this.metrics.push(metric);
        // Keep only last N metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics);
        }
        this.emit('metrics_submitted', metric);
    }
    /**
     * Get performance insights for an adapter/rule combination
     */
    getInsights(adapter, ruleType) {
        const relevantMetrics = this.metrics.filter(m => {
            if (m.adapter !== adapter)
                return false;
            if (ruleType && m.ruleType !== ruleType)
                return false;
            return true;
        });
        if (relevantMetrics.length === 0) {
            return [];
        }
        // Group by rule type
        const byRuleType = new Map();
        for (const metric of relevantMetrics) {
            if (!byRuleType.has(metric.ruleType)) {
                byRuleType.set(metric.ruleType, []);
            }
            byRuleType.get(metric.ruleType).push(metric);
        }
        const insights = [];
        for (const [rule, metrics] of byRuleType.entries()) {
            const avgAccuracy = metrics.reduce((sum, m) => sum + m.accuracy, 0) / metrics.length;
            const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
            insights.push({
                adapter,
                ruleType: rule,
                avgAccuracy,
                avgLatency,
                sampleSize: metrics.length,
                recommendation: this.generateRecommendation(avgAccuracy, avgLatency),
            });
        }
        return insights;
    }
    /**
     * Get recommended rules for a use case
     */
    getRecommendedRules(adapter, _useCase) {
        const insights = this.getInsights(adapter);
        return insights
            .map(insight => ({
            ruleType: insight.ruleType,
            confidence: Math.min(100, insight.sampleSize / 10), // More samples = higher confidence
            expectedAccuracy: insight.avgAccuracy,
        }))
            .sort((a, b) => b.expectedAccuracy - a.expectedAccuracy)
            .slice(0, 5);
    }
    /**
     * Generate recommendation based on performance
     */
    generateRecommendation(accuracy, latency) {
        const recommendations = [];
        if (accuracy < 0.9) {
            recommendations.push('Consider using fuzzy matching or ML-based matching for better accuracy');
        }
        if (latency > 100) {
            recommendations.push('Consider adding indexes or caching to improve latency');
        }
        if (accuracy >= 0.95 && latency < 50) {
            recommendations.push('Performance is excellent. Consider sharing your configuration as a best practice.');
        }
        return recommendations.join('. ') || 'Performance is within acceptable range.';
    }
    /**
     * Get aggregate statistics
     */
    getStats() {
        const adapters = new Set(this.metrics.map(m => m.adapter));
        // Calculate top performers
        const adapterRuleStats = new Map();
        for (const metric of this.metrics) {
            const key = `${metric.adapter}:${metric.ruleType}`;
            if (!adapterRuleStats.has(key)) {
                adapterRuleStats.set(key, { accuracy: 0, count: 0 });
            }
            const stats = adapterRuleStats.get(key);
            stats.accuracy += metric.accuracy;
            stats.count += 1;
        }
        const topPerformers = Array.from(adapterRuleStats.entries())
            .map(([key, stats]) => {
            const parts = key.split(':');
            const adapter = parts[0];
            const ruleType = parts[1];
            if (!adapter || !ruleType) {
                return null;
            }
            return {
                adapter,
                ruleType,
                avgAccuracy: stats.accuracy / stats.count,
            };
        })
            .filter((item) => item !== null)
            .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
            .slice(0, 10);
        return {
            totalMetrics: this.metrics.length,
            optInCustomers: this.optInCustomers.size,
            adapters: Array.from(adapters),
            topPerformers,
        };
    }
}
exports.PerformanceTuningPools = PerformanceTuningPools;
exports.performanceTuningPools = new PerformanceTuningPools();
//# sourceMappingURL=performance-pools.js.map