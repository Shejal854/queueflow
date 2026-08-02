/**
 * PURPOSE: Sets up the Socket.IO server and exposes small `emit*` helper
 * functions the rest of the app calls to push realtime updates.
 *
 * WHY SOCKET.IO OVER RAW WEBSOCKETS
 * Socket.IO adds automatic reconnection, fallback transports, and simple
 * room support out of the box -- all things you'd otherwise hand-roll.
 * For an SDE project, explaining "I used raw ws and built my own
 * reconnect/heartbeat logic" is a bigger, riskier surface to defend in
 * an interview than "I used Socket.IO's connection-state recovery."
 *
 * WHY A SEPARATE MODULE (not inline in server.ts)
 * Services (job.service.ts, worker.service.ts) need to EMIT events when
 * state changes (e.g. right after updating a Job's status). Exporting
 * `emitJobUpdated` etc. from here lets services call it without importing
 * Express/HTTP server internals -- clean separation of transport from
 * business logic.
 *
 * WHY BROADCAST TO ALL CLIENTS (no per-user rooms) IN THIS PROJECT
 * Keeps the realtime layer simple for interview purposes. The natural
 * production evolution ("Possible Improvements" in README) is a
 * per-user room (`socket.join(userId)`) so users only receive their own
 * job updates -- worth mentioning as a follow-up in interviews.
 */
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { SOCKET_EVENTS } from '../constants';
import { logger } from '../config/logger';

let io: SocketIOServer | undefined;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, 'Socket connected');
    socket.on('disconnect', () => logger.debug({ socketId: socket.id }, 'Socket disconnected'));
  });

  return io;
}

export function emitJobCreated(job: unknown) {
  io?.emit(SOCKET_EVENTS.JOB_CREATED, job);
}
export function emitJobUpdated(job: unknown) {
  io?.emit(SOCKET_EVENTS.JOB_UPDATED, job);
}
export function emitWorkerUpdated(worker: unknown) {
  io?.emit(SOCKET_EVENTS.WORKER_UPDATED, worker);
}
export function emitStatsUpdated(stats: unknown) {
  io?.emit(SOCKET_EVENTS.STATS_UPDATED, stats);
}
