/**
 * PURPOSE: App-wide structured logger.
 *
 * WHY PINO (over console.log or Winston)
 * - Pino is one of the fastest Node loggers (JSON, low overhead, async).
 * - Structured (JSON) logs are machine-parseable -> easy to ship to
 *   ELK/Datadog/CloudWatch and query ("show me all logs where jobId=X").
 * - console.log is fine for a script, not for a service: no levels, no
 *   structure, no way to turn down verbosity in prod without code changes.
 *
 * INTERVIEW TALKING POINT
 * Structured logging + correlation IDs (see pino-http reqId) is how you
 * debug a distributed system in production without SSH-ing into a box.
 */
import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.isProd
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
});
