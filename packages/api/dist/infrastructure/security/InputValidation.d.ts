/**
 * Comprehensive Input Validation
 * OWASP Top 10 mitigation: Injection, XSS, etc.
 */
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const commonSchemas: {
    uuid: z.ZodString;
    email: z.ZodString;
    slug: z.ZodString;
    url: z.ZodString;
    nonEmptyString: z.ZodString;
    positiveInteger: z.ZodNumber;
    nonNegativeInteger: z.ZodNumber;
    json: z.ZodEffects<z.ZodString, any, string>;
};
export declare const REQUEST_LIMITS: {
    MAX_BODY_SIZE: number;
    MAX_FIELD_LENGTH: number;
    MAX_ARRAY_LENGTH: number;
    MAX_DEPTH: number;
    MAX_FILE_SIZE: number;
};
/**
 * Validate request body with Zod schema
 */
export declare function validateBody<T extends z.ZodTypeAny>(schema: T): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validate query parameters
 */
export declare function validateQuery<T extends z.ZodTypeAny>(schema: T): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Validate path parameters
 */
export declare function validateParams<T extends z.ZodTypeAny>(schema: T): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Sanitize string input (XSS prevention)
 */
export declare function sanitizeString(input: string): string;
/**
 * Validate and sanitize JSON input
 */
export declare function validateJson(input: string, maxDepth?: number): any;
/**
 * Validate file upload
 */
export declare function validateFile(file: {
    size: number;
    mimetype: string;
    originalname: string;
}): void;
//# sourceMappingURL=InputValidation.d.ts.map