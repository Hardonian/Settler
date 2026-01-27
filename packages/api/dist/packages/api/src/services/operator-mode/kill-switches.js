"use strict";
/**
 * Kill Switches Service
 * Disable connectors and pause background jobs without redeploy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setKillSwitch = setKillSwitch;
exports.isKillSwitchEnabled = isKillSwitchEnabled;
exports.isConnectorDisabled = isConnectorDisabled;
exports.isBackgroundJobPaused = isBackgroundJobPaused;
exports.getAllKillSwitches = getAllKillSwitches;
exports.disableConnector = disableConnector;
exports.enableConnector = enableConnector;
exports.pauseBackgroundJob = pauseBackgroundJob;
exports.resumeBackgroundJob = resumeBackgroundJob;
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
/**
 * Create or update kill switch
 */
async function setKillSwitch(name, type, target, enabled, reason, createdBy) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        throw new Error('Invalid kill switch name');
    }
    if (!type || typeof type !== 'string') {
        throw new Error('Invalid kill switch type');
    }
    if (!target || typeof target !== 'string' || target.trim().length === 0) {
        throw new Error('Invalid kill switch target');
    }
    if (typeof enabled !== 'boolean') {
        throw new Error('Invalid enabled value: must be boolean');
    }
    try {
        const result = await (0, db_1.query)(`INSERT INTO kill_switches (
        name, type, target, enabled, reason, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (name)
      DO UPDATE SET 
        enabled = EXCLUDED.enabled,
        reason = EXCLUDED.reason,
        updated_at = NOW()
      RETURNING id`, [name.trim(), type, target.trim(), enabled, reason?.trim() || null, createdBy || null]);
        const killSwitchId = result?.[0]?.id;
        if (!killSwitchId || typeof killSwitchId !== 'string') {
            throw new Error('Failed to create kill switch: no ID returned');
        }
        (0, logger_1.logInfo)('Kill switch updated', {
            id: killSwitchId,
            name,
            type,
            target,
            enabled,
            reason,
        });
        return killSwitchId;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to set kill switch', error, { name, type, target });
        throw error;
    }
}
/**
 * Check if kill switch is enabled
 */
async function isKillSwitchEnabled(type, target) {
    try {
        const result = await (0, db_1.query)(`SELECT enabled
       FROM kill_switches
       WHERE type = $1 AND target = $2 AND enabled = true`, [type, target]);
        return result.length > 0;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to check kill switch', error, { type, target });
        // Fail closed - assume kill switch is enabled if check fails
        return true;
    }
}
/**
 * Check if connector is disabled
 */
async function isConnectorDisabled(connectorType) {
    return isKillSwitchEnabled('connector', connectorType);
}
/**
 * Check if background job is paused
 */
async function isBackgroundJobPaused(jobType) {
    return isKillSwitchEnabled('background_job', jobType);
}
/**
 * Get all kill switches
 */
async function getAllKillSwitches() {
    const switches = await (0, db_1.query)(`SELECT id, name, type, target, enabled, reason, created_by, created_at, updated_at
     FROM kill_switches
     ORDER BY type, target`);
    return switches.map(sw => ({
        id: sw.id,
        name: sw.name,
        type: sw.type,
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
async function disableConnector(connectorType, reason, createdBy) {
    await setKillSwitch(`connector_${connectorType}`, 'connector', connectorType, true, // enabled = true means kill switch is active (disabled)
    reason, createdBy);
    (0, logger_1.logWarn)('Connector disabled via kill switch', { connectorType, reason });
}
/**
 * Enable connector (remove kill switch)
 */
async function enableConnector(connectorType) {
    await setKillSwitch(`connector_${connectorType}`, 'connector', connectorType, false, // enabled = false means kill switch is inactive (enabled)
    'Manually enabled', undefined);
    (0, logger_1.logInfo)('Connector enabled via kill switch', { connectorType });
}
/**
 * Pause background job (kill switch)
 */
async function pauseBackgroundJob(jobType, reason, createdBy) {
    await setKillSwitch(`background_job_${jobType}`, 'background_job', jobType, true, // enabled = true means kill switch is active (paused)
    reason, createdBy);
    (0, logger_1.logWarn)('Background job paused via kill switch', { jobType, reason });
}
/**
 * Resume background job (remove kill switch)
 */
async function resumeBackgroundJob(jobType) {
    await setKillSwitch(`background_job_${jobType}`, 'background_job', jobType, false, // enabled = false means kill switch is inactive (resumed)
    'Manually resumed', undefined);
    (0, logger_1.logInfo)('Background job resumed via kill switch', { jobType });
}
//# sourceMappingURL=kill-switches.js.map