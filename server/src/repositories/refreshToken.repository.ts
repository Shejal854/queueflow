import { RefreshToken } from '../models/RefreshToken';
import { Types } from 'mongoose';

export const refreshTokenRepository = {
  create(userId: string, token: string, expiresAt: Date) {
    return RefreshToken.create({ user: new Types.ObjectId(userId), token, expiresAt });
  },
  findByToken(token: string) {
    return RefreshToken.findOne({ token, revoked: false });
  },
  revoke(token: string) {
    return RefreshToken.updateOne({ token }, { revoked: true });
  },
  revokeAllForUser(userId: string) {
    return RefreshToken.updateMany({ user: userId }, { revoked: true });
  },
};
