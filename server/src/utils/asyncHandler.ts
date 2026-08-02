/**
 * PURPOSE: Wraps async Express route handlers so any rejected Promise
 * is forwarded to next(err) automatically.
 *
 * WHY THIS EXISTS
 * Express (v4) does NOT catch errors thrown inside async functions --
 * an unhandled rejection would crash the process or hang the request.
 * Wrapping every async controller in try/catch is repetitive; this
 * higher-order function does it once, generically.
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
