/**
 * User Feedback System
 * 
 * Provides comprehensive feedback mechanisms for better UX
 */

import { getErrorMessage, isRetryableError } from './error-messages';
import { toast } from './toast';
import { globalLoadingState } from './loading-states';

/**
 * Show feedback for operation result
 */
export function showFeedback(
  result: { success: boolean; error?: unknown; message?: string },
  options?: {
    showToast?: boolean;
    showLoading?: boolean;
    context?: { operation?: string; resource?: string };
  }
): void {
  const { showToast = true, showLoading = false, context } = options || {};
  
  if (result.success) {
    if (showLoading) {
      globalLoadingState.setLoading(false);
    }
    if (showToast && result.message) {
      toast.success(result.message);
    }
  } else {
    if (showLoading) {
      globalLoadingState.setError(result.error instanceof Error ? result.error : null);
    }
    if (showToast) {
      const errorMessage = getErrorMessage(result.error, context);
      toast.error(errorMessage);
    }
  }
}

/**
 * Execute async operation with feedback
 */
export async function withFeedback<T>(
  operation: () => Promise<T>,
  options?: {
    loadingMessage?: string;
    successMessage?: string;
    showToast?: boolean;
    showLoading?: boolean;
    context?: { operation?: string; resource?: string };
  }
): Promise<T> {
  const {
    loadingMessage,
    successMessage,
    showToast = true,
    showLoading = true,
    context,
  } = options || {};
  
  try {
    if (showLoading && loadingMessage) {
      globalLoadingState.setLoading(true, loadingMessage);
    }
    
    const result = await operation();
    
    if (showLoading) {
      globalLoadingState.setLoading(false);
    }
    if (showToast && successMessage) {
      toast.success(successMessage);
    }
    
    return result;
  } catch {
    if (showLoading) {
      globalLoadingState.setError(error instanceof Error ? error : null);
    }
    if (showToast) {
      const errorMessage = getErrorMessage(error, context);
      const retryable = isRetryableError(error);
      toast.error(errorMessage, retryable ? 10000 : 0); // Show retryable errors longer
    }
    throw error;
  }
}

/**
 * Show retry prompt for retryable errors
 */
export function showRetryPrompt(
  error: unknown,
  onRetry: () => void | Promise<void>
): void {
  const errorMessage = getErrorMessage(error);
  const retryable = isRetryableError(error);
  
  if (retryable) {
    toast.show({
      type: 'error',
      message: errorMessage,
      duration: 0, // Don't auto-dismiss
      action: {
        label: 'Retry',
        onClick: () => {
          void onRetry();
        },
      },
    });
  } else {
    toast.error(errorMessage);
  }
}
