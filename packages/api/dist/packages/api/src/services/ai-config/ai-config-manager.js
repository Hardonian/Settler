"use strict";
/**
 * AI Config Manager
 *
 * Manages user-configurable AI settings
 * Part of Phase VIII: Future-Proof Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIConfigManager = void 0;
const logger_1 = require("../../utils/logger");
class AIConfigManager {
    _prisma;
    constructor(prisma) {
        this._prisma = prisma;
        // Reserved for future database operations
        void this._prisma;
    }
    /**
     * Get AI config for tenant
     */
    async getConfig(_tenantId) {
        // TODO: Store in database or config table
        // For now, return defaults
        return {
            preferredModels: ['gpt-4', 'claude-3-opus'],
            maxAISpend: 1000,
            fallbackRules: [
                {
                    condition: 'cost > maxSpend',
                    action: 'use_cheaper_model',
                },
            ],
            accuracyVsCost: 'balanced',
        };
    }
    /**
     * Update AI config
     */
    async updateConfig(tenantId, config) {
        // TODO: Save to database
        (0, logger_1.logInfo)('AI config updated', { tenantId, config });
    }
}
exports.AIConfigManager = AIConfigManager;
//# sourceMappingURL=ai-config-manager.js.map