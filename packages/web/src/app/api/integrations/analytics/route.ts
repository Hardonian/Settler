import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin access (in production, use proper admin check)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // const searchParams = request.nextUrl.searchParams;
    // const _range = searchParams.get("range") || "30d";

    // Mock revenue data (in production, calculate from actual subscription/addon data)
    const revenue: Array<{
      integrationId: string;
      name: string;
      totalRevenue: number;
      monthlyRecurringRevenue: number;
      customerCount: number;
      averageRevenuePerUser: number;
      growthRate: number;
    }> = [
      {
        integrationId: "stripe",
        name: "Stripe",
        totalRevenue: 125000,
        monthlyRecurringRevenue: 15000,
        customerCount: 450,
        averageRevenuePerUser: 33.33,
        growthRate: 12.5,
      },
      {
        integrationId: "shopify",
        name: "Shopify",
        totalRevenue: 98000,
        monthlyRecurringRevenue: 12000,
        customerCount: 380,
        averageRevenuePerUser: 31.58,
        growthRate: 8.3,
      },
      {
        integrationId: "paypal",
        name: "PayPal",
        totalRevenue: 75000,
        monthlyRecurringRevenue: 9000,
        customerCount: 320,
        averageRevenuePerUser: 28.13,
        growthRate: 15.2,
      },
      {
        integrationId: "tiktok-shop",
        name: "TikTok Shop",
        totalRevenue: 45000,
        monthlyRecurringRevenue: 5500,
        customerCount: 180,
        averageRevenuePerUser: 30.56,
        growthRate: 25.0,
      },
    ];

    return NextResponse.json({ revenue });
  } catch (error) {
    console.error("Error in integrations/analytics GET:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
