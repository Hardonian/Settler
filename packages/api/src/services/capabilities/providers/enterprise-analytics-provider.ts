import type { CapabilityStatus } from "../types";

export interface EnterpriseAnalyticsProvider {
  status(): CapabilityStatus;
}

export class OssEnterpriseAnalyticsProvider implements EnterpriseAnalyticsProvider {
  public status(): CapabilityStatus {
    return {
      key: "enterprise_analytics",
      state: "degraded",
      available: true,
      source: "oss",
      reason: "OSS analytics is available; enterprise enrichment is optional",
    };
  }
}
