-- 20250312000000_billing_rls_guards.sql
-- Harden billing RLS policies for subscriptions, stripe_events, and usage_events

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
    CREATE POLICY subscriptions_select_own ON public.subscriptions
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.billing_accounts ba
          WHERE ba.id = subscriptions.billing_account_id
            AND (
              ba.user_id = auth.uid()
              OR EXISTS (
                SELECT 1
                FROM public.memberships m
                WHERE m.tenant_id = ba.tenant_id
                  AND m.user_id = auth.uid()
                  AND m.status = 'active'
              )
            )
        )
      );

    DROP POLICY IF EXISTS subscriptions_service_role_write ON public.subscriptions;
    CREATE POLICY subscriptions_service_role_write ON public.subscriptions
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'stripe_events'
  ) THEN
    ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS stripe_events_select_own ON public.stripe_events;
    CREATE POLICY stripe_events_select_own ON public.stripe_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.billing_accounts ba
          WHERE ba.id = stripe_events.billing_account_id
            AND (
              ba.user_id = auth.uid()
              OR EXISTS (
                SELECT 1
                FROM public.memberships m
                WHERE m.tenant_id = ba.tenant_id
                  AND m.user_id = auth.uid()
                  AND m.status = 'active'
              )
            )
        )
      );

    DROP POLICY IF EXISTS stripe_events_service_role_write ON public.stripe_events;
    CREATE POLICY stripe_events_service_role_write ON public.stripe_events
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'usage_events'
  ) THEN
    ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS usage_events_select_own ON public.usage_events;
    CREATE POLICY usage_events_select_own ON public.usage_events
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.billing_accounts ba
          WHERE ba.id = usage_events.billing_account_id
            AND (
              ba.user_id = auth.uid()
              OR EXISTS (
                SELECT 1
                FROM public.memberships m
                WHERE m.tenant_id = ba.tenant_id
                  AND m.user_id = auth.uid()
                  AND m.status = 'active'
              )
            )
        )
      );

    DROP POLICY IF EXISTS usage_events_service_role_write ON public.usage_events;
    CREATE POLICY usage_events_service_role_write ON public.usage_events
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
