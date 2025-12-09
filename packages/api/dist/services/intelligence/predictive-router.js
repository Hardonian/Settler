"use strict";
/**
 * Predictive Routing Engine
 *
 * Dynamically selects optimal paths for operations
 * Part of Section 6: Multi-Agent Evolution Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveRouter = void 0;
const logger_1 = require("../../utils/logger");
const ai_router_1 = require("../ai-mesh/ai-router");
class PredictiveRouter {
    router;
    historicalData = new Map();
    constructor() {
        this.router = new ai_router_1.AIRouter();
    }
    /**
     * Route operation to optimal path
     */
    async route(operationType, complexity, accuracyRequired, budget) {
        // Check historical performance
        const _history = this.historicalData.get(operationType);
        // Reserved for future use
        void _history;
        // For low complexity, prefer deterministic
        if (complexity === 'low' && accuracyRequired < 0.9) {
            return {
                path: 'deterministic',
                estimatedCost: 0,
                estimatedLatency: 100,
                confidence: 0.95,
                reasoning: 'Low complexity, deterministic path sufficient',
            };
        }
        // For high accuracy requirements, use AI
        if (accuracyRequired > 0.95) {
            const model = this.router.selectModel({
                jobType: operationType,
                complexity,
                accuracyRequired,
                ...(budget !== undefined && { budget }),
            });
            const config = this.router.getModelConfig(model);
            return {
                path: 'ai',
                model,
                estimatedCost: this.router.estimateCost(model, 1000),
                estimatedLatency: config.latency,
                confidence: 0.9,
                reasoning: `High accuracy required, using ${model}`,
            };
        }
        // For medium complexity, use hybrid
        if (complexity === 'medium') {
            return {
                path: 'hybrid',
                estimatedCost: 0.01,
                estimatedLatency: 500,
                confidence: 0.85,
                reasoning: 'Medium complexity, hybrid approach optimal',
            };
        }
        // Default to deterministic
        return {
            path: 'deterministic',
            estimatedCost: 0,
            estimatedLatency: 100,
            confidence: 0.8,
            reasoning: 'Default to deterministic path',
        };
    }
    /**
     * Record operation result for learning
     */
    recordResult(operationType, path, success, cost, latency) {
        const key = `${operationType}:${path}`;
        const current = this.historicalData.get(key) || {
            successRate: 0,
            avgCost: 0,
            avgLatency: 0,
            count: 0,
        };
        current.count += 1;
        current.successRate = (current.successRate * (current.count - 1) + (success ? 1 : 0)) / current.count;
        current.avgCost = (current.avgCost * (current.count - 1) + cost) / current.count;
        current.avgLatency = (current.avgLatency * (current.count - 1) + latency) / current.count;
        this.historicalData.set(key, current);
        (0, logger_1.logInfo)('Routing result recorded', { operationType, path, success, cost, latency });
    }
    /**
     * Get optimal fallback strategy
     */
    getFallbackStrategy(primaryPath) {
        const fallbacks = [];
        if (primaryPath.path === 'ai') {
            // Fallback to cheaper model
            fallbacks.push({
                path: 'ai',
                model: 'gpt-3.5-turbo',
                estimatedCost: 0.002,
                estimatedLatency: 500,
                confidence: 0.8,
                reasoning: 'Fallback to cheaper AI model',
            });
            // Fallback to deterministic
            fallbacks.push({
                path: 'deterministic',
                estimatedCost: 0,
                estimatedLatency: 100,
                confidence: 0.7,
                reasoning: 'Fallback to deterministic path',
            });
        }
        else if (primaryPath.path === 'hybrid') {
            // Fallback to deterministic
            fallbacks.push({
                path: 'deterministic',
                estimatedCost: 0,
                estimatedLatency: 100,
                confidence: 0.8,
                reasoning: 'Fallback to deterministic path',
            });
        }
        return fallbacks;
    }
}
exports.PredictiveRouter = PredictiveRouter;
//# sourceMappingURL=predictive-router.js.map