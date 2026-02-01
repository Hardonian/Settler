/**
 * Pattern Extraction Engine
 *
 * Analyzes usage patterns and extracts reusable templates
 * Part of Section 6: Multi-Agent Evolution Layer
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - PrismaClient is generated at build time
import { PrismaClient } from "@prisma/client";
// logInfo imported but unused - may be used in future

export interface ExtractedPattern {
  type: "workflow" | "template" | "validation_rule" | "transform_recipe" | "mapping_template";
  pattern: Record<string, unknown>;
  frequency: number;
  confidence: number;
  recommendation: string;
}

export class PatternExtractor {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Extract patterns from usage data
   */
  async extractPatterns(tenantId?: string): Promise<ExtractedPattern[]> {
    const patterns: ExtractedPattern[] = [];

    // Analyze recurring build failures
    const failurePatterns = await this.analyzeFailures(tenantId);
    patterns.push(...failurePatterns);

    // Analyze recon mismatch patterns
    const mismatchPatterns = await this.analyzeMismatches(tenantId);
    patterns.push(...mismatchPatterns);

    // Analyze schema drift patterns
    const driftPatterns = await this.analyzeDrift(tenantId);
    patterns.push(...driftPatterns);

    // Analyze most-used mapping templates
    const mappingPatterns = await this.analyzeMappings(tenantId);
    patterns.push(...mappingPatterns);

    // Analyze high-usage transforms
    const transformPatterns = await this.analyzeTransforms(tenantId);
    patterns.push(...transformPatterns);

    // Analyze common user workflows
    const workflowPatterns = await this.analyzeWorkflows(tenantId);
    patterns.push(...workflowPatterns);

    return patterns;
  }

  /**
   * Analyze recurring build failures
   */
  private async analyzeFailures(tenantId?: string): Promise<ExtractedPattern[]> {
    const failures = await this.prisma.reconResult.findMany({
      where: {
        ...(tenantId && { tenantId }),
        status: "failed",
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      take: 100,
    });

    // Group by error message
    const errorGroups = new Map<string, number>();
    for (const failure of failures) {
      const error = failure.errorMessage || "unknown";
      errorGroups.set(error, (errorGroups.get(error) || 0) + 1);
    }

    const patterns: ExtractedPattern[] = [];
    for (const [error, count] of errorGroups.entries()) {
      if (count >= 5) {
        patterns.push({
          type: "validation_rule",
          pattern: { error },
          frequency: count,
          confidence: Math.min(count / 10, 1.0),
          recommendation: `Create validation rule for: ${error.substring(0, 50)}`,
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze recon mismatch patterns
   */
  private async analyzeMismatches(_tenantId?: string): Promise<ExtractedPattern[]> {
    // TODO: Analyze mismatch patterns from recon results
    // This would look at common field mismatches and suggest mapping templates
    return [];
  }

  /**
   * Analyze schema drift patterns
   */
  private async analyzeDrift(tenantId?: string): Promise<ExtractedPattern[]> {
    const drifts = await this.prisma.driftEvent.findMany({
      where: {
        ...(tenantId && { tenantId }),
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      take: 100,
    });

    // Group by field path
    const fieldGroups = new Map<string, number>();
    for (const drift of drifts) {
      const field = drift.fieldPath || "unknown";
      fieldGroups.set(field, (fieldGroups.get(field) || 0) + 1);
    }

    const patterns: ExtractedPattern[] = [];
    for (const [field, count] of fieldGroups.entries()) {
      if (count >= 3) {
        patterns.push({
          type: "mapping_template",
          pattern: { fieldPath: field },
          frequency: count,
          confidence: Math.min(count / 5, 1.0),
          recommendation: `Update mapping template for field: ${field}`,
        });
      }
    }

    return patterns;
  }

  /**
   * Analyze most-used mapping templates
   */
  private async analyzeMappings(tenantId?: string): Promise<ExtractedPattern[]> {
    const mappings = await this.prisma.mappingTemplate.findMany({
      where: {
        ...(tenantId && { tenantId }),
        deletedAt: null,
      },
      orderBy: {
        usageCount: "desc",
      },
      take: 10,
    });

    return mappings.map(
      (mapping: { name: string; usageCount: number; [key: string]: unknown }) => ({
        type: "mapping_template" as const,
        pattern: mapping,
        frequency: mapping.usageCount,
        confidence: 0.9,
        recommendation: `Popular mapping template: ${mapping.name}`,
      })
    );
  }

  /**
   * Analyze high-usage transforms
   */
  private async analyzeTransforms(tenantId?: string): Promise<ExtractedPattern[]> {
    const transforms = await this.prisma.transformRecipe.findMany({
      where: {
        ...(tenantId && { tenantId }),
        deletedAt: null,
      },
      orderBy: {
        usageCount: "desc",
      },
      take: 10,
    });

    return transforms.map(
      (transform: { name: string; usageCount: number; [key: string]: unknown }) => ({
        type: "transform_recipe" as const,
        pattern: transform,
        frequency: transform.usageCount,
        confidence: 0.9,
        recommendation: `Popular transform recipe: ${transform.name}`,
      })
    );
  }

  /**
   * Analyze common user workflows
   */
  private async analyzeWorkflows(tenantId?: string): Promise<ExtractedPattern[]> {
    const workflows = await this.prisma.workflowRun.findMany({
      where: {
        ...(tenantId && { tenantId }),
        startedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      take: 100,
    });

    // Group by workflow ID
    const workflowGroups = new Map<string, number>();
    for (const workflow of workflows) {
      const id = workflow.workflowId;
      workflowGroups.set(id, (workflowGroups.get(id) || 0) + 1);
    }

    const patterns: ExtractedPattern[] = [];
    for (const [workflowId, count] of workflowGroups.entries()) {
      if (count >= 10) {
        patterns.push({
          type: "workflow",
          pattern: { workflowId },
          frequency: count,
          confidence: Math.min(count / 20, 1.0),
          recommendation: `Popular workflow: ${workflowId}`,
        });
      }
    }

    return patterns;
  }

  /**
   * Generate recommendations from patterns
   */
  async generateRecommendations(tenantId?: string): Promise<
    Array<{
      type: string;
      recommendation: string;
      priority: "low" | "medium" | "high";
      action: Record<string, unknown>;
    }>
  > {
    const patterns = await this.extractPatterns(tenantId);
    const recommendations: Array<{
      type: string;
      recommendation: string;
      priority: "low" | "medium" | "high";
      action: Record<string, unknown>;
    }> = [];

    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        const priority: "low" | "medium" | "high" =
          pattern.frequency > 20
            ? "high"
            : pattern.frequency > 10
              ? "medium"
              : "low";

        recommendations.push({
          type: pattern.type,
          recommendation: pattern.recommendation,
          priority,
          action: {
            createTemplate:
              pattern.type === "mapping_template" || pattern.type === "transform_recipe",
            createWorkflow: pattern.type === "workflow",
            createValidationRule: pattern.type === "validation_rule",
          },
        });
      }
    }

    return recommendations;
  }
}
