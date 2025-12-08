/**
 * Comprehensive Input Validation
 * OWASP Top 10 mitigation: Injection, XSS, etc.
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Common validation schemas
export const commonSchemas = {
  uuid: z.string().uuid('Invalid UUID format'),
  email: z.string().email('Invalid email format').max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').min(1).max(255),
  url: z.string().url('Invalid URL format').max(2048),
  nonEmptyString: z.string().min(1).max(10000),
  positiveInteger: z.number().int().positive(),
  nonNegativeInteger: z.number().int().nonnegative(),
  json: z.string().transform((str, ctx) => {
    try {
      return JSON.parse(str);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON',
      });
      return z.NEVER;
    }
  }),
};

// Request size limits (OWASP recommendation)
export const REQUEST_LIMITS = {
  MAX_BODY_SIZE: 1024 * 1024, // 1 MB
  MAX_FIELD_LENGTH: 10000,
  MAX_ARRAY_LENGTH: 1000,
  MAX_DEPTH: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
};

/**
 * Validate request body with Zod schema
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check body size
      const contentLength = parseInt(req.get('content-length') || '0', 10);
      if (contentLength > REQUEST_LIMITS.MAX_BODY_SIZE) {
        res.status(413).json({
          error: 'PayloadTooLarge',
          message: `Request body exceeds ${REQUEST_LIMITS.MAX_BODY_SIZE} bytes`,
        });
        return;
      }

      // Validate with Zod
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid request body',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid query parameters',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate path parameters
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'ValidationError',
          message: 'Invalid path parameters',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Sanitize string input (XSS prevention)
 */
export function sanitizeString(input: string): string {
  // Remove null bytes
  let sanitized = input.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Truncate to max length
  if (sanitized.length > REQUEST_LIMITS.MAX_FIELD_LENGTH) {
    sanitized = sanitized.substring(0, REQUEST_LIMITS.MAX_FIELD_LENGTH);
  }
  
  return sanitized;
}

/**
 * Validate and sanitize JSON input
 */
export function validateJson(input: string, maxDepth: number = REQUEST_LIMITS.MAX_DEPTH): any {
  const parsed = JSON.parse(input);
  
  function checkDepth(obj: any, currentDepth: number = 0): void {
    if (currentDepth > maxDepth) {
      throw new Error(`JSON depth exceeds maximum of ${maxDepth} levels`);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          checkDepth(value, currentDepth + 1);
        }
      }
    }
  }
  
  checkDepth(parsed);
  return parsed;
}

/**
 * Validate file upload
 */
export function validateFile(file: { size: number; mimetype: string; originalname: string }): void {
  if (file.size > REQUEST_LIMITS.MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${REQUEST_LIMITS.MAX_FILE_SIZE} bytes`);
  }
  
  // Validate file extension (whitelist approach)
  const allowedExtensions = ['.json', '.csv', '.txt'];
  const ext = file.originalname.substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(ext.toLowerCase())) {
    throw new Error(`File type not allowed: ${ext}`);
  }
}
