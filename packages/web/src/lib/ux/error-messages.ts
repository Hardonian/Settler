/**
 * User-Friendly Error Messages
 * 
 * Provides human-readable error messages for better UX
 */

export interface ErrorContext {
  operation?: string;
  resource?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export class UserFriendlyError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly context?: ErrorContext,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'UserFriendlyError';
  }
}

/**
 * Convert technical error to user-friendly message
 */
export function toUserFriendlyError(error: unknown, context?: ErrorContext): UserFriendlyError {
  if (error instanceof UserFriendlyError) {
    return error;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return new UserFriendlyError(
        error.message,
        'Unable to connect to the server. Please check your internet connection and try again.',
        context,
        true
      );
    }
    
    // Timeout errors
    if (message.includes('timeout')) {
      return new UserFriendlyError(
        error.message,
        'The request took too long to complete. Please try again.',
        context,
        true
      );
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('401')) {
      return new UserFriendlyError(
        error.message,
        'Your session has expired. Please sign in again.',
        context,
        false
      );
    }
    
    // Permission errors
    if (message.includes('forbidden') || message.includes('403')) {
      return new UserFriendlyError(
        error.message,
        'You don\'t have permission to perform this action.',
        context,
        false
      );
    }
    
    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return new UserFriendlyError(
        error.message,
        context?.resource
          ? `The ${context.resource} you're looking for doesn't exist.`
          : 'The requested resource was not found.',
        context,
        false
      );
    }
    
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('429')) {
      return new UserFriendlyError(
        error.message,
        'Too many requests. Please wait a moment and try again.',
        context,
        true
      );
    }
    
    // Server errors
    if (message.includes('500') || message.includes('server error')) {
      return new UserFriendlyError(
        error.message,
        'Something went wrong on our end. We\'ve been notified and are working on a fix.',
        context,
        true
      );
    }
    
    // Generic error
    return new UserFriendlyError(
      error.message,
      'An unexpected error occurred. Please try again or contact support if the problem persists.',
      context,
      true
    );
  }
  
  // Unknown error type
  return new UserFriendlyError(
    String(error),
    'An unexpected error occurred. Please try again or contact support if the problem persists.',
    context,
    true
  );
}

/**
 * Get error message for display
 */
export function getErrorMessage(error: unknown, context?: ErrorContext): string {
  const friendlyError = toUserFriendlyError(error, context);
  return friendlyError.userMessage;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof UserFriendlyError) {
    return error.retryable;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') ||
           message.includes('timeout') ||
           message.includes('500') ||
           message.includes('rate limit');
  }
  
  return false;
}
