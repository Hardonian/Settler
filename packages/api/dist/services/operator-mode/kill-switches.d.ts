/**
 * Kill Switches Service
 * Disable connectors and pause background jobs without redeploy
 */
export interface KillSwitch {
    id: string;
    name: string;
    type: 'connector' | 'background_job' | 'feature' | 'endpoint';
    target: string;
    enabled: boolean;
    reason?: string;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Create or update kill switch
 */
export declare function setKillSwitch(name: string, type: KillSwitch['type'], target: string, enabled: boolean, reason?: string, createdBy?: string): Promise<string>;
/**
 * Check if kill switch is enabled
 */
export declare function isKillSwitchEnabled(type: KillSwitch['type'], target: string): Promise<boolean>;
/**
 * Check if connector is disabled
 */
export declare function isConnectorDisabled(connectorType: string): Promise<boolean>;
/**
 * Check if background job is paused
 */
export declare function isBackgroundJobPaused(jobType: string): Promise<boolean>;
/**
 * Get all kill switches
 */
export declare function getAllKillSwitches(): Promise<KillSwitch[]>;
/**
 * Disable connector (kill switch)
 */
export declare function disableConnector(connectorType: string, reason: string, createdBy?: string): Promise<void>;
/**
 * Enable connector (remove kill switch)
 */
export declare function enableConnector(connectorType: string): Promise<void>;
/**
 * Pause background job (kill switch)
 */
export declare function pauseBackgroundJob(jobType: string, reason: string, createdBy?: string): Promise<void>;
/**
 * Resume background job (remove kill switch)
 */
export declare function resumeBackgroundJob(jobType: string): Promise<void>;
//# sourceMappingURL=kill-switches.d.ts.map