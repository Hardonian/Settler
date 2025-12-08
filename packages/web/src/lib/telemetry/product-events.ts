/**
 * Product Analytics Event Catalog
 * 
 * Comprehensive event definitions for product analytics, funnels, and experiments.
 * All events follow the taxonomy defined in /docs/event-taxonomy.md
 */

import { analytics } from '../analytics';
import { logger } from '../logging/logger';

/**
 * Core Global Events
 */
export const ProductEvents = {
  /**
   * User opens the application
   */
  appOpened: (properties?: {
    source?: 'web' | 'mobile' | 'api';
    referrer?: string;
    userAgent?: string;
  }) => {
    trackEvent('app_opened', properties);
  },

  /**
   * User views a page
   */
  pageView: (properties: {
    route: string;
    title?: string;
    referrer?: string;
    loadTime?: number;
  }) => {
    trackEvent('page_view', properties);
  },

  /**
   * User session begins
   */
  sessionStarted: (properties: {
    sessionId: string;
    userId?: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
  }) => {
    trackEvent('session_started', properties);
  },

  /**
   * User session ends
   */
  sessionEnded: (properties: {
    sessionId: string;
    duration: number;
    pageViews: number;
    interactions: number;
  }) => {
    trackEvent('session_ended', properties);
  },

  /**
   * Onboarding Events
   */
  onboarding: {
    started: (properties?: {
      onboardingType?: 'new_user' | 'returning_user' | 'trial';
      source?: string;
    }) => {
      trackEvent('onboarding_started', properties);
    },

    stepCompleted: (properties: {
      stepName: string;
      stepNumber: number;
      totalSteps: number;
      duration?: number;
      skipped?: boolean;
    }) => {
      trackEvent('onboarding_step_completed', properties);
    },

    completed: (properties: {
      totalDuration: number;
      stepsCompleted: number;
      skippedSteps?: number[];
      completionRate: number;
    }) => {
      trackEvent('onboarding_completed', properties);
    },

    abandoned: (properties: {
      stepAbandoned: string;
      stepNumber: number;
      duration: number;
      reason?: string;
    }) => {
      trackEvent('onboarding_abandoned', properties);
    },
  },

  /**
   * Reconciliation Job Events
   */
  jobs: {
    created: (properties: {
      jobId: string;
      sourceAdapter: string;
      targetAdapter: string;
      matchingRules: number;
    }) => {
      trackEvent('job_created', properties);
    },

    updated: (properties: {
      jobId: string;
      fieldsUpdated: string[];
    }) => {
      trackEvent('job_updated', properties);
    },

    deleted: (properties: {
      jobId: string;
      jobAge: number;
    }) => {
      trackEvent('job_deleted', properties);
    },

    runStarted: (properties: {
      jobId: string;
      runType: 'manual' | 'scheduled' | 'api';
      sourceRecordCount?: number;
      targetRecordCount?: number;
    }) => {
      trackEvent('job_run_started', properties);
    },

    runCompleted: (properties: {
      jobId: string;
      executionId: string;
      duration: number;
      matched: number;
      unmatched: number;
      errors: number;
      success: boolean;
    }) => {
      trackEvent('job_run_completed', properties);
    },

    runFailed: (properties: {
      jobId: string;
      executionId: string;
      errorType: string;
      errorMessage: string;
      duration: number;
    }) => {
      trackEvent('job_run_failed', properties);
    },
  },

  /**
   * Report Events
   */
  reports: {
    viewed: (properties: {
      reportId: string;
      jobId: string;
      reportType: 'summary' | 'detailed' | 'export';
      viewDuration?: number;
    }) => {
      trackEvent('report_viewed', properties);
    },

    exported: (properties: {
      reportId: string;
      format: 'csv' | 'excel' | 'pdf' | 'json';
      recordCount: number;
    }) => {
      trackEvent('report_exported', properties);
    },
  },

  /**
   * Engagement Events
   */
  engagement: {
    ctaClicked: (properties: {
      ctaName: string;
      ctaLocation: string;
      ctaText?: string;
      destination?: string;
    }) => {
      trackEvent('cta_clicked', properties);
    },

    featureUsed: (properties: {
      featureName: string;
      featureCategory: string;
      usageCount?: number;
    }) => {
      trackEvent('feature_used', properties);
    },

    searchPerformed: (properties: {
      query: string;
      resultsCount: number;
      searchType: 'jobs' | 'reports' | 'global';
      clickedResult?: boolean;
    }) => {
      trackEvent('search_performed', properties);
    },

    filterApplied: (properties: {
      filterType: string;
      filterValue: string | number;
      context: string;
    }) => {
      trackEvent('filter_applied', properties);
    },
  },

  /**
   * Error & Friction Events
   */
  errors: {
    formValidationFailed: (properties: {
      formName: string;
      fieldName: string;
      errorType: string;
      attemptNumber?: number;
    }) => {
      trackEvent('form_validation_failed', properties);
    },

    apiErrorShown: (properties: {
      errorCode: string | number;
      errorType: string;
      endpoint?: string;
      retryAttempted?: boolean;
    }) => {
      trackEvent('api_error_shown', properties);
    },

    featureFlagFallback: (properties: {
      flagKey: string;
      fallbackValue: boolean | string;
      reason: string;
    }) => {
      trackEvent('feature_flag_fallback_triggered', properties);
    },

    experimentAssignmentFailed: (properties: {
      experimentKey: string;
      fallbackVariant: string;
      reason: string;
    }) => {
      trackEvent('experiment_assignment_failed', properties);
    },
  },

  /**
   * Conversion & Business Events
   */
  conversions: {
    trialStarted: (properties: {
      planId: string;
      trialDuration: number;
      source?: string;
    }) => {
      trackEvent('trial_started', properties);
    },

    subscriptionStarted: (properties: {
      planId: string;
      planName: string;
      billingCycle: 'monthly' | 'annual';
      amount?: number;
    }) => {
      trackEvent('subscription_started', properties);
    },

    subscriptionUpgraded: (properties: {
      fromPlanId: string;
      toPlanId: string;
      upgradeValue?: number;
    }) => {
      trackEvent('subscription_upgraded', properties);
    },

    subscriptionCancelled: (properties: {
      planId: string;
      cancellationReason?: string;
      daysActive: number;
    }) => {
      trackEvent('subscription_cancelled', properties);
    },
  },

  /**
   * Experiment Events
   */
  experiments: {
    assigned: (properties: {
      experimentKey: string;
      variant: string;
      assignmentMethod: 'stable_hash' | 'random' | 'manual';
      userId: string;
    }) => {
      trackEvent('experiment_assigned', properties);
    },

    exposure: (properties: {
      experimentKey: string;
      variant: string;
      exposureType: 'page_view' | 'feature_use' | 'interaction';
    }) => {
      trackEvent('experiment_exposure', properties);
    },
  },
};

