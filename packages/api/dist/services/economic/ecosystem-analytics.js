"use strict";
/**
 * Ecosystem Growth Analytics
 *
 * Tracks vertical adoption, partner integration growth, pain points, opportunities
 * Part 12: Economic & Marketplace Intelligence Engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcosystemAnalytics = void 0;
class EcosystemAnalytics {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Get ecosystem metrics
     */
    async getEcosystemMetrics() {
        const verticalAdoption = await this.analyzeVerticalAdoption();
        const partnerIntegrationGrowth = await this.analyzePartnerIntegrationGrowth();
        const commonPainPoints = await this.identifyCommonPainPoints();
        const missedOpportunities = await this.identifyMissedOpportunities();
        return {
            verticalAdoption,
            partnerIntegrationGrowth,
            commonPainPoints,
            missedOpportunities,
        };
    }
    /**
     * Analyze vertical adoption
     */
    async analyzeVerticalAdoption() {
        const adoption = new Map();
        // Get domain pack usage
        const domainPacks = ['legal', 'finance', 'edtech', 'compliance', 'data-engineering', 'ecommerce'];
        for (const pack of domainPacks) {
            // TODO: Query actual usage from database
            // For now, placeholder
            adoption.set(pack, Math.random() * 100);
        }
        return adoption;
    }
    /**
     * Analyze partner integration growth
     */
    async analyzePartnerIntegrationGrowth() {
        // TODO: Query partner integrations
        // Calculate growth rate
        return 0.15; // 15% growth (placeholder)
    }
    /**
     * Identify common pain points
     */
    async identifyCommonPainPoints() {
        // Analyze error logs, support tickets, etc.
        const painPoints = [];
        const failures = await this.prisma.reconResult.findMany({
            where: { status: 'failed' },
            take: 1000,
        });
        // Group by error message
        const errorGroups = new Map();
        for (const failure of failures) {
            if (failure.errorMessage) {
                const error = failure.errorMessage.substring(0, 50);
                errorGroups.set(error, (errorGroups.get(error) || 0) + 1);
            }
        }
        // Get top pain points
        const sortedErrors = Array.from(errorGroups.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        for (const [error, count] of sortedErrors) {
            painPoints.push(`${error} (${count} occurrences)`);
        }
        return painPoints;
    }
    /**
     * Identify missed opportunities
     */
    async identifyMissedOpportunities() {
        const opportunities = [];
        // Analyze usage patterns to find opportunities
        const _jobs = await this.prisma.reconJob.findMany({
            take: 1000,
        });
        // Reserved for future analysis
        void _jobs;
        // Find common patterns that could be templates
        // TODO: Implement pattern detection
        opportunities.push('High demand for e-commerce reconciliation templates');
        opportunities.push('Growing need for real-time streaming recon');
        opportunities.push('Demand for multi-currency support');
        return opportunities;
    }
    /**
     * Get vertical adoption details
     */
    async getVerticalAdoptionDetails() {
        const metrics = await this.getEcosystemMetrics();
        const details = [];
        for (const [vertical, adoptionRate] of metrics.verticalAdoption.entries()) {
            details.push({
                vertical,
                adoptionRate,
                growthRate: adoptionRate * 0.1, // Placeholder
                totalUsers: Math.round(adoptionRate * 100), // Placeholder
            });
        }
        return details;
    }
}
exports.EcosystemAnalytics = EcosystemAnalytics;
//# sourceMappingURL=ecosystem-analytics.js.map