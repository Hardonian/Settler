/**
 * Data Retention Enforcement Service
 * 
 * Automatically enforces data retention policies per tier.
 * Deletes data older than retention period for each billing tier.
 */

import { supabase } from '../../infrastructure/supabase/client';
import { logInfo, logError } from '../../utils/logger';

interface RetentionPolicy {
  tier: string;
  reconciliation_data_days: number;
  receipt_data_days: number;
  usage_data_days: number;
  audit_log_days: number;
}

// Retention policies per tier (in days)
const RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  free: {
    tier: 'free',
    reconciliation_data_days: 7,
    receipt_data_days: 7,
    usage_data_days: 7,
    audit_log_days: 7,
  },
  starter: {
    tier: 'starter',
    reconciliation_data_days: 30,
    receipt_data_days: 30,
    usage_data_days: 90,
    audit_log_days: 90,
  },
  growth: {
    tier: 'growth',
    reconciliation_data_days: 90,
    receipt_data_days: 90,
    usage_data_days: 365,
    audit_log_days: 365,
  },
  scale: {
    tier: 'scale',
    reconciliation_data_days: 365,
    receipt_data_days: 365,
    usage_data_days: 730,
    audit_log_days: 730,
  },
  enterprise: {
    tier: 'enterprise',
    reconciliation_data_days: 2555, // 7 years
    receipt_data_days: 2555,
    usage_data_days: 2555,
    audit_log_days: 2555,
  },
};

/**
 * Get retention policy for tier
 */
export function getRetentionPolicy(tierId: string): RetentionPolicy {
  // Map legacy plan names
  const tierMap: Record<string, string> = {
    base: 'starter',
    pro: 'growth',
  };
  
  const mappedTier = tierMap[tierId] || tierId;
  const policy = RETENTION_POLICIES[mappedTier];
  if (policy) {
    return policy;
  }
  return RETENTION_POLICIES.free;
}

/**
 * Enforce retention policy for a billing account
 */
export async function enforceRetentionPolicy(
  billingAccountId: string,
  tierId: string
): Promise<{ deleted: number; errors: number }> {
  const policy = getRetentionPolicy(tierId);
  const cutoffDate = new Date();
  let totalDeleted = 0;
  let totalErrors = 0;

  try {
    // Delete old reconciliation data
    const reconciliationCutoff = new Date(cutoffDate);
    reconciliationCutoff.setDate(reconciliationCutoff.getDate() - policy.reconciliation_data_days);
    
    // First get count of records to delete
    const { count: reconCount } = await supabase
      .from('reconciliation_runs')
      .select('id', { count: 'exact', head: true })
      .eq('billing_account_id', billingAccountId)
      .lt('created_at', reconciliationCutoff.toISOString());
    
    const { error: reconError } = await supabase
      .from('reconciliation_runs')
      .delete()
      .eq('billing_account_id', billingAccountId)
      .lt('created_at', reconciliationCutoff.toISOString());

    if (reconError) {
      logError('Error deleting old reconciliation data', reconError);
      totalErrors++;
    } else {
      totalDeleted += reconCount || 0;
      logInfo('Deleted old reconciliation data', {
        billingAccountId,
        count: reconCount,
        cutoffDate: reconciliationCutoff.toISOString(),
      });
    }

    // Delete old receipt data
    const receiptCutoff = new Date(cutoffDate);
    receiptCutoff.setDate(receiptCutoff.getDate() - policy.receipt_data_days);
    
    // First get count of records to delete
    const { count: receiptCount } = await supabase
      .from('receipts')
      .select('id', { count: 'exact', head: true })
      .eq('billing_account_id', billingAccountId)
      .lt('created_at', receiptCutoff.toISOString());
    
    const { error: receiptError } = await supabase
      .from('receipts')
      .delete()
      .eq('billing_account_id', billingAccountId)
      .lt('created_at', receiptCutoff.toISOString());

    if (receiptError) {
      logError('Error deleting old receipt data', receiptError);
      totalErrors++;
    } else {
      totalDeleted += receiptCount || 0;
      logInfo('Deleted old receipt data', {
        billingAccountId,
        count: receiptCount,
        cutoffDate: receiptCutoff.toISOString(),
      });
    }

    // Delete old usage data (keep aggregated data)
    const usageCutoff = new Date(cutoffDate);
    usageCutoff.setDate(usageCutoff.getDate() - policy.usage_data_days);
    
    // First get count of records to delete
    const { count: usageCount } = await supabase
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('billing_account_id', billingAccountId)
      .lt('created_at', usageCutoff.toISOString());
    
    const { error: usageError } = await supabase
      .from('usage_events')
      .delete()
      .eq('billing_account_id', billingAccountId)
      .lt('created_at', usageCutoff.toISOString());

    if (usageError) {
      logError('Error deleting old usage data', usageError);
      totalErrors++;
    } else {
      totalDeleted += usageCount || 0;
      logInfo('Deleted old usage data', {
        billingAccountId,
        count: usageCount,
        cutoffDate: usageCutoff.toISOString(),
      });
    }

    return { deleted: totalDeleted, errors: totalErrors };
  } catch (error) {
    logError('Error enforcing retention policy', error);
    return { deleted: totalDeleted, errors: totalErrors + 1 };
  }
}

/**
 * Enforce retention for all billing accounts
 * Should be run as a scheduled job (daily)
 */
export async function enforceAllRetentionPolicies(): Promise<{
  accountsProcessed: number;
  totalDeleted: number;
  totalErrors: number;
}> {
  let accountsProcessed = 0;
  let totalDeleted = 0;
  let totalErrors = 0;

  try {
    // Get all active billing accounts
    const { data: accounts, error } = await supabase
      .from('billing_accounts')
      .select('id, plan_id')
      .eq('status', 'active')
      .is('deleted_at', null);

    if (error) {
      logError('Error fetching billing accounts', error);
      return { accountsProcessed: 0, totalDeleted: 0, totalErrors: 1 };
    }

    // Process each account
    for (const account of accounts || []) {
      try {
        const result = await enforceRetentionPolicy(account.id, account.plan_id || 'free');
        totalDeleted += result.deleted;
        totalErrors += result.errors;
        accountsProcessed++;
      } catch (error) {
        logError('Error processing account retention', error);
        totalErrors++;
      }
    }

    logInfo('Completed retention policy enforcement', {
      accountsProcessed,
      totalDeleted,
      totalErrors,
    });

    return { accountsProcessed, totalDeleted, totalErrors };
  } catch (error) {
    logError('Error enforcing all retention policies', error);
    return { accountsProcessed, totalDeleted, totalErrors: totalErrors + 1 };
  }
}
