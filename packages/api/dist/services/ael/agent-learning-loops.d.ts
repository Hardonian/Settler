/**
 * Agent-Driven Learning Loops
 *
 * Agents that continuously learn and improve
 * Part 7: Autonomous AIOS Evolution
 */
import type { PrismaClient } from '@prisma/client';
export interface LearningInsight {
    type: 'transform' | 'mapping' | 'schema' | 'validation' | 'workflow';
    issue: string;
    currentState: Record<string, unknown>;
    proposedImprovement: Record<string, unknown>;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
}
export declare class AgentLearningLoops {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Run all learning loops
     */
    runLearningLoops(): Promise<LearningInsight[]>;
    /**
     * Detect suboptimal transforms
     */
    private detectSuboptimalTransforms;
    /**
     * Analyze mapping drift
     */
    private analyzeMappingDrift;
    /**
     * Propose improved schema relationships
     */
    private proposeSchemaImprovements;
    /**
     * Auto-refactor unreferenced validation rules
     */
    private refactorUnreferencedRules;
    /**
     * Generate synthetic failing cases for robustness
     */
    private generateSyntheticCases;
    /**
     * Optimize workflows for latency and cost
     */
    private optimizeWorkflows;
}
//# sourceMappingURL=agent-learning-loops.d.ts.map