/**
 * Ecosystem Growth Analytics
 *
 * Tracks vertical adoption, partner integration growth, pain points, opportunities
 * Part 12: Economic & Marketplace Intelligence Engine
 */
import { PrismaClient } from '@prisma/client';
export interface EcosystemMetrics {
    verticalAdoption: Map<string, number>;
    partnerIntegrationGrowth: number;
    commonPainPoints: string[];
    missedOpportunities: string[];
}
export interface VerticalAdoption {
    vertical: string;
    adoptionRate: number;
    growthRate: number;
    totalUsers: number;
}
export declare class EcosystemAnalytics {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Get ecosystem metrics
     */
    getEcosystemMetrics(): Promise<EcosystemMetrics>;
    /**
     * Analyze vertical adoption
     */
    private analyzeVerticalAdoption;
    /**
     * Analyze partner integration growth
     */
    private analyzePartnerIntegrationGrowth;
    /**
     * Identify common pain points
     */
    private identifyCommonPainPoints;
    /**
     * Identify missed opportunities
     */
    private identifyMissedOpportunities;
    /**
     * Get vertical adoption details
     */
    getVerticalAdoptionDetails(): Promise<VerticalAdoption[]>;
}
//# sourceMappingURL=ecosystem-analytics.d.ts.map