/**
 * PII (Personally Identifiable Information) Filter
 * 
 * Removes or redacts PII from data to comply with privacy regulations.
 * Used in admin observability dashboards to protect user privacy.
 */

/**
 * Patterns for detecting PII
 */
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
  ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};

/**
 * Redact PII from a string
 */
export function redactPII(text: string): string {
  let redacted = text;
  
  // Redact emails (keep domain for analytics)
  redacted = redacted.replace(PII_PATTERNS.email, (match) => {
    const [local, domain] = match.split('@');
    return `***@${domain}`;
  });
  
  // Redact phone numbers
  redacted = redacted.replace(PII_PATTERNS.phone, '***-***-****');
  
  // Redact SSN
  redacted = redacted.replace(PII_PATTERNS.ssn, '***-**-****');
  
  // Redact credit cards
  redacted = redacted.replace(PII_PATTERNS.creditCard, '****-****-****-****');
  
  // Redact IP addresses (keep first octet for geolocation)
  redacted = redacted.replace(PII_PATTERNS.ipAddress, (match) => {
    const parts = match.split('.');
    return `${parts[0]}.***.***.***`;
  });
  
  return redacted;
}

/**
 * Remove PII from an object recursively
 */
export function removePIIFromObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToRemove: string[] = ['email', 'phone', 'ssn', 'creditCard', 'ipAddress']
): T {
  const cleaned = { ...obj };
  
  for (const [key, value] of Object.entries(cleaned)) {
    // Remove specified fields
    if (fieldsToRemove.includes(key.toLowerCase())) {
      delete cleaned[key];
      continue;
    }
    
    // Recursively clean nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = removePIIFromObject(value as Record<string, unknown>, fieldsToRemove) as T[Extract<keyof T, string>];
    }
    
    // Clean arrays
    if (Array.isArray(value)) {
      cleaned[key] = value.map((item) => {
        if (item && typeof item === 'object') {
          return removePIIFromObject(item as Record<string, unknown>, fieldsToRemove);
        }
        if (typeof item === 'string') {
          return redactPII(item);
        }
        return item;
      }) as T[Extract<keyof T, string>];
    }
    
    // Clean strings
    if (typeof value === 'string') {
      cleaned[key] = redactPII(value) as T[Extract<keyof T, string>];
    }
  }
  
  return cleaned;
}

/**
 * Sanitize user data for admin viewing
 */
export function sanitizeUserData(user: {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}): {
  id: string;
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
} {
  const sanitized: Record<string, unknown> = {
    id: user.id || 'unknown',
  };
  
  // Keep email domain for analytics, redact local part
  if (user.email) {
    const [local, domain] = user.email.split('@');
    sanitized.email = `***@${domain}`;
  }
  
  // Keep name if provided (names are generally not PII in this context)
  if (user.name) {
    sanitized.name = user.name;
  }
  
  // Clean metadata
  if (user.metadata) {
    sanitized.metadata = removePIIFromObject(user.metadata);
  }
  
  // Remove sensitive fields
  delete sanitized.phone;
  delete sanitized.ssn;
  delete sanitized.creditCard;
  delete sanitized.password;
  delete sanitized.token;
  
  return sanitized as typeof sanitized & { id: string };
}

/**
 * Sanitize API request/response data
 */
export function sanitizeApiData(data: {
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  [key: string]: unknown;
}): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  // Sanitize headers (remove auth tokens)
  if (data.headers) {
    const cleanedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(data.headers)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'authorization' || lowerKey === 'cookie' || lowerKey === 'x-api-key') {
        cleanedHeaders[key] = '***REDACTED***';
      } else {
        cleanedHeaders[key] = redactPII(value);
      }
    }
    sanitized.headers = cleanedHeaders;
  }
  
  // Sanitize body
  if (data.body) {
    if (typeof data.body === 'string') {
      sanitized.body = redactPII(data.body);
    } else if (typeof data.body === 'object') {
      sanitized.body = removePIIFromObject(data.body as Record<string, unknown>);
    } else {
      sanitized.body = data.body;
    }
  }
  
  // Sanitize query params
  if (data.query) {
    sanitized.query = removePIIFromObject(data.query);
  }
  
  return sanitized;
}
