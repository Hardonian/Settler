import { Request, Response, NextFunction, RequestHandler } from "express";
import { AnyZodObject, ZodError } from "zod";
import { sendError } from "../utils/api-response";
import { logError } from "../utils/logger";

/**
 * Middleware that validates the request body, query, and params against Zod schemas.
 * Returns a 400 Bad Request with detailed validation errors if parsing fails.
 *
 * @example
 * router.post("/users", validate({ body: CreateUserSchema }), createUser);
 */
export const validate = (schemas: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable string or object
        const errorMessages = error.errors.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        logError("Validation failed", { errors: errorMessages, path: req.path });

        sendError(res, 400, "VALIDATION_ERROR", "Invalid request data", {
          validationErrors: errorMessages,
        });
        return;
      }

      // Pass other unexpected errors to the global error handler
      next(error);
    }
  };
};
