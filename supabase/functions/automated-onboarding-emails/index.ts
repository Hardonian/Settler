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
  // Import premium template
  const { getWelcomeEmailTemplate, getPlainTextVersion } = await import(
    "https://esm.sh/@settler/api/services/email/premium-templates"
  ).catch(() => {
    // Fallback if import fails
    return {
      getWelcomeEmailTemplate: () => "",
      getPlainTextVersion: () => "",
    };
  });

  // Get trial end date
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_end_date")
    .eq("id", user.id)
    .single();

  const trialEndDate = profile?.trial_end_date
    ? new Date(profile.trial_end_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "14 days from now";

  const html = getWelcomeEmailTemplate({
    name: user.name || undefined,
    dashboardUrl: `${frontendUrl}/console`,
    trialEndDate,
  });

  const text = getPlainTextVersion(html);
  const subject = `Welcome to Settler, ${user.name || "there"}! 🎉`;

  await sendEmailViaResend(user.email, subject, html, text, supabase, user.id, "welcome");
}

async function sendDay1OnboardingEmail(
  supabase: any,
  user: User,
  frontendUrl: string
): Promise<void> {
  const { getDay1OnboardingEmailTemplate, getPlainTextVersion } = await import("./email-templates.ts");
  
  // Check onboarding progress
  const { data: progress } = await supabase
    .from("onboarding_progress")
    .select("step, completed")
    .eq("user_id", user.id);

  const completedSteps = progress?.filter((p: any) => p.completed) || [];
  const completionPercentage = Math.round((completedSteps.length / 6) * 100);
  const nextStep = progress?.find((p: any) => !p.completed)?.step || "first_api_key";

  const html = getDay1OnboardingEmailTemplate({
    name: user.name || undefined,
    dashboardUrl: `${frontendUrl}/console`,
    nextStep,
    completionPercentage: String(completionPercentage),
  });

  const text = getPlainTextVersion(html);
  const subject = `Let's get you started with Settler`;

  await sendEmailViaResend(user.email, subject, html, text, supabase, user.id, "onboarding_day1");
}

async function sendDay3ActivationEmail(
  supabase: any,
  user: User,
  frontendUrl: string
): Promise<void> {
  const { getDay3ActivationEmailTemplate, getPlainTextVersion } = await import("./email-templates.ts");
  
  // Check if onboarding is complete
  const { data: progress } = await supabase
    .from("onboarding_progress")
    .select("step, completed")
    .eq("user_id", user.id);

  const hasCompletedFirstJob = progress?.some((p: any) => p.step === "first_job" && p.completed) || false;

  const html = getDay3ActivationEmailTemplate({
    name: user.name || undefined,
    dashboardUrl: `${frontendUrl}/console`,
    hasCompletedFirstJob: hasCompletedFirstJob ? "true" : "false",
  });

  const text = getPlainTextVersion(html);
  const subject = hasCompletedFirstJob
    ? "You're all set! 🎉"
    : "Complete your setup to unlock full value";

  await sendEmailViaResend(user.email, subject, html, text, supabase, user.id, "activation_day3");
}

async function sendTrialExpirationWarning(
  supabase: any,
  trial: any,
  frontendUrl: string,
  daysRemaining: number
): Promise<void> {
  const { getTrialExpirationWarningTemplate, getPlainTextVersion } = await import("./email-templates.ts");
  
  const html = getTrialExpirationWarningTemplate({
    name: trial.name || undefined,
    upgradeUrl: `${frontendUrl}/pricing`,
    daysRemaining: String(daysRemaining),
    reconciliations: String(trial.reconciliations || 0),
  });

  const text = getPlainTextVersion(html);
  const subject = daysRemaining === 1
    ? "⚠️ Your trial ends tomorrow"
    : `⏰ Your trial ends in ${daysRemaining} days`;

  await sendEmailViaResend(trial.email, subject, html, text, supabase, trial.user_id, `trial_expiring_${daysRemaining}`);
}

async function sendEmailViaResend(
  email: string,
  subject: string,
  html: string,
  text: string,
  supabase: any,
  userId: string,
  emailType: string
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not configured, logging email send only");
    await logEmailSend(supabase, userId, emailType, subject, html);
    return;
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "Settler <noreply@settler.dev>",
        to: email,
        subject,
        html,
        text,
      }),
    });

    if (resendResponse.ok) {
      const result = await resendResponse.json();
      await logEmailSend(supabase, userId, emailType, subject, html, result.id);
    } else {
      const error = await resendResponse.text();
      console.error("Resend API error:", error);
      await logEmailSend(supabase, userId, emailType, subject, html);
    }
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    await logEmailSend(supabase, userId, emailType, subject, html);
  }
}

async function logEmailSend(
  supabase: any,
  userId: string,
  emailType: string,
  subject: string,
  html: string,
  resendId?: string
): Promise<void> {
  // Get user email
  const { data: user } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!user?.email) return;

  // Log email send
  await supabase.from("email_sends").insert({
    user_id: userId,
    email_address: user.email,
    subject,
    status: resendId ? "sent" : "pending",
    sent_at: resendId ? new Date().toISOString() : null,
    metadata: {
      email_type: emailType,
      html_preview: html.substring(0, 200),
      resend_id: resendId,
    },
  });
}
