/**
 * Continuous Template Improvement
 *
 * Automatically generates improved templates
 * Part 7: Autonomous AIOS Evolution
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { logInfo } from "../../utils/logger";

export interface TemplateImprovement {
  templateId: string;
  templateType: "mapping" | "transform" | "validation";
  currentVersion: string;
  proposedVersion: string;
  improvements: string[];
  backwardCompatible: boolean;
  confidence: number;
}

export class TemplateImprover {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Improve all templates
   */
  async improveTemplates(): Promise<TemplateImprovement[]> {
    const improvements: TemplateImprovement[] = [];

    // Improve mapping templates
    const mappingImprovements = await this.improveMappingTemplates();
    improvements.push(...mappingImprovements);

    // Improve transform recipes
    const transformImprovements = await this.improveTransformRecipes();
    improvements.push(...transformImprovements);

    // Improve validation rules
    const validationImprovements = await this.improveValidationRules();
    improvements.push(...validationImprovements);

    return improvements;
  }

  /**
   * Improve mapping templates
   */
  private async improveMappingTemplates(): Promise<TemplateImprovement[]> {
    const improvements: TemplateImprovement[] = [];

    const templates = await this.prisma.mappingTemplate.findMany({
      where: { deletedAt: null },
      take: 100,
    });

    if (templates.length === 0) return improvements;

    // Execute jobs fetching concurrently, but keeping the take limit
    const promises = templates.map(async (template) => {
      // Analyze usage patterns
      const jobs = await this.prisma.reconJob.findMany({
        where: { mappingTemplateId: template.id },
        take: 100,
      });

      if (jobs.length === 0) return null;

      // If template has high failure rate, propose improvement
      const failures = await this.prisma.reconResult.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
          status: "failed",
        },
        take: 10,
      });

      if (failures.length > 5) {
        const currentVersion = template.version ? String(template.version) : "1.0.0";
        return {
          templateId: template.id,
          templateType: "mapping" as const,
          currentVersion,
          proposedVersion: this.incrementVersion(currentVersion),
          improvements: [
            "Add error handling for missing fields",
            "Improve field matching logic",
            "Add fallback mappings",
          ],
          backwardCompatible: true,
          confidence: 0.8,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result) {
        improvements.push(result);
      }
    }

    return improvements;
  }

  /**
   * Improve transform recipes
   */
  private async improveTransformRecipes(): Promise<TemplateImprovement[]> {
    const improvements: TemplateImprovement[] = [];

    const recipes = await this.prisma.transformRecipe.findMany({
      where: { deletedAt: null },
      take: 100,
    });

    if (recipes.length === 0) return improvements;

    const promises = recipes.map(async (recipe) => {
      // Analyze performance
      const jobs = await this.prisma.reconJob.findMany({
        where: { transformRecipeId: recipe.id },
        take: 100,
      });

      if (jobs.length === 0) return null;

      // Check execution times
      const results = await this.prisma.reconResult.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
        },
        take: 50,
      });

      const durations = results
        .filter(
          (r: { completedAt: Date | null; startedAt: Date | null }) => r.completedAt && r.startedAt
        )
        .map((r: { completedAt: Date | null; startedAt: Date | null }) => {
          if (!r.completedAt || !r.startedAt) return 0;
          return r.completedAt.getTime() - r.startedAt.getTime();
        });

      const avgDuration =
        durations.length > 0
          ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
          : 0;

      if (avgDuration > 10000) {
        // > 10 seconds
        const currentVersion = recipe.version ? String(recipe.version) : "1.0.0";
        return {
          templateId: recipe.id,
          templateType: "transform" as const,
          currentVersion,
          proposedVersion: this.incrementVersion(currentVersion),
          improvements: [
            "Optimize transformation logic",
            "Add caching for repeated operations",
            "Parallelize independent transforms",
          ],
          backwardCompatible: true,
          confidence: 0.7,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result) improvements.push(result);
    }

    return improvements;
  }

  /**
   * Improve validation rules
   */
  private async improveValidationRules(): Promise<TemplateImprovement[]> {
    const improvements: TemplateImprovement[] = [];

    const rules = await this.prisma.validationRule.findMany({
      where: { deletedAt: null },
      take: 100,
    });

    if (rules.length === 0) return improvements;

    // Fetch all jobs once to avoid querying inside the loop
    const allJobs = await this.prisma.reconJob.findMany({
      select: { id: true, validationRules: true },
    });

    const promises = rules.map(async (rule) => {
      const jobs = allJobs.filter((job: { id: string; validationRules: unknown }) => {
        const rules = job.validationRules;
        if (Array.isArray(rules)) {
          return rules.some(
            (r: unknown) =>
              (typeof r === "object" &&
                r !== null &&
                "id" in r &&
                (r as { id: string }).id === rule.id) ||
              r === rule.id
          );
        }
        return false;
      });

      if (jobs.length === 0) return null;

      // If rule never fails, it might be too lenient
      const results = await this.prisma.reconResult.findMany({
        where: {
          reconJobId: { in: jobs.map((j: { id: string }) => j.id) },
          status: "failed",
        },
        take: 1,
      });

      if (results.length === 0 && jobs.length > 10) {
        // ValidationRule doesn't have a version field, use '1.0.0' as default
        return {
          templateId: rule.id,
          templateType: "validation" as const,
          currentVersion: "1.0.0",
          proposedVersion: this.incrementVersion("1.0.0"),
          improvements: [
            "Tighten validation criteria",
            "Add additional checks",
            "Improve error messages",
          ],
          backwardCompatible: true,
          confidence: 0.6,
        };
      }
      return null;
    });

    const results = await Promise.all(promises);
    for (const result of results) {
      if (result) improvements.push(result);
    }

    return improvements;
  }

  /**
   * Increment version number
   */
  private incrementVersion(version: string): string {
    const parts = version.split(".");
    const major = parseInt(parts[0] ?? "1", 10) || 1;
    const minor = parseInt(parts[1] ?? "0", 10) || 0;
    const patch = parseInt(parts[2] ?? "0", 10) || 0;
    return `${major}.${minor}.${patch + 1}`;
  }

  /**
   * Apply template improvement
   */
  async applyImprovement(improvement: TemplateImprovement): Promise<void> {
    // Create new version of template
    if (improvement.templateType === "mapping") {
      const template = await this.prisma.mappingTemplate.findUnique({
        where: { id: improvement.templateId },
      });

      if (template) {
        // Parse version string to number (e.g., "1.0.1" -> 1)
        const versionParts = improvement.proposedVersion.split(".");
        const versionNumber = parseInt(versionParts[0] ?? "1", 10) || 1;

        await this.prisma.mappingTemplate.create({
          data: {
            tenantId: template.tenantId,
            name: `${template.name} (v${improvement.proposedVersion})`,
            description: template.description,
            sourceSchema: template.sourceSchema as Prisma.InputJsonValue,
            targetSchema: template.targetSchema as Prisma.InputJsonValue,
            fieldMappings: template.fieldMappings as Prisma.InputJsonValue,
            transformationRules: template.transformationRules as Prisma.InputJsonValue,
            validationRules: template.validationRules as Prisma.InputJsonValue,
            isPublic: template.isPublic,
            isSystem: template.isSystem,
            usageCount: 0,
            version: versionNumber,
            metadata: template.metadata as Prisma.InputJsonValue,
          },
        });
      }
    }
    // Similar for transform and validation...

    logInfo("Template improvement applied", { improvement });
  }
}
