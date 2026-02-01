/**
 * Milestone tracking and event system
 * Tracks user milestones like first successful setup, activation, etc.
 */

export type MilestoneType =
  | "first_signup"
  | "profile_complete"
  | "first_integration_connected"
  | "first_job_created"
  | "first_successful_run"
  | "first_paid_subscription"
  | "first_100_transactions"
  | "first_1000_transactions"
  | "first_10000_transactions"
  | "activation_complete"
  | "trial_to_paid"
  | "upgrade_to_enterprise";

export interface MilestoneEvent {
  userId: string;
  milestoneType: MilestoneType;
  metadata?: Record<string, unknown>;
}

/**
 * Track a milestone event
 */
export async function trackMilestone(event: MilestoneEvent): Promise<void> {
  try {
    const response = await fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error("Failed to track milestone:", await response.text());
    }
  } catch (_error) {
    console.error("Error tracking milestone:", error);
  }
}

/**
 * Check if a milestone has been achieved
 */
export async function hasMilestone(userId: string, milestoneType: MilestoneType): Promise<boolean> {
  try {
    const response = await fetch(`/api/milestones?userId=${userId}&type=${milestoneType}`);
    if (response.ok) {
      const data = await response.json();
      return data.achieved === true;
    }
    return false;
  } catch (_error) {
    console.error("Error checking milestone:", error);
    return false;
  }
}

/**
 * Get all milestones for a user
 */
export async function getUserMilestones(userId: string): Promise<MilestoneType[]> {
  try {
    const response = await fetch(`/api/milestones?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      return data.milestones || [];
    }
    return [];
  } catch (_error) {
    console.error("Error fetching milestones:", error);
    return [];
  }
}

/**
 * Check for first successful setup milestone
 * This is the key "aha moment" for users
 */
export async function checkFirstSuccessfulSetup(userId: string, jobId: string): Promise<boolean> {
  const hasFirstRun = await hasMilestone(userId, "first_successful_run");
  if (!hasFirstRun) {
    await trackMilestone({
      userId,
      milestoneType: "first_successful_run",
      metadata: { jobId, timestamp: new Date().toISOString() },
    });
    return true;
  }
  return false;
}
