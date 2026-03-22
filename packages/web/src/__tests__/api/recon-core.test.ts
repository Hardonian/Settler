import { getIdempotent, storeIdempotent } from "@/lib/api/v1/recon/core";

// Prevent real Redis connection attempts during unit tests
jest.mock("@/lib/redis/client", () => ({
  getRedisClient: jest.fn(async () => null),
}));

describe("recon api idempotency", () => {
  it("replays same payload for same tenant/key", async () => {
    const key = `idem-${Date.now()}`;
    const body = { name: "run" };
    const first = await getIdempotent("tenant-a", key, body);
    expect((first as { replay?: unknown }).replay).toBeNull();

    await storeIdempotent("tenant-a", key, first.reqHash, { id: "run_1" });
    const replay = await getIdempotent("tenant-a", key, body);
    expect((replay as { replay?: { id: string } }).replay?.id).toBe("run_1");
  });

  it("isolates idempotency by tenant", async () => {
    const key = `idem-shared-${Date.now()}`;
    const body = { name: "run" };
    const t1 = await getIdempotent("tenant-1", key, body);
    await storeIdempotent("tenant-1", key, t1.reqHash, { id: "run_1" });

    const t2 = await getIdempotent("tenant-2", key, body);
    expect((t2 as { replay?: unknown }).replay).toBeNull();
  });
});
