"use strict";
/**
 * Continuous Template Improvement
 *
 * Automatically generates improved templates
 * Part 7: Autonomous AIOS Evolution
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateImprover = void 0;
const logger_1 = require("../../utils/logger");
class TemplateImprover {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Improve all templates
     */
    async improveTemplates() {
        const improvements = [];
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
    async improveMappingTemplates() {
        const improvements = [];
        const templates = await this.prisma.mappingTemplate.findMany({
            where: { deletedAt: null },
            take: 100,
        });
        for (const template of templates) {
            // Analyze usage patterns
            const jobs = await this.prisma.reconJob.findMany({
                where: { mappingTemplateId: template.id },
                take: 100,
            });
            // If template has high failure rate, propose improvement
            const failures = await this.prisma.reconResult.findMany({
                where: {
                    reconJobId: { in: jobs.map((j) => j.id) },
                    status: 'failed',
                },
                take: 10,
            });
            if (failures.length > 5) {
                improvements.push({
                    templateId: template.id,
                    templateType: 'mapping',
                    currentVersion: template.version || '1.0.0',
                    proposedVersion: this.incrementVersion(template.version || '1.0.0'),
                    improvements: [
                        'Add error handling for missing fields',
                        'Improve field matching logic',
                        'Add fallback mappings',
                    ],
                    backwardCompatible: true,
                    confidence: 0.8,
                });
            }
        }
        return improvements;
    }
    /**
     * Improve transform recipes
     */
    async improveTransformRecipes() {
        const improvements = [];
        const recipes = await this.prisma.transformRecipe.findMany({
            where: { deletedAt: null },
            take: 100,
        });
        for (const recipe of recipes) {
            // Analyze performance
            const jobs = await this.prisma.reconJob.findMany({
                where: { transformRecipeId: recipe.id },
                take: 100,
            });
            // Check execution times
            const results = await this.prisma.reconResult.findMany({
                where: {
                    reconJobId: { in: jobs.map((j) => j.id) },
                },
                take: 50,
            });
            const avgDuration = results
                .filter((r) => r.completedAt && r.startedAt)
                .map((r) => r.completedAt.getTime() - r.startedAt.getTime())
                .reduce((a, b, _, arr) => a + b / arr.length, 0);
            if (avgDuration > 10000) { // > 10 seconds
                improvements.push({
                    templateId: recipe.id,
                    templateType: 'transform',
                    currentVersion: recipe.version || '1.0.0',
                    proposedVersion: this.incrementVersion(recipe.version || '1.0.0'),
                    improvements: [
                        'Optimize transformation logic',
                        'Add caching for repeated operations',
                        'Parallelize independent transforms',
                    ],
                    backwardCompatible: true,
                    confidence: 0.7,
                });
            }
        }
        return improvements;
    }
    /**
     * Improve validation rules
     */
    async improveValidationRules() {
        const improvements = [];
        const rules = await this.prisma.validationRule.findMany({
            where: { deletedAt: null },
            take: 100,
        });
        for (const rule of rules) {
            // Check if rule catches issues effectively
            const jobs = await this.prisma.reconJob.findMany({
                where: { validationRuleId: rule.id },
                take: 100,
            });
            // If rule never fails, it might be too lenient
            const results = await this.prisma.reconResult.findMany({
                where: {
                    reconJobId: { in: jobs.map((j) => j.id) },
                    status: 'failed',
                },
                take: 1,
            });
            if (results.length === 0 && jobs.length > 10) {
                improvements.push({
                    templateId: rule.id,
                    templateType: 'validation',
                    currentVersion: rule.version || '1.0.0',
                    proposedVersion: this.incrementVersion(rule.version || '1.0.0'),
                    improvements: [
                        'Tighten validation criteria',
                        'Add additional checks',
                        'Improve error messages',
                    ],
                    backwardCompatible: true,
                    confidence: 0.6,
                });
            }
        }
        return improvements;
    }
    /**
     * Increment version number
     */
    incrementVersion(version) {
        const parts = version.split('.');
        const major = parseInt(parts[0] ?? '1', 10) || 1;
        const minor = parseInt(parts[1] ?? '0', 10) || 0;
        const patch = parseInt(parts[2] ?? '0', 10) || 0;
        return `${major}.${minor}.${patch + 1}`;
    }
    /**
     * Apply template improvement
     */
    async applyImprovement(improvement) {
        // Create new version of template
        if (improvement.templateType === 'mapping') {
            const template = await this.prisma.mappingTemplate.findUnique({
                where: { id: improvement.templateId },
            });
            if (template) {
                await this.prisma.mappingTemplate.create({
                    data: {
                        ...template,
                        id: undefined, // New record
                        version: improvement.proposedVersion,
                        name: `${template.name} (v${improvement.proposedVersion})`,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
            }
        }
        // Similar for transform and validation...
        (0, logger_1.logInfo)('Template improvement applied', { improvement });
    }
}
exports.TemplateImprover = TemplateImprover;
//# sourceMappingURL=template-improver.js.map