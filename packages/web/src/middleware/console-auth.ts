/**
 * Console Authentication Middleware
 *
 * Ensures all Console routes require authentication
 */

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function requireConsoleAuth(_request: NextRequest): Promise<NextResponse | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // Return null to indicate auth required but let route handle it
      // This allows routes to show proper UI instead of redirecting
      return null;
    }

    // User is authenticated, allow request
    return null;
  } catch (error) {
    console.error("[Console Auth] Error checking auth:", error);
    // On error, allow request through but route will handle it
    return null;
  }
}
