// Edge Function: automated-onboarding-emails
// Purpose: Automatically send onboarding emails based on user signup date and progress
// Trigger: Scheduled (cron) or manual invocation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface User {
  id: string;
  email: string;
  name?: string;
  plan_type: string;
  created_at: string;
  trial_end_date?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const now = new Date();
    const frontendUrl = Deno.env.get("FRONTEND_URL") || Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://settler.dev";

    // Day 0: Welcome email for users who signed up today
    const day0 = new Date(now);
    day0.setDate(day0.getDate() - 0);
    day0.setHours(0, 0, 0, 0);

    const { data: day0Users, error: day0Error } = await supabaseClient
      .from("profiles")
      .select("id, email, name, plan_type, created_at")
      .eq("plan_type", "trial")
      .gte("created_at", day0.toISOString())
      .lt("created_at", new Date(day0.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null);

    if (!day0Error && day0Users) {
      for (const user of day0Users) {
        await sendWelcomeEmail(supabaseClient, user, frontendUrl);
      }
    }

    // Day 1: Onboarding reminder
    const day1 = new Date(now);
    day1.setDate(day1.getDate() - 1);
    day1.setHours(0, 0, 0, 0);

    const { data: day1Users, error: day1Error } = await supabaseClient
      .from("profiles")
      .select("id, email, name, plan_type, created_at")
      .eq("plan_type", "trial")
      .gte("created_at", day1.toISOString())
      .lt("created_at", new Date(day1.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null);

    if (!day1Error && day1Users) {
      for (const user of day1Users) {
        await sendDay1OnboardingEmail(supabaseClient, user, frontendUrl);
      }
    }

    // Day 3: Activation reminder
    const day3 = new Date(now);
    day3.setDate(day3.getDate() - 3);
    day3.setHours(0, 0, 0, 0);

    const { data: day3Users, error: day3Error } = await supabaseClient
      .from("profiles")
      .select("id, email, name, plan_type, created_at")
      .eq("plan_type", "trial")
      .gte("created_at", day3.toISOString())
      .lt("created_at", new Date(day3.getTime() + 24 * 60 * 60 * 1000).toISOString())
      .is("deleted_at", null);

    if (!day3Error && day3Users) {
      for (const user of day3Users) {
        await sendDay3ActivationEmail(supabaseClient, user, frontendUrl);
      }
    }

    // Trial expiration warnings (3 days and 1 day before)
    const { data: expiringTrials, error: expiringError } = await supabaseClient
      .rpc("get_trials_expiring_soon", { p_days_ahead: 3 });

    if (!expiringError && expiringTrials) {
      for (const trial of expiringTrials) {
        if (trial.days_remaining === 3) {
          await sendTrialExpirationWarning(supabaseClient, trial, frontendUrl, 3);
        } else if (trial.days_remaining === 1) {
          await sendTrialExpirationWarning(supabaseClient, trial, frontendUrl, 1);
        }
      }
    }

    // Handle expired trials
    await supabaseClient.rpc("handle_trial_expiration");

    return new Response(
      JSON.stringify({
        success: true,
        processed: {
          day0: day0Users?.length || 0,
          day1: day1Users?.length || 0,
          day3: day3Users?.length || 0,
          expiring: expiringTrials?.length || 0,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function sendWelcomeEmail(
  supabase: any,
  user: User,
  frontendUrl: string
): Promise<void> {
  const subject = `Welcome to Settler, ${user.name || "there"}! 🎉`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Settler</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Welcome to Settler!</h1>
        <p>Hi ${user.name || "there"},</p>
        <p>Thanks for signing up! You now have a <strong>14-day free trial</strong> with full access to all features.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Create your first API key</li>
          <li>Run your first reconciliation</li>
          <li>Parse receipts with AI</li>
        </ul>
        <p style="margin-top: 30px;">
          <a href="${frontendUrl}/console" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Console
          </a>
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </body>
    </html>
  `;

  await logEmailSend(supabase, user.id, "welcome", subject, html);
}

async function sendDay1OnboardingEmail(
  supabase: any,
  user: User,
  frontendUrl: string
): Promise<void> {
  // Check onboarding progress
  const { data: progress } = await supabase
    .from("onboarding_progress")
    .select("step, completed")
    .eq("user_id", user.id);

  const completedSteps = progress?.filter((p: any) => p.completed) || [];
  const nextStep = progress?.find((p: any) => !p.completed)?.step || "first_api_key";

  const subject = `Let's get you started with Settler`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Get Started with Settler</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>Ready to get started?</h1>
        <p>Hi ${user.name || "there"},</p>
        <p>You're ${completedSteps.length} steps into your onboarding. Your next step is: <strong>${nextStep}</strong></p>
        <p style="margin-top: 30px;">
          <a href="${frontendUrl}/console" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Continue Setup
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  await logEmailSend(supabase, user.id, "onboarding_day1", subject, html);
}

async function sendDay3ActivationEmail(
  supabase: any,
  user: User,
  frontendUrl: string
): Promise<void> {
  // Check if onboarding is complete
  const { data: progress } = await supabase
    .from("onboarding_progress")
    .select("step, completed")
    .eq("user_id", user.id);

  const allCompleted = progress?.every((p: any) => p.completed) || false;

  const subject = allCompleted
    ? "You're all set! 🎉"
    : "Complete your setup to unlock full value";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>${allCompleted ? "You're making great progress!" : "Almost there!"}</h1>
        <p>Hi ${user.name || "there"},</p>
        ${allCompleted
      ? "<p>You've completed onboarding! Start using Settler to automate your financial operations.</p>"
      : "<p>Complete your setup to unlock the full power of Settler.</p>"}
        <p style="margin-top: 30px;">
          <a href="${frontendUrl}/console" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${allCompleted ? "Go to Console" : "Complete Setup"}
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  await logEmailSend(supabase, user.id, "activation_day3", subject, html);
}

async function sendTrialExpirationWarning(
  supabase: any,
  trial: any,
  frontendUrl: string,
  daysRemaining: number
): Promise<void> {
  const subject = daysRemaining === 1
    ? "⚠️ Your trial ends tomorrow"
    : `⏰ Your trial ends in ${daysRemaining} days`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1>${subject}</h1>
        <p>Hi ${trial.name || "there"},</p>
        <p>Your 14-day free trial ends in ${daysRemaining} day${daysRemaining > 1 ? "s" : ""}.</p>
        <p>Upgrade to continue using all features:</p>
        <ul>
          <li>100,000 reconciliations/month</li>
          <li>10,000 receipt parses/month</li>
          <li>Unlimited adapters</li>
          <li>Email support</li>
        </ul>
        <p style="margin-top: 30px;">
          <a href="${frontendUrl}/pricing" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Upgrade Now
          </a>
        </p>
      </div>
    </body>
    </html>
  `;

  await logEmailSend(supabase, trial.user_id, `trial_expiring_${daysRemaining}`, subject, html);
}

async function logEmailSend(
  supabase: any,
  userId: string,
  emailType: string,
  subject: string,
  html: string
): Promise<void> {
  // Get user email
  const { data: user } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!user?.email) return;

  // Log email send (actual sending would be done via Resend API in production)
  await supabase.from("email_sends").insert({
    user_id: userId,
    email_address: user.email,
    subject,
    status: "pending",
    metadata: {
      email_type: emailType,
      html_preview: html.substring(0, 200),
    },
  });

  // TODO: Actually send email via Resend API
  // For now, just log it. In production, call Resend API here.
}
