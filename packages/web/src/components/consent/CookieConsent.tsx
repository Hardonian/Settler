'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Cookie, Settings } from 'lucide-react';
import Link from 'next/link';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  necessary: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

const CONSENT_STORAGE_KEY = 'settler_consent_preferences';
const CONSENT_EXPIRY_DAYS = 365;

/**
 * Cookie Consent Banner Component
 * 
 * Implements GDPR/CCPA compliant cookie consent with:
 * - Category-based opt-in/opt-out
 * - Preference persistence
 * - Respect for Do Not Track / Global Privacy Control
 * - Analytics script gating
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
  });

  useEffect(() => {
    // Check if user has already set preferences
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ConsentPreferences;
        // Check if consent has expired (older than CONSENT_EXPIRY_DAYS)
        const ageDays = (Date.now() - parsed.timestamp) / (1000 * 60 * 60 * 24);
        if (ageDays < CONSENT_EXPIRY_DAYS) {
          setPreferences(parsed);
          applyPreferences(parsed);
          return; // Don't show banner if valid consent exists
        }
      } catch (error: unknown) {
        console.warn('[CookieConsent] Failed to parse stored preferences:', error);
      }
    }

    // Check Do Not Track / Global Privacy Control
    const dnt = navigator.doNotTrack === '1' || 
                (window as any).navigator?.globalPrivacyControl === true;
    
    if (dnt) {
      // Respect DNT/GPC - only necessary cookies
      const dntPreferences: ConsentPreferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        timestamp: Date.now(),
      };
      setPreferences(dntPreferences);
      savePreferences(dntPreferences);
      applyPreferences(dntPreferences);
      return;
    }

    // Show banner if no valid consent exists
    setShowBanner(true);
  }, []);

  const savePreferences = (prefs: ConsentPreferences) => {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error: unknown) {
      console.warn('[CookieConsent] Failed to save preferences:', error);
    }
  };

  const applyPreferences = (prefs: ConsentPreferences) => {
    // Gate analytics scripts based on consent
    if (prefs.analytics) {
      // Enable analytics (scripts should check this preference)
      window.dispatchEvent(new CustomEvent('consent-analytics-enabled'));
    } else {
      // Disable analytics
      window.dispatchEvent(new CustomEvent('consent-analytics-disabled'));
    }

    if (prefs.marketing) {
      window.dispatchEvent(new CustomEvent('consent-marketing-enabled'));
    } else {
      window.dispatchEvent(new CustomEvent('consent-marketing-disabled'));
    }
  };

  const handleAcceptAll = () => {
    const newPrefs: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
    applyPreferences(newPrefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    const newPrefs: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    };
    setPreferences(newPrefs);
    savePreferences(newPrefs);
    applyPreferences(newPrefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
    applyPreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const toggleCategory = (category: ConsentCategory) => {
    if (category === 'necessary') return; // Cannot disable necessary cookies
    
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!showBanner && !showSettings) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <Card className="max-w-4xl mx-auto shadow-2xl pointer-events-auto border-2">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Cookie className="w-6 h-6 text-primary-600" />
              <div>
                <CardTitle className="text-lg">Cookie Preferences</CardTitle>
                <CardDescription className="mt-1">
                  We use cookies to enhance your experience. Choose your preferences below.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowBanner(false);
                setShowSettings(false);
              }}
              aria-label="Close cookie consent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSettings ? (
            <>
              {/* Cookie Categories */}
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Necessary Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Required for the site to function. Cannot be disabled.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-5 h-5"
                      aria-label="Necessary cookies (always enabled)"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Analytics Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Help us understand how visitors interact with our site.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => toggleCategory('analytics')}
                      className="w-5 h-5"
                      aria-label="Analytics cookies"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Marketing Cookies</h4>
                    <p className="text-sm text-muted-foreground">
                      Used to deliver personalized ads and track campaign performance.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => toggleCategory('marketing')}
                      className="w-5 h-5"
                      aria-label="Marketing cookies"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveSettings} className="flex-1">
                  Save Preferences
                </Button>
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                By clicking "Accept All", you consent to our use of cookies. You can customize your preferences or learn more in our{' '}
                <Link href="/legal/cookies" className="underline hover:text-primary-600">
                  Cookie Policy
                </Link>
                .
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleAcceptAll} className="flex-1">
                  Accept All
                </Button>
                <Button onClick={handleRejectAll} variant="outline" className="flex-1">
                  Reject All
                </Button>
                <Button
                  onClick={() => {
                    setShowSettings(true);
                    setShowBanner(false);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Customize
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
