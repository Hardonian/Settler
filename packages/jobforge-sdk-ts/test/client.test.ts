import { describe, expect, it, vi } from "vitest";
import { JobForgeClient } from "../src/client";

const tenantId = "00000000-0000-0000-0000-000000000000";

function createClient(rpcImpl: ReturnType<typeof vi.fn>) {
  const supabaseClient = { rpc: rpcImpl } as unknown;
  return new JobForgeClient({
    supabaseUrl: "http://localhost:54321",
    supabaseKey: "test-key",
    supabaseClient: supabaseClient as never,
  });
}

describe("JobForgeClient", () => {
  it("enqueueJob returns data from RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: { id: "job-1" }, error: null });
    const client = createClient(rpc);

    const result = await client.enqueueJob({
      tenant_id: tenantId,
      type: "demo.job",
      payload: { ok: true },
    });

    expect(rpc).toHaveBeenCalledWith(
      "jobforge_enqueue_job",
      expect.objectContaining({
        p_tenant_id: tenantId,
        p_type: "demo.job",
      })
    );
    expect(result).toEqual({ id: "job-1" });
  });

  it("enqueueJob surfaces RPC errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const client = createClient(rpc);

    await expect(
      client.enqueueJob({
        tenant_id: tenantId,
        type: "demo.job",
        payload: { ok: true },
      })
    ).rejects.toThrow("Failed to enqueue job: boom");
  });
});
