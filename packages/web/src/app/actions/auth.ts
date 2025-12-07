/**
 * Server Actions for Authentication
 *
 * Interdependence Manifesto: These actions are the ONLY channels for client-side writes,
 * ensuring all data flows through Supabase with proper RLS checks.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logging/logger";
import { getAuthErrorMessage } from "@/lib/utils/error-messages";

export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Server Action: User Sign-up
 *
 * Data Flow: Vercel Form → Next.js Server Action → Supabase profiles table (RLS Check) → Profile Page Reload
 */
export async function signUpUser(
  email: string,
  password: string,
  name?: string
): Promise<SignUpResult> {
  try {
    const supabase = await createClient();

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: getAuthErrorMessage(authError),
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: getAuthErrorMessage("Failed to create user"),
      };
    }

    // 2. Create profile in profiles table with trial setup
    const trialStartDate = new Date();
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      user_id: authData.user.id,
      email: authData.user.email!,
      name: name || authData.user.email!.split("@")[0],
      impact_score: 0,
      plan_type: "trial",
      trial_start_date: trialStartDate.toISOString(),
      trial_end_date: trialEndDate.toISOString(),
      pre_test_completed: false,
      pre_test_answers: {},
    } as any);

    if (profileError) {
      // If profile creation fails, we should handle it gracefully
      // The user is created in auth, but profile might already exist
      logger.error("Profile creation error", profileError as Error, {
        userId: authData.user.id,
        email: authData.user.email,
      });
    }

    // 3. Log sign-up activity
    const { error: activityError } = await supabase.from("activity_log").insert({
      user_id: authData.user.id,
      activity_type: "signup",
      entity_type: "profile",
      entity_id: authData.user.id,
      metadata: {
        source: "web_signup",
        timestamp: new Date().toISOString(),
      },
    } as any);

    if (activityError) {
      logger.warn("Activity log error", { error: activityError.message });
      // Don't fail the sign-up if activity logging fails
    }

    // 4. Send welcome email (trial welcome)
    try {
      const { sendTrialWelcomeEmail } = await import("@settler/api/lib/email-lifecycle");
      await sendTrialWelcomeEmail(
        {
          email: authData.user.email!,
          firstName: name || authData.user.email!.split("@")[0],
          planType: "trial",
        },
        {
          trialStartDate: trialStartDate.toISOString(),
          trialEndDate: trialEndDate.toISOString(),
          daysRemaining: 30,
        }
      );
    } catch (emailError) {
      logger.error("Failed to send welcome email", emailError as Error, {
        userId: authData.user.id,
        email: authData.user.email,
      });
      // Don't fail signup if email fails
    }

    // 5. Revalidate relevant paths
    revalidatePath("/");
    revalidatePath("/dashboard");

    return {
      success: true,
      userId: authData.user.id,
    };
  } catch (error) {
    logger.error("Sign-up error", error as Error, { email });
    return {
      success: false,
      error: getAuthErrorMessage(
        error instanceof Error ? error : new Error("An unexpected error occurred")
      ),
    };
  }
}

/**
 * Server Action: Log Activity
 *
 * Tracks user engagement (clicks, scrolls, views) for community metrics
 */
export async function logActivity(
  activityType: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("activity_log").insert({
      user_id: user?.id || null, // Allow anonymous activity
      activity_type: activityType,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || {},
    } as any);

    if (error) {
      logger.error("Activity log error", error as Error, {
        activityType,
        entityType,
        entityId,
      });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error("Log activity error", error as Error, {
      activityType,
      entityType,
      entityId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to log activity",
    };
  }
}
