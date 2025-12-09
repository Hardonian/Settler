/**
 * Autonomous Evolution Layer (AEL)
 *
 * Continuously scans, analyzes, and proposes platform improvements
 * Part 7: Autonomous AIOS Evolution
 */
import type { PrismaClient } from '@prisma/client';
export interface EvolutionProposal {
    type: 'architectural' | 'template' | 'configuration' | 'api' | 'pipeline' | 'cost';
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    rationale: string;
    impact: string;
    risk: 'low' | 'medium' | 'high';
    estimatedEffort: number;
    backwardCompatible: boolean;
    proposedChange: Record<string, unknown>;
}
export interface EvolutionLog {
    timestamp: Date;
    proposal: EvolutionProposal;
    status: 'proposed' | 'approved' | 'rejected' | 'implemented';
    implementationNotes?: string;
}
export declare class AutonomousEvolutionLayer {
    private prisma;
    private patternExtractor;
    private evolutionLog;
    constructor(prisma: PrismaClient);
    /**
     * Main evolution cycle - runs continuously
     */
    evolve(): Promise<EvolutionProposal[]>;
    /**
     * Scan user behavior patterns
     */
    private scanUserBehavior;
    /**
     * Inspect recon jobs for patterns
     */
    private inspectReconJobs;
    /**
     * Identify failure clusters
     */
    private identifyFailureClusters;
    /**
     * Propose architectural enhancements
     */
    private proposeArchitecturalEnhancements;
    /**
     * Recommend new templates
     */
    private recommendNewTemplates;
    /**
     * Auto-patch minor configuration issues
     */
    private autoPatchConfigurations;
    /**
     * Detect API regression risk
     */
    private detectAPIRegressionRisk;
    /**
     * Rebalance pipeline costs
     */
    private rebalancePipelineCosts;
    /**
     * Log evolution proposal
     */
    private logProposal;
    /**
     * Get evolution log
     */
    getEvolutionLog(): EvolutionLog[];
    /**
     * Approve and implement proposal
     */
    approveProposal(proposalId: string, implementationNotes?: string): Promise<void>;
}
//# sourceMappingURL=autonomous-evolution-layer.d.ts.map