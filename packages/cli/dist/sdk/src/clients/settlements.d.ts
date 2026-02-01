import { SettlerClient } from "../client";
import type { Money, PaginationInfo } from "./transactions";
export interface ListSettlementsParams {
    page?: number;
    limit?: number;
    provider?: "stripe" | "paypal" | "square" | "bank";
    status?: "pending" | "completed" | "failed";
    startDate?: string;
    endDate?: string;
}
export interface Settlement {
    id: string;
    tenantId: string;
    provider: string;
    providerSettlementId: string;
    amount: Money;
    currency: string;
    fxRate: number;
    settlementDate: string;
    expectedDate: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}
export interface SettlementListResponse {
    data: Settlement[];
    pagination: PaginationInfo;
}
export interface SettlementResponse {
    data: Settlement;
}
/**
 * Client for settlement operations.
 */
export declare class SettlementsClient {
    private readonly client;
    constructor(client: SettlerClient);
    list(params?: ListSettlementsParams): Promise<SettlementListResponse>;
    get(id: string): Promise<SettlementResponse>;
}
//# sourceMappingURL=settlements.d.ts.map