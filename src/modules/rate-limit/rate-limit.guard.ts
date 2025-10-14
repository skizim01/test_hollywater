import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RateLimitService, RateLimitConfig } from './rate-limit.service';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(private readonly rateLimitService: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const info = ctx.getInfo();

    const config = this.getRateLimitConfig(info.fieldName);

    const key = this.generateKey(request);

    const result = await this.rateLimitService.checkRateLimit(key, config);

    if (!result.allowed) {
      this.logger.warn(
        `Rate limit exceeded for ${key} on operation ${info.fieldName}`,
      );

      throw new HttpException(
        {
          message: 'Rate limit exceeded',
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          rateLimitInfo: {
            limit: config.maxRequests,
            remaining: result.remaining,
            resetTime: result.resetTime,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getRateLimitConfig(operationName: string): RateLimitConfig {
    const configs: Record<string, RateLimitConfig> = {
      searchBooks: {
        windowMs: 60 * 1000,
        maxRequests: 30,
      },
      books: {
        windowMs: 60 * 1000,
        maxRequests: 60,
      },
      book: {
        windowMs: 60 * 1000,
        maxRequests: 60,
      },
      authors: {
        windowMs: 60 * 1000,
        maxRequests: 60,
      },
      author: {
        windowMs: 60 * 1000,
        maxRequests: 60,
      },
      bookStatistics: {
        windowMs: 60 * 1000,
        maxRequests: 10,
      },
      authorStatistics: {
        windowMs: 60 * 1000,
        maxRequests: 10,
      },
      users: {
        windowMs: 60 * 1000,
        maxRequests: 30,
      },
      userById: {
        windowMs: 60 * 1000,
        maxRequests: 30,
      },
      login: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 5,
      },
      refresh: {
        windowMs: 60 * 1000,
        maxRequests: 10,
      },
      logout: {
        windowMs: 60 * 1000,
        maxRequests: 20,
      },
    };

    const defaultConfig: RateLimitConfig = {
      windowMs: 60 * 1000,
      maxRequests: 30,
    };

    return configs[operationName] || defaultConfig;
  }

  private generateKey(request: Request): string {
    const userId = (request as any).user?.id;
    if (userId) {
      return this.rateLimitService.generateUserKey(userId);
    }

    return this.rateLimitService.generateKey(request);
  }
}
