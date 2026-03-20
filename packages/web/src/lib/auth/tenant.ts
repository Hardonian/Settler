import { createClient } from "@/lib/supabase/server";

/**
 * Retrieves the currently active tenant ID from the authenticated user's metadata.
 * Only works in Server Components or API routes where cookie access is available.
 */
export async function getActiveTenantId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.user_metadata?.tenant_id || null;
  } catch (error) {
    console.error("[Tenant] Failed to get active tenant ID:", error);
    return null;
  }
}
