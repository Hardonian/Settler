"use strict";
/**
 * Connector Runtime
 *
 * Orchestrates connector execution, credential management, sync runs, and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectorRuntime = void 0;
const connector_driver_1 = require("./connector-driver");
const supabase_js_1 = require("@supabase/supabase-js");
const credential_encryption_1 = require("./credential-encryption");
const token_refresh_1 = require("./token-refresh");
const rate_limiting_1 = require("./rate-limiting");
const concurrency_protection_1 = require("./concurrency-protection");
const prometheus_1 = require("./metrics/prometheus");
const alert_manager_1 = require("./alerting/alert-manager");
const retry_queue_1 = require("./retry-queue/retry-queue");
const data_validator_1 = require("./validation/data-validator");
/**
 * Connector Runtime
 */
class ConnectorRuntime {
    config;
    supabase;
    alertManager;
    retryQueue;
    constructor(config) {
        this.config = config;
        this.supabase = (0, supabase_js_1.createClient)(config.supabaseUrl, config.supabaseServiceKey);
        this.alertManager = new alert_manager_1.AlertManager(config.supabaseUrl, config.supabaseServiceKey);
        this.retryQueue = new retry_queue_1.RetryQueue(config.supabaseUrl, config.supabaseServiceKey);
    }
    /**
     * Get connector credentials (decrypted)
     */
    async getCredentials(tenantId, connectorId) {
        const { data: connector, error: connectorError } = await this.supabase
            .from("connectors")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("provider_id", connectorId)
            .single();
        if (connectorError || !connector) {
            throw new connector_driver_1.ConnectorError(`Connector not found: ${connectorId}`, "CONNECTOR_NOT_FOUND", connectorId);
        }
        const { data: credentials, error: credError } = await this.supabase
            .from("connector_credentials")
            .select("encrypted_credentials, access_token_encrypted, refresh_token_encrypted")
            .eq("connector_id", connector.id)
            .single();
        if (credError || !credentials) {
            throw new connector_driver_1.ConnectorError(`Credentials not found for connector: ${connectorId}`, "CREDENTIALS_NOT_FOUND", connectorId);
        }
        // Decrypt credentials
        let decrypted = {};
        const creds = credentials;
        if (creds.encrypted_credentials) {
            try {
                decrypted = await (0, credential_encryption_1.decryptCredentials)(JSON.stringify(creds.encrypted_credentials), this.config.supabaseUrl, this.config.supabaseServiceKey);
            }
            catch (_error) {
                // Fallback: use as-is if decryption fails (backwards compatibility)
                decrypted = creds.encrypted_credentials;
            }
        }
        if (creds.access_token_encrypted) {
            try {
                decrypted.access_token = await (0, credential_encryption_1.decryptToken)(creds.access_token_encrypted, this.config.supabaseUrl, this.config.supabaseServiceKey);
            }
            catch (_error) {
                decrypted.access_token = creds.access_token_encrypted;
            }
        }
        if (creds.refresh_token_encrypted) {
            try {
                decrypted.refresh_token = await (0, credential_encryption_1.decryptToken)(creds.refresh_token_encrypted, this.config.supabaseUrl, this.config.supabaseServiceKey);
            }
            catch (_error) {
                decrypted.refresh_token = creds.refresh_token_encrypted;
            }
        }
        return decrypted;
    }
    /**
     * Create a sync run
     */
    async createSyncRun(tenantId, connectorId, options) {
        const { data: connector, error: connectorError } = await this.supabase
            .from("connectors")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("provider_id", connectorId)
            .single();
        if (connectorError || !connector) {
            throw new connector_driver_1.ConnectorError(`Connector not found: ${connectorId}`, "CONNECTOR_NOT_FOUND", connectorId);
        }
        const { data: syncRun, error: syncError } = await this.supabase
            .from("sync_runs")
            .insert({
            connector_id: connector.id,
            tenant_id: tenantId,
            status: "running",
            sync_since: options.since?.toISOString(),
            sync_until: options.until?.toISOString(),
            cursor: options.cursor,
        })
            .select("id")
            .single();
        if (syncError || !syncRun) {
            throw new connector_driver_1.ConnectorError(`Failed to create sync run: ${syncError?.message}`, "SYNC_RUN_CREATE_FAILED", connectorId);
        }
        return syncRun.id;
    }
    /**
     * Update sync run status
     */
    async updateSyncRun(syncRunId, updates) {
        const updateData = {};
        if (updates.status)
            updateData.status = updates.status;
        if (updates.finishedAt)
            updateData.finished_at = updates.finishedAt.toISOString();
        if (updates.accountsSynced !== undefined)
            updateData.accounts_synced = updates.accountsSynced;
        if (updates.transactionsSynced !== undefined)
            updateData.transactions_synced = updates.transactionsSynced;
        if (updates.balancesSynced !== undefined)
            updateData.balances_synced = updates.balancesSynced;
        if (updates.payoutsSynced !== undefined)
            updateData.payouts_synced = updates.payoutsSynced;
        if (updates.invoicesSynced !== undefined)
            updateData.invoices_synced = updates.invoicesSynced;
        if (updates.subscriptionsSynced !== undefined)
            updateData.subscriptions_synced = updates.subscriptionsSynced;
        if (updates.errorsCount !== undefined)
            updateData.errors_count = updates.errorsCount;
        if (updates.warningsCount !== undefined)
            updateData.warnings_count = updates.warningsCount;
        if (updates.errorMessage)
            updateData.error_message = updates.errorMessage;
        if (updates.errorDetails)
            updateData.error_details = updates.errorDetails;
        if (updates.cursor)
            updateData.cursor = updates.cursor;
        const { error } = await this.supabase
            .from("sync_runs")
            .update(updateData)
            .eq("id", syncRunId);
        if (error) {
            throw new connector_driver_1.ConnectorError(`Failed to update sync run: ${error.message}`, "SYNC_RUN_UPDATE_FAILED", "");
        }
    }
    /**
     * Save normalized data to database
     */
    async saveNormalizedData(tenantId, connectorId, syncRunId, data) {
        // Get connector record
        const { data: connector, error: connectorError } = await this.supabase
            .from("connectors")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("provider_id", connectorId)
            .single();
        if (connectorError || !connector) {
            throw new connector_driver_1.ConnectorError(`Connector not found: ${connectorId}`, "CONNECTOR_NOT_FOUND", connectorId);
        }
        // Save accounts
        if (data.accounts && data.accounts.length > 0) {
            const accountsToInsert = data.accounts.map((acc) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                provider_account_id: acc.providerAccountId,
                account_name: acc.accountName,
                account_type: acc.accountType,
                currency: acc.currency,
                institution_name: acc.institutionName,
                institution_id: acc.institutionId,
                metadata: acc.metadata || {},
            }));
            const { error: accountsError } = await this.supabase
                .from("connector_accounts")
                .upsert(accountsToInsert, {
                onConflict: "connector_id,provider_account_id",
                ignoreDuplicates: false,
            });
            if (accountsError) {
                console.error("Failed to save accounts:", accountsError);
                // Don't throw, continue with other data
            }
        }
        // Save transactions
        if (data.transactions && data.transactions.length > 0) {
            // First, get account IDs for transactions
            const accountMap = new Map();
            if (data.transactions.some((t) => t.accountId)) {
                const { data: accounts } = await this.supabase
                    .from("connector_accounts")
                    .select("id, provider_account_id")
                    .eq("connector_id", connector.id);
                if (accounts) {
                    accounts.forEach((acc) => {
                        accountMap.set(acc.provider_account_id, acc.id);
                    });
                }
            }
            const transactionsToInsert = data.transactions.map((tx) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                account_id: tx.accountId ? accountMap.get(tx.accountId) || null : null,
                external_id: tx.externalId,
                transaction_type: tx.transactionType,
                amount_cents: tx.amountCents,
                currency: tx.currency,
                occurred_at: tx.occurredAt.toISOString(),
                description: tx.description,
                reference_id: tx.referenceId,
                reference_type: tx.referenceType,
                provider_metadata: tx.providerMetadata || {},
                raw_payload: tx.rawPayload ? tx.rawPayload : null,
                idempotency_key: tx.idempotencyKey || `${tx.externalId}-${tx.occurredAt.toISOString()}`,
            }));
            const { error: transactionsError } = await this.supabase
                .from("financial_transactions")
                .upsert(transactionsToInsert, {
                onConflict: "tenant_id,connector_id,idempotency_key",
                ignoreDuplicates: false,
            });
            if (transactionsError) {
                console.error("Failed to save transactions:", transactionsError);
            }
        }
        // Save balances
        if (data.balances && data.balances.length > 0) {
            const accountMap = new Map();
            const { data: accounts } = await this.supabase
                .from("connector_accounts")
                .select("id, provider_account_id")
                .eq("connector_id", connector.id);
            if (accounts) {
                accounts.forEach((acc) => {
                    accountMap.set(acc.provider_account_id, acc.id);
                });
            }
            const balancesToInsert = data.balances.map((bal) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                account_id: accountMap.get(bal.accountId) || null,
                balance_cents: bal.balanceCents,
                available_balance_cents: bal.availableBalanceCents,
                currency: bal.currency,
                snapshot_at: bal.snapshotAt.toISOString(),
                provider_metadata: bal.providerMetadata || {},
                raw_payload: bal.rawPayload ? bal.rawPayload : null,
            }));
            const { error: balancesError } = await this.supabase
                .from("financial_balances")
                .upsert(balancesToInsert, {
                onConflict: "account_id,snapshot_at",
                ignoreDuplicates: false,
            });
            if (balancesError) {
                console.error("Failed to save balances:", balancesError);
            }
        }
        // Save payouts
        if (data.payouts && data.payouts.length > 0) {
            const payoutsToInsert = data.payouts.map((payout) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                account_id: null, // TODO: Map account ID if needed
                external_id: payout.externalId,
                amount_cents: payout.amountCents,
                currency: payout.currency,
                status: payout.status,
                initiated_at: payout.initiatedAt.toISOString(),
                completed_at: payout.completedAt?.toISOString(),
                fee_cents: payout.feeCents,
                net_amount_cents: payout.netAmountCents,
                destination_type: payout.destinationType,
                destination_id: payout.destinationId,
                description: payout.description,
                provider_metadata: payout.providerMetadata || {},
                raw_payload: payout.rawPayload ? payout.rawPayload : null,
                idempotency_key: payout.idempotencyKey,
            }));
            const { error: payoutsError } = await this.supabase
                .from("financial_payouts")
                .upsert(payoutsToInsert, {
                onConflict: "tenant_id,connector_id,idempotency_key",
                ignoreDuplicates: false,
            });
            if (payoutsError) {
                console.error("Failed to save payouts:", payoutsError);
            }
        }
        // Save invoices
        if (data.invoices && data.invoices.length > 0) {
            const invoicesToInsert = data.invoices.map((inv) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                external_id: inv.externalId,
                invoice_number: inv.invoiceNumber,
                customer_id: inv.customerId,
                customer_name: inv.customerName,
                amount_cents: inv.amountCents,
                currency: inv.currency,
                status: inv.status,
                issue_date: inv.issueDate?.toISOString().split("T")[0],
                due_date: inv.dueDate?.toISOString().split("T")[0],
                paid_at: inv.paidAt?.toISOString(),
                line_items: inv.lineItems || [],
                provider_metadata: inv.providerMetadata || {},
                raw_payload: inv.rawPayload ? inv.rawPayload : null,
                idempotency_key: inv.idempotencyKey,
            }));
            const { error: invoicesError } = await this.supabase
                .from("financial_invoices")
                .upsert(invoicesToInsert, {
                onConflict: "tenant_id,connector_id,idempotency_key",
                ignoreDuplicates: false,
            });
            if (invoicesError) {
                console.error("Failed to save invoices:", invoicesError);
            }
        }
        // Save subscriptions
        if (data.subscriptions && data.subscriptions.length > 0) {
            const subscriptionsToInsert = data.subscriptions.map((sub) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                external_id: sub.externalId,
                customer_id: sub.customerId,
                customer_name: sub.customerName,
                plan_id: sub.planId,
                plan_name: sub.planName,
                status: sub.status,
                billing_cycle: sub.billingCycle,
                amount_cents: sub.amountCents,
                currency: sub.currency,
                current_period_start: sub.currentPeriodStart?.toISOString(),
                current_period_end: sub.currentPeriodEnd?.toISOString(),
                cancel_at_period_end: sub.cancelAtPeriodEnd,
                cancelled_at: sub.cancelledAt?.toISOString(),
                provider_metadata: sub.providerMetadata || {},
                raw_payload: sub.rawPayload ? sub.rawPayload : null,
                idempotency_key: sub.idempotencyKey,
            }));
            const { error: subscriptionsError } = await this.supabase
                .from("financial_subscriptions")
                .upsert(subscriptionsToInsert, {
                onConflict: "tenant_id,connector_id,idempotency_key",
                ignoreDuplicates: false,
            });
            if (subscriptionsError) {
                console.error("Failed to save subscriptions:", subscriptionsError);
            }
        }
        // Save tax estimates
        if (data.taxEstimates && data.taxEstimates.length > 0) {
            const taxEstimatesToInsert = data.taxEstimates.map((tax) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                external_id: tax.externalId,
                transaction_id: tax.transactionId,
                transaction_type: tax.transactionType,
                amount_cents: tax.amountCents,
                currency: tax.currency,
                tax_amount_cents: tax.taxAmountCents,
                tax_rate: tax.taxRate,
                jurisdiction: tax.jurisdiction,
                tax_type: tax.taxType,
                occurred_at: tax.occurredAt.toISOString(),
                provider_metadata: tax.providerMetadata || {},
                raw_payload: tax.rawPayload ? tax.rawPayload : null,
                idempotency_key: tax.idempotencyKey,
            }));
            const { error: taxError } = await this.supabase
                .from("financial_tax_estimates")
                .upsert(taxEstimatesToInsert, {
                onConflict: "tenant_id,connector_id,idempotency_key",
                ignoreDuplicates: false,
            });
            if (taxError) {
                console.error("Failed to save tax estimates:", taxError);
            }
        }
        // Save raw payloads for audit
        if (data.rawPayloads && data.rawPayloads.length > 0) {
            const rawEventsToInsert = data.rawPayloads.map((raw, idx) => ({
                connector_id: connector.id,
                tenant_id: tenantId,
                event_type: "sync",
                event_id: `${syncRunId}-${idx}`,
                payload: raw.payload,
                processed: true,
                processed_at: new Date().toISOString(),
            }));
            const { error: rawError } = await this.supabase
                .from("raw_events")
                .upsert(rawEventsToInsert, {
                onConflict: "connector_id,event_id",
                ignoreDuplicates: false,
            });
            if (rawError) {
                console.error("Failed to save raw events:", rawError);
            }
        }
    }
    /**
     * Save normalized data in batches (for large datasets)
     */
    async saveNormalizedDataBatched(tenantId, connectorId, syncRunId, data) {
        const batchSize = 500;
        // Process transactions in batches
        if (data.transactions && data.transactions.length > 0) {
            const batches = [];
            for (let i = 0; i < data.transactions.length; i += batchSize) {
                batches.push(data.transactions.slice(i, i + batchSize));
            }
            for (const batch of batches) {
                await this.saveNormalizedData(tenantId, connectorId, syncRunId, {
                    ...data,
                    transactions: batch,
                });
            }
        }
        // Process other data types similarly - exclude transactions from remaining data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { transactions: _, ...remainingData } = data;
        if ((data.accounts?.length || 0) +
            (data.balances?.length || 0) +
            (data.payouts?.length || 0) +
            (data.invoices?.length || 0) +
            (data.subscriptions?.length || 0) +
            (data.taxEstimates?.length || 0) >
            0) {
            await this.saveNormalizedData(tenantId, connectorId, syncRunId, remainingData);
        }
    }
    /**
     * Update sync cursor
     */
    async updateSyncCursor(tenantId, connectorId, cursorKey, cursorValue, accountId) {
        const { data: connector, error: connectorError } = await this.supabase
            .from("connectors")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("provider_id", connectorId)
            .single();
        if (connectorError || !connector) {
            throw new connector_driver_1.ConnectorError(`Connector not found: ${connectorId}`, "CONNECTOR_NOT_FOUND", connectorId);
        }
        const { error } = await this.supabase.from("sync_cursors").upsert({
            connector_id: connector.id,
            tenant_id: tenantId,
            account_id: accountId || null,
            cursor_key: cursorKey,
            cursor_value: cursorValue,
            last_synced_at: new Date().toISOString(),
        }, {
            onConflict: "connector_id,COALESCE(account_id, '00000000-0000-0000-0000-000000000000'::uuid),cursor_key",
            ignoreDuplicates: false,
        });
        if (error) {
            console.error("Failed to update sync cursor:", error);
            // Don't throw, cursor updates are best-effort
        }
    }
    /**
     * Get sync cursor
     */
    async getSyncCursor(tenantId, connectorId, cursorKey, accountId) {
        const { data: connector, error: connectorError } = await this.supabase
            .from("connectors")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("provider_id", connectorId)
            .single();
        if (connectorError || !connector) {
            return null;
        }
        let query = this.supabase
            .from("sync_cursors")
            .select("cursor_value")
            .eq("connector_id", connector.id)
            .eq("cursor_key", cursorKey);
        if (accountId) {
            query = query.eq("account_id", accountId);
        }
        else {
            query = query.is("account_id", null);
        }
        const { data: cursor } = await query.single();
        return cursor?.cursor_value || null;
    }
    /**
     * Execute sync with driver
     */
    async executeSync(driver, tenantId, connectorId, options) {
        // Check rate limits
        const rateLimitCheck = await (0, rate_limiting_1.checkRateLimit)(connectorId, tenantId, this.config.supabaseUrl, this.config.supabaseServiceKey);
        if (!rateLimitCheck.allowed) {
            throw new connector_driver_1.ConnectorError(`Rate limit exceeded. Retry after ${rateLimitCheck.retryAfter} seconds`, "RATE_LIMIT_EXCEEDED", connectorId);
        }
        // Acquire concurrency lock
        const lock = await (0, concurrency_protection_1.acquireSyncLock)(tenantId, connectorId, this.config.supabaseUrl, this.config.supabaseServiceKey);
        if (!lock.acquired) {
            throw new connector_driver_1.ConnectorError(lock.error || "Sync already in progress", "SYNC_IN_PROGRESS", connectorId);
        }
        const startTime = Date.now();
        try {
            // Track sync start
            (0, prometheus_1.trackSyncStart)(connectorId, tenantId);
            // Get credentials
            const credentials = await this.getCredentials(tenantId, connectorId);
            // Refresh token if needed
            await (0, token_refresh_1.refreshTokenIfNeeded)(driver, connectorId, tenantId, credentials, this.config.supabaseUrl, this.config.supabaseServiceKey);
            // Record API call
            await (0, rate_limiting_1.recordApiCall)(connectorId, tenantId, this.config.supabaseUrl, this.config.supabaseServiceKey);
            // Get last cursor if exists
            const lastCursor = await this.getSyncCursor(tenantId, connectorId, "default", options.accountId);
            const cursorValue = options.cursor || lastCursor;
            const syncOptions = {
                ...options,
                ...(cursorValue ? { cursor: cursorValue } : {}),
            };
            // Create sync run
            const syncRunId = await this.createSyncRun(tenantId, connectorId, syncOptions);
            try {
                // Execute sync
                const result = await driver.sync(credentials, syncOptions);
                // Validate data before saving
                const validation = data_validator_1.validator.validateAll({
                    transactions: result.transactions,
                    accounts: result.accounts,
                    balances: result.balances,
                    payouts: result.payouts,
                    invoices: result.invoices,
                    subscriptions: result.subscriptions,
                    taxEstimates: result.taxEstimates,
                });
                if (!validation.valid && validation.errors.length > 0) {
                    console.warn(`Validation errors for ${connectorId}:`, validation.errors);
                    // Continue but log errors
                }
                // Process in batches for performance
                // Map NormalizedTransaction[] to the expected format with idempotencyKey
                const transactionsWithIdempotency = result.transactions?.map((tx) => ({
                    ...tx,
                    idempotencyKey: tx.idempotencyKey || `${tx.externalId}-${tx.occurredAt.toISOString()}`,
                }));
                // Map balances to ensure accountId is present (required by saveNormalizedData)
                const balancesWithAccountId = result.balances?.map((bal) => ({
                    accountId: bal.accountId || "",
                    balanceCents: bal.balanceCents,
                    availableBalanceCents: bal.availableBalanceCents,
                    currency: bal.currency,
                    snapshotAt: bal.snapshotAt,
                    providerMetadata: bal.providerMetadata,
                    rawPayload: bal.rawPayload,
                }));
                // Map payouts to ensure idempotencyKey is present
                const payoutsWithIdempotency = result.payouts?.map((payout) => ({
                    ...payout,
                    idempotencyKey: payout.idempotencyKey || `${payout.externalId}-${payout.initiatedAt.toISOString()}`,
                }));
                // Map invoices to ensure idempotencyKey is present
                const invoicesWithIdempotency = result.invoices?.map((invoice) => ({
                    ...invoice,
                    idempotencyKey: invoice.idempotencyKey ||
                        `${invoice.externalId}-${invoice.issueDate?.toISOString() || Date.now()}`,
                }));
                // Map subscriptions to ensure idempotencyKey is present
                const subscriptionsWithIdempotency = result.subscriptions?.map((sub) => ({
                    ...sub,
                    idempotencyKey: sub.idempotencyKey ||
                        `${sub.externalId}-${sub.currentPeriodStart?.toISOString() || Date.now()}`,
                }));
                // Map taxEstimates to ensure idempotencyKey is present
                const taxEstimatesWithIdempotency = result.taxEstimates?.map((tax) => ({
                    ...tax,
                    idempotencyKey: tax.idempotencyKey || `${tax.externalId}-${tax.occurredAt.toISOString()}`,
                }));
                const dataToSave = {
                    ...(result.accounts ? { accounts: result.accounts } : {}),
                    ...(transactionsWithIdempotency ? { transactions: transactionsWithIdempotency } : {}),
                    ...(balancesWithAccountId ? { balances: balancesWithAccountId } : {}),
                    ...(payoutsWithIdempotency ? { payouts: payoutsWithIdempotency } : {}),
                    ...(invoicesWithIdempotency ? { invoices: invoicesWithIdempotency } : {}),
                    ...(subscriptionsWithIdempotency ? { subscriptions: subscriptionsWithIdempotency } : {}),
                    ...(taxEstimatesWithIdempotency ? { taxEstimates: taxEstimatesWithIdempotency } : {}),
                    ...(result.rawPayloads ? { rawPayloads: result.rawPayloads } : {}),
                };
                // Save in batches if large dataset
                const totalItems = (result.transactions?.length || 0) +
                    (result.accounts?.length || 0) +
                    (result.balances?.length || 0) +
                    (result.payouts?.length || 0) +
                    (result.invoices?.length || 0) +
                    (result.subscriptions?.length || 0) +
                    (result.taxEstimates?.length || 0);
                if (totalItems > 1000) {
                    // Use batch processing for large datasets
                    await this.saveNormalizedDataBatched(tenantId, connectorId, syncRunId, dataToSave);
                }
                else {
                    // Use regular save for small datasets
                    await this.saveNormalizedData(tenantId, connectorId, syncRunId, dataToSave);
                }
                // Update cursor if provided
                if (result.nextCursor) {
                    await this.updateSyncCursor(tenantId, connectorId, "default", result.nextCursor, options.accountId);
                }
                // Update sync run as completed
                await this.updateSyncRun(syncRunId, {
                    status: "completed",
                    finishedAt: new Date(),
                    accountsSynced: result.counts.accounts || 0,
                    transactionsSynced: result.counts.transactions || 0,
                    balancesSynced: result.counts.balances || 0,
                    payoutsSynced: result.counts.payouts || 0,
                    invoicesSynced: result.counts.invoices || 0,
                    subscriptionsSynced: result.counts.subscriptions || 0,
                    errorsCount: result.errors?.length || 0,
                    warningsCount: result.warnings?.length || 0,
                    ...(result.nextCursor ? { cursor: result.nextCursor } : {}),
                });
                // Update connector last sync
                const { data: connector } = await this.supabase
                    .from("connectors")
                    .select("id")
                    .eq("tenant_id", tenantId)
                    .eq("provider_id", connectorId)
                    .single();
                if (connector) {
                    await this.supabase
                        .from("connectors")
                        .update({
                        last_sync_at: new Date().toISOString(),
                        last_successful_sync_at: new Date().toISOString(),
                        error_count: 0,
                        consecutive_failures: 0,
                        status: "connected",
                    })
                        .eq("id", connector.id);
                }
                // Track metrics
                const duration = Date.now() - startTime;
                (0, prometheus_1.trackSyncComplete)(connectorId, tenantId, duration, {
                    transactions: result.counts.transactions,
                    accounts: result.counts.accounts,
                    errors: result.errors?.length || 0,
                });
                return result;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                const errorType = error instanceof connector_driver_1.ConnectorError ? error.code : "UNKNOWN_ERROR";
                const errorMessage = error instanceof Error ? error.message : String(error);
                // Update sync run as failed
                await this.updateSyncRun(syncRunId, {
                    status: "failed",
                    finishedAt: new Date(),
                    errorMessage,
                    errorDetails: {
                        stack: error instanceof Error ? error.stack : undefined,
                        type: errorType,
                    },
                });
                // Update connector error state
                const { data: connector } = await this.supabase
                    .from("connectors")
                    .select("id, consecutive_failures")
                    .eq("tenant_id", tenantId)
                    .eq("provider_id", connectorId)
                    .single();
                if (connector) {
                    const conn = connector;
                    const newFailureCount = (conn.consecutive_failures || 0) + 1;
                    await this.supabase
                        .from("connectors")
                        .update({
                        last_sync_at: new Date().toISOString(),
                        last_error: errorMessage,
                        error_count: newFailureCount,
                        consecutive_failures: newFailureCount,
                        status: newFailureCount >= 5 ? "error" : "needs_attention",
                        auto_disabled: newFailureCount >= 10,
                    })
                        .eq("id", conn.id);
                    // Track metrics
                    (0, prometheus_1.trackSyncFailure)(connectorId, tenantId, duration, errorType);
                    // Check alerts
                    await this.alertManager.checkSyncFailure(connectorId, tenantId, newFailureCount, errorType, errorMessage);
                    // Add to retry queue if not max attempts
                    if (newFailureCount < 10) {
                        await this.retryQueue.enqueue(connectorId, tenantId, syncRunId, errorMessage, errorType);
                    }
                }
                throw error;
            }
        }
        finally {
            // Release lock
            if (lock.lockId) {
                await (0, concurrency_protection_1.releaseSyncLock)(lock.lockId, this.config.supabaseUrl, this.config.supabaseServiceKey);
            }
        }
    }
}
exports.ConnectorRuntime = ConnectorRuntime;
//# sourceMappingURL=connector-runtime.js.map