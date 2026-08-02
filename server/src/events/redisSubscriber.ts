/**
 * PURPOSE: Subscribes to the Redis Pub/Sub channel the worker publishes
 * to (see worker/src/events/publisher.ts) and relays those messages to
 * connected browsers over Socket.IO.
 *
 * WHY THE API NEEDS ITS OWN REDIS CONNECTION FOR THIS (separate from
 * the one BullMQ's Queue uses)
 * A connection in Redis SUBSCRIBE mode can ONLY issue subscribe-related
 * commands until it unsubscribes -- ioredis enforces this. It must be a
 * dedicated connection, never shared with one doing regular commands
 * (like the Queue's connection adding jobs). Same principle as the
 * BullMQ connection-per-role guidance in config/redis.ts.
 */
import { createRedisConnection } from '../config/redis';
import { REALTIME_CHANNEL } from '../constants';
import { emitJobUpdated, emitWorkerUpdated } from './socket';
import { logger } from '../config/logger';

export function startRealtimeSubscriber() {
  const subscriber = createRedisConnection();

  subscriber.subscribe(REALTIME_CHANNEL, (err) => {
    if (err) logger.error({ err }, 'Failed to subscribe to realtime channel');
  });

  subscriber.on('message', (_channel, message) => {
    try {
      const { type, payload } = JSON.parse(message);
      if (type === 'job:updated') emitJobUpdated(payload);
      else if (type === 'worker:updated') emitWorkerUpdated(payload);
    } catch (err) {
      logger.error({ err }, 'Failed to parse realtime message');
    }
  });

  return subscriber;
}
