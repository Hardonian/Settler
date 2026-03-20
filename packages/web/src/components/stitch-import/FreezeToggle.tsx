"use client";

import React, { useState } from "react";
import { Lock, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const FreezeToggle: React.FC = () => {
  const [frozen, setFrozen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleToggleIntent() {
    if (!frozen) {
      // Enabling freeze is destructive — require confirmation
      setConfirming(true);
    } else {
      // Unfreezing is safe — do it immediately
      setFrozen(false);
    }
  }

  function handleConfirm() {
    setFrozen(true);
    setConfirming(false);
  }

  return (
    <>
      <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500" aria-hidden="true" />
              <h2 className="text-base font-bold text-foreground">Freeze System</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Switch to Read-Only Mode for emergency safety. All write operations will be blocked.
            </p>
          </div>
          <label
            className="relative mt-1 inline-flex shrink-0 cursor-pointer items-center"
            htmlFor="freeze-toggle"
          >
            <input
              className="peer sr-only"
              id="freeze-toggle"
              type="checkbox"
              role="switch"
              aria-checked={frozen}
              aria-label="Freeze system (enables read-only mode)"
              checked={frozen}
              onChange={handleToggleIntent}
            />
            <div
              className={[
                "h-6 w-11 rounded-full transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                frozen
                  ? "bg-red-500"
                  : "bg-border dark:bg-border",
              ].join(" ")}
            />
            <div
              className={[
                "absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-border/60 bg-white shadow transition-transform duration-200",
                frozen ? "translate-x-5 border-red-300" : "",
              ].join(" ")}
            />
          </label>
        </div>
        <div
          className={[
            "mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
            frozen
              ? "border-red-200 bg-red-50"
              : "border-emerald-200 bg-emerald-50",
          ].join(" ")}
        >
          <CheckCircle
            className={`h-4 w-4 ${frozen ? "text-red-500" : "text-emerald-500"}`}
            aria-hidden="true"
          />
          <span
            className={`text-xs font-medium ${frozen ? "text-red-700" : "text-emerald-700"}`}
          >
            {frozen ? "System is frozen — writes are blocked" : "System is currently Operational"}
          </span>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze system?</DialogTitle>
            <DialogDescription>
              This will enable Read-Only Mode and block all write operations across the tenant
              immediately. Confirm only if this is an intentional emergency action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md border border-border/40 px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted/10 transition-colors"
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
