-- Atomic normalized connector persistence for sync durability.
CREATE OR REPLACE FUNCTION public.connector_save_normalized_data_atomic(
  p_tenant_id uuid,
  p_connector_id uuid,
  p_sync_run_id text,
  p_payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  INSERT INTO public.raw_events (
    tenant_id,
    connector_id,
    event_type,
    event_id,
    payload,
    processed,
    processed_at
  ) VALUES (
    p_tenant_id,
    p_connector_id,
    'sync_input_snapshot',
    p_sync_run_id || '-input-snapshot-v2',
    jsonb_build_object(
      'schema_version', 2,
      'snapshot_type', 'connector_sync_input',
      'captured_at', v_now,
      'sync_run_id', p_sync_run_id,
      'tenant_id', p_tenant_id,
      'connector_id', p_connector_id,
      'counts', jsonb_build_object(
        'accounts', COALESCE(jsonb_array_length(p_payload->'accounts'), 0),
        'transactions', COALESCE(jsonb_array_length(p_payload->'transactions'), 0),
        'balances', COALESCE(jsonb_array_length(p_payload->'balances'), 0),
        'payouts', COALESCE(jsonb_array_length(p_payload->'payouts'), 0),
        'invoices', COALESCE(jsonb_array_length(p_payload->'invoices'), 0),
        'subscriptions', COALESCE(jsonb_array_length(p_payload->'subscriptions'), 0),
        'taxEstimates', COALESCE(jsonb_array_length(p_payload->'taxEstimates'), 0),
        'rawPayloads', COALESCE(jsonb_array_length(p_payload->'rawPayloads'), 0)
      ),
      'input', p_payload
    ),
    true,
    v_now
  )
  ON CONFLICT (connector_id, event_id) DO UPDATE
    SET payload = EXCLUDED.payload,
        processed = EXCLUDED.processed,
        processed_at = EXCLUDED.processed_at;

  INSERT INTO public.connector_accounts (
    connector_id,
    tenant_id,
    provider_account_id,
    account_name,
    account_type,
    currency,
    institution_name,
    institution_id,
    metadata
  )
  SELECT
    p_connector_id,
    p_tenant_id,
    entry->>'providerAccountId',
    entry->>'accountName',
    entry->>'accountType',
    entry->>'currency',
    entry->>'institutionName',
    entry->>'institutionId',
    COALESCE(entry->'metadata', '{}'::jsonb)
  FROM jsonb_array_elements(COALESCE(p_payload->'accounts', '[]'::jsonb)) AS entry
  ON CONFLICT (connector_id, provider_account_id) DO UPDATE
    SET account_name = EXCLUDED.account_name,
        account_type = EXCLUDED.account_type,
        currency = EXCLUDED.currency,
        institution_name = EXCLUDED.institution_name,
        institution_id = EXCLUDED.institution_id,
        metadata = EXCLUDED.metadata,
        updated_at = now();

  INSERT INTO public.financial_transactions (
    connector_id,
    tenant_id,
    account_id,
    external_id,
    transaction_type,
    amount_cents,
    currency,
    occurred_at,
    description,
    reference_id,
    reference_type,
    provider_metadata,
    raw_payload,
    idempotency_key
  )
  SELECT
    p_connector_id,
    p_tenant_id,
    acct.id,
    entry->>'externalId',
    entry->>'transactionType',
    (entry->>'amountCents')::bigint,
    entry->>'currency',
    (entry->>'occurredAt')::timestamptz,
    entry->>'description',
    entry->>'referenceId',
    entry->>'referenceType',
    COALESCE(entry->'providerMetadata', '{}'::jsonb),
    entry->'rawPayload',
    entry->>'idempotencyKey'
  FROM jsonb_array_elements(COALESCE(p_payload->'transactions', '[]'::jsonb)) AS entry
  LEFT JOIN public.connector_accounts acct
    ON acct.connector_id = p_connector_id
    AND acct.provider_account_id = NULLIF(entry->>'accountId', '')
  ON CONFLICT (tenant_id, connector_id, idempotency_key) DO UPDATE
    SET account_id = EXCLUDED.account_id,
        external_id = EXCLUDED.external_id,
        transaction_type = EXCLUDED.transaction_type,
        amount_cents = EXCLUDED.amount_cents,
        currency = EXCLUDED.currency,
        occurred_at = EXCLUDED.occurred_at,
        description = EXCLUDED.description,
        reference_id = EXCLUDED.reference_id,
        reference_type = EXCLUDED.reference_type,
        provider_metadata = EXCLUDED.provider_metadata,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = now();

  INSERT INTO public.financial_balances (
    connector_id,
    tenant_id,
    account_id,
    balance_cents,
    available_balance_cents,
    currency,
    snapshot_at,
    provider_metadata,
    raw_payload
  )
  SELECT
    p_connector_id,
    p_tenant_id,
    acct.id,
    (entry->>'balanceCents')::bigint,
    NULLIF(entry->>'availableBalanceCents', '')::bigint,
    entry->>'currency',
    (entry->>'snapshotAt')::timestamptz,
    COALESCE(entry->'providerMetadata', '{}'::jsonb),
    entry->'rawPayload'
  FROM jsonb_array_elements(COALESCE(p_payload->'balances', '[]'::jsonb)) AS entry
  JOIN public.connector_accounts acct
    ON acct.connector_id = p_connector_id
    AND acct.provider_account_id = entry->>'accountId'
  ON CONFLICT (account_id, snapshot_at) DO UPDATE
    SET balance_cents = EXCLUDED.balance_cents,
        available_balance_cents = EXCLUDED.available_balance_cents,
        currency = EXCLUDED.currency,
        provider_metadata = EXCLUDED.provider_metadata,
        raw_payload = EXCLUDED.raw_payload;

  INSERT INTO public.financial_payouts (
    connector_id,
    tenant_id,
    account_id,
    external_id,
    amount_cents,
    currency,
    status,
    initiated_at,
    completed_at,
    fee_cents,
    net_amount_cents,
    destination_type,
    destination_id,
    description,
    provider_metadata,
    raw_payload,
    idempotency_key
  )
  SELECT
    p_connector_id,
    p_tenant_id,
    NULL,
    entry->>'externalId',
    (entry->>'amountCents')::bigint,
    entry->>'currency',
    entry->>'status',
    (entry->>'initiatedAt')::timestamptz,
    NULLIF(entry->>'completedAt', '')::timestamptz,
    NULLIF(entry->>'feeCents', '')::bigint,
    NULLIF(entry->>'netAmountCents', '')::bigint,
    entry->>'destinationType',
    entry->>'destinationId',
    entry->>'description',
    COALESCE(entry->'providerMetadata', '{}'::jsonb),
    entry->'rawPayload',
    entry->>'idempotencyKey'
  FROM jsonb_array_elements(COALESCE(p_payload->'payouts', '[]'::jsonb)) AS entry
  ON CONFLICT (tenant_id, connector_id, idempotency_key) DO UPDATE
    SET external_id = EXCLUDED.external_id,
        amount_cents = EXCLUDED.amount_cents,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        initiated_at = EXCLUDED.initiated_at,
        completed_at = EXCLUDED.completed_at,
        fee_cents = EXCLUDED.fee_cents,
        net_amount_cents = EXCLUDED.net_amount_cents,
        destination_type = EXCLUDED.destination_type,
        destination_id = EXCLUDED.destination_id,
        description = EXCLUDED.description,
        provider_metadata = EXCLUDED.provider_metadata,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = now();

  INSERT INTO public.financial_invoices (
    connector_id,
    tenant_id,
    external_id,
    invoice_number,
    customer_id,
    customer_name,
    amount_cents,
    currency,
    status,
    issue_date,
    due_date,
    paid_at,
    line_items,
    provider_metadata,
    raw_payload,
    idempotency_key
  )
  SELECT
    p_connector_id,
    p_tenant_id,
    entry->>'externalId',
    entry->>'invoiceNumber',
    entry->>'customerId',
    entry->>'customerName',
    (entry->>'amountCents')::bigint,
    entry->>'currency',
    entry->>'status',
    NULLIF(entry->>'issueDate', '')::date,
    NULLIF(entry->>'dueDate', '')::date,
    NULLIF(entry->>'paidAt', '')::timestamptz,
    COALESCE(entry->'lineItems', '[]'::jsonb),
    COALESCE(entry->'providerMetadata', '{}'::jsonb),
    entry->'rawPayload',
    entry->>'idempotencyKey'
  FROM jsonb_array_elements(COALESCE(p_payload->'invoices', '[]'::jsonb)) AS entry
  ON CONFLICT (tenant_id, connector_id, idempotency_key) DO UPDATE
    SET external_id = EXCLUDED.external_id,
        invoice_number = EXCLUDED.invoice_number,
        customer_id = EXCLUDED.customer_id,
        customer_name = EXCLUDED.customer_name,
        amount_cents = EXCLUDED.amount_cents,
        currency = EXCLUDED.currency,
        status = EXCLUDED.status,
        issue_date = EXCLUDED.issue_date,
        due_date = EXCLUDED.due_date,
        paid_at = EXCLUDED.paid_at,
        line_items = EXCLUDED.line_items,
        provider_metadata = EXCLUDED.provider_metadata,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = now();

  INSERT INTO public.financial_subscriptions (
    connector_id,
    tenant_id,
    external_id,
    customer_id,
    customer_name,
    plan_id,
    plan_name,
    status,
    billing_cycle,
    amount_cents,
    currency,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    cancelled_at,
    provider_metadata,
    raw_payload,
    idempotency_key
  )
  SELECT
    p_connector_id,
    p_tenant_id,
    entry->>'externalId',
    entry->>'customerId',
    entry->>'customerName',
    entry->>'planId',
    entry->>'planName',
    entry->>'status',
    entry->>'billingCycle',
    (entry->>'amountCents')::bigint,
    entry->>'currency',
    NULLIF(entry->>'currentPeriodStart', '')::timestamptz,
    NULLIF(entry->>'currentPeriodEnd', '')::timestamptz,
    COALESCE((entry->>'cancelAtPeriodEnd')::boolean, false),
    NULLIF(entry->>'cancelledAt', '')::timestamptz,
    COALESCE(entry->'providerMetadata', '{}'::jsonb),
    entry->'rawPayload',
    entry->>'idempotencyKey'
  FROM jsonb_array_elements(COALESCE(p_payload->'subscriptions', '[]'::jsonb)) AS entry
  ON CONFLICT (tenant_id, connector_id, idempotency_key) DO UPDATE
    SET external_id = EXCLUDED.external_id,
        customer_id = EXCLUDED.customer_id,
        customer_name = EXCLUDED.customer_name,
        plan_id = EXCLUDED.plan_id,
        plan_name = EXCLUDED.plan_name,
        status = EXCLUDED.status,
        billing_cycle = EXCLUDED.billing_cycle,
        amount_cents = EXCLUDED.amount_cents,
        currency = EXCLUDED.currency,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        cancelled_at = EXCLUDED.cancelled_at,
        provider_metadata = EXCLUDED.provider_metadata,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = now();

  INSERT INTO public.financial_tax_estimates (
    connector_id,
    tenant_id,
    external_id,
    transaction_id,
    transaction_type,
    amount_cents,
    currency,
    tax_amount_cents,
    tax_rate,
    jurisdiction,
    tax_type,
    occurred_at,
    provider_metadata,
    raw_payload,
    idempotency_key
  )
  SELECT
    p_connector_id,
    p_tenant_id,
    entry->>'externalId',
    entry->>'transactionId',
    entry->>'transactionType',
    (entry->>'amountCents')::bigint,
    entry->>'currency',
    (entry->>'taxAmountCents')::bigint,
    NULLIF(entry->>'taxRate', '')::numeric,
    entry->>'jurisdiction',
    entry->>'taxType',
    (entry->>'occurredAt')::timestamptz,
    COALESCE(entry->'providerMetadata', '{}'::jsonb),
    entry->'rawPayload',
    entry->>'idempotencyKey'
  FROM jsonb_array_elements(COALESCE(p_payload->'taxEstimates', '[]'::jsonb)) AS entry
  ON CONFLICT (tenant_id, connector_id, idempotency_key) DO UPDATE
    SET external_id = EXCLUDED.external_id,
        transaction_id = EXCLUDED.transaction_id,
        transaction_type = EXCLUDED.transaction_type,
        amount_cents = EXCLUDED.amount_cents,
        currency = EXCLUDED.currency,
        tax_amount_cents = EXCLUDED.tax_amount_cents,
        tax_rate = EXCLUDED.tax_rate,
        jurisdiction = EXCLUDED.jurisdiction,
        tax_type = EXCLUDED.tax_type,
        occurred_at = EXCLUDED.occurred_at,
        provider_metadata = EXCLUDED.provider_metadata,
        raw_payload = EXCLUDED.raw_payload;

  INSERT INTO public.raw_events (
    tenant_id,
    connector_id,
    event_type,
    event_id,
    payload,
    processed,
    processed_at
  )
  SELECT
    p_tenant_id,
    p_connector_id,
    'sync',
    p_sync_run_id || '-' || (ord - 1)::text,
    entry->'payload',
    true,
    v_now
  FROM jsonb_array_elements(COALESCE(p_payload->'rawPayloads', '[]'::jsonb)) WITH ORDINALITY AS t(entry, ord)
  ON CONFLICT (connector_id, event_id) DO UPDATE
    SET payload = EXCLUDED.payload,
        processed = EXCLUDED.processed,
        processed_at = EXCLUDED.processed_at;
END;
$$;
