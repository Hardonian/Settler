/**
 * Auth Callback Route Handler
 *
 * Implements server-side PKCE auth code exchange for Supabase SSR.
 * Safely validates redirect target against open-redirect attacks.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/console";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Prevent open redirect attacks: ensure destination is relative and not protocol-relative
        const isSafePath = next.startsWith("/") && !next.startsWith("//");
        const redirectUrl = isSafePath ? `${origin}${next}` : `${origin}/console`;
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      // Fall through to error redirect
    }
  }

  // Redirect to login with error parameter if exchange fails or code is missing
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
