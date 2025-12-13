/**
 * Toast Notification System
 * 
 * Provides user feedback through toast notifications
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // Auto-dismiss after ms (0 = don't auto-dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: Array<(toasts: Toast[]) => void> = [];
  private nextId = 0;

  /**
   * Subscribe to toast changes
   */
  subscribe(listener: (toasts: Toast[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get all toasts
   */
  getToasts(): Readonly<Toast[]> {
    return [...this.toasts];
  }

  /**
   * Show toast
   */
  show(toast: Omit<Toast, 'id'>): string {
    const id = `toast-${this.nextId++}`;
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };
    
    this.toasts.push(newToast);
    this.notify();
    
    // Auto-dismiss if duration is set
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, newToast.duration);
    }
    
    return id;
  }

  /**
   * Show success toast
   */
  success(message: string, duration?: number): string {
    return this.show({ type: 'success', message, duration });
  }

  /**
   * Show error toast
   */
  error(message: string, duration?: number): string {
    return this.show({ type: 'error', message, duration: duration ?? 0 }); // Don't auto-dismiss errors
  }

  /**
   * Show warning toast
   */
  warning(message: string, duration?: number): string {
    return this.show({ type: 'warning', message, duration });
  }

  /**
   * Show info toast
   */
  info(message: string, duration?: number): string {
    return this.show({ type: 'info', message, duration });
  }

  /**
   * Dismiss toast
   */
  dismiss(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts = [];
    this.notify();
  }

  /**
   * Notify listeners
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener(this.toasts));
  }
}

/**
 * Global toast manager
 */
export const toast = new ToastManager();
