/**
 * CSRF Protection Middleware
 * Protects web UI endpoints from Cross-Site Request Forgery attacks
 * 
 * Uses double-submit cookie pattern:
 * 1. Server sets CSRF token in cookie (httpOnly: false for JavaScript access)
 * 2. Client sends token in header (X-CSRF-Token)
 * 3. Server validates token matches cookie value
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logWarn } from '../utils/logger';
import { config } from '../config';

// Extend Express Request to include cookies
declare global {
  namespace Express {
    interface Request {
      cookies: { [key: string]: string };
    }
  }
}

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Generate CSRF token
 */
function generateCsrfToken(): string {
  return uuidv4();
}

/**
 * CSRF protection middleware
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE)
 * and only when not using API key authentication
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF for API key authentication (stateless)
  if (req.headers['x-api-key']) {
    return next();
  }

  // Skip CSRF for read-only methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for API endpoints (they use API keys or JWT)
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // Get token from cookie and header
  const cookieToken = req.cookies[CSRF_TOKEN_COOKIE];
  const headerToken = req.headers[CSRF_TOKEN_HEADER] as string;

  // Validate tokens match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    logWarn('CSRF token validation failed', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'CSRF token validation failed',
    });
    return;
  }

  next();
}

/**
 * Middleware to set CSRF token cookie
 * Sets token on GET requests for web UI
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Only set CSRF token for web UI routes
  if (req.path.startsWith('/api/')) {
    return next();
  }

  // Generate new token if not present
  const existingToken = req.cookies[CSRF_TOKEN_COOKIE];
  if (!existingToken) {
    const token = generateCsrfToken();
    res.cookie(CSRF_TOKEN_COOKIE, token, {
      httpOnly: false, // Must be accessible to JavaScript
      secure: config.security.secureCookies, // HTTPS only in production
      sameSite: 'strict', // Prevent CSRF attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  next();
}

/**
 * Get CSRF token endpoint (for JavaScript clients)
 * Returns token in response body
 */
export function getCsrfToken(req: Request, res: Response): void {
  const token = req.cookies[CSRF_TOKEN_COOKIE] || generateCsrfToken();
  
  // Set cookie if not present
  if (!req.cookies[CSRF_TOKEN_COOKIE]) {
    res.cookie(CSRF_TOKEN_COOKIE, token, {
      httpOnly: false,
      secure: config.security.secureCookies,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
  }

  res.json({ csrfToken: token });
}
