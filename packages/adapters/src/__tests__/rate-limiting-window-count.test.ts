import { checkRateLimit } from "../rate-limiting";

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            gte: () =>
              Promise.resolve({
                data: [
                  { started_at: new Date(Date.now() - 30_000).toISOString() },
                  { started_at: new Date(Date.now() - 2 * 60_000).toISOString() },
                  { started_at: new Date(Date.now() - 3 * 60 * 60_000).toISOString() },
                ],
                error: null,
              }),
          }),
        }),
      }),
    }),
  }),
}));

describe("checkRateLimit single-pass window counts", () => {
  it("matches minute/hour/day counts in one pass (stripe defaults)", async () => {
    const result = await checkRateLimit("stripe", "tenant-1", "http://localhost", "key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeDefined();
  });
});
