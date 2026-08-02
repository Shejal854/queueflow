/**
 * PURPOSE: Business logic for register/login/logout/refresh -- the
 * ONLY layer that knows about password hashing rules, token issuance,
 * and refresh-token rotation policy.
 *
 * WHY SERVICES EXIST SEPARATELY FROM CONTROLLERS (layered architecture)
 * Controllers deal with HTTP (req/res). Services deal with business
 * RULES. If we later add a CLI script or a GraphQL layer that also
 * needs "register a user," it calls authService.register() directly --
 * no HTTP required, no duplicated logic. This separation is what makes
 * business logic UNIT-TESTABLE without spinning up Express.
 *
 * REFRESH TOKEN ROTATION
 * Every time /refresh is called, we REVOKE the old refresh token and
 * issue a brand new one. If a stolen refresh token is ever reused after
 * the legitimate user already rotated it, the old (revoked) token fails,
 * which is a detectable signal of token theft in a more advanced system.
 */
import { userRepository } from '../repositories/user.repository';
import { refreshTokenRepository } from '../repositories/refreshToken.repository';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { env } from '../config/env';

function refreshExpiryDate(): Date {
  const durationMs = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + durationMs);
}

// Tiny duration parser to avoid pulling in the `ms` package just for this.
function parseDuration(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit] as number;
  return value * unitMs;
}

export const authService = {
  async register(name: string, email: string, password: string) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ApiError(409, 'Email already registered');

    const user = await userRepository.create({ name, email, password });
    return authService.issueTokens(user._id.toString(), user.role);
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email, true);
    if (!user) throw new ApiError(401, 'Invalid credentials');

    const valid = await user.comparePassword(password);
    if (!valid) throw new ApiError(401, 'Invalid credentials');

    const tokens = await authService.issueTokens(user._id.toString(), user.role);
    return { ...tokens, user: { id: user._id, name: user.name, email: user.email, role: user.role } };
  },

  async issueTokens(userId: string, role: 'user' | 'admin') {
    const accessToken = signAccessToken({ userId, role });
    const refreshToken = signRefreshToken({ userId, role });
    await refreshTokenRepository.create(userId, refreshToken, refreshExpiryDate());
    return { accessToken, refreshToken };
  },

  async refresh(oldToken: string) {
    let decoded;
    try {
      decoded = verifyRefreshToken(oldToken);
    } catch {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const stored = await refreshTokenRepository.findByToken(oldToken);
    if (!stored) throw new ApiError(401, 'Refresh token revoked or unknown');

    await refreshTokenRepository.revoke(oldToken); // rotation
    return authService.issueTokens(decoded.userId, decoded.role);
  },

  async logout(token: string) {
    await refreshTokenRepository.revoke(token);
  },
};
