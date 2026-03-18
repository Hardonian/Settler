/**
 * Shared Governance State Hook
 * Provides centralized freeze state access across the frontend
 */

import { useState, useEffect, useCallback } from "react";

export interface GovernanceState {
  frozen: boolean;
  frozen_at: string | null;
  frozen_by: string | null;
  freeze_reason: string | null;
  updated_at: string;
}

export interface UseGovernanceStateReturn {
  governanceState: GovernanceState | null;
  isLoading: boolean;
  error: Error | null;
  isFrozen: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to access tenant governance/freeze state
 * Polls every 30s to stay fresh, provides blocking state for UI controls
 */
export function useGovernanceState(): UseGovernanceStateReturn {
  const [governanceState, setGovernanceState] = useState<GovernanceState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGovernanceState = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/governance/freeze", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setGovernanceState(data.data);
        setError(null);
      } else {
        // Default to unfrozen on error to avoid blocking legitimate operations
        setGovernanceState({
          frozen: false,
          frozen_at: null,
          frozen_by: null,
          freeze_reason: null,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to fetch governance state:", err);
      setError(err as Error);
      // Default to unfrozen on error
      setGovernanceState({
        frozen: false,
        frozen_at: null,
        frozen_by: null,
        freeze_reason: null,
        updated_at: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGovernanceState();
    // Poll every 30 seconds to stay fresh
    const interval = setInterval(fetchGovernanceState, 30000);
    return () => clearInterval(interval);
  }, [fetchGovernanceState]);

  return {
    governanceState,
    isLoading,
    error,
    isFrozen: governanceState?.frozen ?? false,
    refresh: fetchGovernanceState,
  };
}