/**
 * Internal tracking function with context enrichment
 */
function trackEvent(eventName: string, properties?: Record<string, any>) {
  // Enrich with common context
  const enrichedProperties = {
    ...properties,
    timestamp: new Date().toISOString(),
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    // Add session ID if available
    sessionId: getSessionId(),
    // Add user ID if available
    userId: getUserId(),
  };

  // Track in analytics
  analytics.trackEvent(eventName, enrichedProperties);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Product Event: ${eventName}`, enrichedProperties);
  }
}

/**
 * Get current session ID (from sessionStorage or generate)
 */
function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Get current user ID (from localStorage or context)
 */
function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  // Try to get from localStorage (set by auth system)
  const userId = localStorage.getItem('user_id');
  if (userId) return userId;

  // Could also check auth context/state
  return undefined;
}

/**
 * Helper to track CTA clicks with consistent naming
 */
export function trackCtaClick(
  ctaName: string,
  properties?: {
    ctaLocation?: string;
    ctaText?: string;
    destination?: string;
  }
) {
  const props: {
    ctaName: string;
    ctaLocation: string;
    ctaText?: string;
    destination?: string;
  } = {
    ctaName,
    ctaLocation: properties?.ctaLocation || (typeof window !== 'undefined' ? window.location.pathname : ''),
  };
  
  if (properties?.ctaText) {
    props.ctaText = properties.ctaText;
  }
  
  if (properties?.destination) {
    props.destination = properties.destination;
  }
  
  ProductEvents.engagement.ctaClicked(props);
}

/**
 * Helper to track conversions with experiment context
 */
export function trackConversion(
  conversionName: string,
  properties?: {
    value?: number;
    experimentKey?: string;
    variant?: string;
  }
) {
  const eventProperties: Record<string, any> = {
    conversion_name: conversionName,
    value: properties?.value,
  };

  // Add experiment context if provided
  if (properties?.experimentKey && properties?.variant) {
    eventProperties.experimentContext = {
      experimentKey: properties.experimentKey,
      variant: properties.variant,
    };
  }

  analytics.trackEvent('conversion', eventProperties);
}
