/**
 * PII Detection and Sanitization
 * 
 * Detects and sanitizes PII in logs, error messages, and API responses
 * to prevent data leaks and ensure compliance.
 */

import { logger } from '@/lib/observability/logger';

// Common PII patterns
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
  apiKey: /\b(sk|pk|ak)_[a-zA-Z0-9]{20,}\b/g,
  token: /\b[A-Za-z0-9_-]{32,}\b/g,
};

// Sanitization functions
const SANITIZERS = {
  email: (value: string) => {
    const [local, domain] = value.split('@');
    if (!local || !domain) {
      return '***@***';
    }
    return `${local.substring(0, 2)}***@${domain}`;
  },
  phone: (value: string) => {
    return `***-***-${value.slice(-4)}`;
  },
  ssn: (value: string) => {
    return `***-**-${value.slice(-4)}`;
  },
  creditCard: (value: string) => {
    return `****-****-****-${value.slice(-4)}`;
  },
  ipAddress: (value: string) => {
    return `***.***.***.${value.split('.').pop()}`;
  },
  uuid: (value: string) => {
    return `${value.substring(0, 8)}-****-****-****-${value.slice(-12)}`;
  },
  apiKey: (value: string) => {
    return `${value.substring(0, 7)}***`;
  },
  token: (value: string) => {
    return `${value.substring(0, 8)}***`;
  },
};

export interface PIIDetectionResult {
  detected: boolean;
  types: string[];
  sanitized: string;
  originalLength: number;
}

/**
 * Detect PII in a string
 */
export function detectPII(text: string): PIIDetectionResult {
  const detectedTypes: string[] = [];
  let sanitized = text;

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(text)) {
      detectedTypes.push(type);
      sanitized = sanitized.replace(pattern, (match) => {
        const sanitizer = SANITIZERS[type as keyof typeof SANITIZERS];
        return sanitizer ? sanitizer(match) : '***';
      });
    }
  }

  return {
    detected: detectedTypes.length > 0,
    types: detectedTypes,
    sanitized,
    originalLength: text.length,
  };
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T>(obj: T, depth = 0): T {
  if (depth > 10) {
    // Prevent infinite recursion
    return obj;
  }

  if (typeof obj === 'string') {
    const result = detectPII(obj);
    return (result.detected ? result.sanitized : obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1)) as T;
  }

  if (obj && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip known safe keys
      if (
        ['id', 'userId', 'tenantId', 'timestamp', 'createdAt', 'updatedAt'].includes(
          key
        )
      ) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    return sanitized as T;
  }

  return obj;
}

/**
 * Safe logger that automatically sanitizes PII
 */
export const safeLogger = {
  info: async (message: string, context?: Record<string, unknown>) => {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    await logger.info(message, sanitizedContext);
  },

  warn: async (message: string, context?: Record<string, unknown>) => {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    await logger.warn(message, sanitizedContext);
  },

  error: async (message: string, context?: Record<string, unknown>) => {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    await logger.error(message, sanitizedContext);
  },

  debug: async (message: string, context?: Record<string, unknown>) => {
    const sanitizedContext = context ? sanitizeObject(context) : undefined;
    await logger.debug(message, sanitizedContext);
  },
};

/**
 * Check for PII leaks in error messages
 */
export function sanitizeError(error: Error): Error {
  const message = error.message;
  const result = detectPII(message);

  if (result.detected) {
    const sanitizedError = new Error(result.sanitized);
    sanitizedError.name = error.name;
    sanitizedError.stack = error.stack
      ? error.stack.split('\n').map((line) => {
          const lineResult = detectPII(line);
          return lineResult.detected ? lineResult.sanitized : line;
        }).join('\n')
      : undefined;
    return sanitizedError;
  }

  return error;
}

/**
 * Audit PII usage (for compliance)
 */
export async function auditPIIUsage(
  context: string,
  data: Record<string, unknown>
): Promise<void> {
  const result = detectPII(JSON.stringify(data));

  if (result.detected) {
    await logger.warn('PII detected in data', {
      context,
      piiTypes: result.types,
      dataSize: result.originalLength,
      // Don't log the actual data
    });
  }
}
