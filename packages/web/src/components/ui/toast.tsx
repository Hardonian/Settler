/**
 * Toast notification system — token-based surfaces for light/dark parity.
 */

"use client";

import React, { useState, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
  };

  const surface = {
    success:
      "border-success/35 bg-card text-foreground shadow-md ring-1 ring-inset ring-success/20 dark:bg-card dark:ring-success/25",
    error:
      "border-error/40 bg-card text-foreground shadow-md ring-1 ring-inset ring-error/25 dark:ring-error/30",
    info: "border-border bg-card text-foreground shadow-md ring-1 ring-inset ring-border",
    warning:
      "border-warning/45 bg-card text-foreground shadow-md ring-1 ring-inset ring-warning/30 dark:ring-warning/35",
  };

  const iconClass = {
    success: "text-success",
    error: "text-error",
    info: "text-accent-highlight",
    warning: "text-warning",
  };

  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        "flex min-w-[300px] max-w-[400px] items-start gap-3 rounded-[var(--ui-radius-md)] border p-4",
        surface[toast.type]
      )}
      role="status"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 flex-shrink-0", iconClass[toast.type])} aria-hidden="true" />
      <div className="flex-1 text-sm leading-relaxed">{toast.message}</div>
      <button
        type="button"
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded-sm text-muted-foreground opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
