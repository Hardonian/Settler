/** @jest-environment node */

import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api/rate-limit";

const checkMock = jest.fn();
const keyMock = jest.fn();

jest.mock("@/lib/admin/security/rate-limit", () => ({
  rateLimiter: {
    check: (...args: unknown[]) => checkMock(...args),
  },
  getRateLimitKey: (...args: unknown[]) => keyMock(...args),
}));

describe("withRateLimit", () => {
  beforeEach(() => {
    checkMock.mockReset();
    keyMock.mockReset();
    keyMock.mockReturnValue("rate-key");
  });

  function createRequest() {
    return {
      method: "GET",
      headers: new Headers(),
      nextUrl: new URL("https://app.settler.test/api/jobs/123"),
    } as any;
  }

  it("forwards route context args to wrapped handlers", async () => {
    checkMock.mockReturnValue({
      allowed: true,
      remaining: 10,
      resetAt: Date.now() + 60_000,
    });

    const handler = jest.fn(async (_request: any, context: any) =>
      NextResponse.json({ id: (await context.params).id })
    );
    const wrapped = withRateLimit(handler, { maxRequests: 20, windowMs: 60_000 });
    const request = createRequest();
    const context = { params: Promise.resolve({ id: "job-123" }) };

    const response = await wrapped(request, context);
    const payload = await response.json();

    expect(handler).toHaveBeenCalledWith(request, context);
    expect(response.status).toBe(200);
    expect(payload.id).toBe("job-123");
  });

  it("returns 429 when limiter rejects request", async () => {
    checkMock.mockReturnValue({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 10_000,
    });

    const handler = jest.fn(async () => NextResponse.json({ ok: true }));
    const wrapped = withRateLimit(handler, { maxRequests: 1, windowMs: 60_000 });

    const response = await wrapped(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(429);
    expect(payload.error).toBe("Too Many Requests");
    expect(handler).not.toHaveBeenCalled();
  });
});
