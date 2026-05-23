/**
 * Marketplace Intelligence
 *
 * Evaluates marketplace items and automatically promotes/deprecates
 * Part 12: Economic & Marketplace Intelligence Engine
 */

import { PrismaClient } from "@prisma/client";

export interface MarketplaceItem {
  id: string;
  type: "template" | "workflow" | "transform" | "mapping" | "validation";
  name: string;
  popularity: number;
  driftRate: number;
  reliability: number;
  revenuePotential: number;
}

export interface MarketplaceRecommendation {
  action: "promote" | "deprecate" | "update" | "feature";
  itemId: string;
  reason: string;
  priority: "low" | "medium" | "high";
}

export class MarketplaceIntelligence {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Evaluate marketplace items
   */
  async evaluateItems(): Promise<MarketplaceItem[]> {
    const items: MarketplaceItem[] = [];

    // Evaluate templates
    const templates = await this.evaluateTemplates();
    items.push(...templates);

    // Evaluate workflows
    const workflows = await this.evaluateWorkflows();
    items.push(...workflows);

    // Evaluate transforms
    const transforms = await this.evaluateTransforms();
    items.push(...transforms);

    // Evaluate mappings
    const mappings = await this.evaluateMappings();
    items.push(...mappings);

    // Evaluate validations
    const validations = await this.evaluateValidations();
    items.push(...validations);

    return items;
  }

  /**
   * Generate recommendations
   */
  async generateRecommendations(): Promise<MarketplaceRecommendation[]> {
    const items = await this.evaluateItems();
    const recommendations: MarketplaceRecommendation[] = [];

    for (const item of items) {
      // Promote top items
      if (item.popularity > 0.8 && item.reliability > 0.9) {
        recommendations.push({
          action: "promote",
          itemId: item.id,
          reason: `High popularity (${(item.popularity * 100).toFixed(0)}%) and reliability (${(item.reliability * 100).toFixed(0)}%)`,
          priority: "high",
        });
      }

      // Deprecate unreliable items
      if (item.reliability < 0.5 && item.popularity < 0.3) {
        recommendations.push({
          action: "deprecate",
          itemId: item.id,
          reason: `Low reliability (${(item.reliability * 100).toFixed(0)}%) and popularity (${(item.popularity * 100).toFixed(0)}%)`,
          priority: "medium",
        });
      }

      // Update items with high drift
      if (item.driftRate > 0.3) {
        recommendations.push({
          action: "update",
          itemId: item.id,
          reason: `High drift rate (${(item.driftRate * 100).toFixed(0)}%) - needs update`,
          priority: "high",
        });
      }

      // Feature high-revenue items
      if (item.revenuePotential > 1000) {
        recommendations.push({
          action: "feature",
          itemId: item.id,
          reason: `High revenue potential ($${item.revenuePotential.toFixed(2)})`,
          priority: "medium",
        });
      }
    }

    return recommendations;
  }

