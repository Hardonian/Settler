import {
  setTenantUsageCeiling,
  getAllUsageCeilings,
  checkUsageCeiling,
  setBackgroundJobLimit,
} from "../../operator-mode/cost-controls";
import type { CapabilityStatus } from "../types";

export interface UsageMeteringProvider {
  status(): CapabilityStatus;
  setUsageCeiling(
    tenantId: string,
    billingAccountId: string,
    usageType: "ingestions" | "reconciliations" | "api_requests" | "storage",
    monthlyLimit: number
  ): Promise<void>;
  getUsageCeilings(): ReturnType<typeof getAllUsageCeilings>;
  checkUsageCeiling(
    tenantId: string,
    usageType: "ingestions" | "reconciliations" | "api_requests" | "storage"
  ): ReturnType<typeof checkUsageCeiling>;
  setJobLimit(
    jobType: "ingestion" | "reconciliation" | "webhook" | "export",
    maxConcurrent: number,
    maxPerTenant: number
  ): Promise<void>;
}

export class OssUsageMeteringProvider implements UsageMeteringProvider {
  public status(): CapabilityStatus {
    return {
      key: "usage_metering",
      state: "available",
      available: true,
      source: "oss",
      reason: "Using OSS usage metering implementation",
    };
  }

  public setUsageCeiling(
    tenantId: string,
    billingAccountId: string,
    usageType: "ingestions" | "reconciliations" | "api_requests" | "storage",
    monthlyLimit: number
  ): Promise<void> {
    return setTenantUsageCeiling(tenantId, billingAccountId, usageType, monthlyLimit);
  }

  public getUsageCeilings(): ReturnType<typeof getAllUsageCeilings> {
    return getAllUsageCeilings();
  }

  public checkUsageCeiling(
    tenantId: string,
    usageType: "ingestions" | "reconciliations" | "api_requests" | "storage"
  ): ReturnType<typeof checkUsageCeiling> {
    return checkUsageCeiling(tenantId, usageType);
  }

  public setJobLimit(
    jobType: "ingestion" | "reconciliation" | "webhook" | "export",
    maxConcurrent: number,
    maxPerTenant: number
  ): Promise<void> {
    return setBackgroundJobLimit(jobType, maxConcurrent, maxPerTenant);
  }
}
