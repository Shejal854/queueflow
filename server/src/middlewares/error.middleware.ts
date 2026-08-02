/**
 * PURPOSE: Centralized error handler -- the LAST middleware in the chain.
 * Every thrown/next(err) error in the app funnels here.
 *
 * WHY CENTRALIZE ERROR HANDLING
 * Without this, every controller needs its own try/catch + res.status(...)
 * boilerplate, and error response SHAPE inevitably drifts between routes
 * (one returns {error}, another {message}...). One handler = one
 * guaranteed response contract for the frontend to rely on.
 *
 * WHY ApiError (a custom class) INSTEAD OF THROWING PLAIN Error
 * Lets us attach an HTTP status code to the error at the point it's
 * thrown (`throw new ApiError(404, 'Job not found')`) instead of trying
 * to infer status codes from generic error messages here.
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import { env } from '../config/env';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof Error) {
    message = env.isProd ? 'Internal server error' : err.message;
  }

  if (statusCode >= 500) {
    logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  } else {
    logger.warn({ err: message, path: req.originalUrl }, 'Handled error');
  }

  res.status(statusCode).json({ success: false, message, errors });
}
