import { createClient } from "@/lib/supabase/server";
import { SubscriptionStatus, determineSubscriptionTier } from "./subscription-access";

const UNSUBSCRIBED_STATUS: SubscriptionStatus = {
  tier: "unsubscribed",
  hasSubscription: false,
  isPaid: false,
  isEnterprise: false,
};

/**
 * Get current user's subscription status
 *
 * CRITICAL: Gracefully handles all errors and never throws.
 * The lookup must stay tenant scoped and must not infer entitlements from
 * globally visible subscription rows.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const supabase = await createClient();

    let user;
    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !authUser) {
        return UNSUBSCRIBED_STATUS;
      }

      user = authUser;
    } catch (error) {
      console.error("[getSubscriptionStatus] Auth check failed:", error);
      return UNSUBSCRIBED_STATUS;
    }

    const tenantIds = new Set<string>();

    try {
      const { data: memberships } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id);

      for (const membership of (memberships as Array<{ tenant_id?: string | null }> | null) || []) {
        if (membership?.tenant_id) {
          tenantIds.add(membership.tenant_id);
        }
      }
    } catch (membershipError) {
      console.warn("[getSubscriptionStatus] Failed to get tenant memberships:", membershipError);
    }

    type BillingAccountRow = {
      id?: string;
      status?: string;
      tenant_id?: string | null;
    };

    type SubscriptionRow = {
      id?: string;
      status?: string;
      plan_name?: string;
      plan_id?: string;
      current_period_end?: Date | string;
      billing_account_id?: string;
    };

    let billingAccounts: BillingAccountRow[] = [];

    try {
      const { data: directBillingAccounts } = await supabase
        .from("billing_accounts")
        .select("id, status, tenant_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);

      billingAccounts = ((directBillingAccounts as BillingAccountRow[] | null) ?? []).filter(
        (row): row is BillingAccountRow & { id: string } => Boolean(row?.id)
      );

      if (billingAccounts.length === 0 && tenantIds.size > 0) {
        const { data: tenantScopedBillingAccounts } = await supabase
          .from("billing_accounts")
          .select("id, status, tenant_id")
          .in("tenant_id", Array.from(tenantIds))
          .eq("status", "active")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(20);

        billingAccounts = (
          (tenantScopedBillingAccounts as BillingAccountRow[] | null) ?? []
        ).filter((row): row is BillingAccountRow & { id: string } => Boolean(row?.id));
      }
    } catch (billingError) {
      console.error("[getSubscriptionStatus] Failed to get scoped billing accounts:", billingError);
      return UNSUBSCRIBED_STATUS;
    }

    if (billingAccounts.length === 0) {
      return UNSUBSCRIBED_STATUS;
    }

    const billingAccountIds = billingAccounts
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (billingAccountIds.length === 0) {
      return UNSUBSCRIBED_STATUS;
    }

    let subscription: SubscriptionRow | null = null;

    try {
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("id, status, plan_name, plan_id, current_period_end, billing_account_id")
        .in("billing_account_id", billingAccountIds)
        .in("status", ["active", "trialing", "past_due"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      subscription = (subData as SubscriptionRow | null) ?? null;
    } catch (subscriptionError) {
      console.error(
        "[getSubscriptionStatus] Failed to get scoped subscription:",
        subscriptionError
      );
      return UNSUBSCRIBED_STATUS;
    }

    if (!subscription) {
      return UNSUBSCRIBED_STATUS;
    }

    const matchingBillingAccount =
      billingAccounts.find((row) => row.id === subscription?.billing_account_id) ??
      billingAccounts[0] ??
      null;

    const tier = determineSubscriptionTier(
      subscription,
      matchingBillingAccount ? { status: matchingBillingAccount.status } : null
    );

    return {
      tier,
      hasSubscription: true,
      isPaid: tier === "subscribed_paid" || tier === "enterprise",
      isEnterprise: tier === "enterprise",
      planName: subscription.plan_name,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error("[getSubscriptionStatus] Unexpected error:", error);
    return UNSUBSCRIBED_STATUS;
  }
}
