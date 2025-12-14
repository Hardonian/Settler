/**
 * AI Data Insights API Route
 * Generates insights from user's receipt/console data
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get("type") || "receipts";

    let insights: {
      summary: string;
      trends: Array<{ label: string; value: string; change?: string }>;
      recommendations: string[];
    } = {
      summary: "",
      trends: [],
      recommendations: [],
    };

    if (dataType === "receipts") {
      // Get receipt data
      const { data: receipts } = await supabase
        .from("receipts")
        .select("total, merchant_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (receipts && receipts.length > 0) {
        const totalSpent = receipts.reduce((sum, r) => sum + (parseFloat(r.total as string) || 0), 0);
        const avgSpent = totalSpent / receipts.length;
        const merchants = new Map<string, number>();
        receipts.forEach((r) => {
          const merchant = r.merchant_name || "Unknown";
          merchants.set(merchant, (merchants.get(merchant) || 0) + 1);
        });
        const topMerchant = Array.from(merchants.entries()).sort((a, b) => b[1] - a[1])[0];

        insights = {
          summary: `You've processed ${receipts.length} receipt${receipts.length !== 1 ? "s" : ""} with a total value of $${totalSpent.toFixed(2)}. Your average receipt value is $${avgSpent.toFixed(2)}.`,
          trends: [
            {
              label: "Total Processed",
              value: String(receipts.length),
            },
            {
              label: "Total Value",
              value: `$${totalSpent.toFixed(2)}`,
            },
            {
              label: "Top Merchant",
              value: topMerchant?.[0] || "N/A",
            },
          ],
          recommendations: [
            "Set up automated receipt processing with webhooks",
            "Export receipts for accounting integration",
            "Use receipt data for expense categorization",
          ],
        };
      } else {
        insights = {
          summary: "You haven't processed any receipts yet. Start by uploading a receipt image or PDF.",
          trends: [],
          recommendations: [
            "Upload your first receipt",
            "Try the receipt parsing API",
            "Check out receipt processing examples",
          ],
        };
      }
    } else if (dataType === "usage") {
      // Get usage data
      const { data: usage } = await supabase
        .from("usage_events")
        .select("event_type, quantity, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (usage && usage.length > 0) {
        const usageByType = new Map<string, number>();
        usage.forEach((u) => {
          const type = u.event_type || "unknown";
          usageByType.set(type, (usageByType.get(type) || 0) + (u.quantity || 0));
        });

        const totalUsage = Array.from(usageByType.values()).reduce((sum, v) => sum + v, 0);

        insights = {
          summary: `You've made ${totalUsage} API calls across ${usageByType.size} different service${usageByType.size !== 1 ? "s" : ""}. Your most used service is ${Array.from(usageByType.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}.`,
          trends: Array.from(usageByType.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => ({
              label: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              value: String(count),
            })),
          recommendations: [
            "Set up usage alerts to monitor your API consumption",
            "Review your usage patterns to optimize costs",
            "Consider upgrading if you're approaching limits",
          ],
        };
      }
    }

    return NextResponse.json(insights);
  } catch (error) {
    console.error("AI data insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
