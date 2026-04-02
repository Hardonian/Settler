/** @jest-environment node */

import { resolveRequiredBuildGroups } from "@/lib/env/contract";
import { validateConsoleEnv } from "@/lib/env/validate";

describe("env contract helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    delete process.env.SUPABASE_DATABASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("resolves required groups via aliases", () => {
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_ANON_KEY = "anon-key-value";
    process.env.DIRECT_URL = "postgresql://example";

    const groups = resolveRequiredBuildGroups();

    expect(groups.every((group) => group.satisfied)).toBe(true);
    expect(groups.find((group) => group.label === "Supabase URL")?.via).toBe("SUPABASE_URL");
    expect(groups.find((group) => group.label === "Database connection")?.via).toBe("DIRECT_URL");
  });

  it("keeps missing groups explicit in console validation", () => {
    const validation = validateConsoleEnv();

    expect(validation.valid).toBe(false);
    expect(validation.missing).toContain("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL");
    expect(validation.missing).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY");
  });
});
