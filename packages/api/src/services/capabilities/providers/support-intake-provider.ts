import type { CapabilityStatus } from "../types";

export interface SupportIntakeProvider {
  status(): CapabilityStatus;
}

export class OssSupportIntakeProvider implements SupportIntakeProvider {
  public status(): CapabilityStatus {
    return {
      key: "support_intake",
      state: "available",
      available: true,
      source: "oss",
      reason: "Using OSS support intake implementation",
    };
  }
}
