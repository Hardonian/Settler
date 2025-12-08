export interface NormalizedData {
    id: string;
    amount: number;
    currency: string;
    date: Date;
    metadata: Record<string, unknown>;
    sourceId?: string;
    referenceId?: string;
}
export interface FetchOptions {
    dateRange: {
        start: Date;
        end: Date;
    };
    config: Record<string, unknown>;
}
export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
export interface Adapter {
    name: string;
    version: string;
    fetch(options: FetchOptions): Promise<NormalizedData[]>;
    normalize(data: unknown): NormalizedData;
    validate(data: NormalizedData): ValidationResult;
}
//# sourceMappingURL=base.d.ts.map