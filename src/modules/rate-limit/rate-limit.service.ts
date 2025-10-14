import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { Request } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name);

  constructor(private readonly redisService: RedisService) {}

  async checkRateLimit(
    key: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
      const windowEnd = windowStart + config.windowMs;
      const resetTime = windowEnd;

      const rateLimitKey = `rate_limit:${key}:${windowStart}`;

      const currentCount = await this.redisService.get(rateLimitKey);
      const totalHits = currentCount ? parseInt(currentCount) : 0;

      if (totalHits >= config.maxRequests) {
        this.logger.warn(
          `Rate limit exceeded for key: ${key}, hits: ${totalHits}/${config.maxRequests}`,
        );

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits,
        };
      }

      const newCount = await this.redisService.incr(rateLimitKey);

      if (newCount === 1) {
        await this.redisService.expire(
          rateLimitKey,
          Math.ceil(config.windowMs / 1000),
        );
      }

      const remaining = Math.max(0, config.maxRequests - newCount);

      this.logger.debug(
        `Rate limit check for key: ${key}, hits: ${newCount}/${config.maxRequests}, remaining: ${remaining}`,
      );

      return {
        allowed: true,
        remaining,
        resetTime,
        totalHits: newCount,
      };
    } catch (error) {
      this.logger.error(`Rate limit check failed for key: ${key}`, error);

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: Date.now() + config.windowMs,
        totalHits: 1,
      };
    }
  }

  async resetRateLimit(key: string): Promise<boolean> {
    try {
      const pattern = `rate_limit:${key}:*`;
      const deletedCount = await this.redisService.deleteByPattern(pattern);
      this.logger.debug(
        `Reset rate limit for key: ${key}, deleted ${deletedCount} entries`,
      );
      return deletedCount > 0;
    } catch (error) {
      this.logger.error(`Failed to reset rate limit for key: ${key}`, error);
      return false;
    }
  }

  async clearAllRateLimits(): Promise<number> {
    try {
      return await this.redisService.deleteByPattern('rate_limit:*');
    } catch (error) {
      this.logger.error('Failed to clear all rate limits:', error);
      return 0;
    }
  }

  generateKey(req: Request): string {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  generateUserKey(userId: string): string {
    return `user:${userId}`;
  }

  generateApiKey(apiKey: string): string {
    return `api:${apiKey}`;
  }
}
