import { clearPendingRequests, withDeduplication } from "../utils/deduplication";

describe("withDeduplication", () => {
  beforeEach(() => {
    clearPendingRequests();
  });

  it("deduplicates concurrent identical keys", async () => {
    let calls = 0;
    const p1 = withDeduplication("GET", "/x", {}, async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return 1;
    });
    const p2 = withDeduplication("GET", "/x", {}, async () => {
      calls += 1;
      return 2;
    });
    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(calls).toBe(1);
  });
});
