/**
 * Server Actions for Authentication
 * 
 * Interdependence Manifesto: These actions are the ONLY channels for client-side writes,
 * ensuring all data flows through Supabase with proper RLS checks.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/types/database.types';
import { trackSignupComplete } from '@/lib/analytics/conversion';

export interface SignUpResult {
  success: boolean;
  error?: string;
  userId?: string;
}

/**
 * Server Action: User Sign-up
 * 
 * Data Flow: Vercel Form → Next.js Server Action → Supabase profiles table (RLS Check) → Profile Page Reload
 */
export async function signUpUser(
  email: string,
  password: string,
  name?: string
): Promise<SignUpResult> {
  try {
    const supabase = await createClient();

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: authError.message,
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Failed to create user',
      };
    }

    // 2. Create profile in profiles table (RLS will enforce user_id match)
    if (!authData.user.email) {
      return {
        success: false,
        error: 'User email is required',
      };
    }

    const profileData: Database['public']['Tables']['profiles']['Insert'] = {
      id: authData.user.id,
      user_id: authData.user.id,
      email: authData.user.email,
      name: name || (authData.user.email.split('@')[0] ?? null),
      impact_score: 0,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .insert(profileData as any);

    if (profileError) {
      // If profile creation fails, we should handle it gracefully
      // The user is created in auth, but profile might already exist
      console.error('Profile creation error:', profileError);
    }

    // 3. Log sign-up activity
    const activityData: Database['public']['Tables']['activity_log']['Insert'] = {
      user_id: authData.user.id,
      activity_type: 'signup',
      entity_type: 'profile',
      entity_id: authData.user.id,
      metadata: {
        source: 'web_signup',
        timestamp: new Date().toISOString(),
      },
    };

    const { error: activityError } = await supabase
      .from('activity_log')
      .insert(activityData as any);

    if (activityError) {
      console.error('Activity log error:', activityError);
      // Don't fail the sign-up if activity logging fails
    }

    // 4. Track conversion event
    await trackSignupComplete(authData.user.id).catch(() => {
      // Don't block signup if tracking fails
    });

    // 5. Revalidate relevant paths
    revalidatePath('/');
    revalidatePath('/dashboard');

    return {
      success: true,
      userId: authData.user.id,
    };
  } catch (error) {
    console.error('Sign-up error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Server Action: Log Activity
 * 
 * Tracks user engagement (clicks, scrolls, views) for community metrics
 */
export async function logActivity(
  activityType: string,
  entityType?: string,
  entityId?: string,
  metadata?: Database['public']['Tables']['activity_log']['Row']['metadata']
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const activityData: Database['public']['Tables']['activity_log']['Insert'] = {
      user_id: user?.id ?? null, // Allow anonymous activity
      activity_type: activityType,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? {},
    };

    const { error } = await supabase
      .from('activity_log')
      .insert(activityData as any);

    if (error) {
      console.error('Activity log error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Log activity error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log activity',
    };
  }
}
