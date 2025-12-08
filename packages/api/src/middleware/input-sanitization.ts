/**
 * Input Sanitization Middleware
 * Provides additional input sanitization beyond Zod validation
 */

import { Request, Response, NextFunction } from 'express';
import { sanitizeReportData } from '../utils/xss-sanitize';
import { logWarn } from '../utils/logger';

/**
 * Sanitize request body to prevent XSS and injection attacks
 * This is a defense-in-depth measure - Zod validation is primary
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  // Only sanitize if body exists and is an object
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    try {
      // Deep sanitize string values
      req.body = sanitizeReportData(req.body) as typeof req.body;
    } catch (error: unknown) {
      logWarn('Input sanitization failed', { error, path: req.path });
      // Continue anyway - Zod validation will catch invalid input
    }
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        // Remove potential XSS patterns
        const sanitized = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
        
        if (sanitized !== value) {
          logWarn('Potentially malicious query parameter detected', {
            key,
            path: req.path,
            ip: req.ip,
          });
          req.query[key] = sanitized;
        }
      }
    }
  }

  next();
}

/**
 * Validate and sanitize URL parameters
 */
export function sanitizeUrlParams(req: Request, res: Response, next: NextFunction): void {
  // Validate UUID format for ID parameters
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  for (const [key, value] of Object.entries(req.params)) {
    if (key.toLowerCase().includes('id') && typeof value === 'string') {
      if (!uuidPattern.test(value)) {
        res.status(400).json({
          error: 'INVALID_ID',
          message: `Invalid ${key} format`,
        });
        return;
      }
    }

    // Sanitize string parameters
    if (typeof value === 'string') {
      const sanitized = value.replace(/[<>'"&]/g, '');
      if (sanitized !== value) {
        logWarn('Potentially malicious URL parameter detected', {
          key,
          path: req.path,
          ip: req.ip,
        });
        req.params[key] = sanitized;
      }
    }
  }

  next();
}
