/**
 * Connector Runtime
 * 
 * Orchestrates connector execution, credential management, sync runs, and error handling.
 */

import { ConnectorDriver, ConnectorError, SyncOptions, SyncResult } from './connector-driver';
import { createClient } from '@supabase/supabase-js';

export interface RuntimeConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  encryptionKey?: string; // For credential encryption
}

export interface SyncRunContext {
  tenantId: string;
  connectorId: string;
  syncRunId: string;
  userId?: string;
}

/**
 * Connector Runtime
 */
export class ConnectorRuntime {
  private supabase: ReturnType<typeof createClient>;

  constructor(private config: RuntimeConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
  }

  /**
   * Get connector credentials (decrypted)
   */
  async getCredentials(
    tenantId: string,
    connectorId: string
  ): Promise<Record<string, unknown>> {
    const { data: connector, error: connectorError } = await this.supabase
      .from('connectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', connectorId)
      .single();

    if (connectorError || !connector) {
      throw new ConnectorError(
        `Connector not found: ${connectorId}`,
        'CONNECTOR_NOT_FOUND',
        connectorId
      );
    }

    const { data: credentials, error: credError } = await this.supabase
      .from('connector_credentials')
      .select('encrypted_credentials, access_token_encrypted, refresh_token_encrypted')
      .eq('connector_id', connector.id)
      .single();

    if (credError || !credentials) {
      throw new ConnectorError(
        `Credentials not found for connector: ${connectorId}`,
        'CREDENTIALS_NOT_FOUND',
        connectorId
      );
    }

    // TODO: Decrypt credentials using encryptionKey
    // For now, return as-is (should be encrypted at application level)
    const decrypted: Record<string, unknown> = {
      ...(credentials.encrypted_credentials as Record<string, unknown>),
    };

    if (credentials.access_token_encrypted) {
      decrypted.access_token = credentials.access_token_encrypted; // Should decrypt
    }
    if (credentials.refresh_token_encrypted) {
      decrypted.refresh_token = credentials.refresh_token_encrypted; // Should decrypt
    }

    return decrypted;
  }

  /**
   * Create a sync run
   */
  async createSyncRun(
    tenantId: string,
    connectorId: string,
    options: SyncOptions
  ): Promise<string> {
    const { data: connector, error: connectorError } = await this.supabase
      .from('connectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', connectorId)
      .single();

    if (connectorError || !connector) {
      throw new ConnectorError(
        `Connector not found: ${connectorId}`,
        'CONNECTOR_NOT_FOUND',
        connectorId
      );
    }

    const { data: syncRun, error: syncError } = await this.supabase
      .from('sync_runs')
      .insert({
        connector_id: connector.id,
        tenant_id: tenantId,
        status: 'running',
        sync_since: options.since?.toISOString(),
        sync_until: options.until?.toISOString(),
        cursor: options.cursor,
      })
      .select('id')
      .single();

    if (syncError || !syncRun) {
      throw new ConnectorError(
        `Failed to create sync run: ${syncError?.message}`,
        'SYNC_RUN_CREATE_FAILED',
        connectorId
      );
    }

    return syncRun.id;
  }

  /**
   * Update sync run status
   */
  async updateSyncRun(
    syncRunId: string,
    updates: {
      status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
      finishedAt?: Date;
      accountsSynced?: number;
      transactionsSynced?: number;
      balancesSynced?: number;
      payoutsSynced?: number;
      invoicesSynced?: number;
      subscriptionsSynced?: number;
      errorsCount?: number;
      warningsCount?: number;
      errorMessage?: string;
      errorDetails?: Record<string, unknown>;
      cursor?: string;
    }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.finishedAt) updateData.finished_at = updates.finishedAt.toISOString();
    if (updates.accountsSynced !== undefined) updateData.accounts_synced = updates.accountsSynced;
    if (updates.transactionsSynced !== undefined) updateData.transactions_synced = updates.transactionsSynced;
    if (updates.balancesSynced !== undefined) updateData.balances_synced = updates.balancesSynced;
    if (updates.payoutsSynced !== undefined) updateData.payouts_synced = updates.payoutsSynced;
    if (updates.invoicesSynced !== undefined) updateData.invoices_synced = updates.invoicesSynced;
    if (updates.subscriptionsSynced !== undefined) updateData.subscriptions_synced = updates.subscriptionsSynced;
    if (updates.errorsCount !== undefined) updateData.errors_count = updates.errorsCount;
    if (updates.warningsCount !== undefined) updateData.warnings_count = updates.warningsCount;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;
    if (updates.errorDetails) updateData.error_details = updates.errorDetails;
    if (updates.cursor) updateData.cursor = updates.cursor;

