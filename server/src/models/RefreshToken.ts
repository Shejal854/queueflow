/**
 * PURPOSE: Persists refresh tokens so they can be revoked (logout,
 * password change, "log out of all devices") instead of trusting a JWT
 * blindly until it expires.
 *
 * WHY STORE REFRESH TOKENS BUT NOT ACCESS TOKENS
 * Access tokens are short-lived (15 min) and verified statelessly (fast,
 * no DB hit on every request) -- that's the whole point of JWTs.
 * Refresh tokens are long-lived (7 days), so we DO pay a DB hit on the
 * (rare) refresh call in exchange for the ability to revoke them.
 * This hybrid is the standard "stateless access + stateful refresh"
 * pattern used in production auth systems.
 *
 * TTL INDEX: `expires` with `expireAfterSeconds: 0` tells MongoDB to
 * auto-delete the document once `expiresAt` passes -- free garbage
 * collection, no cron job needed.
 */
import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  token: string;
  expiresAt: Date;
  revoked: boolean;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
