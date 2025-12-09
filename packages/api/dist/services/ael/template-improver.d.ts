/**
 * Continuous Template Improvement
 *
 * Automatically generates improved templates
 * Part 7: Autonomous AIOS Evolution
 */
import { PrismaClient } from '@prisma/client';
export interface TemplateImprovement {
    templateId: string;
    templateType: 'mapping' | 'transform' | 'validation';
    currentVersion: string;
    proposedVersion: string;
    improvements: string[];
    backwardCompatible: boolean;
    confidence: number;
}
export declare class TemplateImprover {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Improve all templates
     */
    improveTemplates(): Promise<TemplateImprovement[]>;
    /**
     * Improve mapping templates
     */
    private improveMappingTemplates;
    /**
     * Improve transform recipes
     */
    private improveTransformRecipes;
    /**
     * Improve validation rules
     */
    private improveValidationRules;
    /**
     * Increment version number
     */
    private incrementVersion;
    /**
     * Apply template improvement
     */
    applyImprovement(improvement: TemplateImprovement): Promise<void>;
}
//# sourceMappingURL=template-improver.d.ts.map