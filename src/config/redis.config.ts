import { get } from '@nestled/config/lib/validate';
import { RedisClientOptions } from 'redis';

export const getRedisConfig = (): RedisClientOptions => {
  return {
    socket: {
      host: get('REDIS_HOST').asString() || 'localhost',
      port: get('REDIS_PORT').asPortNumber() || 6379,
      connectTimeout: 10000,
      keepAlive: 30000,
    },
    password: get('REDIS_PASSWORD').asString() || undefined,
    database: get('REDIS_DB').asInt() || 0,
  };
};
