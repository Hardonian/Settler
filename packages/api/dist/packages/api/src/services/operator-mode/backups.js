"use strict";
/**
 * Database Backup Service
 * Automated backups with restore verification
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackup = createBackup;
exports.verifyBackup = verifyBackup;
exports.listBackups = listBackups;
exports.scheduleDailyBackup = scheduleDailyBackup;
const child_process_1 = require("child_process");
const util_1 = require("util");
const db_1 = require("../../db");
const logger_1 = require("../../utils/logger");
const config_1 = require("../../config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Create database backup
 */
async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `settler-backup-${timestamp}.sql`;
    const backupDir = process.env.BACKUP_DIR || '/tmp/backups';
    const backupPath = path.join(backupDir, filename);
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    try {
        // Create backup record
        const result = await (0, db_1.query)(`INSERT INTO backup_records (filename, status, created_at)
       VALUES ($1, 'pending', NOW())
       RETURNING id`, [filename]);
        const backupId = result?.[0]?.id;
        if (!backupId || typeof backupId !== 'string') {
            throw new Error('Failed to create backup record: no ID returned');
        }
        (0, logger_1.logInfo)('Starting database backup', { backupId, filename });
        // Validate config
        if (!config_1.config.database.host || !config_1.config.database.name || !config_1.config.database.user || !config_1.config.database.password) {
            throw new Error('Database configuration incomplete');
        }
        // Create pg_dump command
        const pgDumpCmd = [
            'pg_dump',
            `--host=${String(config_1.config.database.host)}`,
            `--port=${String(config_1.config.database.port || 5432)}`,
            `--username=${String(config_1.config.database.user)}`,
            `--dbname=${String(config_1.config.database.name)}`,
            '--format=plain',
            '--no-owner',
            '--no-acl',
            `--file=${backupPath}`,
        ].join(' ');
        // Set PGPASSWORD environment variable
        const env = {
            ...process.env,
            PGPASSWORD: String(config_1.config.database.password),
        };
        // Execute backup with timeout
        try {
            await Promise.race([
                execAsync(pgDumpCmd, { env }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Backup timeout after 30 minutes')), 30 * 60 * 1000)),
            ]);
        }
        catch (execError) {
            if (execError.message?.includes('timeout')) {
                throw execError;
            }
            throw new Error(`pg_dump failed: ${execError.message || String(execError)}`);
        }
        // Get file size
        let sizeBytes = 0;
        try {
            const stats = fs.statSync(backupPath);
            sizeBytes = stats.size || 0;
        }
        catch (statError) {
            (0, logger_1.logError)('Failed to get backup file size', statError, { backupPath });
            // Continue anyway - size is optional
        }
        // Update backup record
        await (0, db_1.query)(`UPDATE backup_records
       SET status = 'completed', size_bytes = $1
       WHERE id = $2`, [sizeBytes, backupId]);
        (0, logger_1.logInfo)('Database backup completed', {
            backupId,
            filename,
            sizeBytes,
        });
        return {
            id: backupId,
            filename,
            sizeBytes,
            status: 'completed',
            createdAt: new Date(),
            restoreTested: false,
        };
    }
    catch (error) {
        (0, logger_1.logError)('Database backup failed', error, { filename });
        // Update backup record with error
        const result = await (0, db_1.query)(`SELECT id FROM backup_records WHERE filename = $1 ORDER BY created_at DESC LIMIT 1`, [filename]);
        if (result.length > 0 && result[0]) {
            await (0, db_1.query)(`UPDATE backup_records
         SET status = 'failed', error_message = $1
         WHERE id = $2`, [
                error instanceof Error ? error.message : 'Unknown error',
                result[0].id,
            ]);
        }
        throw error;
    }
}
/**
 * Verify backup by testing restore
 */
