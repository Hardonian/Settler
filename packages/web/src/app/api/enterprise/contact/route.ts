/**
 * Enterprise Contact API Route
 *
 * Handles enterprise demo requests and sales inquiries.
 * Logs to activity_log and notifies sales team via Resend.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { withUniversalBillingGate } from "@/middleware/billing-gate-universal";
import { appLogger } from "@/lib/utils/logger";
import { withSecurity } from "@/lib/middleware/api-security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withSecurity(
  withUniversalBillingGate(
    async function POST(request: Request) {
      try {
        const body = await request.json();
        const { name, email, company, message } = body;

        if (!name || !email || !company) {
          return NextResponse.json(
            { error: "Name, email, and company are required" },
            { status: 400 }
          );
        }

        const contactMeta = {
          name,
          email,
          company,
          message: message || "",
          source: "web_form",
        };

        // Persist to activity_log via Supabase admin client
        try {
          const admin = await createAdminClient();
          await admin.from("activity_log").insert({
            activity_type: "enterprise_contact_request",
            entity_type: "enterprise",
            metadata: contactMeta,
          });
        } catch (dbErr) {
          appLogger.error("[Enterprise Contact] DB insert failed", dbErr);
          // non-fatal — continue to email
        }

        // Notify sales team via Resend
        const salesEmail =
          process.env.ENTERPRISE_SALES_EMAIL ||
          process.env.RESEND_FROM_EMAIL ||
          "sales@settler.dev";
        await sendTransactionalEmail({
          to: salesEmail,
          subject: `New enterprise inquiry: ${company}`,
          html: `<h2>New enterprise contact request</h2>
<table>
  <tr><td><strong>Name</strong></td><td>${name}</td></tr>
  <tr><td><strong>Email</strong></td><td>${email}</td></tr>
  <tr><td><strong>Company</strong></td><td>${company}</td></tr>
  <tr><td><strong>Message</strong></td><td>${message || "(none)"}</td></tr>
</table>`,
        });

        // Send acknowledgement to the prospect
        await sendTransactionalEmail({
          to: email,
          subject: "We received your Settler inquiry",
          html: `<p>Hi ${name},</p>
<p>Thanks for reaching out. A member of our team will be in touch within one business day.</p>
<p>In the meantime, you can explore our <a href="https://settler.dev/docs">documentation</a> or book a call directly.</p>
<p>— The Settler team</p>`,
        });

        return NextResponse.json({
          success: true,
          message: "Thank you! Our team will be in touch within one business day.",
        });
      } catch (error) {
        appLogger.error("[Enterprise Contact] Error", error);
        return NextResponse.json(
          {
            success: false,
            error: "Failed to submit request. Please try again or email enterprise@settler.dev",
          },
          { status: 200 }
        );
      }
    },
    { feature: "POST API" }
  ),
  { rateLimit: { windowMs: 60000, maxRequests: 10 }, requireAuth: false }
);
