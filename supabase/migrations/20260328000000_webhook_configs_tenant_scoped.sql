-- Tenant-scoped webhook signing secrets (fail-closed per tenant + adapter)
-- Replaces global (adapter-only) primary key with composite tenant isolation.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webhook_configs'
  ) THEN
    -- Drop legacy primary key on adapter alone if present
    IF EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'webhook_configs_pkey' AND conrelid = 'public.webhook_configs'::regclass
    ) THEN
      ALTER TABLE public.webhook_configs DROP CONSTRAINT webhook_configs_pkey;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'webhook_configs' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE public.webhook_configs
        ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;

    -- Backfill from default dev tenant when present (single-tenant legacy rows)
    UPDATE public.webhook_configs wc
    SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
    WHERE wc.tenant_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.tenants t WHERE t.id = '00000000-0000-0000-0000-000000000001'::uuid
      );

    -- Any remaining NULL tenant_id rows cannot be attributed safely — remove them
    DELETE FROM public.webhook_configs WHERE tenant_id IS NULL;

    ALTER TABLE public.webhook_configs ALTER COLUMN tenant_id SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'webhook_configs_tenant_id_adapter_key' AND conrelid = 'public.webhook_configs'::regclass
    ) THEN
      ALTER TABLE public.webhook_configs
        ADD CONSTRAINT webhook_configs_tenant_id_adapter_key UNIQUE (tenant_id, adapter);
    END IF;

    CREATE INDEX IF NOT EXISTS idx_webhook_configs_tenant_adapter ON public.webhook_configs USING btree (tenant_id, adapter);
  END IF;
END $$;
