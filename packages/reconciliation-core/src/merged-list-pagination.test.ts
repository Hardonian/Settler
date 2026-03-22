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

  it("rejects limit outside 1..500", () => {
    const t = new Date("2024-06-01T12:00:00.000Z").getTime();
    const one = [{ row: "j", sortTimeMs: t, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }];
    expect(() =>
      mergeDualStreamPage({
        limit: 0,
        jobCandidates: one,
        ingestionCandidates: [],
        mapJob: (x) => x,
        mapIngestion: (x) => x,
        prev: null,
      })
    ).toThrow(MergedRunsCursorError);
    expect(() =>
      mergeDualStreamPage({
        limit: 501,
        jobCandidates: one,
        ingestionCandidates: [],
        mapJob: (x) => x,
        mapIngestion: (x) => x,
        prev: null,
      })
    ).toThrow(MergedRunsCursorError);
  });

  it("paginates deterministically across pages when one stream exhausts mid-sequence", () => {
    const t = new Date("2024-06-01T12:00:00.000Z").getTime();
    const i1 = { row: "i1", sortTimeMs: t, id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc" };
    const j1 = { row: "j1", sortTimeMs: t, id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
    const j0 = { row: "j0", sortTimeMs: t, id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };

    const page1 = mergeDualStreamPage({
      limit: 1,
      jobCandidates: [j1, j0],
      ingestionCandidates: [i1],
      mapJob: (x) => x,
      mapIngestion: (x) => x,
      prev: null,
    });
    expect(page1.items).toEqual(["i1"]);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = mergeDualStreamPage({
      limit: 1,
      jobCandidates: [j1, j0],
      ingestionCandidates: [],
      mapJob: (x) => x,
      mapIngestion: (x) => x,
      prev: page1.nextCursor,
    });
    expect(page2.items).toEqual(["j1"]);
    expect(page2.nextCursor).not.toBeNull();

    const page3 = mergeDualStreamPage({
      limit: 1,
      jobCandidates: [j0],
      ingestionCandidates: [],
      mapJob: (x) => x,
      mapIngestion: (x) => x,
      prev: page2.nextCursor,
    });
    expect(page3.items).toEqual(["j0"]);
    expect(page3.nextCursor).toBeNull();
  });
});
