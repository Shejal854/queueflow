/**
 * PURPOSE: Publishes job/worker state-change events to a Redis Pub/Sub
 * channel so the API process (which owns the Socket.IO server and the
 * browser connections) can forward them to connected dashboards in
 * realtime.
 *
 * WHY REDIS PUB/SUB INSTEAD OF THE WORKER CALLING AN API HTTP ENDPOINT
 * The worker and API are independent, separately-scaled services (that
 * was an explicit requirement of this project). If the worker called the
 * API over HTTP to "please emit this socket event," the worker would now
 * have a hard runtime dependency on the API being up and reachable --
 * job processing could stall or error just because the API pod happened
 * to be mid-deploy. Pub/Sub decouples them: the worker fires-and-forgets
 * a message onto a channel; if nobody is subscribed (API is down), the
 * message is simply dropped and the NEXT dashboard poll/reconnect will
 * still see correct state because Mongo (not the pub/sub message) is the
 * source of truth. This is the same reasoning behind using a message
 * broker for cross-service notifications instead of direct RPC calls.
 *
 * INTERVIEW TALKING POINT
 * "Why not just have the worker emit Socket.IO directly?" -- Socket.IO
 * needs the actual browser TCP connections, which live in the API
 * process. Redis Pub/Sub is the standard way to fan messages out to
 * multiple Socket.IO server instances too (see socket.io-redis-adapter),
 * so this choice also sets us up to horizontally scale the API later.
 */
import { createRedisConnection } from '../config/redis';
import { REALTIME_CHANNEL } from '../constants';

const publisher = createRedisConnection();

export async function publishEvent(type: 'job:updated' | 'worker:updated', payload: unknown) {
  await publisher.publish(REALTIME_CHANNEL, JSON.stringify({ type, payload }));
}
