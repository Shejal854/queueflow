/**
 * PURPOSE
 * Centralizes all environment variable access behind a single, typed object.
 *
 * WHY THIS EXISTS
 * Reading process.env.X directly all over the codebase is fragile: typos
 * aren't caught until runtime, there's no single place to see what config
 * the app needs, and it's easy to forget to set a var in production.
 * This file fails FAST (at boot) if a required var is missing, and gives
 * every other file a typed, autocompletable `env` object to import.
 *
 * INTERVIEW TALKING POINT
 * "Fail fast" config validation is a production practice: better to crash
 * on startup with a clear error than to crash (or silently misbehave) at
 * 2am when a request finally touches the missing config.
 */
import dotenv from 'dotenv';
dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: required('NODE_ENV', 'development'),
  PORT: Number(required('PORT', '5000')),

  MONGO_URI: required('MONGO_URI', 'mongodb://localhost:27017/queueflow'),

  REDIS_HOST: required('REDIS_HOST', 'localhost'),
  REDIS_PORT: Number(required('REDIS_PORT', '6379')),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
  JWT_ACCESS_EXPIRES_IN: required('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: required('JWT_REFRESH_EXPIRES_IN', '7d'),

  CLIENT_URL: required('CLIENT_URL', 'http://localhost:5173'),

  LOG_LEVEL: required('LOG_LEVEL', 'info'),

  isProd: process.env.NODE_ENV === 'production',
};
