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
    .from("affiliate_programs")
    .select("*")
    .eq("referral_code", affiliateCode)
    .eq("status", "active")
    .single();

  if (!affiliate) {
    return; // Invalid or inactive affiliate
  }

  // Calculate commission
  const affiliateData = affiliate as { id: string; commission_rate?: number; total_revenue?: number };
  const commissionAmount = (revenueAmount * (affiliateData.commission_rate || 0)) / 100;

  // Create conversion record
  await (supabase.from("affiliate_conversions") as any).insert({
    affiliate_id: affiliateData.id,
    user_id: userId,
    conversion_type: conversionType,
    revenue_amount: revenueAmount,
    commission_amount: commissionAmount,
    status: "pending",
  });

  // Update affiliate totals
  await (supabase
    .from("affiliate_programs") as any)
    .update({
      total_revenue: (affiliateData.total_revenue || 0) + revenueAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", affiliateData.id);
}

/**
 * Process affiliate payout
 */
export async function processAffiliatePayout(affiliateId: string, amount: number): Promise<void> {
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

  type Conversion = { id: string; commission_amount?: number };
  const typedConversions = (conversions || []) as Conversion[];
  const totalCommission = typedConversions.reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0);

  if (totalCommission < amount) {
    throw new Error("Insufficient commission balance");
  }

  // Mark conversions as paid
  const conversionIds = typedConversions.map((c) => c.id);
  await (supabase
    .from("affiliate_conversions") as any)
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .in("id", conversionIds);

  // Update affiliate payouts
  const { data: affiliate } = await supabase
    .from("affiliate_programs")
    .select("total_payouts")
    .eq("id", affiliateId)
    .single();

  const affiliateData = affiliate as { total_payouts?: number } | null;
  await (supabase
    .from("affiliate_programs") as any)
    .update({
      total_payouts: (affiliateData?.total_payouts || 0) + amount,
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
    .from("affiliate_programs")
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

  type AffiliateStats = { total_revenue?: number; total_payouts?: number };
  type ConversionStats = { status: string; commission_amount?: number };
  
  const affiliateData = affiliate as AffiliateStats;
  const typedConversions = (conversions || []) as ConversionStats[];
  
  const totalRevenue = affiliateData.total_revenue || 0;
  const totalCommissions =
    typedConversions.reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0);
  const totalPayouts = affiliateData.total_payouts || 0;
  const pendingCommissions =
    typedConversions
      .filter((c: any) => c.status === "pending")
      .reduce((sum: number, c: any) => sum + (c.commission_amount || 0), 0);
  const conversionCount = conversions?.length || 0;

  return {
    totalRevenue,
    totalCommissions,
    totalPayouts,
    pendingCommissions,
    conversionCount,
  };
}
