/**
 * Job Execution Domain Entity
 * Represents a single execution of a reconciliation job
 */
export declare enum ExecutionStatus {
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface ExecutionSummary {
    matched: number;
    unmatched: number;
    errors: number;
    accuracy?: number;
}
export interface ExecutionProps {
    id: string;
    jobId: string;
    status: ExecutionStatus;
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    summary?: ExecutionSummary;
    createdAt: Date;
}
export declare class Execution {
    private props;
    private constructor();
    static create(props: Omit<ExecutionProps, 'id' | 'status' | 'startedAt' | 'createdAt'>): Execution;
    static fromPersistence(props: ExecutionProps): Execution;
    get id(): string;
    get jobId(): string;
    get status(): ExecutionStatus;
    get startedAt(): Date;
    get completedAt(): Date | undefined;
    get error(): string | undefined;
    get summary(): ExecutionSummary | undefined;
    get createdAt(): Date;
    complete(summary: ExecutionSummary): void;
    fail(error: string): void;
    cancel(): void;
    toPersistence(): ExecutionProps;
}
//# sourceMappingURL=Execution.d.ts.map