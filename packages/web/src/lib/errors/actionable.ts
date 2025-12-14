/**
 * Actionable Error Messages
 * 
 * Provides actionable error messages with guidance for developers.
 */

export interface ActionableError {
  code: string;
  message: string;
  action: string;
  documentation?: string;
  support?: string;
}

const ERROR_GUIDANCE: Record<string, ActionableError> = {
  'USAGE_LIMIT_EXCEEDED': {
    code: 'USAGE_LIMIT_EXCEEDED',
    message: 'You have exceeded your usage limit for this service.',
    action: 'Upgrade your plan or wait for the next billing period. View your usage at /console/usage',
    documentation: '/docs/pricing',
    support: '/support',
  },
  'BILLING_ACCOUNT_REQUIRED': {
    code: 'BILLING_ACCOUNT_REQUIRED',
    message: 'A billing account is required to use this service.',
    action: 'Create a billing account at /console or contact support.',
    documentation: '/docs/getting-started',
    support: '/support',
  },
  'API_KEY_INVALID': {
    code: 'API_KEY_INVALID',
    message: 'The provided API key is invalid or expired.',
    action: 'Generate a new API key at /console/api-keys or check your key format.',
    documentation: '/docs/api-keys',
    support: '/support',
  },
  'RATE_LIMIT_EXCEEDED': {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'You have exceeded the rate limit for this endpoint.',
    action: 'Wait before retrying or upgrade your plan for higher limits. Check rate limits at /docs/rate-limits',
    documentation: '/docs/rate-limits',
    support: '/support',
  },
  'VALIDATION_ERROR': {
    code: 'VALIDATION_ERROR',
    message: 'The request data is invalid.',
    action: 'Check the request format and required fields. See API documentation for details.',
    documentation: '/docs/api-reference',
    support: '/support',
  },
  'RESOURCE_NOT_FOUND': {
    code: 'RESOURCE_NOT_FOUND',
    message: 'The requested resource was not found.',
    action: 'Verify the resource ID and ensure you have access to it.',
    documentation: '/docs/api-reference',
    support: '/support',
  },
  'UNAUTHORIZED': {
    code: 'UNAUTHORIZED',
    message: 'You are not authorized to perform this action.',
    action: 'Check your API key permissions or sign in to access this resource.',
    documentation: '/docs/authentication',
    support: '/support',
  },
  'SERVICE_UNAVAILABLE': {
    code: 'SERVICE_UNAVAILABLE',
    message: 'The service is temporarily unavailable.',
    action: 'Retry your request in a few moments. Check status at /status',
    documentation: '/docs/status',
    support: '/support',
  },
};

/**
 * Get actionable error guidance
 */
export function getActionableError(code: string): ActionableError | null {
  return ERROR_GUIDANCE[code] || null;
}

/**
 * Create an actionable error response
 */
export function createActionableErrorResponse(
  code: string,
  customMessage?: string
) {
  const guidance = getActionableError(code);
  
  if (!guidance) {
    return {
      error: {
        code,
        message: customMessage || 'An error occurred',
      },
    };
  }

  return {
    error: {
      code: guidance.code,
      message: customMessage || guidance.message,
      action: guidance.action,
      documentation: guidance.documentation,
      support: guidance.support,
    },
  };
}

/**
 * Enhance error message with actionable guidance
 */
export function enhanceError(error: Error | string, code?: string): ActionableError {
  const errorCode = code || (typeof error === 'string' ? error : error.message);
  const guidance = getActionableError(errorCode);

  if (guidance) {
    return guidance;
  }

  return {
    code: errorCode,
    message: typeof error === 'string' ? error : error.message,
    action: 'Check the documentation or contact support for assistance.',
    documentation: '/docs',
    support: '/support',
  };
}
