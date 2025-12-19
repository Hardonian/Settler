import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Get current user's role in their tenant
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    // Get user's role from memberships
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    return NextResponse.json({ 
      role: membership?.role || 'member',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Error getting user role:', error);
    return NextResponse.json(
      { role: null, error: error.message },
      { status: 500 }
    );
  }
}
