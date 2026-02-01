/**
 * Ecosystem Growth Analytics
 * 
 * Tracks vertical adoption, partner integration growth, pain points, opportunities
 * Part 12: Economic & Marketplace Intelligence Engine
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { PrismaClient } from '@prisma/client';
// logInfo imported but unused - may be used in future

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

export class EcosystemAnalytics {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get ecosystem metrics
   */
  async getEcosystemMetrics(): Promise<EcosystemMetrics> {
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
  private async analyzeVerticalAdoption(): Promise<Map<string, number>> {
    const adoption = new Map<string, number>();

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
  private async analyzePartnerIntegrationGrowth(): Promise<number> {
    // TODO: Query partner integrations
    // Calculate growth rate
    return 0.15; // 15% growth (placeholder)
  }

  /**
   * Identify common pain points
   */
  private async identifyCommonPainPoints(): Promise<string[]> {
    // Analyze error logs, support tickets, etc.
    const painPoints: string[] = [];

    const failures = await this.prisma.reconResult.findMany({
      where: { status: 'failed' },
      take: 1000,
    });

    // Group by error message
    const errorGroups = new Map<string, number>();
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
  private async identifyMissedOpportunities(): Promise<string[]> {
    const opportunities: string[] = [];

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
  async getVerticalAdoptionDetails(): Promise<VerticalAdoption[]> {
    const metrics = await this.getEcosystemMetrics();
    const details: VerticalAdoption[] = [];

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
