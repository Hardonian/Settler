/**
 * Loading State Management
 *
 * Provides utilities for managing loading states and progress indicators
 */

export interface LoadingState {
  isLoading: boolean;
  progress?: number; // 0-100
  message?: string;
  error?: Error | null;
}

export class LoadingStateManager {
  private state: LoadingState = {
    isLoading: false,
  };
  private listeners: Array<(state: LoadingState) => void> = [];

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: LoadingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get current state
   */
  getState(): Readonly<LoadingState> {
    return { ...this.state };
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean, message?: string): void {
    const newState: LoadingState = {
      ...this.state,
      isLoading,
      error: null,
    };
    if (message !== undefined) {
      newState.message = message;
    }
    this.state = newState;
    this.notify();
  }

  /**
   * Set progress
   */
  setProgress(progress: number, message?: string): void {
    const newState: LoadingState = {
      ...this.state,
      isLoading: true,
      progress: Math.max(0, Math.min(100, progress)),
      error: null,
    };
    if (message !== undefined) {
      newState.message = message;
    }
    this.state = newState;
    this.notify();
  }

  /**
   * Set error
   */
  setError(error: Error | null): void {
    this.state = {
      ...this.state,
      isLoading: false,
      error,
    };
    this.notify();
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      isLoading: false,
    };
    this.notify();
  }

  /**
   * Notify listeners
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }
}

/**
 * Global loading state manager
 */
export const globalLoadingState = new LoadingStateManager();

/**
 * React hook for loading state (if using React)
 */
export function useLoadingState() {
  // This would be implemented with React hooks in a React component
  // For now, return the global state manager
  return globalLoadingState;
}