    const { error } = await this.supabase
      .from('sync_runs')
      .update(updateData)
      .eq('id', syncRunId);

    if (error) {
      throw new ConnectorError(
        `Failed to update sync run: ${error.message}`,
        'SYNC_RUN_UPDATE_FAILED',
        ''
      );
    }
  }

  /**
   * Save normalized data to database
   */
  async saveNormalizedData(
    tenantId: string,
    connectorId: string,
    syncRunId: string,
    data: {
      accounts?: Array<{
        providerAccountId: string;
        accountName: string;
        accountType?: string;
        currency: string;
        institutionName?: string;
        institutionId?: string;
        metadata?: Record<string, unknown>;
      }>;
      transactions?: Array<{
        externalId: string;
        accountId?: string;
        transactionType: string;
        amountCents: number;
        currency: string;
        occurredAt: Date;
        description?: string;
        referenceId?: string;
        referenceType?: string;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
      }>;
      balances?: Array<{
        accountId: string;
        balanceCents: number;
        availableBalanceCents?: number;
        currency: string;
        snapshotAt: Date;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
      }>;
      payouts?: Array<{
        externalId: string;
        accountId?: string;
        amountCents: number;
        currency: string;
        status: string;
        initiatedAt: Date;
        completedAt?: Date;
        feeCents?: number;
        netAmountCents?: number;
        destinationType?: string;
        destinationId?: string;
        description?: string;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
      }>;
      invoices?: Array<{
        externalId: string;
        invoiceNumber?: string;
        customerId?: string;
        customerName?: string;
        amountCents: number;
        currency: string;
        status: string;
        issueDate?: Date;
        dueDate?: Date;
        paidAt?: Date;
        lineItems?: Array<{
          description: string;
          quantity: number;
          unitPriceCents: number;
          totalCents: number;
        }>;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
      }>;
      subscriptions?: Array<{
        externalId: string;
        customerId: string;
        customerName?: string;
        planId?: string;
        planName?: string;
        status: string;
        billingCycle?: string;
        amountCents: number;
        currency: string;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
        cancelAtPeriodEnd?: boolean;
        cancelledAt?: Date;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
      }>;
      taxEstimates?: Array<{
        externalId: string;
        transactionId?: string;
        transactionType?: string;
        amountCents: number;
        currency: string;
        taxAmountCents: number;
        taxRate?: number;
        jurisdiction?: string;
        taxType?: string;
        occurredAt: Date;
        providerMetadata?: Record<string, unknown>;
        rawPayload?: unknown;
        idempotencyKey: string;
      }>;
      rawPayloads?: Array<{ type: string; payload: unknown }>;
    }
  ): Promise<void> {
    // Get connector record
    const { data: connector, error: connectorError } = await this.supabase
      .from('connectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', connectorId)
      .single();

    if (connectorError || !connector) {
      throw new ConnectorError(
        `Connector not found: ${connectorId}`,
        'CONNECTOR_NOT_FOUND',
        connectorId
      );
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
        .from('connector_accounts')
        .upsert(accountsToInsert, {
          onConflict: 'connector_id,provider_account_id',
          ignoreDuplicates: false,
        });

      if (accountsError) {
        console.error('Failed to save accounts:', accountsError);
        // Don't throw, continue with other data
      }
    }

    // Save transactions
    if (data.transactions && data.transactions.length > 0) {
      // First, get account IDs for transactions
      const accountMap = new Map<string, string>();
      if (data.transactions.some((t) => t.accountId)) {
        const { data: accounts } = await this.supabase
          .from('connector_accounts')
          .select('id, provider_account_id')
          .eq('connector_id', connector.id);

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
        raw_payload: tx.rawPayload ? (tx.rawPayload as Record<string, unknown>) : null,
        idempotency_key: tx.idempotencyKey,
      }));

      const { error: transactionsError } = await this.supabase
        .from('financial_transactions')
        .upsert(transactionsToInsert, {
          onConflict: 'tenant_id,connector_id,idempotency_key',
          ignoreDuplicates: false,
        });

      if (transactionsError) {
        console.error('Failed to save transactions:', transactionsError);
      }
    }

    // Save balances
    if (data.balances && data.balances.length > 0) {
      const accountMap = new Map<string, string>();
      const { data: accounts } = await this.supabase
        .from('connector_accounts')
        .select('id, provider_account_id')
        .eq('connector_id', connector.id);

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
        raw_payload: bal.rawPayload ? (bal.rawPayload as Record<string, unknown>) : null,
      }));

      const { error: balancesError } = await this.supabase
        .from('financial_balances')
        .upsert(balancesToInsert, {
          onConflict: 'account_id,snapshot_at',
          ignoreDuplicates: false,
        });

      if (balancesError) {
        console.error('Failed to save balances:', balancesError);
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
        raw_payload: payout.rawPayload ? (payout.rawPayload as Record<string, unknown>) : null,
        idempotency_key: payout.idempotencyKey,
      }));

      const { error: payoutsError } = await this.supabase
        .from('financial_payouts')
        .upsert(payoutsToInsert, {
          onConflict: 'tenant_id,connector_id,idempotency_key',
          ignoreDuplicates: false,
        });

      if (payoutsError) {
        console.error('Failed to save payouts:', payoutsError);
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
        issue_date: inv.issueDate?.toISOString().split('T')[0],
        due_date: inv.dueDate?.toISOString().split('T')[0],
        paid_at: inv.paidAt?.toISOString(),
        line_items: inv.lineItems || [],
        provider_metadata: inv.providerMetadata || {},
        raw_payload: inv.rawPayload ? (inv.rawPayload as Record<string, unknown>) : null,
        idempotency_key: inv.idempotencyKey,
      }));

      const { error: invoicesError } = await this.supabase
        .from('financial_invoices')
        .upsert(invoicesToInsert, {
          onConflict: 'tenant_id,connector_id,idempotency_key',
          ignoreDuplicates: false,
        });

      if (invoicesError) {
        console.error('Failed to save invoices:', invoicesError);
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
        raw_payload: sub.rawPayload ? (sub.rawPayload as Record<string, unknown>) : null,
        idempotency_key: sub.idempotencyKey,
      }));

      const { error: subscriptionsError } = await this.supabase
        .from('financial_subscriptions')
        .upsert(subscriptionsToInsert, {
          onConflict: 'tenant_id,connector_id,idempotency_key',
          ignoreDuplicates: false,
        });

      if (subscriptionsError) {
        console.error('Failed to save subscriptions:', subscriptionsError);
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
        raw_payload: tax.rawPayload ? (tax.rawPayload as Record<string, unknown>) : null,
        idempotency_key: tax.idempotencyKey,
      }));

      const { error: taxError } = await this.supabase
        .from('financial_tax_estimates')
        .upsert(taxEstimatesToInsert, {
          onConflict: 'tenant_id,connector_id,idempotency_key',
          ignoreDuplicates: false,
        });

      if (taxError) {
        console.error('Failed to save tax estimates:', taxError);
      }
    }

    // Save raw payloads for audit
    if (data.rawPayloads && data.rawPayloads.length > 0) {
      const rawEventsToInsert = data.rawPayloads.map((raw, idx) => ({
        connector_id: connector.id,
        tenant_id: tenantId,
        event_type: 'sync',
        event_id: `${syncRunId}-${idx}`,
        payload: raw.payload as Record<string, unknown>,
        processed: true,
        processed_at: new Date().toISOString(),
      }));

      const { error: rawError } = await this.supabase
        .from('raw_events')
        .upsert(rawEventsToInsert, {
          onConflict: 'connector_id,event_id',
          ignoreDuplicates: false,
        });

      if (rawError) {
        console.error('Failed to save raw events:', rawError);
      }
    }
  }

  /**
   * Update sync cursor
   */
  async updateSyncCursor(
    tenantId: string,
    connectorId: string,
    cursorKey: string,
    cursorValue: string,
    accountId?: string
  ): Promise<void> {
    const { data: connector, error: connectorError } = await this.supabase
      .from('connectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', connectorId)
      .single();

    if (connectorError || !connector) {
      throw new ConnectorError(
        `Connector not found: ${connectorId}`,
        'CONNECTOR_NOT_FOUND',
        connectorId
      );
    }

    const { error } = await this.supabase
      .from('sync_cursors')
      .upsert({
        connector_id: connector.id,
        tenant_id: tenantId,
        account_id: accountId || null,
        cursor_key: cursorKey,
        cursor_value: cursorValue,
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'connector_id,COALESCE(account_id, \'00000000-0000-0000-0000-000000000000\'::uuid),cursor_key',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Failed to update sync cursor:', error);
      // Don't throw, cursor updates are best-effort
    }
  }

  /**
   * Get sync cursor
   */
  async getSyncCursor(
    tenantId: string,
    connectorId: string,
    cursorKey: string,
    accountId?: string
  ): Promise<string | null> {
    const { data: connector, error: connectorError } = await this.supabase
      .from('connectors')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('provider_id', connectorId)
      .single();

    if (connectorError || !connector) {
      return null;
    }

    const { data: cursor } = await this.supabase
      .from('sync_cursors')
      .select('cursor_value')
      .eq('connector_id', connector.id)
      .eq('cursor_key', cursorKey)
      .eq('account_id', accountId || null)
      .single();

    return cursor?.cursor_value || null;
  }

  /**
   * Execute sync with driver
   */
  async executeSync(
    driver: ConnectorDriver,
    tenantId: string,
    connectorId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    // Get credentials
    const credentials = await this.getCredentials(tenantId, connectorId);

    // Get last cursor if exists
    const lastCursor = await this.getSyncCursor(
      tenantId,
      connectorId,
      'default',
      options.accountId
    );

    const syncOptions: SyncOptions = {
      ...options,
      cursor: options.cursor || lastCursor || undefined,
    };

    // Create sync run
    const syncRunId = await this.createSyncRun(tenantId, connectorId, syncOptions);

    try {
      // Execute sync
      const result = await driver.sync(credentials, syncOptions);

      // Save normalized data
      await this.saveNormalizedData(tenantId, connectorId, syncRunId, {
        accounts: result.accounts,
        transactions: result.transactions,
        balances: result.balances,
        payouts: result.payouts,
        invoices: result.invoices,
        subscriptions: result.subscriptions,
        taxEstimates: result.taxEstimates,
        rawPayloads: result.rawPayloads,
      });

      // Update cursor if provided
      if (result.nextCursor) {
        await this.updateSyncCursor(
          tenantId,
          connectorId,
          'default',
          result.nextCursor,
          options.accountId
        );
      }

      // Update sync run as completed
      await this.updateSyncRun(syncRunId, {
        status: 'completed',
        finishedAt: new Date(),
        accountsSynced: result.counts.accounts || 0,
        transactionsSynced: result.counts.transactions || 0,
        balancesSynced: result.counts.balances || 0,
        payoutsSynced: result.counts.payouts || 0,
        invoicesSynced: result.counts.invoices || 0,
        subscriptionsSynced: result.counts.subscriptions || 0,
        errorsCount: result.errors?.length || 0,
        warningsCount: result.warnings?.length || 0,
        cursor: result.nextCursor,
      });

      // Update connector last sync
      const { data: connector } = await this.supabase
        .from('connectors')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('provider_id', connectorId)
        .single();

      if (connector) {
        await this.supabase
          .from('connectors')
          .update({
            last_sync_at: new Date().toISOString(),
            last_successful_sync_at: new Date().toISOString(),
            error_count: 0,
            consecutive_failures: 0,
            status: 'connected',
          })
          .eq('id', connector.id);
      }

      return result;
    } catch (error) {
      // Update sync run as failed
      await this.updateSyncRun(syncRunId, {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
        errorDetails: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      // Update connector error state
      const { data: connector } = await this.supabase
        .from('connectors')
        .select('id, consecutive_failures')
        .eq('tenant_id', tenantId)
        .eq('provider_id', connectorId)
        .single();

      if (connector) {
        const newFailureCount = (connector.consecutive_failures || 0) + 1;
        await this.supabase
          .from('connectors')
          .update({
            last_sync_at: new Date().toISOString(),
            last_error: error instanceof Error ? error.message : String(error),
            error_count: newFailureCount,
            consecutive_failures: newFailureCount,
            status: newFailureCount >= 5 ? 'error' : 'needs_attention',
            auto_disabled: newFailureCount >= 10,
          })
          .eq('id', connector.id);
      }

      throw error;
    }
  }
}
