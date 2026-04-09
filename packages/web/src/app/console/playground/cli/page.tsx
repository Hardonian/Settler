/**
 * CLI Playground Page
 *
 * Interactive CLI playground with code editor, request builder, and response viewer.
 * Features are gated based on subscription tier.
 */

import { CLIPlayground } from "@/components/console/CLIPlayground";
import { getSubscriptionInfo } from "@/lib/console/subscription";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CLIPlaygroundPage() {
  const subscription = await getSubscriptionInfo();

  return <CLIPlayground subscriptionTier={subscription.tier} />;
}
