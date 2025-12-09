/**
 * Usage Simulation Engine
 *
 * Analyzes usage patterns and simulates costs
 * Part of Section 9: Pricing Intelligence
 */
import { PrismaClient } from '@prisma/client';
export interface UsageSimulation {
    period: 'daily' | 'weekly' | 'monthly';
    reconComparisons: number;
    validations: number;
    transformations: number;
    mappings: number;
    workflowSteps: number;
    aiTokens: number;
    storageBytes: number;
    webhookTriggers: number;
    estimatedCost: number;
}
export declare class UsageSimulator {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Simulate usage for a tenant
     */
    simulateUsage(tenantId: string, period?: 'daily' | 'weekly' | 'monthly'): Promise<UsageSimulation>;
    /**
     * Get historical usage
     */
    private getHistoricalUsage;
    /**
     * Project future usage
     */
    private projectUsage;
    /**
     * Calculate cost
     */
    private calculateCost;
    /**
     * Get start date for period
     */
    private getStartDate;
}
//# sourceMappingURL=usage-simulator.d.ts.map