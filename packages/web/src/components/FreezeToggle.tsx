"use client";

import React, { useState, useEffect } from "react";
import { Lock, CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface FreezeState {
  frozen: boolean;
  frozen_at: string | null;
  frozen_by: string | null;
  freeze_reason: string | null;
  updated_at: string;
}

const FreezeToggle: React.FC = () => {
  const [frozen, setFrozen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freezeState, setFreezeState] = useState<FreezeState | null>(null);

  // Fetch current freeze state on mount
  useEffect(() => {
    fetchFreezeState();
  }, []);

  async function fetchFreezeState() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/governance/freeze", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch freeze state: ${res.status}`);
      }

      const data = await res.json();
      setFreezeState(data.data);
      setFrozen(data.data.frozen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load freeze state");
    } finally {
      setLoading(false);
    }
  }

  async function updateFreezeState(newFrozen: boolean, reason?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/governance/freeze", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          frozen: newFrozen,
          reason: reason || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || `Failed to update freeze state: ${res.status}`);
      }

      const data = await res.json();
      setFreezeState(data.data);
      setFrozen(data.data.frozen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update freeze state");
      // Revert UI state on failure
      setFrozen(!newFrozen);
    } finally {
      setLoading(false);
    }
  }

  function handleToggleIntent() {
    if (!frozen) {
      // Enabling freeze is destructive — require confirmation
      setConfirming(true);
    } else {
      // Unfreezing is safe — do it immediately
      updateFreezeState(false);
    }
  }

  function handleConfirm() {
    setConfirming(false);
    updateFreezeState(true, "Emergency freeze via operator console");
  }

  if (loading && !freezeState) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="ml-2 text-sm text-muted-foreground">Loading freeze state...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" aria-hidden="true" />
              <h2 className="text-base font-bold text-foreground">Freeze System</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Switch to Read-Only Mode for emergency safety. All write operations will be blocked.
            </p>
            {freezeState?.freeze_reason ? (
              <p className="text-xs text-muted-foreground">
                Reason:{" "}
                <span className="font-medium text-foreground">{freezeState.freeze_reason}</span>
              </p>
            ) : null}
            {frozen && freezeState?.frozen_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                Frozen at: {new Date(freezeState.frozen_at).toLocaleString()}
              </p>
            )}
          </div>
          <label
            className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center"
            htmlFor="freeze-toggle"
          >
            <input
              className="peer sr-only"
              id="freeze-toggle"
              type="checkbox"
              aria-label="Freeze system (enables read-only mode)"
              checked={frozen}
              onChange={handleToggleIntent}
              disabled={loading}
            />
            <div
              className={[
                "h-6 w-11 rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                frozen ? "bg-red-500" : "bg-muted",
                loading ? "opacity-50 cursor-not-allowed" : "",
              ].join(" ")}
            />
            <div
              className={[
                "absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-border bg-background shadow transition-transform duration-200",
                frozen ? "translate-x-5 border-red-300" : "",
              ].join(" ")}
            />
          </label>
        </div>
        <div
          className={[
            "mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
            frozen ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50",
          ].join(" ")}
        >
          <CheckCircle
            className={`h-4 w-4 ${frozen ? "text-red-500" : "text-emerald-500"}`}
            aria-hidden="true"
          />
          <span className={`text-xs font-medium ${frozen ? "text-red-700" : "text-emerald-700"}`}>
            {frozen ? "System is frozen — writes are blocked" : "System is currently Operational"}
          </span>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          <p className="font-semibold">Enforcement Scope:</p>
          <p className="mt-1">
            <strong>Enforced:</strong> Ingestion uploads, reconciliation runs, bulk operations,
            match reviews
          </p>
          <p className="mt-1">
            <strong>Not Enforced:</strong> Read operations, health checks, governance controls,
            connector reads
          </p>
          <p className="mt-1 font-medium text-amber-700 dark:text-amber-300">
            This is a scoped operational freeze, not a universal system lock.
          </p>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze system?</DialogTitle>
            <DialogDescription>
              This will enable Read-Only Mode and block write operations across the tenant
              immediately. Confirm only if this is an intentional emergency action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Freeze System
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FreezeToggle;
