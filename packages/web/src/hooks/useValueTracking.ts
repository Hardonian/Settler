/**
 * Value Tracking Hook
 * 
 * React hook for tracking value events in components.
 * Automatically tracks funnel transitions and value events.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackValueEvent, type ValueEvent } from '@/lib/gtm/value-events';
import { trackFunnelTransition, type FunnelStage } from '@/lib/gtm/funnels';
import { trackPageView } from '@/lib/gtm/analytics';

interface UseValueTrackingOptions {
  userId?: string;
  tenantId?: string;
  billingAccountId?: string;
  projectId?: string;
}

/**
 * Track value event hook
 */
export function useValueEventTracking(options: UseValueTrackingOptions) {
  return {
    track: async (event: Omit<ValueEvent, 'timestamp' | 'userId' | 'tenantId' | 'billingAccountId' | 'projectId'>) => {
      await trackValueEvent({
        ...event,
        timestamp: new Date(),
        userId: options.userId,
        tenantId: options.tenantId,
        billingAccountId: options.billingAccountId,
        projectId: options.projectId,
      });
    },
  };
}

/**
 * Track funnel transition hook
 */
export function useFunnelTracking(userId?: string) {
  return {
    trackTransition: async (from: FunnelStage, to: FunnelStage, metadata?: Record<string, unknown>) => {
      await trackFunnelTransition({
        from,
        to,
        timestamp: new Date(),
        userId,
        metadata,
      });
    },
  };
}

/**
 * Auto-track page views and funnel stages
 */
export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    trackPageView(pathname);

    // Track funnel transitions based on route
    const routeToStage: Record<string, FunnelStage> = {
      '/': 'visitor',
      '/playground': 'playground_engaged',
      '/console': 'signed_up',
      '/console/api-keys': 'signed_up',
      '/console/api-logs': 'first_api_call',
      '/console/playground/reconcile': 'first_api_call',
      '/console/reconciliation-view': 'first_reconciliation',
      '/console/integrations': 'first_integration',
      '/pricing': 'upgraded',
    };

    const currentStage = routeToStage[pathname];
    if (currentStage) {
      // Get previous stage from session storage
      const previousStage = sessionStorage.getItem('funnel_stage') as FunnelStage | null;
      if (previousStage && previousStage !== currentStage) {
        trackFunnelTransition({
          from: previousStage,
          to: currentStage,
          timestamp: new Date(),
        });
      }
      sessionStorage.setItem('funnel_stage', currentStage);
    }
  }, [pathname]);
}
