/**
 * PURPOSE: The actual process entrypoint -- connects to Mongo, starts
 * the HTTP server, wires up Socket.IO, and handles graceful shutdown.
 *
 * WHY GRACEFUL SHUTDOWN (SIGTERM handler)
 * In Docker/Kubernetes, the platform sends SIGTERM before killing a
 * container (e.g. during a deploy). Without a handler, in-flight HTTP
 * requests get dropped mid-response. Closing the server first (stop
 * accepting new connections, let existing ones finish) then closing DB
 * connections is the standard production shutdown sequence.
 */
import http from 'http';
import { buildApp } from './app';
import { connectDB, disconnectDB } from './config/db';
import { initSocket } from './events/socket';
import { startRealtimeSubscriber } from './events/redisSubscriber';
import { env } from './config/env';
import { logger } from './config/logger';

async function main() {
  await connectDB();

  const app = buildApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  const subscriber = startRealtimeSubscriber();

  httpServer.listen(env.PORT, () => {
    logger.info(`QueueFlow API listening on port ${env.PORT}`);
    logger.info(`Swagger docs at http://localhost:${env.PORT}/api-docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    httpServer.close(async () => {
      subscriber.disconnect();
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if shutdown hangs longer than 10s
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error during startup');
  process.exit(1);
});
