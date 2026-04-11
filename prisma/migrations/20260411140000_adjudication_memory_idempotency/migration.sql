-- Idempotent adjudication memory: same workbench intent maps to one row per tenant+exception+fingerprint.
ALTER TABLE "exception_adjudication_memory" ADD COLUMN IF NOT EXISTS "adjudication_fingerprint" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "exception_adjudication_memory_idempotency"
  ON "exception_adjudication_memory" ("tenant_id", "exception_id", "adjudication_fingerprint");
