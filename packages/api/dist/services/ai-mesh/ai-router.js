"use strict";
/**
 * AI Router Service
 *
 * Routes AI requests to optimal models based on cost, accuracy, and job type
 * Part of Phase III: Self-Healing AI Mesh
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRouter = void 0;
const logger_1 = require("../../utils/logger");
const MODEL_CONFIGS = {
    'gpt-4': {
        model: 'gpt-4',
        costPer1kTokens: 0.03,
        accuracy: 0.95,
        latency: 2000,
        maxTokens: 8192,
        supportsStreaming: true,
    },
    'gpt-3.5-turbo': {
        model: 'gpt-3.5-turbo',
        costPer1kTokens: 0.002,
        accuracy: 0.85,
        latency: 500,
        maxTokens: 4096,
        supportsStreaming: true,
    },
    'claude-3-opus': {
        model: 'claude-3-opus',
        costPer1kTokens: 0.015,
        accuracy: 0.96,
        latency: 3000,
        maxTokens: 200000,
        supportsStreaming: true,
    },
    'claude-3-sonnet': {
        model: 'claude-3-sonnet',
        costPer1kTokens: 0.003,
        accuracy: 0.92,
        latency: 1500,
        maxTokens: 200000,
        supportsStreaming: true,
    },
    'claude-3-haiku': {
        model: 'claude-3-haiku',
        costPer1kTokens: 0.00025,
        accuracy: 0.88,
        latency: 800,
        maxTokens: 200000,
        supportsStreaming: true,
    },
    'local-llm': {
        model: 'local-llm',
        costPer1kTokens: 0,
        accuracy: 0.75,
        latency: 1000,
        maxTokens: 4096,
        supportsStreaming: false,
    },
};
class AIRouter {
    /**
     * Select optimal model for request
     */
    selectModel(request) {
        const candidates = Object.values(MODEL_CONFIGS).filter(config => {
            // Filter by accuracy requirement
            if (config.accuracy < request.accuracyRequired) {
                return false;
            }
            // Filter by latency requirement
            if (request.maxLatency && config.latency > request.maxLatency) {
                return false;
            }
            return true;
        });
        if (candidates.length === 0) {
            // Fallback to highest accuracy
            return 'claude-3-opus';
        }
        // Score models: lower cost + higher accuracy = better
        const scored = candidates.map(config => ({
            config,
            score: (config.accuracy * 100) - (config.costPer1kTokens * 10000),
        }));
        scored.sort((a, b) => b.score - a.score);
        const bestCandidate = scored[0];
        if (!bestCandidate) {
            // Fallback if somehow scored is empty (shouldn't happen due to earlier check)
            return 'claude-3-opus';
        }
        const selected = bestCandidate.config.model;
        (0, logger_1.logInfo)('AI model selected', { request, selected });
        return selected;
    }
    /**
     * Get model config
     */
    getModelConfig(model) {
        return MODEL_CONFIGS[model];
    }
    /**
     * Estimate cost for request
     */
    estimateCost(model, estimatedTokens) {
        const config = MODEL_CONFIGS[model];
        return (estimatedTokens / 1000) * config.costPer1kTokens;
    }
}
exports.AIRouter = AIRouter;
//# sourceMappingURL=ai-router.js.map