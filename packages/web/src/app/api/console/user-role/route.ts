import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/shared/auth/roles';
import { isSuperAdmin } from '@/lib/auth/super-admin';
import { withUniversalBillingGate } from '@/middleware/billing-gate-universal';

export const dynamic = 'force-dynamic';

/**
 * Get current user's role in their tenant and super admin status
 */
export const GET = withUniversalBillingGate(async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ role: null, isSuperAdmin: false }, { status: 401 });
    }

    // Get user's role from getUserRole (includes SUPER_ADMIN check)
    const role = await getUserRole(user.id);
    const isAdmin = await isSuperAdmin();

    return NextResponse.json({ 
      role,
      isSuperAdmin: isAdmin,
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Error getting user role:', error);
    // Never return 500 - return default role with error message
    return NextResponse.json(
      { 
        role: null, 
        isSuperAdmin: false, 
        error: 'Unable to retrieve user role',
        message: 'User role information is temporarily unavailable. Please try again.',
        retryable: true,
      },
      { status: 200 }
    );
  }
}, { feature: 'GET API' });
