/**
 * PURPOSE: Sign and verify access/refresh JWTs in one place.
 *
 * WHY TWO DIFFERENT SECRETS for access vs refresh tokens
 * If the access-token secret were ever compromised, an attacker could
 * only forge short-lived access tokens (bounded damage) and could NOT
 * mint new refresh tokens to stay authenticated indefinitely.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../interfaces';

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}
