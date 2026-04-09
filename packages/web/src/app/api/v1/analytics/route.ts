/**
 * Client-side UX analytics ingest endpoint
 *
 * Accepts batches of UX events from the browser and persists them to
 * activity_log via the Supabase admin client.  No auth required — events
 * are anonymous by design.  Rate-limited to prevent abuse.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withSecurity(
  async function POST(request: Request) {
    try {
      const body = await request.json();

      // Accept either a single event or a batch array
      const events: unknown[] = Array.isArray(body) ? body : [body];

      if (events.length === 0) {
        return NextResponse.json({ ok: true, received: 0 });
      }

      // Cap batch size
      const batch = events.slice(0, 50);

      const admin = await createAdminClient();

      const rows = batch.map((ev) => {
        const event = ev as Record<string, unknown>;
        return {
          activity_type: String(event.type ?? "ux_event"),
          entity_type: "ux",
          metadata: {
            id: event.id,
            route: event.route,
            timestamp: event.timestamp,
            ...(event as Record<string, unknown>),
          },
        };
      });

      const { error } = await admin.from("activity_log").insert(rows);

      if (error) {
        // Log server-side but return 200 to client — analytics must not surface errors
        console.error("[analytics] activity_log insert failed:", error.message);
      }

      return NextResponse.json({ ok: true, received: batch.length });
    } catch (err) {
      console.error("[analytics] unexpected error:", err);
      return NextResponse.json({ ok: true, received: 0 });
    }
  },
  { rateLimit: { windowMs: 10000, maxRequests: 30 }, requireAuth: false }
);
