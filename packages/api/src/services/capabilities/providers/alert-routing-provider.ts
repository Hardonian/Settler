import {
  checkAlertThresholds,
  upsertAlertThreshold,
  type AlertThreshold,
} from "../../operator-mode/alerting";
import type { CapabilityStatus } from "../types";

export interface AlertRoutingProvider {
  status(): CapabilityStatus;
  checkThresholds(): ReturnType<typeof checkAlertThresholds>;
  upsertThreshold(userId: string, threshold: AlertThreshold): Promise<string>;
}

export class OssAlertRoutingProvider implements AlertRoutingProvider {
  public status(): CapabilityStatus {
    return {
      key: "alert_routing",
      state: "available",
      available: true,
      source: "oss",
      reason: "Using OSS alert routing implementation",
    };
  }

  public checkThresholds(): ReturnType<typeof checkAlertThresholds> {
    return checkAlertThresholds();
  }

  public upsertThreshold(userId: string, threshold: AlertThreshold): Promise<string> {
    return upsertAlertThreshold(userId, threshold);
  }
}
