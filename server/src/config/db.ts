/**
 * PURPOSE: Owns the MongoDB connection lifecycle via Mongoose.
 *
 * WHY A SEPARATE FILE
 * Connection setup (retries, event listeners, graceful shutdown) is
 * infrastructure concern, not business logic. Keeping it isolated means
 * server.ts stays a thin composition root, and the worker process can
 * reuse this exact same module instead of duplicating connection code.
 *
 * INTERVIEW TALKING POINT
 * Why does the WORKER also need its own Mongo connection instead of
 * calling the API? Because workers run as an independent process/service
 * (see architecture doc) -- they read/write Job state directly for
 * performance and to avoid a synchronous HTTP hop on every job.
 */
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error({ err }, 'MongoDB connection error'));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGO_URI);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
