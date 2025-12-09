/**
 * Pipeline Auto-Rewrite Engine
 *
 * Recognizes outdated pipelines and rewrites them
 * Part 8: Self-Rewriting OS & Meta-Orchestration
 */
import { PrismaClient } from '@prisma/client';
export interface PipelineRewrite {
    pipelineId: string;
    currentVersion: string;
    targetVersion: string;
    changes: PipelineChange[];
    backwardCompatible: boolean;
    risk: 'low' | 'medium' | 'high';
}
export interface PipelineChange {
    type: 'node_upgrade' | 'logic_rewrite' | 'patch' | 'optimization';
    nodeId: string;
    description: string;
    oldLogic: Record<string, unknown>;
    newLogic: Record<string, unknown>;
}
export declare class PipelineRewriter {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Analyze and rewrite outdated pipelines
     */
    rewritePipelines(): Promise<PipelineRewrite[]>;
    /**
     * Analyze workflow for rewrite opportunities
     */
    private analyzeWorkflow;
    /**
     * Detect outdated patterns in workflow runs
     */
    private detectOutdatedPatterns;
    /**
     * Check if step type is deprecated
     */
    private isDeprecatedStepType;
    /**
     * Upgrade step to new version
     */
    private upgradeStep;
    /**
     * Check if step has incompatible configuration
     */
    private isIncompatibleConfig;
    /**
     * Patch step to fix incompatibility
     */
    private patchStep;
    /**
     * Apply rewrite to pipeline
     */
    applyRewrite(rewrite: PipelineRewrite): Promise<void>;
}
//# sourceMappingURL=pipeline-rewriter.d.ts.map