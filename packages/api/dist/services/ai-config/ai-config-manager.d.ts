/**
 * AI Config Manager
 *
 * Manages user-configurable AI settings
 * Part of Phase VIII: Future-Proof Architecture
 */
import { PrismaClient } from '@prisma/client';
import { AIModel } from '../ai-mesh/ai-router';
export interface AIConfig {
    preferredModels: AIModel[];
    maxAISpend: number;
    fallbackRules: Array<{
        condition: string;
        action: 'use_cheaper_model' | 'use_local' | 'skip_ai';
    }>;
    accuracyVsCost: 'accuracy' | 'balanced' | 'cost';
}
export declare class AIConfigManager {
    private _prisma;
    constructor(prisma: PrismaClient);
    /**
     * Get AI config for tenant
     */
    getConfig(_tenantId: string): Promise<AIConfig>;
    /**
     * Update AI config
     */
    updateConfig(tenantId: string, config: Partial<AIConfig>): Promise<void>;
}
//# sourceMappingURL=ai-config-manager.d.ts.map