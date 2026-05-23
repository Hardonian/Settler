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
      include: {
        jobs: {
          take: 100,
          select: {
            id: true,
            results: {
              where: { status: "failed" },
              take: 10,
              select: { id: true },
            },
          },
        },
      },
    });

    if (templates.length > 0) {
      const templateIds = templates.map((t: { id: string }) => t.id);

      // Fetch all jobs for these templates at once, up to a reasonable limit to prevent OOM
      // Using a larger take since we're batching 100 templates worth of jobs
      const jobs = await this.prisma.reconJob.findMany({
        where: { mappingTemplateId: { in: templateIds } },
        take: 1000,
      });

      // Group jobs by template ID
      const jobsByTemplateId = new Map<string, { id: string }[]>();
      for (const job of jobs) {
        if (job.mappingTemplateId) {
          if (!jobsByTemplateId.has(job.mappingTemplateId)) {
            jobsByTemplateId.set(job.mappingTemplateId, []);
          }
          jobsByTemplateId.get(job.mappingTemplateId)!.push(job);
        }
      }

      const jobIds = jobs.map((j: { id: string }) => j.id);

      // Fetch all failures for these jobs at once, bounded by take
      const failures =
        jobIds.length > 0
          ? await this.prisma.reconResult.findMany({
              where: {
                reconJobId: { in: jobIds },
                status: "failed",
              },
              take: 1000,
            })
          : [];

      // Group failures by job ID
      const failuresByJobId = new Map<string, any[]>();
      for (const failure of failures) {
        if (!failuresByJobId.has(failure.reconJobId)) {
          failuresByJobId.set(failure.reconJobId, []);
        }
        failuresByJobId.get(failure.reconJobId)!.push(failure);
      }

      for (const template of templates) {
        // Enforce the original logic's 100 jobs per template limit in memory
        const templateJobs = (jobsByTemplateId.get(template.id) || []).slice(0, 100);

        let failureCount = 0;
        for (const job of templateJobs) {
          // Enforce the original logic's 10 failures per job limit in memory
          const jobFailures = (failuresByJobId.get(job.id) || []).slice(0, 10);
          failureCount += jobFailures.length;
        }

        if (failureCount > 5) {
          const currentVersion = template.version ? String(template.version) : "1.0.0";
          improvements.push({
            templateId: template.id,
            templateType: "mapping",
            currentVersion,
            proposedVersion: this.incrementVersion(currentVersion),
            improvements: [
              "Add error handling for missing fields",
              "Improve field matching logic",
              "Add fallback mappings",
            ],
            backwardCompatible: true,
            confidence: 0.8,
          });
        }
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
      include: {
        jobs: {
          take: 100,
          select: {
            id: true,
            results: {
              take: 50,
              select: { startedAt: true, completedAt: true },
            },
          },
        },
      },
    });

    const recipeIds = recipes.map((r) => r.id);
    const allJobs = await this.prisma.reconJob.findMany({
      where: { transformRecipeId: { in: recipeIds } },
    });

    // Group jobs by recipe id, taking up to 100 per recipe
    const jobsByRecipeId = allJobs.reduce(
      (acc, job) => {
        const recipeId = job.transformRecipeId;
        if (!recipeId) return acc;

        if (!acc[recipeId]) {
          acc[recipeId] = [];
        }

        if (acc[recipeId].length < 100) {
          acc[recipeId].push(job);
        }

        return acc;
      },
      {} as Record<string, typeof allJobs>
    );

    for (const recipe of recipes) {
      // Analyze performance
      const jobs = jobsByRecipeId[recipe.id] || [];

      // Group jobs by recipe ID
      const jobsByRecipeId = new Map<string, { id: string }[]>();
      for (const job of jobs) {
        if (job.transformRecipeId) {
          if (!jobsByRecipeId.has(job.transformRecipeId)) {
            jobsByRecipeId.set(job.transformRecipeId, []);
          }
          jobsByRecipeId.get(job.transformRecipeId)!.push(job);
        }
      }

      const jobIds = jobs.map((j: { id: string }) => j.id);

      // Fetch all results for these jobs at once
      const results =
        jobIds.length > 0
          ? await this.prisma.reconResult.findMany({
              where: {
                reconJobId: { in: jobIds },
              },
              take: 5000, // 100 recipes * 100 jobs * 50 results
            })
          : [];

      // Group results by job ID
      const resultsByJobId = new Map<string, any[]>();
      for (const result of results) {
        if (!resultsByJobId.has(result.reconJobId)) {
          resultsByJobId.set(result.reconJobId, []);
        }
        resultsByJobId.get(result.reconJobId)!.push(result);
      }

      for (const recipe of recipes) {
        // Enforce the original logic's 100 jobs per recipe limit in memory
        const recipeJobs = (jobsByRecipeId.get(recipe.id) || []).slice(0, 100);

        const durations: number[] = [];
        for (const job of recipeJobs) {
          // Enforce the original logic's 50 results per job limit in memory
          const jobResults = (resultsByJobId.get(job.id) || []).slice(0, 50);
          for (const r of jobResults) {
            if (r.completedAt && r.startedAt) {
              durations.push(r.completedAt.getTime() - r.startedAt.getTime());
            }
          }
        }

        const avgDuration =
          durations.length > 0
            ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length
            : 0;

        if (avgDuration > 10000) {
          // > 10 seconds
          const currentVersion = recipe.version ? String(recipe.version) : "1.0.0";
          improvements.push({
            templateId: recipe.id,
            templateType: "transform",
            currentVersion,
            proposedVersion: this.incrementVersion(currentVersion),
            improvements: [
              "Optimize transformation logic",
              "Add caching for repeated operations",
              "Parallelize independent transforms",
            ],
            backwardCompatible: true,
            confidence: 0.7,
          });
        }
      }
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

    if (rules.length > 0) {
      // Fetch all jobs once outside the loop
      // We limit to 1000 to avoid loading the entire table.
      const allJobs = await this.prisma.reconJob.findMany({
        select: { id: true, validationRules: true },
        take: 1000,
      });

      const jobsByRuleId = new Map<string, { id: string }[]>();

      for (const rule of rules) {
        const matchingJobs = allJobs.filter((job: { id: string; validationRules: unknown }) => {
          const jobRules = job.validationRules;
          if (Array.isArray(jobRules)) {
            return jobRules.some(
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
        jobsByRuleId.set(rule.id, matchingJobs);
      }

      // Extract all unique job IDs across all rules
      const allJobIds = new Set<string>();
      for (const ruleJobs of jobsByRuleId.values()) {
        for (const job of ruleJobs) {
          allJobIds.add(job.id);
        }
      }

      const jobIdsArray = Array.from(allJobIds);

      // Fetch all failed results for these jobs at once
      const failedResults =
        jobIdsArray.length > 0
          ? await this.prisma.reconResult.findMany({
              where: {
                reconJobId: { in: jobIdsArray },
                status: "failed",
              },
              take: 1000,
            })
          : [];

      // Group failed results by job ID
      const failuresByJobId = new Map<string, any[]>();
      for (const failure of failedResults) {
        if (!failuresByJobId.has(failure.reconJobId)) {
          failuresByJobId.set(failure.reconJobId, []);
        }
        failuresByJobId.get(failure.reconJobId)!.push(failure);
      }

      for (const rule of rules) {
        const jobs = jobsByRuleId.get(rule.id) || [];

        let failureCount = 0;
        for (const job of jobs) {
          // Apply original limit of 1 failure (since take was 1 in original loop)
          failureCount += (failuresByJobId.get(job.id) || []).slice(0, 1).length;
        }

        if (failureCount === 0 && jobs.length > 10) {
          // ValidationRule doesn't have a version field, use '1.0.0' as default
          improvements.push({
            templateId: rule.id,
            templateType: "validation",
            currentVersion: "1.0.0",
            proposedVersion: this.incrementVersion("1.0.0"),
            improvements: [
              "Tighten validation criteria",
              "Add additional checks",
              "Improve error messages",
            ],
            backwardCompatible: true,
            confidence: 0.6,
          });
        }
      }
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
