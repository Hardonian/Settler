export interface ReconciliationJob {
    id: string;
    userId: string;
    name: string;
    source: AdapterConfig;
    target: AdapterConfig;
    rules: MatchingRules;
    schedule?: string;
    status: "active" | "paused" | "archived";
    createdAt: string;
    updatedAt: string;
}
export interface AdapterConfig {
    adapter: string;
    config: Record<string, unknown>;
}
export interface MatchingRules {
    matching: MatchingRule[];
    conflictResolution?: "first-wins" | "last-wins" | "manual-review";
}
export interface MatchingRule {
    field: string;
    type: "exact" | "fuzzy" | "range";
    tolerance?: number;
    days?: number;
    threshold?: number;
}
export interface ReconciliationReport {
    jobId: string;
    dateRange: {
        start: string;
        end: string;
    };
    summary: ReportSummary;
    matches: Match[];
    unmatched: UnmatchedItem[];
    errors: ReportError[];
    generatedAt: string;
}
export interface ReportSummary {
    matched: number;
    unmatched: number;
    errors: number;
    accuracy: number;
    totalTransactions: number;
}
export interface Match {
    id: string;
    sourceId: string;
    targetId: string;
    amount: number;
    currency: string;
    matchedAt: string;
    confidence: number;
}
export interface UnmatchedItem {
    id: string;
    sourceId?: string;
    targetId?: string;
    amount: number;
    currency: string;
    reason: string;
}
export interface ReportError {
    id: string;
    message: string;
    occurredAt: string;
}
export interface Webhook {
    id: string;
    userId: string;
    url: string;
    events: string[];
    secret: string;
    status: "active" | "paused";
    createdAt: string;
}
export interface Adapter {
    id: string;
    name: string;
    description: string;
    version: string;
    config: {
        required: string[];
        optional: string[];
    };
    supportedEvents?: string[];
}
export interface CreateJobRequest {
    name: string;
    source: AdapterConfig;
    target: AdapterConfig;
    rules: MatchingRules;
    schedule?: string;
}
export interface CreateWebhookRequest {
    url: string;
    events: string[];
    secret?: string;
}
export interface ListResponse<T> {
    data: T[];
    count: number;
}
export interface ApiResponse<T> {
    data: T;
    message?: string;
}
//# sourceMappingURL=types.d.ts.map