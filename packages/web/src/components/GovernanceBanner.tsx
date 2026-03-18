"use client";

import React, { useState, useEffect } from "react";
import { Lock, X } from "lucide-react";

interface FreezeState {
  frozen: boolean;
  frozen_at: string | null;
  frozen_by: string | null;
  freeze_reason: string | null;
  updated_at: string;
}

interface GovernanceBannerProps {
  /** Allow dismissing the banner for current session */
  dismissible?: boolean;
}

/**
 * Governance Banner
 * Shows prominent freeze state warning across operator pages
 * Provides clear indication when system is in read-only mode
 */
export const GovernanceBanner: React.FC<GovernanceBannerProps> = ({ dismissible = false }) => {
  const [freezeState, setFreezeState] = useState<FreezeState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFreezeState();
    // Poll freeze state every 30 seconds to catch changes
    const interval = setInterval(fetchFreezeState, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchFreezeState() {
    try {
      const res = await fetch("/api/v1/governance/freeze", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setFreezeState(data.data);
      }
    } catch (err) {
      // Silent fail - banner will hide if can't load state
      console.error("Failed to fetch freeze state:", err);
    } finally {
      setLoading(false);
    }
  }

  // Don't show banner if not frozen, dismissed, or loading
  if (loading || !freezeState?.frozen || dismissed) {
    return null;
  }

  return (
    <div
      className="relative border-b-2 border-red-600 bg-red-50"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-3">
            <Lock className="h-5 w-5 flex-shrink-0 text-red-700" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">
                System Frozen - Read-Only Mode Active
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                Write operations are blocked on high-risk mutation paths. Ingestion, reconciliation,
                and bulk operations are disabled.
                {freezeState.freeze_reason && (
                  <span className="ml-1">Reason: {freezeState.freeze_reason}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {freezeState.frozen_at && (
              <p className="text-xs text-red-600 hidden sm:block">
                Since: {new Date(freezeState.frozen_at).toLocaleString()}
              </p>
            )}
            {dismissible && (
              <button
                onClick={() => setDismissed(true)}
                className="rounded-md p-1 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50 transition-colors"
                aria-label="Dismiss freeze warning for this session"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceBanner;
