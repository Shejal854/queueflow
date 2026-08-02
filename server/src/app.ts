/**
 * PURPOSE: Builds and configures the Express `app` object -- middleware
 * stack, routes, error handling. Exported (not started) so tests can
 * import `app` and hit it with supertest WITHOUT binding a real port.
 *
 * WHY app.ts IS SEPARATE FROM server.ts
 * Classic Express testability pattern: server.ts does `app.listen(...)`
 * (a side effect you don't want during tests), while app.ts just builds
 * the app. Supertest can drive `app` directly over an in-memory socket.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function buildApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // Basic rate limiting on auth routes to blunt brute-force login
  // attempts -- a small, cheap production practice worth mentioning.
  app.use(
    '/api/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false })
  );

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
