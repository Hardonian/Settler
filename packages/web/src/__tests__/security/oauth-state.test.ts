/** @jest-environment node */

import { createOAuthState, verifyOAuthState } from "@/lib/security/oauth-state";

describe("oauth state security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      OAUTH_STATE_SIGNING_KEY: "x".repeat(64),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("accepts valid signed state bound to user and provider", () => {
    const state = createOAuthState({
      connectorId: "connector-1",
      tenantId: "tenant-1",
      providerId: "stripe",
      userId: "user-1",
    });

    const verified = verifyOAuthState(state, {
      providerId: "stripe",
      userId: "user-1",
    });

    expect(verified).not.toBeNull();
    expect(verified?.connectorId).toBe("connector-1");
    expect(verified?.tenantId).toBe("tenant-1");
  });

  it("rejects state when actor binding mismatches", () => {
    const state = createOAuthState({
      connectorId: "connector-1",
      tenantId: "tenant-1",
      providerId: "stripe",
      userId: "user-1",
    });

    const verified = verifyOAuthState(state, {
      providerId: "stripe",
      userId: "user-2",
    });

    expect(verified).toBeNull();
  });

  it("rejects tampered state", () => {
    const state = createOAuthState({
      connectorId: "connector-1",
      tenantId: "tenant-1",
      providerId: "stripe",
      userId: "user-1",
    });

    const [payload, signature] = state.split(".");
    const tampered = `${payload}A.${signature}`;

    expect(
      verifyOAuthState(tampered, {
        providerId: "stripe",
        userId: "user-1",
      })
    ).toBeNull();
  });
});
