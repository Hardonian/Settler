/**
 * DB-backed contract tests for merged reconciliation listing and run resolution.
 * Requires PostgreSQL with `recon_jobs` and `reconciliation_runs` (golden / Prisma schema).
 *
 * Opt-in (separate from generic RUN_DB_TESTS so tenant suites do not require these tables):
 *   RUN_RECON_MERGED_LIST_DB=1 RUN_DB_TESTS=true pnpm --filter @settler/api exec jest src/__tests__/integration/reconciliation-merged-list.db.test.ts --runInBand --forceExit
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  buildConsoleReconciliationListBody,
  decodeMergedRunsCursor,
  encodeMergedRunsCursor,
  fetchMergedReconciliationRunsPage,
  resolveReconciliationRunForTenant,
} from "@settler/reconciliation-core";

const runDb = process.env.RUN_DB_TESTS === "true" && process.env.RUN_RECON_MERGED_LIST_DB === "1";
const describeDb = runDb ? describe : describe.skip;

describeDb("reconciliation merged list (database)", () => {
  let ctx: { pool: Pool; prisma: PrismaClient } | undefined;

  const tenantA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const userA = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const tenantB = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const userB = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

  const jobNew = "22222222-2222-4222-8222-222222222222";
  const jobOld = "33333333-3333-4333-8333-333333333333";
  const ingNew = "11111111-1111-4111-8111-111111111111";
  const ingOld = "44444444-4444-4444-8444-444444444444";
  const collisionId = "55555555-5555-4555-8555-555555555555";
  const otherTenantJob = "66666666-6666-4666-8666-666666666666";

  beforeAll(async () => {
    const pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME || "settler_test",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    });

    const chk = await pool.query(
      `SELECT COUNT(DISTINCT table_name)::int AS c
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('recon_jobs', 'reconciliation_runs')`
    );
    if (Number(chk.rows[0]?.c) !== 2) {
      await pool.end();
      throw new Error(
        "reconciliation-merged-list.db.test requires public.recon_jobs and public.reconciliation_runs; apply golden schema."
      );
    }

    const adapter = new PrismaPg(pool);
    const prismaClient = new PrismaClient({ adapter });
    ctx = { pool, prisma: prismaClient };
  });

  afterAll(async () => {
    if (!ctx) return;
    await ctx.prisma.$disconnect();
    await ctx.pool.end();
  });

  beforeEach(async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const { pool } = ctx;
    await pool.query(`DELETE FROM reconciliation_runs WHERE tenant_id = ANY($1::uuid[])`, [
      [tenantA, tenantB],
    ]);
    await pool.query(`DELETE FROM recon_jobs WHERE tenant_id = ANY($1::uuid[])`, [
      [tenantA, tenantB],
    ]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[userA, userB]]);
    await pool.query(`DELETE FROM tenants WHERE id = ANY($1::uuid[])`, [[tenantA, tenantB]]);

    await pool.query(
      `INSERT INTO tenants (id, name, slug, created_at, updated_at)
       VALUES ($1, 'Recon Int A', 'recon-int-a-' || substr($1::text, 1, 8), NOW(), NOW()),
              ($2, 'Recon Int B', 'recon-int-b-' || substr($2::text, 1, 8), NOW(), NOW())`,
      [tenantA, tenantB]
    );

    await pool.query(
      `INSERT INTO users (id, tenant_id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, 'recon-a@test.local', 'x', NOW(), NOW()),
              ($3, $4, 'recon-b@test.local', 'x', NOW(), NOW())`,
      [userA, tenantA, userB, tenantB]
    );

    const enc = "e".repeat(32);
    await pool.query(
      `INSERT INTO recon_jobs (id, tenant_id, user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, created_at, updated_at)
       VALUES ($1, $2, $3, 'job-new', 'src', $6, 'tgt', $6, $4::timestamptz, $4::timestamptz),
              ($5, $2, $3, 'job-old', 'src', $6, 'tgt', $6, $7::timestamptz, $7::timestamptz)`,
      [jobNew, tenantA, userA, "2024-06-02T12:00:00.000Z", jobOld, enc, "2024-06-01T12:00:00.000Z"]
    );

    await pool.query(
      `INSERT INTO reconciliation_runs (id, tenant_id, user_id, name, status, started_at, completed_at, created_at, updated_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, metadata)
       VALUES ($1, $2, $3, 'ing-new', 'completed', $4::timestamptz, $4::timestamptz, $4::timestamptz, $4::timestamptz, 0, 0, 0, 0, 0, '{}'),
              ($5, $2, $3, 'ing-old', 'completed', $6::timestamptz, $6::timestamptz, $6::timestamptz, $6::timestamptz, 0, 0, 0, 0, 0, '{}')`,
      [ingNew, tenantA, userA, "2024-06-03T12:00:00.000Z", ingOld, "2024-06-01T12:00:00.000Z"]
    );

    await pool.query(
      `INSERT INTO recon_jobs (id, tenant_id, user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, created_at, updated_at)
       VALUES ($1, $2, $3, 'other-tenant', 'src', $4, 'tgt', $4, NOW(), NOW())`,
      [otherTenantJob, tenantB, userB, enc]
    );
  });

  test("merged pagination: deterministic order, no duplicates across pages", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const limit = 2;
    const p1 = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit,
      cursorState: null,
      runKind: "all",
      encodeCursor: encodeMergedRunsCursor,
    });

    expect(p1.pagination.returned).toBe(2);
    expect(p1.runs.map((r) => r.id)).toEqual([ingNew, jobNew]);
    expect(p1.next_cursor).toBeTruthy();

    const cursor = decodeMergedRunsCursor(p1.next_cursor);
    const p2 = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit,
      cursorState: cursor,
      runKind: "all",
      encodeCursor: encodeMergedRunsCursor,
    });

    expect(p2.runs.map((r) => r.id)).toEqual([ingOld, jobOld]);
    const allIds = [...p1.runs.map((r) => r.id), ...p2.runs.map((r) => r.id)];
    expect(new Set(allIds).size).toBe(4);

    const p3 = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit,
      cursorState: decodeMergedRunsCursor(p2.next_cursor),
      runKind: "all",
      encodeCursor: encodeMergedRunsCursor,
    });
    expect(p3.runs.length).toBe(0);
    expect(p3.next_cursor).toBeNull();
  });

  test("tenant isolation: other tenant job never appears", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const page = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit: 50,
      cursorState: null,
      runKind: "recon_job",
      encodeCursor: encodeMergedRunsCursor,
    });
    const ids = page.runs.map((r) => r.id);
    expect(ids).toContain(jobNew);
    expect(ids).toContain(jobOld);
    expect(ids).not.toContain(otherTenantJob);
  });

  test("run_kind filters: recon_job stream only jobs", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const page = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit: 10,
      cursorState: null,
      runKind: "recon_job",
      encodeCursor: encodeMergedRunsCursor,
    });
    expect(page.runs.every((r) => r.runKind === "recon_job")).toBe(true);
    expect(page.runs.length).toBe(2);
  });

  test("run_kind filters: ingestion_run stream only ingestion", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const page = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit: 10,
      cursorState: null,
      runKind: "ingestion_run",
      encodeCursor: encodeMergedRunsCursor,
    });
    expect(page.runs.every((r) => r.runKind === "ingestion_run")).toBe(true);
    expect(page.runs.length).toBe(2);
  });

  test("console list body matrix matches Next route projection", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const page = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit: 10,
      cursorState: null,
      runKind: "all",
      encodeCursor: encodeMergedRunsCursor,
    });

    const allBody = buildConsoleReconciliationListBody(page, "all");
    expect(allBody.runs).toBeDefined();
    expect((allBody.reconciliations as unknown[]).length).toBe(2);

    const jobOnly = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit: 10,
      cursorState: null,
      runKind: "recon_job",
      encodeCursor: encodeMergedRunsCursor,
    });
    const jobBody = buildConsoleReconciliationListBody(jobOnly, "recon_job");
    expect(jobBody.runs).toBeUndefined();
    expect((jobBody.reconciliations as { id: string }[]).map((x) => x.id).sort()).toEqual(
      [jobOld, jobNew].sort()
    );

    const ingOnly = await fetchMergedReconciliationRunsPage({
      prisma: ctx.prisma,
      tenantId: tenantA,
      limit: 10,
      cursorState: null,
      runKind: "ingestion_run",
      encodeCursor: encodeMergedRunsCursor,
    });
    const ingBody = buildConsoleReconciliationListBody(ingOnly, "ingestion_run");
    expect(ingBody.runs).toBeUndefined();
    expect(ingBody.reconciliations).toEqual([]);
  });

  test("resolveReconciliationRunForTenant: ambiguous UUID returns collision", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const { pool, prisma } = ctx;
    const enc = "f".repeat(32);
    await pool.query(`DELETE FROM reconciliation_runs WHERE id = $1`, [collisionId]);
    await pool.query(`DELETE FROM recon_jobs WHERE id = $1`, [collisionId]);

    await pool.query(
      `INSERT INTO recon_jobs (id, tenant_id, user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, created_at, updated_at)
       VALUES ($1, $2, $3, 'collision-job', 'src', $4, 'tgt', $4, NOW(), NOW())`,
      [collisionId, tenantA, userA, enc]
    );
    await pool.query(
      `INSERT INTO reconciliation_runs (id, tenant_id, user_id, name, status, started_at, created_at, updated_at, source_count, target_count, matched_count, unmatched_source_count, unmatched_target_count, metadata)
       VALUES ($1, $2, $3, 'collision-run', 'completed', NOW(), NOW(), NOW(), 0, 0, 0, 0, 0, '{}')`,
      [collisionId, tenantA, userA]
    );

    const res = await resolveReconciliationRunForTenant(prisma, tenantA, collisionId);
    expect(res.kind).toBe("ambiguous_uuid_collision");
    if (res.kind === "ambiguous_uuid_collision") {
      expect(res.jobId).toBe(collisionId);
      expect(res.ingestionRunId).toBe(collisionId);
    }
  });

  test("resolveReconciliationRunForTenant: recon_job id resolves to recon_job", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const res = await resolveReconciliationRunForTenant(ctx.prisma, tenantA, jobNew);
    expect(res.kind).toBe("recon_job");
    if (res.kind === "recon_job") {
      expect(res.detail.runKind).toBe("recon_job");
      expect(res.detail.id).toBe(jobNew);
    }
  });

  test("resolveReconciliationRunForTenant: ingestion id resolves to ingestion_run", async () => {
    if (!ctx) throw new Error("reconciliation DB harness not initialized");
    const res = await resolveReconciliationRunForTenant(ctx.prisma, tenantA, ingNew);
    expect(res.kind).toBe("ingestion_run");
    if (res.kind === "ingestion_run") {
      expect(res.detail.runKind).toBe("ingestion_run");
    }
  });
});
