/**
 * PURPOSE: User account schema for authentication.
 *
 * WHY bcrypt hash stored, never plaintext password:
 * If the DB is ever leaked, hashed+salted passwords cannot be reversed
 * cheaply. bcrypt is intentionally SLOW (adjustable cost factor) to make
 * brute-forcing infeasible even after a leak.
 *
 * WHY a pre-save hook for hashing (instead of hashing in the service):
 * Guarantees that NO code path can ever save a plaintext password, even
 * if a future developer forgets to hash it in a new service method.
 * This is "defense at the data layer."
 *
 * INDEXES: unique index on email for O(log n) lookup during login and to
 * enforce one-account-per-email at the DB level (race-condition safe,
 * unlike an application-level "check then insert").
 */
import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>('User', userSchema);
