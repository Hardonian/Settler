import { SettlerClient } from "../client";
export interface EvaluationContext {
    userId?: string;
    email?: string;
    ip?: string;
    country?: string;
    [key: string]: unknown;
}
export interface FlagEvaluation {
    flagKey: string;
    value: boolean | string | number | Record<string, unknown>;
    variant?: string;
    reason?: string;
}
export declare class FlagsClient {
    private client;
    constructor(client: SettlerClient);
    evaluate(flagKey: string, context?: EvaluationContext, defaultValue?: boolean | string | number | Record<string, unknown>): Promise<FlagEvaluation>;
}
//# sourceMappingURL=flags.d.ts.map