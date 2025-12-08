/**
 * AI Config Manager
 * 
 * Manages user-configurable AI settings
 * Part of Phase VIII: Future-Proof Architecture
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';
import { logInfo } from '../../utils/logger';
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

export class AIConfigManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get AI config for tenant
   */
  async getConfig(tenantId: string): Promise<AIConfig> {
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
  async updateConfig(tenantId: string, config: Partial<AIConfig>): Promise<void> {
    // TODO: Save to database
    logInfo('AI config updated', { tenantId, config });
  }
}
