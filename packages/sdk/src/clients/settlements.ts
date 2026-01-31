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
export class SettlementsClient {
  constructor(private readonly client: SettlerClient) {}

  async list(params: ListSettlementsParams = {}): Promise<SettlementListResponse> {
    const query: Record<string, string> = {};
    if (params.page !== undefined) query.page = String(params.page);
    if (params.limit !== undefined) query.limit = String(params.limit);
    if (params.provider) query.provider = params.provider;
    if (params.status) query.status = params.status;
    if (params.startDate) query.startDate = params.startDate;
    if (params.endDate) query.endDate = params.endDate;

    return this.client.request<SettlementListResponse>("GET", "/api/v1/settlements", { query });
  }

  async get(id: string): Promise<SettlementResponse> {
    return this.client.request<SettlementResponse>("GET", `/api/v1/settlements/${encodeURIComponent(id)}`);
  }
}
