/**
 * Kill Switches Service
 * Disable connectors and pause background jobs without redeploy
 */

import { query } from "../../db";
import { logInfo, logError, logWarn } from "../../utils/logger";

export interface KillSwitch {
  id: string;
  name: string;
  type: "connector" | "background_job" | "feature" | "endpoint";
  target: string; // connector type, job type, feature name, or endpoint path
  enabled: boolean;
  reason?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create or update kill switch
 */
export async function setKillSwitch(
  name: string,
  type: KillSwitch["type"],
  target: string,
  enabled: boolean,
  reason?: string,
  createdBy?: string
): Promise<string> {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Invalid kill switch name");
  }
  if (!type || typeof type !== "string") {
    throw new Error("Invalid kill switch type");
  }
  if (!target || typeof target !== "string" || target.trim().length === 0) {
    throw new Error("Invalid kill switch target");
  }
  if (typeof enabled !== "boolean") {
    throw new Error("Invalid enabled value: must be boolean");
  }

  try {
    const result = await query<{ id: string }>(
      `INSERT INTO kill_switches (
        name, type, target, enabled, reason, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (name)
      DO UPDATE SET 
        enabled = EXCLUDED.enabled,
        reason = EXCLUDED.reason,
        updated_at = NOW()
      RETURNING id`,
      [name.trim(), type, target.trim(), enabled, reason?.trim() || null, createdBy || null]
    );

    const killSwitchId = result?.[0]?.id;
    if (!killSwitchId || typeof killSwitchId !== "string") {
      throw new Error("Failed to create kill switch: no ID returned");
    }

    logInfo("Kill switch updated", {
      id: killSwitchId,
      name,
      type,
      target,
      enabled,
      reason,
    });

    return killSwitchId;
  } catch (error) {
    logError("Failed to set kill switch", error, { name, type, target });
    throw error;
  }
}

/**
 * Check if kill switch is enabled
 */
export async function isKillSwitchEnabled(
  type: KillSwitch["type"],
  target: string
): Promise<boolean> {
  try {
    const result = await query<{ enabled: boolean }>(
      `SELECT enabled
       FROM kill_switches
       WHERE type = $1 AND target = $2 AND enabled = true`,
      [type, target]
    );

    return result.length > 0;
  } catch (error) {
    logError("Failed to check kill switch", error, { type, target });
    // Fail closed - assume kill switch is enabled if check fails
    return true;
  }
}

/**
 * Check if connector is disabled
 */
export async function isConnectorDisabled(connectorType: string): Promise<boolean> {
  return isKillSwitchEnabled("connector", connectorType);
}

/**
 * Check if background job is paused
 */
export async function isBackgroundJobPaused(jobType: string): Promise<boolean> {
  return isKillSwitchEnabled("background_job", jobType);
}

/**
 * Get all kill switches
 */
export async function getAllKillSwitches(): Promise<KillSwitch[]> {
  const switches = await query<{
    id: string;
    name: string;
    type: string;
    target: string;
    enabled: boolean;
    reason: string | null;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT id, name, type, target, enabled, reason, created_by, created_at, updated_at
     FROM kill_switches
     ORDER BY type, target`
  );

  return switches.map((sw) => ({
    id: sw.id,
    name: sw.name,
    type: sw.type as KillSwitch["type"],
    target: sw.target,
    enabled: sw.enabled,
    reason: sw.reason || undefined,
    createdBy: sw.created_by || undefined,
    createdAt: sw.created_at,
    updatedAt: sw.updated_at,
  }));
}

/**
 * Disable connector (kill switch)
 */
export async function disableConnector(
  connectorType: string,
  reason: string,
  createdBy?: string
): Promise<void> {
  await setKillSwitch(
    `connector_${connectorType}`,
    "connector",
    connectorType,
    true, // enabled = true means kill switch is active (disabled)
    reason,
    createdBy
  );

  logWarn("Connector disabled via kill switch", { connectorType, reason });
}

/**
 * Enable connector (remove kill switch)
 */
export async function enableConnector(connectorType: string): Promise<void> {
  await setKillSwitch(
    `connector_${connectorType}`,
    "connector",
    connectorType,
    false, // enabled = false means kill switch is inactive (enabled)
    "Manually enabled",
    undefined
  );

  logInfo("Connector enabled via kill switch", { connectorType });
}

/**
 * Pause background job (kill switch)
 */
export async function pauseBackgroundJob(
  jobType: string,
  reason: string,
  createdBy?: string
): Promise<void> {
  await setKillSwitch(
    `background_job_${jobType}`,
    "background_job",
    jobType,
    true, // enabled = true means kill switch is active (paused)
    reason,
    createdBy
  );

  logWarn("Background job paused via kill switch", { jobType, reason });
}

/**
 * Resume background job (remove kill switch)
 */
export async function resumeBackgroundJob(jobType: string): Promise<void> {
  await setKillSwitch(
    `background_job_${jobType}`,
    "background_job",
    jobType,
    false, // enabled = false means kill switch is inactive (resumed)
    "Manually resumed",
    undefined
  );

  logInfo("Background job resumed via kill switch", { jobType });
}
