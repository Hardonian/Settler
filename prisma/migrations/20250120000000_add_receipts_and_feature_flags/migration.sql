-- CreateTable
CREATE TABLE IF NOT EXISTS "receipt_uploads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "api_key_id" UUID,
    "billing_account_id" UUID,
    "storage_location" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "receipts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "upload_id" UUID NOT NULL,
    "vendor" TEXT,
    "date" TIMESTAMP(3),
    "currency" TEXT,
    "subtotal" DECIMAL(15,2),
    "tax" DECIMAL(15,2),
    "total" DECIMAL(15,2),
    "payment_method" TEXT,
    "confidence_score" DECIMAL(5,4),
    "raw_text" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "receipt_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "receipt_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(10,3),
    "unit_price" DECIMAL(15,2),
    "line_total" DECIMAL(15,2),
    "category" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipt_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "feature_flags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "billing_account_id" UUID,
    "project_id" UUID,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'boolean',
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "default_value" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "feature_flag_environments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "environment" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "variant" JSONB,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT "feature_flag_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "feature_flag_overrides" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "flag_id" UUID NOT NULL,
    "environment" TEXT NOT NULL,
    "target_key" TEXT NOT NULL,
    "target_type" TEXT NOT NULL DEFAULT 'user',
    "value" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "feature_flag_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipt_uploads_api_key_id_idx" ON "receipt_uploads"("api_key_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipt_uploads_billing_account_id_idx" ON "receipt_uploads"("billing_account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipt_uploads_status_idx" ON "receipt_uploads"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipt_uploads_created_at_idx" ON "receipt_uploads"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipts_upload_id_idx" ON "receipts"("upload_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "receipts_upload_id_key" ON "receipts"("upload_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipts_vendor_idx" ON "receipts"("vendor");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipts_date_idx" ON "receipts"("date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipts_created_at_idx" ON "receipts"("created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipt_items_receipt_id_idx" ON "receipt_items"("receipt_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "receipt_items_category_idx" ON "receipt_items"("category");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flags_billing_account_id_project_id_key_key" ON "feature_flags"("billing_account_id", "project_id", "key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flags_billing_account_id_idx" ON "feature_flags"("billing_account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flags_project_id_idx" ON "feature_flags"("project_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flags_key_idx" ON "feature_flags"("key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flags_is_global_idx" ON "feature_flags"("is_global");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flags_deleted_at_idx" ON "feature_flags"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flag_environments_flag_id_environment_key" ON "feature_flag_environments"("flag_id", "environment");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flag_environments_flag_id_idx" ON "feature_flag_environments"("flag_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flag_environments_environment_idx" ON "feature_flag_environments"("environment");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flag_environments_enabled_idx" ON "feature_flag_environments"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flag_overrides_flag_id_environment_target_key_target_type_key" ON "feature_flag_overrides"("flag_id", "environment", "target_key", "target_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flag_overrides_flag_id_idx" ON "feature_flag_overrides"("flag_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flag_overrides_environment_idx" ON "feature_flag_overrides"("environment");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flag_overrides_target_key_idx" ON "feature_flag_overrides"("target_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "feature_flag_overrides_expires_at_idx" ON "feature_flag_overrides"("expires_at");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "receipt_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_items" ADD CONSTRAINT "receipt_items_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_environments" ADD CONSTRAINT "feature_flag_environments_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_flag_overrides" ADD CONSTRAINT "feature_flag_overrides_flag_id_fkey" FOREIGN KEY ("flag_id") REFERENCES "feature_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
