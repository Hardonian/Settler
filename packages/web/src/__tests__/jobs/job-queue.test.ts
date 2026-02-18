/** @jest-environment node */
/**
 * Job Queue Tests
 *
 * Tests for RLS policies and concurrency controls.
 * Run with: npx jest packages/web/src/__tests__/jobs/job-queue.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { createAdminClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type SupabaseDb = SupabaseClient<Database>;

const hasSupabaseAdminEnv = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
const describeIfSupabase = hasSupabaseAdminEnv ? describe : describe.skip;

describeIfSupabase("Job Queue RLS and Concurrency", () => {
  let adminClient: SupabaseDb;
  let tenantAId: string;
  let tenantBId: string;

  beforeAll(async () => {
    adminClient = await createAdminClient();

    // Create test tenants
    const { data: tenantA } = await adminClient
      .from("tenants")
      .insert({
        name: "Test Tenant A - Job Queue",
        slug: "test-tenant-a-jobs",
        tier: "free_tier",
        status: "active",
        quotas: {},
        config: {},
      })
      .select()
      .single();

    const { data: tenantB } = await adminClient
      .from("tenants")
      .insert({
        name: "Test Tenant B - Job Queue",
        slug: "test-tenant-b-jobs",
        tier: "free_tier",
        status: "active",
        quotas: {},
        config: {},
      })
      .select()
      .single();

    tenantAId = tenantA!.id;
    tenantBId = tenantB!.id;
  });

  afterAll(async () => {
    // Cleanup
    await adminClient.from("jobs").delete().eq("tenant_id", tenantAId);
    await adminClient.from("jobs").delete().eq("tenant_id", tenantBId);
    await adminClient.from("tenants").delete().eq("id", tenantAId);
    await adminClient.from("tenants").delete().eq("id", tenantBId);
  });

  describe("enqueue_job RPC", () => {
    it("should enqueue a job with idempotency", async () => {
      const jobId = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "test_job",
        p_payload: { test: true, data: "hello" },
        p_idempotency_key: "test-idempotency-1",
        p_max_attempts: 3,
      });

      expect(jobId.error).toBeNull();
      expect(jobId.data).toBeTruthy();

      // Enqueue again with same idempotency key should return same job
      const jobId2 = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "test_job",
        p_payload: { test: true, data: "different" },
        p_idempotency_key: "test-idempotency-1",
        p_max_attempts: 3,
      });

      expect(jobId2.data).toBe(jobId.data);
    });

    it("should allow same idempotency key for different tenants", async () => {
      const jobIdA = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "test_job",
        p_payload: {},
        p_idempotency_key: "shared-key",
      });

      const jobIdB = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantBId,
        p_type: "test_job",
        p_payload: {},
        p_idempotency_key: "shared-key",
      });

      expect(jobIdA.data).not.toBe(jobIdB.data);
    });

    it("should schedule job with run_at", async () => {
      const futureDate = new Date(Date.now() + 60000).toISOString();

      const { data: jobId, error } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "scheduled_job",
        p_payload: {},
        p_run_at: futureDate,
      });

      expect(error).toBeNull();

      const { data: job } = await adminClient
        .from("jobs")
        .select("run_at, status")
        .eq("id", jobId)
        .single();

      expect(job?.status).toBe("queued");
      expect(new Date(job?.run_at!).toISOString()).toBe(futureDate);
    });
  });

  describe("RLS - Tenant Isolation", () => {
    it("should enforce tenant isolation on jobs table", async () => {
      // Set tenant context to tenant A
      await adminClient.rpc("set_tenant_context", { tenant_id: tenantAId });

      // Enqueue a job for tenant A
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "rls_test",
        p_payload: { tenant: "A" },
      });

      // With tenant A context, we should see the job
      const { data: jobsA } = await adminClient.from("jobs").select("*").eq("id", jobId);

      expect(jobsA?.length).toBe(1);

      // Switch to tenant B context
      await adminClient.rpc("set_tenant_context", { tenant_id: tenantBId });

      // With tenant B context, we should NOT see tenant A's job
      const { data: jobsB } = await adminClient.from("jobs").select("*").eq("id", jobId);

      expect(jobsB?.length).toBe(0);
    });

    it("should enforce tenant isolation on job_results", async () => {
      // Create a job and result for tenant A
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "result_test",
        p_payload: {},
      });

      // Complete the job with a result
      await adminClient.rpc("complete_job", {
        p_job_id: jobId!,
        p_status: "succeeded",
        p_result_ref: "test-result-ref",
      });

      await adminClient.rpc("store_job_result", {
        p_job_id: jobId!,
        p_result_data: { output: "success" },
      });

      // Set tenant A context and verify access
      await adminClient.rpc("set_tenant_context", { tenant_id: tenantAId });
      const { data: resultsA } = await adminClient
        .from("job_results")
        .select("*")
        .eq("job_id", jobId);

      expect(resultsA?.length).toBe(1);

      // Set tenant B context and verify no access
      await adminClient.rpc("set_tenant_context", { tenant_id: tenantBId });
      const { data: resultsB } = await adminClient
        .from("job_results")
        .select("*")
        .eq("job_id", jobId);

      expect(resultsB?.length).toBe(0);
    });
  });

  describe("claim_jobs - Concurrency", () => {
    it("should claim available jobs with FOR UPDATE SKIP LOCKED", async () => {
      // Enqueue multiple jobs
      const jobIds: string[] = [];
      for (let i = 0; i < 5; i++) {
        const { data } = await adminClient.rpc("enqueue_job", {
          p_tenant_id: tenantAId,
          p_type: "claimable_job",
          p_payload: { index: i },
        });
        jobIds.push(data!);
      }

      // Claim 2 jobs as worker-1
      const { data: claimed1 } = await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-1",
        p_limit: 2,
        p_tenant_id: tenantAId,
      });

      expect(claimed1?.length).toBe(2);
      expect(claimed1?.[0].attempts).toBe(1);
      expect(claimed1?.[0].locked_by).toBeNull(); // Not stored in claim result

      // Verify claimed jobs are now running
      const { data: runningJobs } = await adminClient
        .from("jobs")
        .select("status, locked_by")
        .in("id", claimed1?.map((j: { job_id: string }) => j.job_id) || []);

      expect(runningJobs?.every((j: { status: string }) => j.status === "running")).toBe(true);
      expect(
        runningJobs?.every((j: { locked_by: string | null }) => j.locked_by === "worker-1")
      ).toBe(true);

      // Claim remaining jobs as worker-2
      const { data: claimed2 } = await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-2",
        p_limit: 10,
        p_tenant_id: tenantAId,
      });

      expect(claimed2?.length).toBe(3);
    });

    it("should not claim jobs scheduled for the future", async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "future_job",
        p_payload: {},
        p_run_at: futureDate,
      });

      // Try to claim - should not get the future job
      const { data: claimed } = await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-test",
        p_limit: 10,
        p_tenant_id: tenantAId,
      });

      const found = claimed?.find((j: { job_id: string }) => j.job_id === jobId);
      expect(found).toBeUndefined();
    });

    it("should handle concurrent claims without conflicts", async () => {
      // Create several jobs
      for (let i = 0; i < 10; i++) {
        await adminClient.rpc("enqueue_job", {
          p_tenant_id: tenantAId,
          p_type: "concurrent_test",
          p_payload: { index: i },
        });
      }

      // Simulate concurrent claims from multiple workers
      const workers = ["worker-A", "worker-B", "worker-C"];
      const claims = await Promise.all(
        workers.map((workerId) =>
          adminClient.rpc("claim_jobs", {
            p_worker_id: workerId,
            p_limit: 4,
            p_tenant_id: tenantAId,
          })
        )
      );

      // Collect all claimed job IDs
      const allClaimedIds = claims.flatMap(
        (c) => c.data?.map((j: { job_id: string }) => j.job_id) || []
      );

      // Verify no duplicates (each job claimed by only one worker)
      const uniqueIds = new Set(allClaimedIds);
      expect(uniqueIds.size).toBe(allClaimedIds.length);

      // Total claimed should be 10 (all jobs)
      expect(allClaimedIds.length).toBe(10);
    });
  });

  describe("complete_job and status transitions", () => {
    it("should complete a job successfully", async () => {
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "completable_job",
        p_payload: {},
      });

      // Claim it first
      await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-complete",
        p_limit: 1,
        p_tenant_id: tenantAId,
      });

      // Complete it
      const { data: completed } = await adminClient.rpc("complete_job", {
        p_job_id: jobId!,
        p_status: "succeeded",
        p_result_ref: "s3://bucket/result.json",
      });

      expect(completed).toBe(true);

      // Verify status
      const { data: job } = await adminClient
        .from("jobs")
        .select("status, finished_at, result_ref")
        .eq("id", jobId)
        .single();

      expect(job?.status).toBe("succeeded");
      expect(job?.finished_at).toBeTruthy();
      expect(job?.result_ref).toBe("s3://bucket/result.json");
    });

    it("should mark job as dead after max attempts", async () => {
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "failing_job",
        p_payload: {},
        p_max_attempts: 2,
      });

      // First attempt - fail
      await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-1",
        p_limit: 1,
        p_tenant_id: tenantAId,
      });

      await adminClient.rpc("complete_job", {
        p_job_id: jobId!,
        p_status: "failed",
        p_error: { message: "First failure" },
      });

      // Second attempt - fail again
      await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-2",
        p_limit: 1,
        p_tenant_id: tenantAId,
      });

      await adminClient.rpc("complete_job", {
        p_job_id: jobId!,
        p_status: "failed",
        p_error: { message: "Second failure" },
      });

      // Check job is now dead
      const { data: job } = await adminClient
        .from("jobs")
        .select("status, attempts")
        .eq("id", jobId)
        .single();

      expect(job?.status).toBe("dead");
      expect(job?.attempts).toBe(2);
    });
  });

  describe("heartbeat_job", () => {
    it("should extend lock lease", async () => {
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "long_running_job",
        p_payload: {},
      });

      // Claim it
      await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-heartbeat",
        p_limit: 1,
        p_tenant_id: tenantAId,
      });

      const { data: before } = await adminClient
        .from("jobs")
        .select("locked_at")
        .eq("id", jobId)
        .single();

      // Wait a bit and send heartbeat
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data: heartbeatResult } = await adminClient.rpc("heartbeat_job", {
        p_job_id: jobId!,
        p_worker_id: "worker-heartbeat",
      });

      expect(heartbeatResult).toBe(true);

      const { data: after } = await adminClient
        .from("jobs")
        .select("locked_at")
        .eq("id", jobId)
        .single();

      expect(new Date(after?.locked_at!).getTime()).toBeGreaterThan(
        new Date(before?.locked_at!).getTime()
      );
    });

    it("should reject heartbeat from different worker", async () => {
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "heartbeat_test",
        p_payload: {},
      });

      // Claim as worker-1
      await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker-1",
        p_limit: 1,
        p_tenant_id: tenantAId,
      });

      // Try heartbeat as worker-2
      const { data: heartbeatResult } = await adminClient.rpc("heartbeat_job", {
        p_job_id: jobId!,
        p_worker_id: "worker-2",
      });

      expect(heartbeatResult).toBe(false);
    });
  });

  describe("retry_job", () => {
    it("should retry a dead job", async () => {
      // Create and kill a job
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "retryable_job",
        p_payload: {},
        p_max_attempts: 1,
      });

      await adminClient.rpc("claim_jobs", {
        p_worker_id: "worker",
        p_limit: 1,
        p_tenant_id: tenantAId,
      });

      await adminClient.rpc("complete_job", {
        p_job_id: jobId!,
        p_status: "failed",
      });

      // Verify it's dead
      const { data: before } = await adminClient
        .from("jobs")
        .select("status")
        .eq("id", jobId)
        .single();
      expect(before?.status).toBe("dead");

      // Retry it
      const { data: retried } = await adminClient.rpc("retry_job", {
        p_job_id: jobId!,
        p_delay: "0 seconds",
      });

      expect(retried).toBe(true);

      // Verify it's queued again
      const { data: after } = await adminClient
        .from("jobs")
        .select("status, error, finished_at")
        .eq("id", jobId)
        .single();

      expect(after?.status).toBe("queued");
      expect(after?.error).toBeNull();
      expect(after?.finished_at).toBeNull();
    });
  });

  describe("release_stale_locks", () => {
    it("should release locks from crashed workers", async () => {
      // Create a job and manually set it to running with old lock
      const { data: jobId } = await adminClient.rpc("enqueue_job", {
        p_tenant_id: tenantAId,
        p_type: "stale_lock_test",
        p_payload: {},
      });

      // Manually set as running with old locked_at
      await adminClient
        .from("jobs")
        .update({
          status: "running",
          locked_by: "crashed-worker",
          locked_at: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          attempts: 1,
        })
        .eq("id", jobId);

      // Release stale locks
      const { data: released } = await adminClient.rpc("release_stale_locks", {
        p_stale_threshold: "5 minutes",
      });

      expect(released).toBeGreaterThan(0);

      // Verify job is queued again with backoff
      const { data: job } = await adminClient
        .from("jobs")
        .select("status, locked_by, run_at")
        .eq("id", jobId)
        .single();

      expect(job?.status).toBe("queued");
      expect(job?.locked_by).toBeNull();
      // Should have exponential backoff (2^1 = 2 minutes)
      expect(new Date(job?.run_at!).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("smoke_test job type", () => {
    it("should create test job via create_test_job RPC", async () => {
      const { data: jobId, error } = await adminClient.rpc("create_test_job", {
        p_tenant_id: tenantAId,
        p_test_data: { message: "custom test data" },
      });

      expect(error).toBeNull();
      expect(jobId).toBeTruthy();

      // Verify job properties
      const { data: job } = await adminClient
        .from("jobs")
        .select("type, payload, tenant_id")
        .eq("id", jobId)
        .single();

      expect(job?.type).toBe("smoke_test");
      expect(job?.payload).toEqual({ message: "custom test data" });
      expect(job?.tenant_id).toBe(tenantAId);
    });
  });
});
