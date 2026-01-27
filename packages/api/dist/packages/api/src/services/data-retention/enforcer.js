"use strict";
/**
 * Data Retention Enforcement Service
 *
 * Automatically enforces data retention policies per tier.
 * Deletes data older than retention period for each billing tier.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRetentionPolicy = getRetentionPolicy;
exports.enforceRetentionPolicy = enforceRetentionPolicy;
exports.enforceAllRetentionPolicies = enforceAllRetentionPolicies;
const client_1 = require("../../infrastructure/supabase/client");
const logger_1 = require("../../utils/logger");
// Retention policies per tier (in days)
const RETENTION_POLICIES = {
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
function getRetentionPolicy(tierId) {
    // Map legacy plan names
    const tierMap = {
        base: 'starter',
        pro: 'growth',
    };
    const mappedTier = tierMap[tierId] || tierId;
    const policy = RETENTION_POLICIES[mappedTier];
    // Return policy if found, otherwise return free policy (guaranteed to exist)
    return policy ?? RETENTION_POLICIES['free'];
}
/**
 * Enforce retention policy for a billing account
 */
async function enforceRetentionPolicy(billingAccountId, tierId) {
    const policy = getRetentionPolicy(tierId);
    const cutoffDate = new Date();
    let totalDeleted = 0;
    let totalErrors = 0;
    try {
        // Delete old reconciliation data
        const reconciliationCutoff = new Date(cutoffDate);
        reconciliationCutoff.setDate(reconciliationCutoff.getDate() - policy.reconciliation_data_days);
        // First get count of records to delete
        const { count: reconCount } = await client_1.supabase
            .from('reconciliation_runs')
            .select('id', { count: 'exact', head: true })
            .eq('billing_account_id', billingAccountId)
            .lt('created_at', reconciliationCutoff.toISOString());
        const { error: reconError } = await client_1.supabase
            .from('reconciliation_runs')
            .delete()
            .eq('billing_account_id', billingAccountId)
            .lt('created_at', reconciliationCutoff.toISOString());
        if (reconError) {
            (0, logger_1.logError)('Error deleting old reconciliation data', reconError);
            totalErrors++;
        }
        else {
            totalDeleted += reconCount || 0;
            (0, logger_1.logInfo)('Deleted old reconciliation data', {
                billingAccountId,
                count: reconCount,
                cutoffDate: reconciliationCutoff.toISOString(),
            });
        }
        // Delete old receipt data
        const receiptCutoff = new Date(cutoffDate);
        receiptCutoff.setDate(receiptCutoff.getDate() - policy.receipt_data_days);
        // First get count of records to delete
        const { count: receiptCount } = await client_1.supabase
            .from('receipts')
            .select('id', { count: 'exact', head: true })
            .eq('billing_account_id', billingAccountId)
            .lt('created_at', receiptCutoff.toISOString());
        const { error: receiptError } = await client_1.supabase
            .from('receipts')
            .delete()
            .eq('billing_account_id', billingAccountId)
            .lt('created_at', receiptCutoff.toISOString());
        if (receiptError) {
            (0, logger_1.logError)('Error deleting old receipt data', receiptError);
            totalErrors++;
        }
        else {
            totalDeleted += receiptCount || 0;
            (0, logger_1.logInfo)('Deleted old receipt data', {
                billingAccountId,
                count: receiptCount,
                cutoffDate: receiptCutoff.toISOString(),
            });
        }
        // Delete old usage data (keep aggregated data)
        const usageCutoff = new Date(cutoffDate);
        usageCutoff.setDate(usageCutoff.getDate() - policy.usage_data_days);
        // First get count of records to delete
        const { count: usageCount } = await client_1.supabase
            .from('usage_events')
            .select('id', { count: 'exact', head: true })
            .eq('billing_account_id', billingAccountId)
            .lt('created_at', usageCutoff.toISOString());
        const { error: usageError } = await client_1.supabase
            .from('usage_events')
            .delete()
            .eq('billing_account_id', billingAccountId)
            .lt('created_at', usageCutoff.toISOString());
        if (usageError) {
            (0, logger_1.logError)('Error deleting old usage data', usageError);
            totalErrors++;
        }
        else {
            totalDeleted += usageCount || 0;
            (0, logger_1.logInfo)('Deleted old usage data', {
                billingAccountId,
                count: usageCount,
                cutoffDate: usageCutoff.toISOString(),
            });
        }
        return { deleted: totalDeleted, errors: totalErrors };
    }
    catch (error) {
        (0, logger_1.logError)('Error enforcing retention policy', error);
        return { deleted: totalDeleted, errors: totalErrors + 1 };
    }
}
/**
 * Enforce retention for all billing accounts
 * Should be run as a scheduled job (daily)
 */
async function enforceAllRetentionPolicies() {
    let accountsProcessed = 0;
    let totalDeleted = 0;
    let totalErrors = 0;
    try {
        // Get all active billing accounts
        const { data: accounts, error } = await client_1.supabase
            .from('billing_accounts')
            .select('id, plan_id')
            .eq('status', 'active')
            .is('deleted_at', null);
        if (error) {
            (0, logger_1.logError)('Error fetching billing accounts', error);
            return { accountsProcessed: 0, totalDeleted: 0, totalErrors: 1 };
        }
        // Process each account
        for (const account of accounts || []) {
            try {
                const result = await enforceRetentionPolicy(account.id, account.plan_id || 'free');
                totalDeleted += result.deleted;
                totalErrors += result.errors;
                accountsProcessed++;
            }
            catch (error) {
                (0, logger_1.logError)('Error processing account retention', error);
                totalErrors++;
            }
        }
        (0, logger_1.logInfo)('Completed retention policy enforcement', {
            accountsProcessed,
            totalDeleted,
            totalErrors,
        });
        return { accountsProcessed, totalDeleted, totalErrors };
    }
    catch (error) {
        (0, logger_1.logError)('Error enforcing all retention policies', error);
        return { accountsProcessed, totalDeleted, totalErrors: totalErrors + 1 };
    }
}
//# sourceMappingURL=enforcer.js.map