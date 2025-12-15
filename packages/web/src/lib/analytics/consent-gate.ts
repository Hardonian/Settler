/**
 * Analytics Consent Gate
 * 
 * Gates analytics tracking based on cookie consent preferences.
 * Respects Do Not Track and Global Privacy Control signals.
 */

type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

interface ConsentPreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const CONSENT_STORAGE_KEY = 'settler_consent_preferences';

/**
 * Check if consent is given for a specific category
 */
export function hasConsent(category: ConsentCategory): boolean {
  // Necessary cookies are always allowed
  if (category === 'necessary') {
    return true;
  }

  // Check Do Not Track / Global Privacy Control
  if (typeof window !== 'undefined') {
    const dnt = navigator.doNotTrack === '1' || 
                (window as any).navigator?.globalPrivacyControl === true;
    
    if (dnt) {
      return false; // Only necessary cookies allowed
    }
  }

  // Check stored preferences
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        const prefs = JSON.parse(stored) as ConsentPreferences;
        return prefs[category] === true;
      }
    } catch (error) {
      console.warn('[Analytics Consent] Failed to read preferences:', error);
    }
  }

  // Default: no consent (opt-in model)
  return false;
}

/**
 * Check if analytics tracking is allowed
 */
export function canTrackAnalytics(): boolean {
  return hasConsent('analytics');
}

/**
 * Check if marketing tracking is allowed
 */
export function canTrackMarketing(): boolean {
  return hasConsent('marketing');
}

/**
 * Wait for consent and then execute callback
 */
export function withConsent<T>(
  category: ConsentCategory,
  callback: () => T,
  fallback?: () => T
): T | undefined {
  if (hasConsent(category)) {
    return callback();
  }
  return fallback?.();
}

/**
 * Listen for consent changes
 */
export function onConsentChange(
  callback: (category: ConsentCategory, granted: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }

  const handleConsentEvent = (event: CustomEvent) => {
    if (event.type === 'consent-analytics-enabled') {
      callback('analytics', true);
    } else if (event.type === 'consent-analytics-disabled') {
      callback('analytics', false);
    } else if (event.type === 'consent-marketing-enabled') {
      callback('marketing', true);
    } else if (event.type === 'consent-marketing-disabled') {
      callback('marketing', false);
    }
  };

  window.addEventListener('consent-analytics-enabled', handleConsentEvent as EventListener);
  window.addEventListener('consent-analytics-disabled', handleConsentEvent as EventListener);
  window.addEventListener('consent-marketing-enabled', handleConsentEvent as EventListener);
  window.addEventListener('consent-marketing-disabled', handleConsentEvent as EventListener);

  return () => {
    window.removeEventListener('consent-analytics-enabled', handleConsentEvent as EventListener);
    window.removeEventListener('consent-analytics-disabled', handleConsentEvent as EventListener);
    window.removeEventListener('consent-marketing-enabled', handleConsentEvent as EventListener);
    window.removeEventListener('consent-marketing-disabled', handleConsentEvent as EventListener);
  };
}
