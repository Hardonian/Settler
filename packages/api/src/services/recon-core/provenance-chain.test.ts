import crypto from "node:crypto";

function stableStringify(input: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  Object.keys(input)
    .sort()
    .forEach((key) => {
      sorted[key] = input[key];
    });
  return JSON.stringify(sorted);
}

function buildEntryHash(input: {
  previousEntryHash?: string;
  tenantId: string;
  runId: string;
  matchId?: string;
  sequence: number;
  eventType: string;
  actorType: string;
  actorUserId?: string;
  details: Record<string, unknown>;
}): string {
  return crypto
    .createHash("sha256")
    .update(
      [
        input.previousEntryHash ?? "genesis",
        input.tenantId,
        input.runId,
        input.matchId ?? "none",
        String(input.sequence),
        input.eventType,
        input.actorType,
        input.actorUserId ?? "none",
        stableStringify(input.details),
      ].join("|")
    )
    .digest("hex");
}

describe("Provenance chain linking", () => {
  it("uses genesis hash for the first entry", () => {
    const hash1 = buildEntryHash({
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 1,
      eventType: "match_created",
      actorType: "system",
      details: { sourceRecordId: "src-1", targetRecordId: "tgt-1" },
    });

    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("chains subsequent entries to the previous entry hash", () => {
    const hash1 = buildEntryHash({
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 1,
      eventType: "match_created",
      actorType: "system",
      details: { sourceRecordId: "src-1" },
    });

    const hash2 = buildEntryHash({
      previousEntryHash: hash1,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 2,
      eventType: "review_decision",
      actorType: "human",
      actorUserId: "user-1",
      details: { decision: "approved" },
    });

    const hash3 = buildEntryHash({
      previousEntryHash: hash2,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 3,
      eventType: "status_transition",
      actorType: "system",
      details: { fromStatus: "pending", toStatus: "completed" },
    });

    expect(hash1).not.toBe(hash2);
    expect(hash2).not.toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash2).toMatch(/^[a-f0-9]{64}$/);
    expect(hash3).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces different chains when an intermediate entry is tampered with", () => {
    const hash1 = buildEntryHash({
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 1,
      eventType: "match_created",
      actorType: "system",
      details: { sourceRecordId: "src-1" },
    });

    const hash2 = buildEntryHash({
      previousEntryHash: hash1,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 2,
      eventType: "review_decision",
      actorType: "human",
      actorUserId: "user-1",
      details: { decision: "approved" },
    });

    const hash3 = buildEntryHash({
      previousEntryHash: hash2,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 3,
      eventType: "status_transition",
      actorType: "system",
      details: { fromStatus: "pending", toStatus: "completed" },
    });

    const tamperedHash2 = buildEntryHash({
      previousEntryHash: hash1,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 2,
      eventType: "review_decision",
      actorType: "human",
      actorUserId: "user-1",
      details: { decision: "rejected" },
    });

    const tamperedHash3 = buildEntryHash({
      previousEntryHash: tamperedHash2,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 3,
      eventType: "status_transition",
      actorType: "system",
      details: { fromStatus: "pending", toStatus: "completed" },
    });

    expect(hash3).not.toBe(tamperedHash3);
  });

  it("detects deletion of an intermediate entry", () => {
    const hash1 = buildEntryHash({
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 1,
      eventType: "match_created",
      actorType: "system",
      details: { sourceRecordId: "src-1" },
    });

    const hash2 = buildEntryHash({
      previousEntryHash: hash1,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 2,
      eventType: "review_decision",
      actorType: "human",
      actorUserId: "user-1",
      details: { decision: "approved" },
    });

    const hash3 = buildEntryHash({
      previousEntryHash: hash2,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 3,
      eventType: "status_transition",
      actorType: "system",
      details: { fromStatus: "pending", toStatus: "completed" },
    });

    const hashAfterDeletion = buildEntryHash({
      previousEntryHash: hash1,
      tenantId: "tenant-1",
      runId: "run-1",
      sequence: 3,
      eventType: "status_transition",
      actorType: "system",
      details: { fromStatus: "pending", toStatus: "completed" },
    });

    expect(hash3).not.toBe(hashAfterDeletion);
  });
});