  /**
   * Evaluate templates
   */
  private async evaluateTemplates(): Promise<MarketplaceItem[]> {
    const templates = await this.prisma.reconTemplate.findMany({
      take: 100,
    });

    const items: MarketplaceItem[] = [];

    for (const template of templates) {
      const jobs = await this.prisma.reconJob.findMany({
        where: { templateId: template.id },
        take: 1000,
      });

      const popularity = Math.min(jobs.length / 1000, 1.0);

      const drifts = await this.prisma.driftEvent.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
        },
        take: 100,
      });

      const driftRate = drifts.length / Math.max(jobs.length, 1);

      const results = await this.prisma.reconResult.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
        },
        take: 1000,
      });

      const failures = results.filter((r: { status: string }) => r.status === "failed").length;
      const reliability = 1 - failures / Math.max(results.length, 1);

      const revenuePotential = popularity * reliability * 1000; // Placeholder

      items.push({
        id: template.id,
        type: "template",
        name: template.name,
        popularity,
        driftRate,
        reliability,
        revenuePotential,
      });
    }

    return items;
  }

  /**
   * Evaluate workflows by usage patterns
   */
  private async evaluateWorkflows(): Promise<MarketplaceItem[]> {
    const workflows = await this.prisma.workflowDefinition.findMany({
      where: { isPublic: true },
      include: { _count: { select: { executions: true } } },
    });

    return workflows.map(wf => ({
      id: `workflow-${wf.id}`,
      type: "workflow" as const,
      name: wf.name,
      description: wf.description || "",
      author: wf.authorId || "unknown",
      downloads: wf._count.executions,
      rating: 4.5,
      popularity: Math.min(wf._count.executions / 100, 1),
      reliability: 0.9,
      tags: wf.tags as string[] || [],
    }));
  }

  /**
   * Evaluate transforms by error rates and usage
   */
  private async evaluateTransforms(): Promise<MarketplaceItem[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recipes = await this.prisma.transformRecipe.findMany({
      where: { isPublic: true },
      include: {
        _count: { select: { jobs: true } },
        jobs: { where: { createdAt: { gte: thirtyDaysAgo } }, select: { status: true } },
      },
    });

    return recipes.map(recipe => {
      const totalJobs = recipe.jobs.length;
      const failedJobs = recipe.jobs.filter(j => j.status === 'error').length;
      const reliability = totalJobs > 0 ? (totalJobs - failedJobs) / totalJobs : 0.95;

      return {
        id: `transform-${recipe.id}`,
        type: "transform" as const,
        name: recipe.name,
        description: recipe.description || "",
        author: recipe.authorId || "unknown",
        downloads: recipe._count.jobs,
        rating: reliability > 0.95 ? 5 : reliability > 0.9 ? 4 : 3,
        popularity: Math.min(recipe._count.jobs / 50, 1),
        reliability,
        tags: recipe.tags as string[] || [],
      };
    });
  }

  /**
   * Evaluate mappings by match rates
   */
  private async evaluateMappings(): Promise<MarketplaceItem[]> {
    const templates = await this.prisma.mappingTemplate.findMany({
      where: { isPublic: true },
      include: {
        _count: { select: { reconJobs: true } },
        reconJobs: { select: { id: true }, take: 10 },
      },
    });

    return Promise.all(
      templates.map(async template => {
        // Calculate match rate from recent results
        const matchRates = await this.prisma.reconResult.findMany({
          where: {
            reconJobId: { in: template.reconJobs.map(j => j.id) },
          },
          select: { confidence: true },
          take: 100,
        });

        const avgMatchRate = matchRates.length > 0
          ? matchRates.reduce((sum, r) => sum + (r.confidence || 0), 0) / matchRates.length
          : 0.85;

        return {
          id: `mapping-${template.id}`,
          type: "mapping" as const,
          name: template.name,
          description: template.description || "",
          author: template.authorId || "unknown",
          downloads: template._count.reconJobs,
          rating: avgMatchRate > 0.9 ? 5 : avgMatchRate > 0.8 ? 4 : 3,
          popularity: Math.min(template._count.reconJobs / 30, 1),
          reliability: avgMatchRate,
          tags: template.tags as string[] || [],
        };
      })
    );
  }

  /**
   * Evaluate validations by false positive rates
   */
  private async evaluateValidations(): Promise<MarketplaceItem[]> {
    const rules = await this.prisma.validationRule.findMany({
      where: { isPublic: true },
      include: {
        _count: { select: { executions: true, failures: true } },
      },
    });

    return rules.map(rule => {
      const totalExecutions = rule._count.executions;
      const totalFailures = rule._count.failures;
      const falsePositiveRate = totalExecutions > 0 ? totalFailures / totalExecutions : 0.1;
      const reliability = Math.max(0, 1 - falsePositiveRate);

      return {
        id: `validation-${rule.id}`,
        type: "validation" as const,
        name: rule.name,
        description: rule.description || "",
        author: rule.authorId || "unknown",
        downloads: totalExecutions,
        rating: reliability > 0.95 ? 5 : reliability > 0.9 ? 4 : 3,
        popularity: Math.min(totalExecutions / 100, 1),
        reliability,
        tags: rule.tags as string[] || [],
      };
    });
  }

  /**
   * Surface trending transforms
   */
  async surfaceTrendingTransforms(): Promise<MarketplaceItem[]> {
    const items = await this.evaluateItems();

    // Filter for transforms
    const transforms = items.filter((i) => i.type === "transform");

    // Sort by popularity and reliability
    transforms.sort((a, b) => {
      const scoreA = a.popularity * a.reliability;
      const scoreB = b.popularity * b.reliability;
      return scoreB - scoreA;
    });

    // Return top 10
    return transforms.slice(0, 10);
  }
}
