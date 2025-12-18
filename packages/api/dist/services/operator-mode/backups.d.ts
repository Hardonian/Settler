/**
 * Database Backup Service
 * Automated backups with restore verification
 */
export interface BackupRecord {
    id: string;
    filename: string;
    sizeBytes: number;
    status: 'pending' | 'completed' | 'failed' | 'verified';
    createdAt: Date;
    verifiedAt?: Date;
    restoreTested: boolean;
    errorMessage?: string;
}
/**
 * Create database backup
 */
export declare function createBackup(): Promise<BackupRecord>;
/**
 * Verify backup by testing restore
 */
export declare function verifyBackup(backupId: string): Promise<boolean>;
/**
 * List recent backups
 */
export declare function listBackups(limit?: number): Promise<BackupRecord[]>;
/**
 * Schedule daily backup (to be called by cron job)
 */
export declare function scheduleDailyBackup(): Promise<void>;
//# sourceMappingURL=backups.d.ts.map