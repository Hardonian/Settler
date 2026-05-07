import { checkRateLimit } from "../rate-limiting";
import { createClient } from "@supabase/supabase-js";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(),
}));

describe("checkRateLimit error handling and limit exceeded", () => {
  const mockGte = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              gte: mockGte,
            }),
          }),
        }),
      }),
    });
  });

  it("returns allowed=false when requestsPerMinute limit is exceeded", async () => {
    // Etsy limits: 10 per minute
    mockGte.mockResolvedValueOnce({
      data: Array(10).fill({ started_at: new Date().toISOString() }),
      error: null,
    });

    const result = await checkRateLimit("etsy", "tenant-1", "http://localhost", "key");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(60);
    expect(result.remaining).toBe(0);
  });

  it("returns allowed=false when requestsPerHour limit is exceeded", async () => {
    // Etsy limits: 100 per hour
    // Put them 5 minutes ago so they don't trigger the minute limit
    mockGte.mockResolvedValueOnce({
      data: Array(100).fill({ started_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() }),
      error: null,
    });

    const result = await checkRateLimit("etsy", "tenant-1", "http://localhost", "key");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(3600);
    expect(result.remaining).toBe(0);
  });

  it("returns allowed=false when requestsPerDay limit is exceeded", async () => {
    // Etsy limits: 1000 per day
    // Put them 2 hours ago so they don't trigger the hour limit
    mockGte.mockResolvedValueOnce({
      data: Array(1000).fill({
        started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      }),
      error: null,
    });

    const result = await checkRateLimit("etsy", "tenant-1", "http://localhost", "key");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(86400);
    expect(result.remaining).toBe(0);
  });

  it("handles underlying store errors gracefully (fail-open)", async () => {
    mockGte.mockResolvedValueOnce({
      data: null,
      error: { message: "Database connection failed" },
    });

    const result = await checkRateLimit("etsy", "tenant-1", "http://localhost", "key");
    // Fails open by assuming no requests if there's an error
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeDefined();
  });
});
