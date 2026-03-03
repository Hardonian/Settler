import { getIdempotent, storeIdempotent } from "@/lib/api/v1/recon/core";

describe("recon api idempotency", () => {
  it("replays same payload for same tenant/key", () => {
    const key = `idem-${Date.now()}`;
    const body = { name: "run" };
    const first = getIdempotent("tenant-a", key, body);
    expect((first as { replay?: unknown }).replay).toBeNull();

    storeIdempotent("tenant-a", key, first.reqHash, { id: "run_1" });
    const replay = getIdempotent("tenant-a", key, body);
    expect((replay as { replay?: { id: string } }).replay?.id).toBe("run_1");
  });

  it("isolates idempotency by tenant", () => {
    const key = `idem-shared-${Date.now()}`;
    const body = { name: "run" };
    const t1 = getIdempotent("tenant-1", key, body);
    storeIdempotent("tenant-1", key, t1.reqHash, { id: "run_1" });

    const t2 = getIdempotent("tenant-2", key, body);
    expect((t2 as { replay?: unknown }).replay).toBeNull();
  });
});
