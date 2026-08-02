import dotenv from 'dotenv';
dotenv.config();

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const env = {
  NODE_ENV: required('NODE_ENV', 'development'),
  MONGO_URI: required('MONGO_URI', 'mongodb://localhost:27017/queueflow'),
  REDIS_HOST: required('REDIS_HOST', 'localhost'),
  REDIS_PORT: Number(required('REDIS_PORT', '6379')),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  API_URL: required('API_URL', 'http://localhost:5000'),
  WORKER_CONCURRENCY: Number(required('WORKER_CONCURRENCY', '5')),
  LOG_LEVEL: required('LOG_LEVEL', 'info'),
};