async function verifyBackup(backupId) {
    try {
        (0, logger_1.logInfo)('Verifying backup', { backupId });
        // Get backup record
        const backup = await (0, db_1.query)(`SELECT filename, status FROM backup_records WHERE id = $1`, [backupId]);
        if (!backup || backup.length === 0 || !backup[0]) {
            throw new Error('Backup record not found');
        }
        const backupRecord = backup[0];
        if (!backupRecord.filename || typeof backupRecord.filename !== 'string') {
            throw new Error('Invalid backup record: missing filename');
        }
        if (backupRecord.status !== 'completed') {
            throw new Error(`Backup status is ${backupRecord.status}, cannot verify`);
        }
        const backupDir = process.env.BACKUP_DIR || '/tmp/backups';
        const backupPath = path.join(backupDir, backupRecord.filename);
        if (!fs.existsSync(backupPath)) {
            throw new Error('Backup file not found');
        }
        // Create test database name
        const testDbName = `settler_backup_test_${Date.now()}`;
        try {
            // Create test database
            await (0, db_1.query)(`CREATE DATABASE ${testDbName}`);
            // Restore backup to test database
            if (!config_1.config.database.host || !config_1.config.database.user || !config_1.config.database.password) {
                throw new Error('Database configuration incomplete for restore');
            }
            const restoreCmd = [
                'psql',
                `--host=${String(config_1.config.database.host)}`,
                `--port=${String(config_1.config.database.port || 5432)}`,
                `--username=${String(config_1.config.database.user)}`,
                `--dbname=${testDbName}`,
                `--file=${backupPath}`,
            ].join(' ');
            const env = {
                ...process.env,
                PGPASSWORD: String(config_1.config.database.password),
            };
            try {
                await Promise.race([
                    execAsync(restoreCmd, { env }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Restore timeout after 30 minutes')), 30 * 60 * 1000)),
                ]);
            }
            catch (restoreError) {
                if (restoreError.message?.includes('timeout')) {
                    throw restoreError;
                }
                throw new Error(`Restore failed: ${restoreError.message || String(restoreError)}`);
            }
            // Verify restore by checking a few key tables
            const testQuery = await (0, db_1.query)(`SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = 'public'`);
            if (testQuery.length === 0) {
                throw new Error('Restore verification failed: no tables found');
            }
            // Update backup record
            await (0, db_1.query)(`UPDATE backup_records
         SET status = 'verified', restore_tested = true, verified_at = NOW()
         WHERE id = $1`, [backupId]);
            (0, logger_1.logInfo)('Backup verified successfully', { backupId });
            return true;
        }
        finally {
            // Clean up test database
            try {
                await (0, db_1.query)(`DROP DATABASE IF EXISTS ${testDbName}`);
            }
            catch (cleanupError) {
                (0, logger_1.logError)('Failed to cleanup test database', cleanupError, {
                    testDbName,
                });
            }
        }
    }
    catch (error) {
        (0, logger_1.logError)('Backup verification failed', error, { backupId });
        // Update backup record
        await (0, db_1.query)(`UPDATE backup_records
       SET error_message = $1
       WHERE id = $2`, [
            error instanceof Error ? error.message : 'Unknown error',
            backupId,
        ]);
        return false;
    }
}
/**
 * List recent backups
 */
async function listBackups(limit = 10) {
    const backups = await (0, db_1.query)(`SELECT id, filename, size_bytes, status, created_at, verified_at, restore_tested, error_message
     FROM backup_records
     ORDER BY created_at DESC
     LIMIT $1`, [limit]);
    return backups.map(backup => ({
        id: backup.id,
        filename: backup.filename,
        sizeBytes: Number(backup.size_bytes || 0),
        status: backup.status,
        createdAt: backup.created_at,
        verifiedAt: backup.verified_at || undefined,
        restoreTested: backup.restore_tested,
        errorMessage: backup.error_message || undefined,
    }));
}
/**
 * Schedule daily backup (to be called by cron job)
 */
async function scheduleDailyBackup() {
    try {
        (0, logger_1.logInfo)('Starting scheduled daily backup');
        const backup = await createBackup();
        // Verify backup
        await verifyBackup(backup.id);
        (0, logger_1.logInfo)('Scheduled daily backup completed', { backupId: backup.id });
        // Clean up old backups (keep last 30 days)
        await cleanupOldBackups(30);
    }
    catch (error) {
        (0, logger_1.logError)('Scheduled daily backup failed', error);
        throw error;
    }
}
/**
 * Clean up old backups
 */
async function cleanupOldBackups(daysToKeep) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const oldBackups = await (0, db_1.query)(`SELECT filename FROM backup_records
     WHERE created_at < $1`, [cutoffDate]);
    const backupDir = process.env.BACKUP_DIR || '/tmp/backups';
    for (const backup of oldBackups) {
        const backupPath = path.join(backupDir, backup.filename);
        try {
            if (fs.existsSync(backupPath)) {
                fs.unlinkSync(backupPath);
            }
            await (0, db_1.query)(`DELETE FROM backup_records WHERE filename = $1`, [
                backup.filename,
            ]);
            (0, logger_1.logInfo)('Deleted old backup', { filename: backup.filename });
        }
        catch (error) {
            (0, logger_1.logError)('Failed to delete old backup', error, {
                filename: backup.filename,
            });
        }
    }
}
//# sourceMappingURL=backups.js.map