/**
 * PURPOSE: Shared Redis connection factory for BullMQ (queue + worker) and
 * for any ad-hoc caching.
 *
 * WHY A FACTORY FUNCTION INSTEAD OF ONE SHARED CLIENT
 * BullMQ recommends separate ioredis connections per Queue/Worker/QueueEvents
 * instance rather than sharing one, because each maintains its own blocking
 * commands (e.g. BRPOPLPUSH-style blocking reads for the worker). Sharing one
 * connection across a blocking consumer and a producer can deadlock or starve
 * requests. `maxRetriesPerRequest: null` is REQUIRED by BullMQ workers so
 * that ioredis doesn't give up and throw during long blocking calls.
 *
 * INTERVIEW TALKING POINT
 * This is a classic "shared nothing where it matters" pattern: cheap to
 * create a new logical connection, expensive to have contention.
 */
import IORedis, { RedisOptions } from 'ioredis';
import { env } from './env';

export function createRedisConnection(): IORedis {
  const options: RedisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  };
  return new IORedis(options);
}
