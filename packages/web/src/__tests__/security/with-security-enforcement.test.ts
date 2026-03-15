/** @jest-environment node */

import { NextResponse } from "next/server";
import { withSecurity } from "@/lib/middleware/api-security";

const authenticateRequestMock = jest.fn();

jest.mock("@/lib/api/unified-auth", () => ({
  authenticateRequest: (...args: unknown[]) => authenticateRequestMock(...args),
}));

jest.mock("@/lib/api/rate-limit", () => ({
  withRateLimit: (handler: unknown) => handler,
}));

describe("withSecurity enforcement", () => {
  beforeEach(() => {
    authenticateRequestMock.mockReset();
  });

  function createRequest(
    url: string,
    init?: { method?: string; headers?: Record<string, string> }
  ) {
    return {
      method: init?.method ?? "GET",
      headers: new Headers(init?.headers ?? {}),
      nextUrl: new URL(url),
    } as any;
  }

  it("returns 401 when requireAuth is enabled and auth is missing", async () => {
    authenticateRequestMock.mockResolvedValue(null);

    const handler = withSecurity(async () => NextResponse.json({ ok: true }), {
      requireAuth: true,
    });

    const response = await handler(createRequest("https://app.settler.test/api/secure"));
    expect(response.status).toBe(401);
  });

  it("rejects cross-origin browser mutation requests", async () => {
    const handler = withSecurity(async () => NextResponse.json({ ok: true }));

    const response = await handler(
      createRequest("https://app.settler.test/api/secure", {
        method: "POST",
        headers: {
          origin: "https://evil.example",
        },
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload.code).toBe("INVALID_ORIGIN");
  });

  it("allows API key mutation requests without browser origin headers", async () => {
    const handler = withSecurity(async () => NextResponse.json({ ok: true }));

    const response = await handler(
      createRequest("https://app.settler.test/api/secure", {
        method: "POST",
        headers: {
          authorization: "Bearer rk_test_key",
        },
      })
    );

    expect(response.status).toBe(200);
  });
});
