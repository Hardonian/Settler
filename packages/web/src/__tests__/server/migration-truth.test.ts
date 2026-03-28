/** @jest-environment node */

import { assertWebhookConfigsTenantScoping } from "@/lib/server/migration-truth";

describe("assertWebhookConfigsTenantScoping", () => {
  it("returns SCHEMA_CHECK_FAILED when Prisma is stubbed", async () => {
    const stub = { __prismaInitError: new Error("init failed") } as never;
    const r = await assertWebhookConfigsTenantScoping(stub);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("WEBHOOK_CONFIGS_SCHEMA_CHECK_FAILED");
    }
  });

  it("returns MIGRATION_MISSING when tenant_id column absent", async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        // tenant column check
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ oid: 1 }]),
    } as never;
    const r = await assertWebhookConfigsTenantScoping(prisma);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("WEBHOOK_CONFIGS_MIGRATION_MISSING");
    }
  });

  it("returns TENANT_PARTIAL when tenant_id still nullable", async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ is_nullable: "YES" }])
        .mockResolvedValueOnce([{ oid: 1 }]),
    } as never;
    const r = await assertWebhookConfigsTenantScoping(prisma);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("WEBHOOK_CONFIGS_TENANT_PARTIAL");
    }
  });

  it("returns UNIQUE_CONSTRAINT_MISSING when constraint absent", async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ is_nullable: "NO" }])
        .mockResolvedValueOnce([]),
    } as never;
    const r = await assertWebhookConfigsTenantScoping(prisma);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("WEBHOOK_CONFIGS_UNIQUE_CONSTRAINT_MISSING");
    }
  });

  it("returns ok when column not null and unique constraint present", async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ is_nullable: "NO" }])
        .mockResolvedValueOnce([{ oid: 1 }]),
    } as never;
    const r = await assertWebhookConfigsTenantScoping(prisma);
    expect(r).toEqual({ ok: true });
  });
});
