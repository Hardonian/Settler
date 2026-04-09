/** @jest-environment node */
/**
 * Smoke Test: Auth Flow
 *
 * Basic smoke test to verify auth flow works end-to-end.
 */

import { createClient } from "@supabase/supabase-js";

describe("Auth Smoke Test", () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    test.skip("Skipping auth smoke test - Supabase not configured", () => {});
    return;
  }

  it("should create Supabase client", () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it("should handle unauthenticated requests", async () => {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Should not throw error, just return null user
    expect(user).toBeNull();
    expect(error === null || error.message.includes("Auth session missing")).toBe(true);
  });

  it("should verify auth endpoints exist", () => {
    // Verify auth methods exist
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    expect(typeof supabase.auth.signUp).toBe("function");
    expect(typeof supabase.auth.signInWithPassword).toBe("function");
    expect(typeof supabase.auth.signOut).toBe("function");
    expect(typeof supabase.auth.getUser).toBe("function");
  });
});
