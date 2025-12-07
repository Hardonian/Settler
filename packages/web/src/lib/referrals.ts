/**
 * Referral Program System
 * Tracks referrals, generates codes, and manages rewards
 */

import { createClient } from "@/lib/supabase/client";

export interface ReferralReward {
  referrerUserId: string;
  rewardAmount: number;
  rewardCurrency: string;
  status: "pending" | "completed" | "rewarded";
}

/**
 * Generate unique referral code for user
 */
export async function generateReferralCode(userId: string): Promise<string> {
  const supabase = createClient();

  // Check if user already has a referral code
  const { data: existing } = await supabase
    .from("referrals")
    .select("referral_code")
    .eq("referrer_user_id", userId)
    .limit(1)
    .single();

  if (existing) {
    return (existing as any).referral_code;
  }

  // Generate new code (user initials + random)
  const { data: user } = await supabase.from("users").select("email").eq("id", userId).single();
  const initials = (user as any)?.email?.substring(0, 2).toUpperCase() || "US";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const code = `${initials}${random}`;

  // Create referral record
  await supabase.from("referrals").insert({
    referrer_user_id: userId,
    referral_code: code,
    status: "pending",
  } as any);

  return code;
}

/**
 * Apply referral code (when new user signs up)
 */
export async function applyReferralCode(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; referrerUserId?: string; error?: string }> {
  const supabase = createClient();

  // Find referral
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referral_code", referralCode.toUpperCase())
    .eq("status", "pending")
    .single();

  if (!referral) {
    return { success: false, error: "Invalid referral code" };
  }

  // Check if user is referring themselves
  if ((referral as any).referrer_user_id === newUserId) {
    return { success: false, error: "Cannot use your own referral code" };
  }

  // Update referral
  const { error: updateError } = await supabase
    .from("referrals")
    .update({
      referred_user_id: newUserId,
      status: "completed",
      completed_at: new Date().toISOString(),
    } as any)
    .eq("id", (referral as any).id);

  if (updateError) {
    return { success: false, error: "Failed to apply referral code" };
  }

  // Award reward (when referred user upgrades to paid)
  // This will be triggered when the referred user upgrades

  return { success: true, referrerUserId: (referral as any).referrer_user_id };
}

/**
 * Award referral reward (when referred user upgrades)
 */
export async function awardReferralReward(
  referredUserId: string,
  rewardAmount: number = 25.0,
  rewardCurrency: string = "USD"
): Promise<void> {
  const supabase = createClient();

  // Find referral
  const { data: referral } = await supabase
    .from("referrals")
    .select("*")
    .eq("referred_user_id", referredUserId)
    .eq("status", "completed")
    .single();

  if (!referral) {
    return; // No referral found
  }

  // Update referral with reward
  await supabase
    .from("referrals")
    .update({
      status: "rewarded",
      reward_amount: rewardAmount,
      reward_currency: rewardCurrency,
      updated_at: new Date().toISOString(),
    } as any)
    .eq("id", (referral as any).id);

  // TODO: Send reward to referrer (credit account, send gift card, etc.)
}

/**
 * Get user's referral stats
 */
export async function getReferralStats(userId: string): Promise<{
  referralCode: string;
  totalReferrals: number;
  completedReferrals: number;
  totalRewards: number;
}> {
  const supabase = createClient();

  // Get referral code
  const code = await generateReferralCode(userId);

  // Get stats
  const { data: referrals } = await supabase
    .from("referrals")
    .select("*")
    .eq("referrer_user_id", userId);

  const totalReferrals = referrals?.length || 0;
  const completedReferrals =
    referrals?.filter((r: any) => r.status === "completed" || r.status === "rewarded").length || 0;
  const totalRewards =
    referrals?.reduce((sum: number, r: any) => sum + (r.reward_amount || 0), 0) || 0;

  return {
    referralCode: code,
    totalReferrals,
    completedReferrals,
    totalRewards,
  };
}
