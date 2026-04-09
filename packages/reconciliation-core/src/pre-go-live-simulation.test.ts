/**
 * Executable pre-go-live simulation for merged reconciliation list behavior.
 * Proves (without theatre): determinism under concurrent reads, stable ordering,
 * cursor validity, and tenant-independent merge outcomes when inputs are isolated.
 *
 * This does not substitute for DB integration tests; it exercises the pure merge
 * and cursor layers that back operator list APIs under overlapping poll pressure.
 */

import {
  compareMergeCandidates,
  decodeMergedRunsCursor,
  encodeMergedRunsCursor,
  mergeDualStreamPage,
  type MergeCandidate,
  type MergedRunsCursorV1,
} from "./merged-list-pagination";

type Tagged = { tenant: "A" | "B"; kind: "job" | "ing"; payload: string };

function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Deterministic valid UUIDs for stable lexicographic tie-breaks in merge tests. */
function uuidFromIndex(i: number, stream: "job" | "ing"): string {
  const offset = stream === "job" ? 0 : 50_000;
  const h = (i + offset).toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${h}`;
}

function buildCandidates(
  tenant: "A" | "B",
  jobCount: number,
  ingCount: number,
  random: () => number,
  timeBase: number
): {
  job: MergeCandidate<string>[];
  ing: MergeCandidate<string>[];
} {
  const jobs: MergeCandidate<string>[] = [];
  for (let i = 0; i < jobCount; i += 1) {
    const id = uuidFromIndex(i, "job");
    const sortTimeMs = timeBase + Math.floor(random() * 86_400_000);
    jobs.push({ row: `job-${tenant}-${i}`, sortTimeMs, id });
  }
  const ings: MergeCandidate<string>[] = [];
  for (let i = 0; i < ingCount; i += 1) {
    const id = uuidFromIndex(i, "ing");
    const sortTimeMs = timeBase + Math.floor(random() * 86_400_000);
    ings.push({ row: `ing-${tenant}-${i}`, sortTimeMs, id });
  }
  jobs.sort((a, b) => compareMergeCandidates(a, b));
  ings.sort((a, b) => compareMergeCandidates(a, b));
  return { job: jobs, ing: ings };
}

function mergePage(
  job: MergeCandidate<string>[],
  ing: MergeCandidate<string>[],
  limit: number,
  prev: MergedRunsCursorV1 | null
) {
  return mergeDualStreamPage({
    limit,
    jobCandidates: job,
    ingestionCandidates: ing,
    mapJob: (x) => x,
    mapIngestion: (x) => x,
    prev,
  });
}

describe("pre-go-live simulation (merged runs)", () => {
  it("produces identical pages under concurrent overlapping reads (operator poll storm)", () => {
    const random = seededRng(42);
    const { job, ing } = buildCandidates(
      "A",
      24,
      18,
      random,
      Date.parse("2026-03-01T00:00:00.000Z")
    );
    const limit = 12;
    const expected = mergePage(job, ing, limit, null);

    const concurrent = 64;
    const runs = Array.from({ length: concurrent }, () => mergePage(job, ing, limit, null));

    for (const r of runs) {
      expect(r.items).toEqual(expected.items);
      expect(r.nextCursor).toEqual(expected.nextCursor);
      expect(r.pagination).toEqual(expected.pagination);
    }
  });

  it("keeps independent tenant buffers from cross-merging (isolation of inputs)", () => {
    const rA = seededRng(1);
    const rB = seededRng(2);
    const base = Date.parse("2026-03-15T00:00:00.000Z");
    const a = buildCandidates("A", 8, 6, rA, base);
    const b = buildCandidates("B", 8, 6, rB, base);

    const pageA = mergePage(a.job, a.ing, 20, null);
    const pageB = mergePage(b.job, b.ing, 20, null);

    const rowsA = new Set(pageA.items.map((x) => String(x)));
    const rowsB = new Set(pageB.items.map((x) => String(x)));
    for (const row of rowsA) {
      expect(rowsB.has(row)).toBe(false);
    }
  });

  it("paginates across pages without duplicates when buffers refetch like the API (cursor follows last emitted per stream)", () => {
    const t = Date.parse("2026-06-01T12:00:00.000Z");
    const i1 = { row: "i1", sortTimeMs: t, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" };
    const j1 = { row: "j1", sortTimeMs: t, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
    const j0 = { row: "j0", sortTimeMs: t, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };

    const page1 = mergePage([j1, j0], [i1], 1, null);
    expect(page1.items).toEqual(["i1"]);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = mergePage([j1, j0], [], 1, page1.nextCursor);
    expect(page2.items).toEqual(["j1"]);
    expect(page2.nextCursor).not.toBeNull();

    const page3 = mergePage([j0], [], 1, page2.nextCursor);
    expect(page3.items).toEqual(["j0"]);
    expect(page3.nextCursor).toBeNull();

    const collected = [...page1.items, ...page2.items, ...page3.items];
    expect(new Set(collected).size).toBe(3);
  });

  it("round-trips next_cursor through encode/decode without changing merge semantics on page 2", () => {
    const t = Date.parse("2026-02-01T00:00:00.000Z");
    const jobCandidates: MergeCandidate<string>[] = [
      { row: "j0", sortTimeMs: t, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      { row: "j1", sortTimeMs: t - 1000, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab" },
    ];
    const ingCandidates: MergeCandidate<string>[] = [
      { row: "i0", sortTimeMs: t + 500, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
    ];

    const page1 = mergePage(jobCandidates, ingCandidates, 1, null);
    expect(page1.nextCursor).not.toBeNull();
    const encoded = encodeMergedRunsCursor(page1.nextCursor!);
    const decoded = decodeMergedRunsCursor(encoded);
    const page2 = mergePage(jobCandidates, [], 5, decoded);

    const full = mergePage(jobCandidates, ingCandidates, 5, null);
    expect([...page1.items, ...page2.items]).toEqual(full.items);
  });

  it("surfaces stream exhaustion flags consistently when one stream is empty", () => {
    const t = Date.parse("2026-04-01T00:00:00.000Z");
    const onlyJobs: MergeCandidate<string>[] = [
      { row: "j0", sortTimeMs: t, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
    ];
    const merged = mergePage(onlyJobs, [], 10, null);
    expect(merged.pagination.ingestion_stream_exhausted).toBe(true);
    expect(merged.pagination.job_stream_exhausted).toBe(true);
    expect(merged.items).toHaveLength(1);
  });
});

describe("pre-go-live simulation (tagged interleave)", () => {
  it("preserves total ordering when interleaving job and ingestion streams with shared clock", () => {
    const t0 = Date.parse("2026-05-01T12:00:00.000Z");
    const jobCandidates: MergeCandidate<Tagged>[] = [
      {
        row: { tenant: "A", kind: "job", payload: "a" },
        sortTimeMs: t0,
        id: "11111111-1111-4111-8111-111111111111",
      },
      {
        row: { tenant: "A", kind: "job", payload: "b" },
        sortTimeMs: t0 - 1,
        id: "11111111-1111-4111-8111-111111111112",
      },
    ];
    const ingCandidates: MergeCandidate<Tagged>[] = [
      {
        row: { tenant: "A", kind: "ing", payload: "x" },
        sortTimeMs: t0,
        id: "22222222-2222-4222-8222-222222222222",
      },
    ];

    const merged = mergeDualStreamPage({
      limit: 10,
      jobCandidates,
      ingestionCandidates: ingCandidates,
      mapJob: (r) => r,
      mapIngestion: (r) => r,
      prev: null,
    });

    const keys = merged.items.map((x) => (x as Tagged).payload);
    expect(keys[0]).toBe("x");
    expect(keys[1]).toBe("a");
    expect(keys[2]).toBe("b");
  });
});
