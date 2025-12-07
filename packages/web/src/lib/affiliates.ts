/**
 * Affiliate System
 * Manages affiliate partners, conversions, and payouts
 */

import { createClient } from "@/lib/supabase/client";

export interface AffiliateConversion {
  affiliateId: string;
  userId: string;
  conversionType: "signup" | "upgrade" | "renewal";
  revenueAmount: number;
  commissionAmount: number;
}

/**
 * Track affiliate conversion
 */
export async function trackAffiliateConversion(
  affiliateCode: string,
  userId: string,
  conversionType: "signup" | "upgrade" | "renewal",
  revenueAmount: number
): Promise<void> {
  const supabase = createClient();

  // Find affiliate
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("affiliate_code", affiliateCode)
    .eq("status", "active")
    .single();

  if (!affiliate) {
    return; // Invalid or inactive affiliate
  }

  // Calculate commission
  const commissionAmount = (revenueAmount * affiliate.commission_rate) / 100;

  // Create conversion record
  await supabase.from("affiliate_conversions").insert({
    affiliate_id: affiliate.id,
    user_id: userId,
    conversion_type: conversionType,
    revenue_amount: revenueAmount,
    commission_amount: commissionAmount,
    status: "pending",
  });

  // Update affiliate totals
  await supabase
    .from("affiliates")
    .update({
      total_revenue: (affiliate.total_revenue || 0) + revenueAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliate.id);
}

/**
 * Process affiliate payout
 */
export async function processAffiliatePayout(
  affiliateId: string,
  amount: number
): Promise<void> {
  const supabase = createClient();

  // Get pending conversions
  const { data: conversions } = await supabase
    .from("affiliate_conversions")
    .select("*")
    .eq("affiliate_id", affiliateId)
    .eq("status", "pending");

  if (!conversions || conversions.length === 0) {
    return;
  }

  const totalCommission = conversions.reduce((sum, c) => sum + c.commission_amount, 0);

  if (totalCommission < amount) {
    throw new Error("Insufficient commission balance");
  }

  // Mark conversions as paid
  const conversionIds = conversions.map((c) => c.id);
  await supabase
    .from("affiliate_conversions")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .in("id", conversionIds);

  // Update affiliate payouts
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("total_payouts")
    .eq("id", affiliateId)
    .single();

  await supabase
    .from("affiliates")
    .update({
      total_payouts: (affiliate?.total_payouts || 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateId);
}

/**
 * Get affiliate stats
 */
export async function getAffiliateStats(affiliateId: string): Promise<{
  totalRevenue: number;
  totalCommissions: number;
  totalPayouts: number;
  pendingCommissions: number;
  conversionCount: number;
}> {
  const supabase = createClient();

  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("*")
    .eq("id", affiliateId)
    .single();

  if (!affiliate) {
    throw new Error("Affiliate not found");
  }

  const { data: conversions } = await supabase
    .from("affiliate_conversions")
    .select("*")
    .eq("affiliate_id", affiliateId);

  const totalRevenue = affiliate.total_revenue || 0;
  const totalCommissions = conversions?.reduce((sum, c) => sum + c.commission_amount, 0) || 0;
  const totalPayouts = affiliate.total_payouts || 0;
  const pendingCommissions =
    conversions?.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.commission_amount, 0) || 0;
  const conversionCount = conversions?.length || 0;

  return {
    totalRevenue,
    totalCommissions,
    totalPayouts,
    pendingCommissions,
    conversionCount,
  };
}
