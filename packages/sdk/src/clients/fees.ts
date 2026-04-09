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
export class FeesClient {
  constructor(private readonly client: SettlerClient) {}

  async list(params: ListFeesParams = {}): Promise<FeeListResponse> {
    const query: Record<string, string> = {};
    if (params.transactionId) query.transactionId = params.transactionId;
    if (params.settlementId) query.settlementId = params.settlementId;
    if (params.type) query.type = params.type;

    return this.client.request<FeeListResponse>("GET", "/api/v1/fees", { query });
  }

  async getEffectiveRate(params: EffectiveRateParams = {}): Promise<EffectiveRateResponse> {
    const query: Record<string, string> = {};
    if (params.transactionId) query.transactionId = params.transactionId;
    if (params.provider) query.provider = params.provider;
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;

    return this.client.request<EffectiveRateResponse>("GET", "/api/v1/fees/effective-rate", {
      query,
    });
  }
}
