import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async Express route handler to automatically catch promise rejections
 * and pass them to the global error handler via next().
 * This eliminates the need for try/catch boilerplate in every route.
 *
 * @example
 * router.get("/users", asyncHandler(async (req, res) => {
 *   const users = await db.query("SELECT * FROM users");
 *   res.json(users);
 * }));
 */
export const asyncHandler = (
  fn: (req: Request | any, res: Response, next: NextFunction) => Promise<any>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
