-- ============================================================================
-- MULTI-TENANT & WHITE-LABEL SITE BUILDER MIGRATION
-- Adds Tenant, TenantBranding, TenantNavigation, TenantPage, TenantPageRevision,
-- Experiment, ExperimentVariant, and ExperimentMetricEvent models
-- ============================================================================

-- CreateTable: tenants
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "billing_account_id" UUID,
    "slug" TEXT NOT NULL,
    "primary_domain" TEXT,
    "custom_domain" TEXT,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tenant_branding
CREATE TABLE IF NOT EXISTS "tenant_branding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#2563eb',
    "secondary_color" TEXT NOT NULL DEFAULT '#7c3aed',
    "accent_color" TEXT NOT NULL DEFAULT '#06b6d4',
    "background_color" TEXT NOT NULL DEFAULT '#ffffff',
    "border_radius_scale" DECIMAL(3,2),
    "font_family_primary" TEXT,
    "font_family_secondary" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_branding_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tenant_navigation
CREATE TABLE IF NOT EXISTS "tenant_navigation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "nav_items" JSONB NOT NULL DEFAULT '[]',
    "footer_items" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_navigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tenant_pages
CREATE TABLE IF NOT EXISTS "tenant_pages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "page_type" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL DEFAULT '1.0',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "seo_image_url" TEXT,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: tenant_page_revisions
CREATE TABLE IF NOT EXISTS "tenant_page_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_page_id" UUID NOT NULL,
    "editor_user_id" UUID,
    "snapshot" JSONB NOT NULL,
    "comment" TEXT,
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_page_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: experiments
CREATE TABLE IF NOT EXISTS "experiments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "target_page_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "traffic_split" JSONB NOT NULL DEFAULT '{}',
    "primary_metric" TEXT NOT NULL DEFAULT 'click_through',
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: experiment_variants
CREATE TABLE IF NOT EXISTS "experiment_variants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "experiment_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "blocks_override" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiment_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: experiment_metric_events
CREATE TABLE IF NOT EXISTS "experiment_metric_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "experiment_id" UUID NOT NULL,
    "variant_key" TEXT NOT NULL,
    "tenant_id" UUID NOT NULL,
    "page_id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" UUID,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_metric_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: tenants
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS "tenants_slug_idx" ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS "tenants_primary_domain_idx" ON "tenants"("primary_domain");
CREATE INDEX IF NOT EXISTS "tenants_custom_domain_idx" ON "tenants"("custom_domain");
CREATE INDEX IF NOT EXISTS "tenants_billing_account_id_idx" ON "tenants"("billing_account_id");
CREATE INDEX IF NOT EXISTS "tenants_is_active_idx" ON "tenants"("is_active");

-- CreateIndex: tenant_branding
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_branding_tenant_id_key" ON "tenant_branding"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_branding_tenant_id_idx" ON "tenant_branding"("tenant_id");

-- CreateIndex: tenant_navigation
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_navigation_tenant_id_key" ON "tenant_navigation"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_navigation_tenant_id_idx" ON "tenant_navigation"("tenant_id");

-- CreateIndex: tenant_pages
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_pages_tenant_id_slug_key" ON "tenant_pages"("tenant_id", "slug");
CREATE INDEX IF NOT EXISTS "tenant_pages_tenant_id_idx" ON "tenant_pages"("tenant_id");
CREATE INDEX IF NOT EXISTS "tenant_pages_slug_idx" ON "tenant_pages"("slug");
CREATE INDEX IF NOT EXISTS "tenant_pages_page_type_idx" ON "tenant_pages"("page_type");
CREATE INDEX IF NOT EXISTS "tenant_pages_is_draft_idx" ON "tenant_pages"("is_draft");

