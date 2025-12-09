/**
 * Workflow Engine
 *
 * Orchestrates complex data operations workflows
 * Part of Phase V: AIOS (Autonomous Data Operations OS)
 */
import { PrismaClient } from '@prisma/client';
export type WorkflowStepType = 'ingestion' | 'transform' | 'validate' | 'map' | 'recon' | 'drift_detection' | 'audit' | 'webhook' | 'conditional' | 'loop' | 'timer';
export interface WorkflowStep {
    id: string;
    type: WorkflowStepType;
    config: Record<string, unknown>;
    onSuccess?: string;
    onFailure?: string;
    retry?: {
        maxAttempts: number;
        backoff: 'linear' | 'exponential';
    };
}
export interface WorkflowTrigger {
    type: 'schedule' | 'event' | 'manual';
    config: Record<string, unknown>;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    version: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
}
export declare class WorkflowEngine {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Execute workflow
     */
    executeWorkflow(tenantId: string, workflowId: string, input?: Record<string, unknown>): Promise<{
        workflowRunId: string;
        status: 'running' | 'completed' | 'failed';
        results: Record<string, unknown>;
    }>;
    /**
     * Schedule workflow
     */
    scheduleWorkflow(tenantId: string, workflowId: string, schedule: {
        type: 'cron' | 'interval' | 'once';
        config: Record<string, unknown>;
    }): Promise<void>;
}
//# sourceMappingURL=workflow-engine.d.ts.map