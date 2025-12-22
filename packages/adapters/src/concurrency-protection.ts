/**
 * Concurrency Protection
 * 
 * Ensures only one sync runs per (tenant_id, connector_id) at a time
 */

import { createClient } from '@supabase/supabase-js';

export interface ConcurrencyLock {
  acquired: boolean;
  lockId?: string;
  error?: string;
}

/**
 * Acquire lock for sync (using PostgreSQL advisory locks)
 */
export async function acquireSyncLock(
  tenantId: string,
  connectorId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<ConcurrencyLock> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Use PostgreSQL advisory lock
    // Hash tenant_id and connector_id to create unique lock key
    const lockKey = `tenant:${tenantId}:connector:${connectorId}`;
    const lockHash = Buffer.from(lockKey).readUInt32BE(0);

    // Try to acquire lock (non-blocking)
    const { data, error } = await supabase.rpc('pg_try_advisory_lock', {
      lock_id: lockHash,
    });

    if (error || !data) {
      return {
        acquired: false,
        error: 'Failed to acquire lock',
      };
    }

    if (data === false) {
      return {
        acquired: false,
        error: 'Sync already in progress',
      };
    }

    return {
      acquired: true,
      lockId: lockHash.toString(),
    };
  } catch (error) {
    // Fallback: Check for running sync runs
    const { data: runningSyncs } = await supabase
      .from('sync_runs')
      .select('id')
      .eq('connector_id', connectorId)
      .eq('tenant_id', tenantId)
      .eq('status', 'running')
      .limit(1);

    if (runningSyncs && runningSyncs.length > 0) {
      return {
        acquired: false,
        error: 'Sync already in progress',
      };
    }

    return {
      acquired: true,
    };
  }
}

/**
 * Release sync lock
 */
export async function releaseSyncLock(
  lockId: string,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<void> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    await supabase.rpc('pg_advisory_unlock', {
      lock_id: parseInt(lockId, 10),
    });
  } catch (error) {
    // Lock will expire automatically
    console.warn('Failed to release lock:', error);
  }
}
