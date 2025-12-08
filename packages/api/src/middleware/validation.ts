import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { logWarn } from "../utils/logger";
import { AuthRequest } from "./auth";

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logWarn('Validation error', {
          path: req.path,
          method: req.method,
          errors: error.errors,
          traceId: (req as AuthRequest).traceId,
        });
        
        res.status(400).json({
          error: "Validation Error",
          message: "Invalid request data",
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      } else {
        next(error);
      }
    }
  };
};