-- CreateIndex: tenant_page_revisions
CREATE INDEX IF NOT EXISTS "tenant_page_revisions_tenant_page_id_idx" ON "tenant_page_revisions"("tenant_page_id");
CREATE INDEX IF NOT EXISTS "tenant_page_revisions_editor_user_id_idx" ON "tenant_page_revisions"("editor_user_id");
CREATE INDEX IF NOT EXISTS "tenant_page_revisions_approved_by_user_id_idx" ON "tenant_page_revisions"("approved_by_user_id");
CREATE INDEX IF NOT EXISTS "tenant_page_revisions_created_at_idx" ON "tenant_page_revisions"("created_at" DESC);

-- CreateIndex: experiments
CREATE UNIQUE INDEX IF NOT EXISTS "experiments_tenant_id_slug_key" ON "experiments"("tenant_id", "slug");
CREATE INDEX IF NOT EXISTS "experiments_tenant_id_idx" ON "experiments"("tenant_id");
CREATE INDEX IF NOT EXISTS "experiments_target_page_id_idx" ON "experiments"("target_page_id");
CREATE INDEX IF NOT EXISTS "experiments_status_idx" ON "experiments"("status");
CREATE INDEX IF NOT EXISTS "experiments_starts_at_idx" ON "experiments"("starts_at");
CREATE INDEX IF NOT EXISTS "experiments_ends_at_idx" ON "experiments"("ends_at");

-- CreateIndex: experiment_variants
CREATE UNIQUE INDEX IF NOT EXISTS "experiment_variants_experiment_id_key_key" ON "experiment_variants"("experiment_id", "key");
CREATE INDEX IF NOT EXISTS "experiment_variants_experiment_id_idx" ON "experiment_variants"("experiment_id");
CREATE INDEX IF NOT EXISTS "experiment_variants_key_idx" ON "experiment_variants"("key");

-- CreateIndex: experiment_metric_events
CREATE INDEX IF NOT EXISTS "experiment_metric_events_experiment_id_idx" ON "experiment_metric_events"("experiment_id");
CREATE INDEX IF NOT EXISTS "experiment_metric_events_variant_key_idx" ON "experiment_metric_events"("variant_key");
CREATE INDEX IF NOT EXISTS "experiment_metric_events_tenant_id_idx" ON "experiment_metric_events"("tenant_id");
CREATE INDEX IF NOT EXISTS "experiment_metric_events_page_id_idx" ON "experiment_metric_events"("page_id");
CREATE INDEX IF NOT EXISTS "experiment_metric_events_event_type_idx" ON "experiment_metric_events"("event_type");
CREATE INDEX IF NOT EXISTS "experiment_metric_events_session_id_idx" ON "experiment_metric_events"("session_id");
CREATE INDEX IF NOT EXISTS "experiment_metric_events_user_id_idx" ON "experiment_metric_events"("user_id");
CREATE INDEX IF NOT EXISTS "experiment_metric_events_created_at_idx" ON "experiment_metric_events"("created_at");

-- AddForeignKey: tenant_branding -> tenants
ALTER TABLE "tenant_branding" ADD CONSTRAINT "tenant_branding_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: tenant_navigation -> tenants
ALTER TABLE "tenant_navigation" ADD CONSTRAINT "tenant_navigation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: tenant_pages -> tenants
ALTER TABLE "tenant_pages" ADD CONSTRAINT "tenant_pages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: tenant_page_revisions -> tenant_pages
ALTER TABLE "tenant_page_revisions" ADD CONSTRAINT "tenant_page_revisions_tenant_page_id_fkey" FOREIGN KEY ("tenant_page_id") REFERENCES "tenant_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: experiments -> tenants
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: experiments -> tenant_pages
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_target_page_id_fkey" FOREIGN KEY ("target_page_id") REFERENCES "tenant_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: experiment_variants -> experiments
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: experiment_metric_events -> experiments
ALTER TABLE "experiment_metric_events" ADD CONSTRAINT "experiment_metric_events_experiment_id_fkey" FOREIGN KEY ("experiment_id") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: tenants -> billing_accounts (optional relation)
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_billing_account_id_fkey" FOREIGN KEY ("billing_account_id") REFERENCES "billing_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: billing_accounts -> tenants (optional reverse relation)
-- Note: This is handled via the tenant.billingAccountId field, no additional constraint needed
