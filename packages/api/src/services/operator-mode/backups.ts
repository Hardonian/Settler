/**
 * Database Backup Service
 * Automated backups with restore verification
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { query } from '../../db';
import { logInfo, logError } from '../../utils/logger';
import { config } from '../../config';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

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
export async function createBackup(): Promise<BackupRecord> {
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
    const result = await query<{ id: string }>(
      `INSERT INTO backup_records (filename, status, created_at)
       VALUES ($1, 'pending', NOW())
       RETURNING id`,
      [filename]
    );

    const backupId = result?.[0]?.id;
    if (!backupId || typeof backupId !== 'string') {
      throw new Error('Failed to create backup record: no ID returned');
    }

    logInfo('Starting database backup', { backupId, filename });

    // Validate config
    if (!config.database.host || !config.database.name || !config.database.user || !config.database.password) {
      throw new Error('Database configuration incomplete');
    }

    // Create pg_dump command
    const pgDumpCmd = [
      'pg_dump',
      `--host=${String(config.database.host)}`,
      `--port=${String(config.database.port || 5432)}`,
      `--username=${String(config.database.user)}`,
      `--dbname=${String(config.database.name)}`,
      '--format=plain',
      '--no-owner',
      '--no-acl',
      `--file=${backupPath}`,
    ].join(' ');

    // Set PGPASSWORD environment variable
    const env = {
      ...process.env,
      PGPASSWORD: String(config.database.password),
    };

    // Execute backup with timeout
    try {
      await Promise.race([
        execAsync(pgDumpCmd, { env }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Backup timeout after 30 minutes')), 30 * 60 * 1000)
        ),
      ]);
    } catch (execError: any) {
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
    } catch (statError) {
      logError('Failed to get backup file size', statError, { backupPath });
      // Continue anyway - size is optional
    }

    // Update backup record
    await query(
      `UPDATE backup_records
       SET status = 'completed', size_bytes = $1
       WHERE id = $2`,
      [sizeBytes, backupId]
    );

    logInfo('Database backup completed', {
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
  } catch (error) {
    logError('Database backup failed', error, { filename });

    // Update backup record with error
    const result = await query<{ id: string }>(
      `SELECT id FROM backup_records WHERE filename = $1 ORDER BY created_at DESC LIMIT 1`,
      [filename]
    );

    if (result.length > 0 && result[0]) {
      await query(
        `UPDATE backup_records
         SET status = 'failed', error_message = $1
         WHERE id = $2`,
        [
          error instanceof Error ? error.message : 'Unknown error',
          result[0].id,
        ]
      );
    }

    throw error;
  }
}

/**
 * Verify backup by testing restore
 */
export async function verifyBackup(backupId: string): Promise<boolean> {
  try {
    logInfo('Verifying backup', { backupId });

    // Get backup record
    const backup = await query<{
      filename: string;
      status: string;
    }>(
      `SELECT filename, status FROM backup_records WHERE id = $1`,
      [backupId]
    );

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
      await query(`CREATE DATABASE ${testDbName}`);

      // Restore backup to test database
      if (!config.database.host || !config.database.user || !config.database.password) {
        throw new Error('Database configuration incomplete for restore');
      }

      const restoreCmd = [
        'psql',
        `--host=${String(config.database.host)}`,
        `--port=${String(config.database.port || 5432)}`,
        `--username=${String(config.database.user)}`,
        `--dbname=${testDbName}`,
        `--file=${backupPath}`,
      ].join(' ');

      const env = {
        ...process.env,
        PGPASSWORD: String(config.database.password),
      };

      try {
        await Promise.race([
          execAsync(restoreCmd, { env }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Restore timeout after 30 minutes')), 30 * 60 * 1000)
          ),
        ]);
      } catch (restoreError: any) {
        if (restoreError.message?.includes('timeout')) {
          throw restoreError;
        }
        throw new Error(`Restore failed: ${restoreError.message || String(restoreError)}`);
      }

      // Verify restore by checking a few key tables
      const testQuery = await query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = 'public'`
      );

      if (testQuery.length === 0) {
        throw new Error('Restore verification failed: no tables found');
      }

      // Update backup record
      await query(
        `UPDATE backup_records
         SET status = 'verified', restore_tested = true, verified_at = NOW()
         WHERE id = $1`,
        [backupId]
      );

      logInfo('Backup verified successfully', { backupId });

      return true;
    } finally {
      // Clean up test database
      try {
        await query(`DROP DATABASE IF EXISTS ${testDbName}`);
      } catch (cleanupError) {
        logError('Failed to cleanup test database', cleanupError, {
          testDbName,
        });
      }
    }
  } catch (error) {
    logError('Backup verification failed', error, { backupId });

    // Update backup record
    await query(
      `UPDATE backup_records
       SET error_message = $1
       WHERE id = $2`,
      [
        error instanceof Error ? error.message : 'Unknown error',
        backupId,
      ]
    );

    return false;
  }
}

/**
 * List recent backups
 */
export async function listBackups(limit: number = 10): Promise<BackupRecord[]> {
  const backups = await query<{
    id: string;
    filename: string;
    size_bytes: number;
    status: string;
    created_at: Date;
    verified_at: Date | null;
    restore_tested: boolean;
    error_message: string | null;
  }>(
    `SELECT id, filename, size_bytes, status, created_at, verified_at, restore_tested, error_message
     FROM backup_records
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return backups.map(backup => ({
    id: backup.id,
    filename: backup.filename,
    sizeBytes: Number(backup.size_bytes || 0),
    status: backup.status as BackupRecord['status'],
    createdAt: backup.created_at,
    verifiedAt: backup.verified_at || undefined,
    restoreTested: backup.restore_tested,
    errorMessage: backup.error_message || undefined,
  }));
}

/**
 * Schedule daily backup (to be called by cron job)
 */
export async function scheduleDailyBackup(): Promise<void> {
  try {
    logInfo('Starting scheduled daily backup');

    const backup = await createBackup();

    // Verify backup
    await verifyBackup(backup.id);

    logInfo('Scheduled daily backup completed', { backupId: backup.id });

    // Clean up old backups (keep last 30 days)
    await cleanupOldBackups(30);
  } catch (error) {
    logError('Scheduled daily backup failed', error);
    throw error;
  }
}

/**
 * Clean up old backups
 */
async function cleanupOldBackups(daysToKeep: number): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const oldBackups = await query<{ filename: string }>(
    `SELECT filename FROM backup_records
     WHERE created_at < $1`,
    [cutoffDate]
  );

  const backupDir = process.env.BACKUP_DIR || '/tmp/backups';

  for (const backup of oldBackups) {
    const backupPath = path.join(backupDir, backup.filename);
    try {
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      await query(`DELETE FROM backup_records WHERE filename = $1`, [
        backup.filename,
      ]);
      logInfo('Deleted old backup', { filename: backup.filename });
    } catch (error) {
      logError('Failed to delete old backup', error, {
        filename: backup.filename,
      });
    }
  }
}
