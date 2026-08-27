/**
 * DB-backed contract tests for merged reconciliation listing and run resolution.
 * and `public.recon_results` columns exist (Prisma-shaped vs slimmer baselines).
 *
 * Opt-in (separate from generic RUN_DB_TESTS so tenant suites do not require these tables):
 *   RUN_RECON_MERGED_LIST_DB=1 RUN_DB_TESTS=true pnpm --filter @settler/api run test:recon-merged-db
 *
 * CI applies `scripts/ci/reconciliation-merged-list-schema.sql` for a guaranteed Prisma match.
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

const PRISMA_RECON_RESULTS_COLUMNS = [
  "id",
  "recon_job_id",
  "tenant_id",
  "status",
  "started_at",
  "completed_at",
  "source_count",
  "target_count",
  "matched_count",
  "unmatched_source_count",
  "unmatched_target_count",
  "conflict_count",
  "confidence_avg",
  "confidence_min",
  "confidence_max",
  "error_message",
  "input_hash",
  "snapshot_id",
  "summary",
  "metadata",
  "created_at",
  "updated_at",
] as const;

async function loadColumns(pool: Pool, table: string): Promise<Set<string>> {
  const r = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return new Set(r.rows.map((x) => x.column_name));
}

async function tableExists(pool: Pool, table: string): Promise<boolean> {
  const r = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return Number(r.rows[0]?.c) > 0;
}

function pickColumns(
  available: Set<string>,
  row: Record<string, unknown>
): { names: string[]; values: unknown[] } {
  const names: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(row)) {
    if (available.has(k) && v !== undefined) {
      names.push(k);
      values.push(v);
    }
  }
  return { names, values };
}

async function insertRow(
  pool: Pool,
  table: string,
  available: Set<string>,
  row: Record<string, unknown>
) {
  const { names, values } = pickColumns(available, row);
  if (names.length === 0) throw new Error(`No insertable columns for ${table}`);
  const placeholders = names.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `INSERT INTO ${table} (${names.join(", ")}) VALUES (${placeholders})`;
  await pool.query(sql, values);
}

describeDb("reconciliation merged list (database)", () => {
  let ctx: { pool: Pool; prisma: PrismaClient } | undefined;
  let columns: {
    tenants: Set<string>;
    users: Set<string> | null;
    reconJobs: Set<string>;
    reconResults: Set<string>;
  };

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
         AND table_name IN ('recon_jobs', 'recon_results')`
    );
    if (Number(chk.rows[0]?.c) !== 2) {
      await pool.end();
      throw new Error(
        "reconciliation-merged-list.db.test requires public.recon_jobs and public.recon_results."
      );
    }

    const tenants = await loadColumns(pool, "tenants");
    const reconJobs = await loadColumns(pool, "recon_jobs");
    const reconResults = await loadColumns(pool, "recon_results");
    const usersExist = await tableExists(pool, "users");
    const users = usersExist ? await loadColumns(pool, "users") : null;

    const ingestionMergeCapable = PRISMA_RECON_RESULTS_COLUMNS.every((c) => reconResults.has(c));
    if (!ingestionMergeCapable) {
      const missing = PRISMA_RECON_RESULTS_COLUMNS.filter((c) => !reconResults.has(c));
      await pool.end();
      throw new Error(
        `recon_results is missing columns required by Prisma merge queries: ${missing.join(
          ", "
        )}. Apply scripts/ci/reconciliation-merged-list-schema.sql to a test database, or use a DB that matches prisma/schema.prisma for this table.`
      );
    }

    columns = { tenants, users, reconJobs, reconResults };

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

    await pool.query(`DELETE FROM recon_results WHERE tenant_id = ANY($1::uuid[])`, [
      [tenantA, tenantB],
    ]);
    await pool.query(`DELETE FROM recon_jobs WHERE tenant_id = ANY($1::uuid[])`, [
      [tenantA, tenantB],
    ]);
    if (columns.users) {
      await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[userA, userB]]);
    }
    await pool.query(`DELETE FROM tenants WHERE id = ANY($1::uuid[])`, [[tenantA, tenantB]]);

    const slugA = `recon-int-a-${tenantA.slice(0, 8)}`;
    const slugB = `recon-int-b-${tenantB.slice(0, 8)}`;

    const tenantRowA: Record<string, unknown> = {
      id: tenantA,
      name: "Recon Int A",
      slug: slugA,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      metadata: {},
    };
    const tenantRowB: Record<string, unknown> = {
      id: tenantB,
      name: "Recon Int B",
      slug: slugB,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
      metadata: {},
    };

    await insertRow(pool, "tenants", columns.tenants, tenantRowA);
    await insertRow(pool, "tenants", columns.tenants, tenantRowB);

    if (columns.users) {
      await insertRow(pool, "users", columns.users, {
        id: userA,
        tenant_id: tenantA,
        email: "recon-a@test.local",
        password_hash: "x",
        created_at: new Date(),
        updated_at: new Date(),
      });
      await insertRow(pool, "users", columns.users, {
        id: userB,
        tenant_id: tenantB,
        email: "recon-b@test.local",
        password_hash: "x",
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    const enc = "e".repeat(32);
    const jobBase: Record<string, unknown> = {
      tenant_id: tenantA,
      user_id: userA,
      name: "job",
      source_adapter: "src",
      source_config_encrypted: enc,
      target_adapter: "tgt",
      target_config_encrypted: enc,
      validation_rules: [],
      recon_strategy: "deterministic",
      schedule_timezone: "UTC",
      status: "active",
      version: 1,
      metadata: {},
      deleted_at: null,
    };

    await insertRow(pool, "recon_jobs", columns.reconJobs, {
      ...jobBase,
      id: jobNew,
      name: "job-new",
      created_at: new Date("2024-06-02T12:00:00.000Z"),
      updated_at: new Date("2024-06-02T12:00:00.000Z"),
    });
    await insertRow(pool, "recon_jobs", columns.reconJobs, {
      ...jobBase,
      id: jobOld,
      name: "job-old",
      created_at: new Date("2024-06-01T12:00:00.000Z"),
      updated_at: new Date("2024-06-01T12:00:00.000Z"),
    });

    {
      const ingBase: Record<string, unknown> = {
        tenant_id: tenantA,
        recon_job_id: null,
        status: "completed",
        source_count: 0,
        target_count: 0,
        matched_count: 0,
        unmatched_source_count: 0,
        unmatched_target_count: 0,
        conflict_count: 0,
        metadata: { userId: userA },
        confidence_avg: null,
        error_message: null,
      };
      const tNew = new Date("2024-06-03T12:00:00.000Z");
      const tOld = new Date("2024-06-01T12:00:00.000Z");
      await insertRow(pool, "recon_results", columns.reconResults, {
        ...ingBase,
        id: ingNew,
        started_at: tNew,
        completed_at: tNew,
        created_at: tNew,
        updated_at: tNew,
      });
      await insertRow(pool, "recon_results", columns.reconResults, {
        ...ingBase,
        id: ingOld,
        started_at: tOld,
        completed_at: tOld,
        created_at: tOld,
        updated_at: tOld,
      });
    }

    await insertRow(pool, "recon_jobs", columns.reconJobs, {
      ...jobBase,
      id: otherTenantJob,
      tenant_id: tenantB,
      user_id: userB,
      name: "other-tenant",
      created_at: new Date(),
      updated_at: new Date(),
    });
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

    expect(p2.next_cursor).toBeNull();
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
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const enc = "f".repeat(32);
    await pool.query(`DELETE FROM reconciliation_runs WHERE id = $1`, [collisionId]);
    await pool.query(`DELETE FROM recon_jobs WHERE id = $1`, [collisionId]);

    await insertRow(pool, "recon_jobs", columns.reconJobs, {
      id: collisionId,
      tenant_id: tenantA,
      user_id: userA,
      name: "collision-job",
      source_adapter: "src",
      source_config_encrypted: enc,
      target_adapter: "tgt",
      target_config_encrypted: enc,
      validation_rules: [],
      recon_strategy: "deterministic",
      schedule_timezone: "UTC",
      status: "active",
      version: 1,
      metadata: {},
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    const now = new Date();
    await insertRow(pool, "recon_results", columns.reconResults, {
      id: collisionId,
      tenant_id: tenantA,
      status: "completed",
      started_at: now,
      completed_at: now,
      created_at: now,
      updated_at: now,
      source_count: 0,
      target_count: 0,
      matched_count: 0,
      unmatched_source_count: 0,
      unmatched_target_count: 0,
      metadata: {},
      confidence_avg: null,
      error_message: null,
    });

    try {
      const res = await resolveReconciliationRunForTenant(prisma, tenantA, collisionId);
      expect(res.kind).toBe("ambiguous_uuid_collision");
      if (res.kind === "ambiguous_uuid_collision") {
        expect(res.jobId).toBe(collisionId);
        expect(res.ingestionRunId).toBe(collisionId);
      }
    } finally {
      errSpy.mockRestore();
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
