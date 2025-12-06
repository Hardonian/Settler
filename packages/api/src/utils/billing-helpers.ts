/**
 * Billing Helper Functions
 *
 * Utility functions for billing operations
 */

import { supabase } from "../infrastructure/supabase/client";
import { logError } from "./logger";

/**
 * Get billing account for user
 */
export async function getBillingAccount(userId: string, tenantId?: string) {
  try {
    const query = supabase
      .from("billing_accounts")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .eq("status", "active")
      .single();

    const { data, error } = await query;

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    logError("Error fetching billing account", error);
    return null;
  }
}

/**
 * Get active subscription for billing account
 */
export async function getActiveSubscription(billingAccountId: string) {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("billing_account_id", billingAccountId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    logError("Error fetching subscription", error);
    return null;
  }
}
