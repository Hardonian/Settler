/**
 * Protocol Utilities
 * Helper functions for working with protocol types
 */

import {
  Money
} from './index';

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate ISO 8601 date string
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === dateString;
}

/**
 * Validate currency code (ISO 4217)
 */
export function isValidCurrency(currency: string): boolean {
  if (!currency || typeof currency !== 'string') {
    return false;
  }
  
  // Basic ISO 4217 validation (3 uppercase letters)
  return /^[A-Z]{3}$/.test(currency);
}

/**
 * Validate money amount
 */
export function isValidMoney(money: Money): boolean {
  if (!money || typeof money !== 'object') {
    return false;
  }
  
  if (typeof money.value !== 'number' || isNaN(money.value) || !isFinite(money.value)) {
    return false;
  }
  
  if (money.value < 0) {
    return false; // Negative amounts not allowed by default
  }
  
  return isValidCurrency(money.currency);
}

/**
 * Format money for display
 */
export function formatMoney(money: Money, locale: string = 'en-US'): string {
  if (!isValidMoney(money)) {
    return 'Invalid';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: money.currency
    }).format(money.value);
  } catch {
    return `${money.currency} ${money.value.toFixed(2)}`;
  }
}

/**
 * Sanitize transaction metadata
 */
export function sanitizeTransactionMetadata(
  metadata?: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }
  
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(metadata)) {
    // Sanitize keys
    const sanitizedKey = sanitizeString(key);
    if (!sanitizedKey) continue;
    
    // Sanitize values
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (value === null) {
      sanitized[sanitizedKey] = null;
    }
    // Skip objects and arrays for security
  }
  
  return sanitized;
}

/**
 * Validate transaction ID format
 */
export function validateTransactionId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }
  
  // Basic validation: non-empty, reasonable length
  return id.length > 0 && id.length <= 255 && /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Mask PII in strings
 */
export function maskPII(input: string, maskChar: string = '*'): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Mask email addresses
  input = input.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (email) => {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    return `${local[0]}${maskChar.repeat(Math.max(0, local.length - 2))}@${domain}`;
  });
  
  // Mask credit card numbers (basic)
  input = input.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, (card) => {
    return `****-****-****-${card.slice(-4)}`;
  });
  
  return input;
}

/**
 * Generate secure random ID
 */
export function generateSecureId(prefix: string = 'id'): string {
  const randomBytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return `${prefix}_${hex}`;
}

/**
 * Deep clone object (for immutable updates)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}
