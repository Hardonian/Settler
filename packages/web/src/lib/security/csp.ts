/**
 * Content Security Policy (CSP) Configuration
 * 
 * Configures CSP headers for enhanced security.
 */

export interface CSPDirective {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'connect-src'?: string[];
  'font-src'?: string[];
  'object-src'?: string[];
  'media-src'?: string[];
  'frame-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

const DEFAULT_CSP: CSPDirective = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for Next.js in development
    'https://vercel.live',
    'https://va.vercel-scripts.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://api.stripe.com',
    'https://*.vercel.app',
    'https://vercel.live',
    process.env.NEXT_PUBLIC_SENTRY_DSN ? 'https://*.sentry.io' : '',
  ].filter(Boolean),
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'object-src': ["'none'"],
  'media-src': ["'self'"],
  'frame-src': [
    "'self'",
    'https://js.stripe.com',
    'https://hooks.stripe.com',
  ],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': process.env.NODE_ENV === 'production',
};

/**
 * Build CSP header string
 */
export function buildCSPHeader(directives: CSPDirective = DEFAULT_CSP): string {
  const parts: string[] = [];

  Object.entries(directives).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      if (value) {
        parts.push(key);
      }
    } else if (Array.isArray(value)) {
      const filtered = value.filter(Boolean);
      if (filtered.length > 0) {
        parts.push(`${key} ${filtered.join(' ')}`);
      }
    }
  });

  return parts.join('; ');
}

/**
 * Get CSP header for production
 */
export function getCSPHeader(): string {
  return buildCSPHeader(DEFAULT_CSP);
}

/**
 * Get CSP header for development (more permissive)
 */
export function getCSPHeaderDev(): string {
  return buildCSPHeader({
    ...DEFAULT_CSP,
    'script-src': [
      ...(DEFAULT_CSP['script-src'] || []),
      "'unsafe-eval'", // Allow eval in development
    ],
    'connect-src': [
      ...(DEFAULT_CSP['connect-src'] || []),
      'ws://localhost:*',
      'http://localhost:*',
    ],
  });
}
