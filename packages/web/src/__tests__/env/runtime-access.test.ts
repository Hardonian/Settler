/** @jest-environment node */

import { getAppEnvStatus } from "@/lib/env/runtime-access";

describe("runtime env access contract", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("accepts server-prefixed fallbacks for app required env keys", () => {
    process.env.SUPABASE_URL = "https://fallback.supabase.co";
    process.env.SUPABASE_ANON_KEY = "fallback-anon";

    const status = getAppEnvStatus();

    expect(status.ok).toBe(true);
    expect(status.missing).toEqual([]);
  });

  it("reports missing grouped requirements when both variants are absent", () => {
    const status = getAppEnvStatus();

    expect(status.ok).toBe(false);
    expect(status.missing).toContain("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
    expect(status.missing).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY");
  });
});
