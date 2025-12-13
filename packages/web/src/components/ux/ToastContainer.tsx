/**
 * Toast Container Component
 * 
 * Displays toast notifications
 */

'use client';

import { useEffect, useState } from 'react';
import { toast, Toast, ToastType } from '@/lib/ux/toast';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
  error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts);
    return unsubscribe;
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toastItem) => {
        const Icon = iconMap[toastItem.type];
        return (
          <div
            key={toastItem.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
              colorMap[toastItem.type]
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{toastItem.message}</p>
              {toastItem.action && (
                <button
                  onClick={toastItem.action.onClick}
                  className="mt-2 text-sm font-semibold underline"
                >
                  {toastItem.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(toastItem.id)}
              className="flex-shrink-0 text-current opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
