/**
 * User Dashboard Data Access
 *
 * Fetches user-specific dashboard data from Supabase
 */

import { createClient } from "@/lib/supabase/server";

interface ProfileRow {
  id: string;
  email?: string;
  name?: string;
  plan_type?: string;
  trial_end_date?: string;
  industry?: string;
  company_name?: string;
  pre_test_completed?: boolean;
  pre_test_answers?: Record<string, unknown>;
  first_name?: string;
  [key: string]: unknown;
}


export interface UserDashboardData {
  user: {
    id: string;
    email: string;
    firstName?: string;
    planType: "free" | "trial" | "commercial" | "enterprise";
    trialEndDate?: string;
    industry?: string;
    companyName?: string;
    preTestCompleted: boolean;
  };
  usage: {
    reconciliations: {
      current: number;
      limit: number | "unlimited";
    };
    playgroundRuns: {
      current: number;
      limit: number | "unlimited";
    };
  };
  recentJobs: Array<{
    id: string;
    name: string;
    status: "completed" | "running" | "failed";
    matchedCount: number;
    unmatchedCount: number;
    accuracy: number;
    createdAt: string;
  }>;
  metrics: {
    totalReconciliations: number;
    averageAccuracy: number;
    timeSaved: number;
    jobsCreated: number;
  };
  isFirstVisit: boolean;
}

/**
 * Fetch user dashboard data
 */
export async function getUserDashboardData(): Promise<UserDashboardData | null> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single<ProfileRow>();

    if (profileError || !profile) {
      return null;
    }

    // Check if first visit (no activity log entries)
    const { count: activityCount } = await supabase
      .from("activity_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id);

    const isFirstVisit = (activityCount || 0) === 0;

    // Get usage stats (in production, calculate from actual usage)
    const planType = (profile?.plan_type as "free" | "trial" | "commercial" | "enterprise") || "free";
    const usage = {
      reconciliations: {
        current: 0, // Calculate from reconciliation jobs
        limit: (planType === "trial" || planType === "commercial" ? "unlimited" : 1000) as
          | number
          | "unlimited",
      },
      playgroundRuns: {
        current: 0, // Calculate from playground usage
        limit: (planType === "trial" || planType === "commercial" ? "unlimited" : 3) as
          | number
          | "unlimited",
      },
    };

    // Get recent jobs (in production, fetch from jobs table)
    const recentJobs: UserDashboardData["recentJobs"] = [];

    // Calculate metrics (in production, calculate from actual data)
    const metrics = {
      totalReconciliations: 0,
      averageAccuracy: 0,
      timeSaved: 0,
      jobsCreated: 0,
    };

    return {
      user: {
        id: profile?.id || "",
        email: profile?.email || "",
        firstName: profile?.name && typeof profile.name === 'string' ? profile.name.split(" ")[0] : undefined,
        planType: planType,
        trialEndDate: profile?.trial_end_date,
        industry: profile?.industry,
        companyName: profile?.company_name,
        preTestCompleted: profile?.pre_test_completed || false,
      },
      usage,
      recentJobs,
      metrics,
      isFirstVisit,
    };
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    return null;
  }
}

/**
 * Save pre-test questionnaire answers
 */
export async function savePreTestAnswers(
  answers: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Type the update data to match database schema
    const updateData: {
      pre_test_completed: boolean;
      pre_test_answers: Record<string, any>;
      updated_at: string;
      industry?: string;
    } = {
      pre_test_completed: true,
      pre_test_answers: answers,
      updated_at: new Date().toISOString(),
      ...(answers.industry && { industry: answers.industry }),
    };

    const { error } = await (supabase
      .from("profiles") as any)
      .update(updateData)
      .eq("id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save answers",
    };
  }
}
