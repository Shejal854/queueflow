/**
 * PURPOSE: HTTP boundary for auth. Translates req/res into calls on
 * authService and sets cookies. Contains ZERO business logic -- that's
 * the whole point of the layered architecture (routes -> controllers ->
 * services -> repositories -> DB).
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { authService } from '../services/auth.service';
import { ApiError } from '../utils/ApiError';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../constants';
import { env } from '../config/env';

const cookieOpts = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax' as const,
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const tokens = await authService.register(name, email, password);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendSuccess(res, 201, 'Registered successfully', { accessToken: tokens.accessToken });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, 200, 'Logged in successfully', {
      accessToken: result.accessToken,
      user: result.user,
    });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (!token) throw new ApiError(401, 'No refresh token provided');
    const tokens = await authService.refresh(token);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    sendSuccess(res, 200, 'Token refreshed', { accessToken: tokens.accessToken });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (token) await authService.logout(token);
    res.clearCookie(ACCESS_TOKEN_COOKIE);
    res.clearCookie(REFRESH_TOKEN_COOKIE);
    sendSuccess(res, 200, 'Logged out successfully', null);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, 200, 'Current user', req.user);
  }),
};
