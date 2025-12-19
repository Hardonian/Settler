'use client';

/**
 * FeatureFlags Provider
 * 
 * Provides feature flags from server-side entitlements
 */

import { createContext, useContext, useEffect, useState } from 'react';

// Client-side entitlements type (matches server type)
export interface Entitlements {
  plan: string;
  features: {
    api_keys: boolean;
    receipts: boolean;
    reconciliation: boolean;
    feature_flags: boolean;
    analytics: boolean;
    webhooks: boolean;
    priority_support?: boolean;
    sso?: boolean;
    custom_integrations?: boolean;
  };
  limits: {
    api_calls_per_month: number;
    receipts_per_month: number;
    reconciliation_runs_per_month: number;
  };
}

interface FeatureFlagsContextValue {
  entitlements: Entitlements | null;
  hasFeature: (feature: keyof Entitlements['features']) => boolean;
  isLoading: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  entitlements: null,
  hasFeature: () => false,
  isLoading: true,
});

export function FeatureFlagsProvider({
  children,
  tenantId,
  initialEntitlements,
}: {
  children: React.ReactNode;
  tenantId: string | null;
  initialEntitlements?: Entitlements;
}) {
  const [entitlements, setEntitlements] = useState<Entitlements | null>(
    initialEntitlements || null
  );
  const [isLoading, setIsLoading] = useState(!initialEntitlements);

  useEffect(() => {
    if (!tenantId || initialEntitlements) {
      setIsLoading(false);
      return;
    }

    // Fetch entitlements from API
    fetch(`/api/entitlements?tenant_id=${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        setEntitlements(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch entitlements:', error);
        setIsLoading(false);
      });
  }, [tenantId, initialEntitlements]);

  const hasFeature = (feature: keyof Entitlements['features']): boolean => {
    return entitlements?.features[feature] === true;
  };

  return (
    <FeatureFlagsContext.Provider value={{ entitlements, hasFeature, isLoading }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
