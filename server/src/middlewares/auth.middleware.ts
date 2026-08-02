/**
 * PURPOSE: Protects routes by verifying the JWT access token and
 * attaching the decoded user to `req.user`.
 *
 * WHY JWT ACCESS TOKEN IN AN httpOnly COOKIE (not localStorage)
 * Tokens in localStorage are readable by any JS on the page -> vulnerable
 * to XSS token theft. httpOnly cookies can't be read by JS at all, only
 * sent automatically by the browser. We pair this with a CSRF-safe
 * pattern (SameSite=Lax/Strict) instead of manual CSRF tokens for an
 * SDE-level project.
 *
 * WHY SHORT-LIVED ACCESS TOKEN + LONG-LIVED REFRESH TOKEN
 * Limits the blast radius if an access token IS somehow stolen (expires
 * in 15 min) while avoiding forcing users to log in every 15 minutes
 * (the refresh token silently gets them a new one).
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { JwtPayload } from '../interfaces';
import { ACCESS_TOKEN_COOKIE } from '../constants';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : undefined;
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] || bearerToken;

  if (!token) return next(new ApiError(401, 'Not authenticated'));

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') return next(new ApiError(403, 'Admin access required'));
  next();
}
