/**
 * Console Activity Logger
 * 
 * Centralized logging for Console operations.
 * Logs all user actions for audit trail and live activity feed.
 */

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/shared/db/prismaClient';

/**
 * Activity types supported by Console
 */
export type ActivityType = 
  | 'reconcile' 
  | 'receipt' 
  | 'flag' 
  | 'api_key' 
  | 'usage' 
  | 'billing'
  | 'site'
  | 'experiment';

/**
 * Activity actions
 */
export type ActivityAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'executed' 
  | 'viewed'
  | 'toggled'
  | 'revoked';

/**
 * Activity status
 */
export type ActivityStatus = 'success' | 'processing' | 'failed';

/**
 * Activity metadata (flexible key-value store)
 */
export interface ActivityMetadata {
  [key: string]: unknown;
}


/**
 * Log a console activity
 */
export async function logActivity(params: {
  activityType: ActivityType;
  action: ActivityAction;
  title: string;
  description?: string;
  status?: ActivityStatus;
  metadata?: ActivityMetadata;
  resourceId?: string;
  resourceType?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[ActivityLogger] No user found, skipping activity log');
      return;
    }

    // Get billing account
    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
    });

    if (!billingAccount) {
      console.warn('[ActivityLogger] No billing account found, skipping activity log');
      return;
    }

    // Log to Supabase using the function
    const { error } = await supabase.rpc('log_console_activity', {
      p_user_id: user.id,
      p_billing_account_id: billingAccount.id,
      p_activity_type: params.activityType,
      p_action: params.action,
      p_title: params.title,
      p_description: params.description || null,
      p_status: params.status || 'success',
      p_metadata: params.metadata || {},
      p_resource_id: params.resourceId || null,
      p_resource_type: params.resourceType || null,
    } as never);

    if (error) {
      console.error('[ActivityLogger] Failed to log activity:', error);
      // Don't throw - logging failures shouldn't break the app
    }
  } catch (_error) {
    console.error('[ActivityLogger] Error logging activity:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Get recent activities for a billing account
 */
export async function getRecentActivities(limit = 10) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const billingAccount = await prisma.billingAccount.findFirst({
      where: { userId: user.id },
    });

    if (!billingAccount) {
      return [];
    }

    const { data, error } = await supabase.rpc('get_recent_console_activities', {
      p_billing_account_id: billingAccount.id,
      p_limit: limit,
    } as never);

    if (error) {
      console.error('[ActivityLogger] Failed to fetch activities:', error);
      return [];
    }

    return data || [];
  } catch (_error) {
    console.error('[ActivityLogger] Error fetching activities:', error);
    return [];
  }
}
