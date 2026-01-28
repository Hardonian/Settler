import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';
import { appLogger } from '@/lib/utils/logger';
import { withSecurity } from '@/lib/middleware/api-security';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Ensure Node.js runtime for Supabase

export const GET = withSecurity(
  withUniversalBillingGate(async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user roles from database
    const { prisma } = await import('@/shared/db/prismaClient');
    
    // Get tenant ID from user's billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
    });

    if (!billingAccount?.tenantId) {
      return NextResponse.json({ users: [] });
    }

    // Fetch user roles from tenant_users table via Supabase
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select('user_id, role, joined_at')
      .eq('tenant_id', billingAccount.tenantId);

    if (!tenantUsers || tenantUsers.length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Get user emails from Supabase auth
    const users = [];
    
    for (const tenantUser of tenantUsers) {
      try {
        const tenantUserTyped = tenantUser as { user_id?: string; role?: string; joined_at?: string };
        const userId = tenantUserTyped?.user_id;
        if (!userId) continue;
        
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
        if (authUser) {
          users.push({
            userId: userId,
            email: authUser.email || '',
            role: tenantUserTyped?.role || 'member',
            assignedAt: tenantUserTyped?.joined_at || new Date().toISOString(),
          });
        }
      } catch (error) {
        // Skip if user not found
      }
    }

    return NextResponse.json({ users });
  } catch (error) {
    appLogger.error("Error in users GET", error);
    // Never return 500 - return empty users array with graceful error message
    return NextResponse.json({ 
      users: [],
      error: "Unable to fetch users at this time",
      message: "Please try again later"
    }, { status: 200 });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
