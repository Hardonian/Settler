/**
 * Saga Orchestrator
 * Manages distributed workflows with compensation and retry logic
 */
import { Pool } from 'pg';
import { IEventStore } from '../../infrastructure/eventsourcing/EventStore';
import { IEventBus } from '../../infrastructure/events/IEventBus';
export declare enum SagaStatus {
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    COMPENSATING = "compensating"
}
export interface SagaStep {
    name: string;
    execute: (state: SagaState) => Promise<SagaStepResult>;
    compensate?: (state: SagaState) => Promise<void>;
    timeoutMs?: number;
    retryable?: boolean;
    maxRetries?: number;
}
export interface SagaStepResult {
    success: boolean;
    data?: Record<string, unknown>;
    error?: {
        type: string;
        message: string;
        retryable: boolean;
    };
}
export interface SagaState {
    sagaId: string;
    sagaType: string;
    aggregateId: string;
    currentStep: string;
    status?: SagaStatus;
    stepHistory: Array<{
        step: string;
        status: 'started' | 'completed' | 'failed' | 'compensated';
        timestamp: Date;
        error?: string;
    }>;
    data: Record<string, unknown>;
    correlationId: string;
    tenantId: string;
}
export interface SagaDefinition {
    type: string;
    steps: SagaStep[];
    onComplete?: (state: SagaState) => Promise<void>;
    onFailure?: (state: SagaState, error: Error) => Promise<void>;
}
export declare class SagaOrchestrator {
    private db;
    private _eventStore;
    private _eventBus;
    private sagas;
    constructor(db: Pool | undefined, _eventStore: IEventStore, _eventBus: IEventBus);
    /**
     * Register a saga definition
     */
    registerSaga(definition: SagaDefinition): void;
    /**
     * Start a new saga instance
     */
    startSaga(sagaType: string, aggregateId: string, initialData: Record<string, unknown>, tenantId: string, correlationId?: string): Promise<string>;
    /**
     * Execute saga steps
     */
    private executeSaga;
    /**
     * Execute a step with retry logic
     */
    private executeStepWithRetry;
    /**
     * Compensate for completed steps
     */
    private compensate;
    /**
     * Save saga state to database
     */
    private saveSagaState;
    /**
     * Record step start
     */
    private recordStepStart;
    /**
     * Record step completion
     */
    private recordStepComplete;
    /**
     * Record step compensation
     */
    private recordStepCompensated;
    /**
     * Mark saga as completed
     */
    private markSagaCompleted;
    /**
     * Mark saga as failed
     */
    private markSagaFailed;
    /**
     * Schedule retry for a step
     */
    private scheduleRetry;
    /**
     * Check if step should be retried
     */
    private shouldRetryStep;
    /**
     * Handle step timeout
     */
    private handleStepTimeout;
    /**
     * Resume a saga (for retries or manual resumption)
     */
    resumeSaga(sagaId: string, sagaType: string): Promise<void>;
    /**
     * Cancel a saga
     */
    cancelSaga(sagaId: string, sagaType: string): Promise<void>;
    /**
     * Get saga status
     */
    getSagaStatus(sagaId: string, sagaType: string): Promise<SagaState | null>;
}
//# sourceMappingURL=SagaOrchestrator.d.ts.map