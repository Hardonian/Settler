"use strict";
/**
 * Pipeline Auto-Rewrite Engine
 *
 * Recognizes outdated pipelines and rewrites them
 * Part 8: Self-Rewriting OS & Meta-Orchestration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineRewriter = void 0;
const logger_1 = require("../../utils/logger");
class PipelineRewriter {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Analyze and rewrite outdated pipelines
     */
    async rewritePipelines() {
        const rewrites = [];
        // Find workflows with old versions
        const workflows = await this.prisma.workflowRun.findMany({
            take: 1000,
            orderBy: { startedAt: 'desc' },
        });
        // Group by workflow ID
        const workflowGroups = new Map();
        for (const workflow of workflows) {
            const id = workflow.workflowId;
            if (!workflowGroups.has(id)) {
                workflowGroups.set(id, []);
            }
            workflowGroups.get(id).push(workflow);
        }
        // Analyze each workflow for rewrite opportunities
        for (const [workflowId, runs] of workflowGroups.entries()) {
            const rewrite = await this.analyzeWorkflow(workflowId, runs);
            if (rewrite) {
                rewrites.push(rewrite);
            }
        }
        return rewrites;
    }
    /**
     * Analyze workflow for rewrite opportunities
     */
    async analyzeWorkflow(workflowId, runs) {
        // Check for outdated patterns
        const outdatedPatterns = this.detectOutdatedPatterns(runs);
        if (outdatedPatterns.length === 0) {
            return null;
        }
        const changes = [];
        // Upgrade outdated nodes
        for (const pattern of outdatedPatterns) {
            if (pattern.type === 'outdated_node') {
                changes.push({
                    type: 'node_upgrade',
                    nodeId: pattern.nodeId,
                    description: `Upgrade ${pattern.nodeId} to latest version`,
                    oldLogic: pattern.oldLogic,
                    newLogic: pattern.newLogic,
                });
            }
            else if (pattern.type === 'incompatible_node') {
                changes.push({
                    type: 'patch',
                    nodeId: pattern.nodeId,
                    description: `Patch incompatible node ${pattern.nodeId}`,
                    oldLogic: pattern.oldLogic,
                    newLogic: pattern.newLogic,
                });
            }
        }
        return {
            pipelineId: workflowId,
            currentVersion: '1.0.0', // TODO: Get from workflow
            targetVersion: '2.0.0',
            changes,
            backwardCompatible: true,
            risk: changes.length > 5 ? 'medium' : 'low',
        };
    }
    /**
     * Detect outdated patterns in workflow runs
     */
    detectOutdatedPatterns(runs) {
        const patterns = [];
        // Analyze step configurations
        for (const run of runs) {
            const steps = (run.steps || []);
            for (const step of steps) {
                // Check for deprecated step types
                if (this.isDeprecatedStepType(step.type)) {
                    patterns.push({
                        type: 'outdated_node',
                        nodeId: step.id,
                        oldLogic: step,
                        newLogic: this.upgradeStep(step),
                    });
                }
                // Check for incompatible configurations
                if (this.isIncompatibleConfig(step)) {
                    patterns.push({
                        type: 'incompatible_node',
                        nodeId: step.id,
                        oldLogic: step,
                        newLogic: this.patchStep(step),
                    });
                }
            }
        }
        return patterns;
    }
    /**
     * Check if step type is deprecated
     */
    isDeprecatedStepType(type) {
        const deprecatedTypes = ['legacy_transform', 'old_validator'];
        return deprecatedTypes.includes(type);
    }
    /**
     * Upgrade step to new version
     */
    upgradeStep(step) {
        // Map old step types to new ones
        const typeMapping = {
            'legacy_transform': 'transform',
            'old_validator': 'validate',
        };
        return {
            ...step,
            type: typeMapping[step.type] || step.type,
            version: '2.0.0',
        };
    }
    /**
     * Check if step has incompatible configuration
     */
    isIncompatibleConfig(step) {
        // Check for incompatible config patterns
        if (step.config && typeof step.config === 'object' && 'legacyFormat' in step.config) {
            return Boolean(step.config.legacyFormat);
        }
        return false;
    }
    /**
     * Patch step to fix incompatibility
     */
    patchStep(step) {
        return {
            ...step,
            config: {
                ...(step.config || {}),
                legacyFormat: false,
                migrated: true,
            },
        };
    }
    /**
     * Apply rewrite to pipeline
     */
    async applyRewrite(rewrite) {
        // TODO: Implement actual rewrite logic
        // This would update the workflow definition in the database
        (0, logger_1.logInfo)('Pipeline rewrite applied', { pipelineId: rewrite.pipelineId });
    }
}
exports.PipelineRewriter = PipelineRewriter;
//# sourceMappingURL=pipeline-rewriter.js.map