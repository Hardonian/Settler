import {
  compareMergeCandidates,
  decodeMergedRunsCursor,
  encodeMergedRunsCursor,
  mergeDualStreamPage,
  MergedRunsCursorError,
} from "./merged-list-pagination";

describe("merged list pagination", () => {
  it("encodes and decodes a v1 cursor round-trip", () => {
    const state = {
      v: 1 as const,
      ij: { t: "2024-01-02T00:00:00.000Z", id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      ir: null,
    };
    const enc = encodeMergedRunsCursor(state);
    expect(decodeMergedRunsCursor(enc)).toEqual(state);
  });

  it("rejects invalid cursor JSON", () => {
    expect(() => decodeMergedRunsCursor("!!!")).toThrow(MergedRunsCursorError);
  });

  it("merges two streams deterministically with tie-break on id", () => {
    const t = new Date("2024-06-01T12:00:00.000Z").getTime();
    const jobCandidates = [
      { row: "j1", sortTimeMs: t, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
      { row: "j0", sortTimeMs: t, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    ];
    const ingCandidates = [
      { row: "i1", sortTimeMs: t, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" },
    ];
    const merged = mergeDualStreamPage({
      limit: 2,
      jobCandidates,
      ingestionCandidates: ingCandidates,
      mapJob: (x) => x,
      mapIngestion: (x) => x,
      prev: null,
    });
    expect(merged.items).toEqual(["i1", "j1"]);
    expect(merged.nextCursor).not.toBeNull();
  });

  it("compareMergeCandidates orders higher sort time first", () => {
    const a = { row: "a", sortTimeMs: 100, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
    const b = { row: "b", sortTimeMs: 200, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
    expect(compareMergeCandidates(a, b)).toBeGreaterThan(0);
  });
});
