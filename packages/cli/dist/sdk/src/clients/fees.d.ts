import { SettlerClient } from "../client";
import type { Money } from "./transactions";
export interface ListFeesParams {
    transactionId?: string;
    settlementId?: string;
    type?: "processing" | "fx" | "chargeback" | "refund" | "adjustment" | "other";
}
export interface Fee {
    id: string;
    tenantId: string;
    transactionId: string;
    settlementId: string;
    type: string;
    amount: Money;
    description: string;
    rate: number;
    createdAt: string;
}
export interface FeeListResponse {
    data: Fee[];
}
export interface EffectiveRateParams {
    transactionId?: string;
    provider?: string;
    startDate?: string;
    endDate?: string;
}
export interface EffectiveRateResult {
    transactionId: string;
    provider: string;
    transactionAmount: number;
    totalFees: number;
    effectiveRate: number;
}
export interface EffectiveRateResponse {
    data: EffectiveRateResult[];
}
/**
 * Client for fee visibility and reporting.
 */
export declare class FeesClient {
    private readonly client;
    constructor(client: SettlerClient);
    list(params?: ListFeesParams): Promise<FeeListResponse>;
    getEffectiveRate(params?: EffectiveRateParams): Promise<EffectiveRateResponse>;
}
//# sourceMappingURL=fees.d.ts.map