/**
 * PURPOSE: Generic middleware that validates req.{body,params,query}
 * against any Zod schema, BEFORE the request reaches the controller.
 *
 * WHY IN MIDDLEWARE, NOT INSIDE EACH CONTROLLER
 * Keeps controllers focused on orchestration (call service, send
 * response) instead of repeating parsing/error-formatting logic in every
 * handler. This is the Single Responsibility Principle applied to
 * Express: routing validates, controllers orchestrate, services decide.
 */
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate =
  (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
        });
      }
      next(err);
    }
  };
