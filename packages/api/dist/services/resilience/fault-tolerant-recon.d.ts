/**
 * Fault-Tolerant Recon Architecture
 *
 * Replayable jobs, idempotent transforms, safe rollback, fix-forward logic
 * Part 11: Resilience & Zero-Fault Hardening
 */
import { PrismaClient } from '@prisma/client';
export interface CheckpointState {
    state: Record<string, unknown>;
    timestamp: Date;
}
export interface ReplayableJob {
    jobId: string;
    checkpoint: CheckpointState;
    canReplay: boolean;
    replayStrategy: 'full' | 'incremental' | 'from_checkpoint';
}
export interface RollbackPlan {
    jobId: string;
    steps: Array<{
        type: 'revert_transform' | 'restore_state' | 'undo_mapping';
        description: string;
        safe: boolean;
    }>;
}
export declare class FaultTolerantRecon {
    private prisma;
    private checkpoints;
    constructor(prisma: PrismaClient);
    /**
     * Create checkpoint
     */
    createCheckpoint(jobId: string, state: Record<string, unknown>): Promise<void>;
    /**
     * Make transform idempotent
     */
    makeIdempotent(transformId: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
    /**
     * Safe rollback
     */
    safeRollback(jobId: string): Promise<RollbackPlan>;
    /**
     * Fix-forward logic
     */
    fixForward(jobId: string, _error: Error): Promise<{
        fixed: boolean;
        newState: Record<string, unknown> | null;
    }>;
    /**
     * Replay job
     */
    replayJob(jobId: string, strategy: 'full' | 'incremental' | 'from_checkpoint'): Promise<ReplayableJob>;
    /**
     * Hash input for idempotency
     */
    private hashInput;
}
//# sourceMappingURL=fault-tolerant-recon.d.ts.map