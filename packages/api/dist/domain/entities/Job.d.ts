/**
 * Reconciliation Job Domain Entity
 * Represents a reconciliation job configuration
 */
export declare enum JobStatus {
    ACTIVE = "active",
    PAUSED = "paused",
    ARCHIVED = "archived"
}
export interface MatchingRule {
    field: string;
    type: 'exact' | 'fuzzy' | 'range';
    tolerance?: number;
    threshold?: number;
    days?: number;
}
export interface ReconciliationRules {
    matching: MatchingRule[];
    conflictResolution: 'first-wins' | 'last-wins' | 'manual-review';
}
export interface JobProps {
    id: string;
    userId: string;
    name: string;
    sourceAdapter: string;
    sourceConfigEncrypted: string;
    targetAdapter: string;
    targetConfigEncrypted: string;
    rules: ReconciliationRules;
    schedule?: string;
    status: JobStatus;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Job {
    private props;
    private constructor();
    static create(props: Omit<JobProps, 'id' | 'status' | 'version' | 'createdAt' | 'updatedAt'>): Job;
    static fromPersistence(props: JobProps): Job;
    get id(): string;
    get userId(): string;
    get name(): string;
    get sourceAdapter(): string;
    get sourceConfigEncrypted(): string;
    get targetAdapter(): string;
    get targetConfigEncrypted(): string;
    get rules(): ReconciliationRules;
    get schedule(): string | undefined;
    get status(): JobStatus;
    get version(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    pause(): void;
    resume(): void;
    archive(): void;
    updateRules(rules: ReconciliationRules): void;
    updateSchedule(schedule: string | undefined): void;
    updateConfigs(sourceConfigEncrypted: string, targetConfigEncrypted: string): void;
    toPersistence(): JobProps;
}
//# sourceMappingURL=Job.d.ts.map