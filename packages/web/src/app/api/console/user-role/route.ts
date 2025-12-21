import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserRole } from '@/shared/auth/roles';
import { isSuperAdmin } from '@/lib/auth/super-admin';

/**
 * Get current user's role in their tenant and super admin status
 */
export async function GET() {
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
    return NextResponse.json(
      { role: null, isSuperAdmin: false, error: error.message },
      { status: 500 }
    );
  }
}
