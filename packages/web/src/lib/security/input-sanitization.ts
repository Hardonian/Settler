/**
 * Input Sanitization
 * 
 * Security utilities for sanitizing user input to prevent:
 * - XSS attacks
 * - SQL injection (via Prisma, but defense in depth)
 * - NoSQL injection
 * - Path traversal
 * - Command injection
 */

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength = 10000): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize file path (prevent path traversal)
 */
export function sanitizePath(path: string): string {
  // Remove path traversal attempts
  let sanitized = path.replace(/\.\./g, '').replace(/\/\//g, '/');
  
  // Remove leading/trailing slashes
  sanitized = sanitized.replace(/^\/+|\/+$/g, '');
  
  // Only allow alphanumeric, hyphens, underscores, and forward slashes
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_\/]/g, '');
  
  return sanitized;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    maxStringLength?: number;
    sanitizeUrls?: boolean;
    sanitizePaths?: boolean;
  } = {}
): T {
  const { maxStringLength = 10000, sanitizeUrls = false, sanitizePaths = false } = options;

  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      let sanitizedValue: string | null = sanitizeString(value, maxStringLength);
      
      if (sanitizeUrls && key.toLowerCase().includes('url')) {
        sanitizedValue = sanitizeUrl(sanitizedValue) || sanitizedValue;
      }
      
      if (sanitizePaths && (key.toLowerCase().includes('path') || key.toLowerCase().includes('file'))) {
        sanitizedValue = sanitizePath(sanitizedValue);
      }
      
      (sanitized as Record<string, unknown>)[key] = sanitizedValue;
    } else if (Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item, maxStringLength) : item
      );
    } else if (value && typeof value === 'object') {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        options
      );
    } else {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
