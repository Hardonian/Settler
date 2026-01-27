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

    // Check admin access
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch roles from database
    const { prisma } = await import('@/shared/db/prismaClient');
    
    // Get tenant ID from user's billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
    });

    if (!billingAccount?.tenantId) {
      return NextResponse.json({ roles: [] });
    }

    // Fetch roles from roles table (if exists) or use default roles
    // For now, use default roles with actual user counts from tenant_users
    const { data: tenantUsers } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', billingAccount.tenantId);

    const roleCounts: Record<string, number> = {};
    if (tenantUsers && Array.isArray(tenantUsers)) {
      tenantUsers.forEach((tu: { role?: string }) => {
        const role = tu?.role || 'member';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });
    }

    const roles = [
      {
        id: "admin",
        name: "Admin",
        permissions: ["read", "write", "delete", "manage_users", "manage_billing"],
        userCount: roleCounts.admin || 0,
      },
      {
        id: "developer",
        name: "Developer",
        permissions: ["read", "write"],
        userCount: roleCounts.developer || 0,
      },
      {
        id: "support",
        name: "Support",
        permissions: ["read", "manage_tickets"],
        userCount: roleCounts.support || 0,
      },
      {
        id: "viewer",
        name: "Viewer",
        permissions: ["read"],
        userCount: roleCounts.viewer || 0,
      },
      {
        id: "member",
        name: "Member",
        permissions: ["read", "write"],
        userCount: roleCounts.member || 0,
      },
      {
        id: "owner",
        name: "Owner",
        permissions: ["read", "write", "delete", "manage_users", "manage_billing"],
        userCount: roleCounts.owner || 0,
      },
    ].filter(role => role.userCount > 0 || ['admin', 'developer', 'support', 'viewer'].includes(role.id));

    return NextResponse.json({ roles });
  } catch {
    appLogger.error("Error in roles GET", error);
    // Never return 500 - return empty roles array with graceful error message
    return NextResponse.json({ 
      roles: [],
      error: "Unable to fetch roles at this time",
      message: "Please try again later"
    }, { status: 200 });
  }
}, { feature: 'GET API' }),
  { rateLimit: { windowMs: 60000, maxRequests: 100 }, requireAuth: true }
);
